import { gzipSync } from "node:zlib";
import { mkdir, writeFile } from "node:fs/promises";
import { test, expect, type Page } from "@playwright/test";
import { apiURL, createdAt, products } from "../e2e/data/chat";
import { chatHistoryPage } from "../../src/mocks/chat-history";
const directory =
  process.env.BENCH_OUTPUT_DIR ?? "performance-results/chat-runtime/issue-218";
const room = {
  chatRoomId: 1,
  title: "추가 검증",
  messages: Array.from({ length: 20000 }, (_, i) => ({
    messageId: i + 1,
    content: `메시지 ${i + 1} 출근 옷 추천`,
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
async function paint(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}
test("로드 여부별 검색 대상 이동 및 앞뒤 조회, 이미지 전후 가로 스와이프", async ({
  browser,
  request,
}) => {
  const results = [];
  await mkdir(directory, { recursive: true });
  for (let run = 0; run <= 5; run++)
    for (const initialCount of [20000, 20]) {
      expect(
        (
          await request.post(`${apiURL}/__test/reset`, {
            data: { rooms: [room] },
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
      let release!: () => void;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      let imageReady = false;
      const queries: string[] = [];
      await context.route("**/*", async (route) => {
        const url = new URL(route.request().url());
        if (url.hostname !== "127.0.0.1") return route.abort();
        if (url.pathname.includes("/images/fixtures/")) {
          await gate;
          return route.continue();
        }
        if (
          url.pathname === "/chat-rooms/1/messages" &&
          route.request().method() === "GET"
        ) {
          const params = new URLSearchParams(url.search);
          queries.push(url.search);
          if (
            !params.has("aroundMessageId") &&
            !params.has("before") &&
            !params.has("after")
          )
            params.set("size", String(initialCount));
          await new Promise((resolve) => setTimeout(resolve, 200));
          return route.fulfill({
            json: {
              code: "SUCCESS",
              message: "성공",
              data: chatHistoryPage(room, params),
            },
          });
        }
        if (url.pathname === "/chat-rooms/search") {
          await new Promise((resolve) => setTimeout(resolve, 200));
          return route.fulfill({
            json: {
              code: "SUCCESS",
              message: "성공",
              data: {
                items: [
                  {
                    chatRoomId: 1,
                    title: room.title,
                    messageId: 10000,
                    message: "메시지 10000 출근 옷 추천",
                  },
                ],
                hasNext: false,
                nextCursor: null,
              },
            },
          });
        }
        return route.continue();
      });
      try {
        await page.goto("http://127.0.0.1:3100/chat/1", {
          waitUntil: "domcontentloaded",
        });
        const log = page.getByRole("log");
        await expect(log).toHaveAttribute(
          "data-loaded-message-count",
          String(initialCount),
          { timeout: 60000 },
        );
        await page.evaluate(() =>
          window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: "instant",
          }),
        );
        await paint(page);
        if (initialCount === 20000) {
          await page.evaluate(() =>
            window.scrollBy({ top: -5000, behavior: "instant" }),
          );
          await paint(page);
          const id = await page.evaluate(() =>
            Array.from(document.querySelectorAll("[data-message-id]"))
              .find((row) => {
                const section = row.querySelector(
                  '[aria-label="AI 추천 상품"]',
                );
                if (!section) return false;
                const r = section.getBoundingClientRect();
                return r.bottom > 100 && r.top < 600;
              })
              ?.getAttribute("data-message-id"),
          );
          expect(id).toBeTruthy();
          const carousel = page
            .locator(
              `[data-message-id="${id}"] [aria-label="AI 추천 상품"] > div`,
            )
            .first();
          await carousel.scrollIntoViewIfNeeded();
          const swipes = [];
          for (const ready of [false, true]) {
            if (ready) {
              release();
              imageReady = true;
              await page.evaluate(async () => {
                await Promise.all(
                  Array.from(document.images, (img) =>
                    img.decode().catch(() => {}),
                  ),
                );
              });
            }
            await cdp.send("Tracing.start", {
              categories:
                "devtools.timeline,toplevel,disabled-by-default-devtools.timeline,cc,benchmark,disabled-by-default-devtools.timeline.frame",
              transferMode: "ReturnAsStream",
            });
            const y = await page.evaluate(() => scrollY);
            const box = (await carousel.boundingBox())!;
            const left = await carousel.evaluate((e) => e.scrollLeft);
            const started = performance.now();
            await cdp.send("Input.synthesizeScrollGesture", {
              x: Math.round(box.x + box.width / 2),
              y: Math.round(Math.max(120, Math.min(550, box.y + 100))),
              xDistance: ready ? 250 : -250,
              yDistance: 0,
              speed: 600,
              gestureSourceType: "touch",
              preventFling: true,
            });
            await page.waitForTimeout(300);
            const end = await carousel.evaluate((e) => e.scrollLeft);
            const drift = (await page.evaluate(() => scrollY)) - y;
            const durationMs = performance.now() - started;
            expect(Math.abs(end - left)).toBeGreaterThan(100);
            expect(Math.abs(drift)).toBeLessThan(3);
            const complete = new Promise<{ stream?: string }>((resolve) =>
              cdp.once("Tracing.tracingComplete", resolve),
            );
            await cdp.send("Tracing.end");
            const { stream } = await complete;
            let trace = "";
            for (;;) {
              const chunk = await cdp.send("IO.read", { handle: stream! });
              trace += chunk.data;
              if (chunk.eof) break;
            }
            await cdp.send("IO.close", { handle: stream! });
            if (run > 0)
              await writeFile(
                `${directory}/swipe-${ready ? "ready" : "pending"}-${run}.json.gz`,
                gzipSync(trace),
              );
            swipes.push({
              imageReady: ready,
              durationMs,
              startLeft: left,
              endLeft: end,
              verticalDriftPx: drift,
            });
          }
          if (run > 0)
            results.push({ kind: "image-swipes", run, initialCount, swipes });
        }
        if (!imageReady) release();
        await page.getByRole("button", { name: "대화 목록 열기" }).click();
        await page
          .getByRole("button", { name: "대화 검색", exact: true })
          .click();
        await page
          .getByRole("searchbox", { name: "대화 내용 검색" })
          .fill("출근");
        const link = page
          .getByRole("list", { name: "검색 결과" })
          .getByRole("link");
        await expect(link).toHaveCount(1);
        const start = performance.now();
        await link.click();
        const target = page.locator('[data-message-id="10000"]');
        await expect(target).toBeInViewport();
        await paint(page);
        const targetMs = performance.now() - start;
        const targetY = (await target.boundingBox())!.y;
        await expect(log).toHaveAttribute("data-loaded-message-count", "41");
        await page.evaluate(() =>
          window.scrollTo({ top: 0, behavior: "instant" }),
        );
        await expect(log).toHaveAttribute("data-loaded-message-count", "61");
        await page.evaluate(() =>
          window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: "instant",
          }),
        );
        await expect(log).toHaveAttribute("data-loaded-message-count", "81");
        const ids = await log
          .locator("[data-message-id]")
          .evaluateAll((rows) =>
            rows.map((row) => Number(row.getAttribute("data-message-id"))),
          );
        expect(new Set(ids).size).toBe(ids.length);
        expect(ids).toEqual([...ids].sort((a, b) => a - b));
        expect(
          queries.some((q) => q.includes("aroundMessageId=10000")),
        ).toBeTruthy();
        expect(queries.some((q) => q.includes("before="))).toBeTruthy();
        expect(queries.some((q) => q.includes("after="))).toBeTruthy();
        if (run > 0)
          results.push({
            kind: "target",
            run,
            initialCount,
            targetPreviouslyLoaded: initialCount === 20000,
            targetMs,
            targetY,
            queries,
            loadedAfterContext: 41,
            loadedAfterOlder: 61,
            loadedAfterNewer: 81,
            mounted: ids.length,
          });
        await writeFile(
          `${directory}/extra-summary.json`,
          JSON.stringify(
            {
              browser: browser.version(),
              cpuRate: 4,
              warmups: 1,
              swipeTiming:
                "gesture start through 300ms settle and scroll-position reads; trace read/compression/write excluded",
              results,
            },
            null,
            2,
          ),
        );
        console.log(`extra ${run}/5 loaded=${initialCount}`);
      } finally {
        release();
        await context.close();
      }
    }
});
