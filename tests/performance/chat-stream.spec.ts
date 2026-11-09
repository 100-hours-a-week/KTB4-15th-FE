import { mkdir, writeFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";
import { apiURL, createdAt, products, partialReply } from "../e2e/data/chat";
import { chatHistoryPage } from "../../src/mocks/chat-history";

test("20,000개에서 50ms 간격 토큰 렌더와 스크롤", async ({
  browser,
  request,
}) => {
  const results = [];
  const directory = "performance-results/chat-runtime/issue-218";
  await mkdir(directory, { recursive: true });
  const room = {
    chatRoomId: 1,
    title: "스트리밍 검증",
    messages: Array.from({ length: 20000 }, (_, i) => ({
      messageId: i + 1,
      content: `이전 메시지 ${i + 1}`,
      createdAt,
      ...(i % 2
        ? {
            senderType: "AI" as const,
            generationStatus: null,
            recommendation: { recommendationId: i + 1, products },
          }
        : {
            senderType: "USER" as const,
            generationStatus: "COMPLETED" as const,
            recommendation: null,
          }),
    })),
  };
  for (let run = 0; run <= 5; run++) {
    expect(
      (
        await request.post(`${apiURL}/__test/reset`, {
          data: { rooms: [room], streamTokenDelayMs: 50 },
        })
      ).ok(),
    ).toBeTruthy();
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      serviceWorkers: "block",
    });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await context.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (url.hostname !== "127.0.0.1") return route.abort();
      if (
        url.pathname === "/chat-rooms/1/messages" &&
        route.request().method() === "GET"
      )
        return route.fulfill({
          json: {
            code: "SUCCESS",
            message: "성공",
            data: chatHistoryPage(room, new URLSearchParams({ size: "20000" })),
          },
        });
      return route.continue();
    });
    try {
      await page.goto("http://127.0.0.1:3100/chat/1");
      await expect(page.getByRole("log")).toHaveAttribute(
        "data-loaded-message-count",
        "20000",
        { timeout: 60000 },
      );
      await page.evaluate(() =>
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: "instant",
        }),
      );
      const input = page.getByRole("textbox", { name: "메시지, 최대 500자" });
      await input.fill("스트리밍 검증 요청");
      await page.evaluate(() => {
        const state = {
          start: 0,
          first: 0,
          changes: [] as { time: number; text: string }[],
          tasks: [] as number[],
          frames: [] as number[],
          active: true,
        };
        window.__stream = state;
        new PerformanceObserver((list) => {
          state.tasks.push(
            ...list
              .getEntries()
              .filter((e) => e.startTime >= state.start)
              .map((e) => e.duration),
          );
        }).observe({ type: "longtask" });
        let last = performance.now();
        function tick(now: number) {
          if (!state.active) return;
          state.frames.push(now - last);
          last = now;
          requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        document
          .querySelector('button[aria-label="메시지 전송"]')!
          .addEventListener(
            "click",
            () => {
              state.start = performance.now();
            },
            { once: true },
          );
        new MutationObserver(() => {
          const paragraphs = Array.from(
            document.querySelectorAll('[role="log"] p'),
          );
          const text = paragraphs.at(-1)?.textContent || "";
          if (
            state.start &&
            text.startsWith("추") &&
            !text.startsWith("이전") &&
            state.changes.at(-1)?.text !== text
          ) {
            if (!state.first) state.first = performance.now();
            state.changes.push({ time: performance.now(), text });
          }
        }).observe(document.body, {
          subtree: true,
          childList: true,
          characterData: true,
        });
      });
      await page
        .getByRole("button", { name: "메시지 전송", exact: true })
        .click();
      await expect
        .poll(() => page.evaluate(() => window.__stream.first))
        .toBeGreaterThan(0);
      await cdp.send("Input.synthesizeScrollGesture", {
        x: 195,
        y: 400,
        yDistance: 300,
        speed: 600,
        gestureSourceType: "mouse",
        preventFling: true,
      });
      await expect(
        page.getByText(partialReply, { exact: true }),
      ).toBeAttached();
      await expect(input).toBeDisabled();
      const y = await page.evaluate(() => scrollY);
      expect(
        (await request.post(`${apiURL}/__test/finish-stream`)).ok(),
      ).toBeTruthy();
      await expect(input).toBeEnabled();
      await expect(
        page.getByRole("button", { name: "새 답변 보기" }),
      ).toBeVisible();
      const after = await page.evaluate(() => scrollY);
      expect(Math.abs(after - y)).toBeLessThan(3);
      const state = await page.evaluate(() => {
        const s = window.__stream;
        s.active = false;
        return s;
      });
      expect(state.changes.length).toBeGreaterThan(2);
      if (run > 0)
        results.push({
          run,
          firstTokenMs: state.first - state.start,
          observedTextUpdates: state.changes.length,
          positionDriftPx: after - y,
          maxAnimationFrameGapMs: Math.max(...state.frames),
          longTaskCount: state.tasks.length,
          maxLongTaskMs: Math.max(0, ...state.tasks),
          state,
        });
      await writeFile(
        `${directory}/stream-summary.json`,
        JSON.stringify(
          {
            browser: browser.version(),
            cpuRate: 4,
            tokenDelayMs: 50,
            warmups: 1,
            results,
          },
          null,
          2,
        ),
      );
      console.log(`stream ${run}/5`);
    } finally {
      await context.close();
    }
  }
});
