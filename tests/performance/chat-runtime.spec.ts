import { mkdir, writeFile } from "node:fs/promises";
import { test, expect, type Page } from "@playwright/test";
import {
  apiURL,
  createdAt,
  products,
  partialReply,
  reply,
} from "../e2e/data/chat";
import { chatHistoryPage } from "../../src/mocks/chat-history";

const directory =
  process.env.BENCH_OUTPUT_DIR ?? "performance-results/chat-runtime/issue-218";
const messages = Array.from({ length: 20_000 }, (_, i) => ({
  messageId: i + 1,
  content: `${i % 2 ? "답변" : "질문"} ${i + 1}: 편안한 출근 옷을 추천해 주세요.`,
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
}));
const room = { chatRoomId: 1, title: "성능 측정", messages };
const output: unknown[] = [];
async function paint(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}

test("20,000개 상태에서 입력, 전송, 상품 스와이프, 검색과 이동", async ({
  browser,
  request,
}) => {
  await mkdir(directory, { recursive: true });
  for (let run = 0; run <= 6; run++) {
    const noProducts = run === 6;
    expect(
      (
        await request.post(`${apiURL}/__test/reset`, {
          data: { rooms: [room], noProducts },
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
    const historyRequests: string[] = [];
    await context.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (url.hostname !== "127.0.0.1") return route.abort();
      if (
        url.pathname === "/chat-rooms/1/messages" &&
        route.request().method() === "GET"
      ) {
        historyRequests.push(url.search);
        const params = new URLSearchParams(url.search);
        if (
          !params.has("before") &&
          !params.has("after") &&
          !params.has("aroundMessageId")
        )
          params.set("size", "20000");
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
        const cursor = Number(url.searchParams.get("cursor")) || 0;
        const items = Array.from({ length: 20 }, (_, i) => ({
          chatRoomId: 1,
          title: room.title,
          messageId: 19999 - cursor - i * 2,
          message: `질문 ${19999 - cursor - i * 2}: 출근 옷 추천`,
        }));
        await new Promise((resolve) => setTimeout(resolve, 200));
        return route.fulfill({
          json: {
            code: "SUCCESS",
            message: "성공",
            data: { items, hasNext: cursor < 80, nextCursor: cursor + 40 },
          },
        });
      }
      return route.continue();
    });
    try {
      await page.goto("http://127.0.0.1:3100/chat/1");
      const log = page.getByRole("log", { name: "채팅 메시지" });
      await expect(log).toHaveAttribute("data-loaded-message-count", "20000", {
        timeout: 60000,
      });
      await page.evaluate(async () => {
        await document.fonts.ready;
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: "instant",
        });
      });
      await paint(page);
      const input = page.getByRole("textbox", { name: "메시지, 최대 500자" });
      await input.focus();
      const singleHeight = (await input.boundingBox())!.height;
      const inputSamples: number[] = [];
      const text = "출근할 때 입을 편안한 옷을 추천해 주세요.";
      for (const char of text) {
        const start = performance.now();
        await cdp.send("Input.insertText", { text: char });
        await paint(page);
        inputSamples.push(performance.now() - start);
      }
      await expect(input).toHaveValue(text);
      const deleteSamples: number[] = [];
      for (let i = 0; i < text.length; i++) {
        const start = performance.now();
        await input.press("Backspace");
        await paint(page);
        deleteSamples.push(performance.now() - start);
      }
      await expect(input).toHaveValue("");
      const compositionSamples: number[] = [];
      for (const text of ["ㅎ", "하", "한"]) {
        const start = performance.now();
        await cdp.send("Input.imeSetComposition", {
          text,
          selectionStart: text.length,
          selectionEnd: text.length,
        });
        await paint(page);
        compositionSamples.push(performance.now() - start);
      }
      await input.dispatchEvent("keydown", {
        key: "Enter",
        code: "Enter",
        isComposing: true,
        bubbles: true,
      });
      await expect(input).toHaveValue("한");
      await cdp.send("Input.insertText", { text: "한" });
      await expect(input).toHaveValue("한");
      const requests = await (
        await request.get(`${apiURL}/__test/requests`)
      ).json();
      expect(
        requests.data.requests.filter(
          (r: { method: string }) => r.method === "POST",
        ),
      ).toHaveLength(0);
      const resizeStart = performance.now();
      await input.fill("첫 줄\n둘째 줄\n셋째 줄");
      await paint(page);
      const resizeMs = performance.now() - resizeStart;
      const multilineHeight = (await input.boundingBox())!.height;
      expect(multilineHeight).toBeGreaterThan(singleHeight);
      await input.fill(text);
      await paint(page);
      // Browser MutationObserver records DOM visibility without Playwright polling latency.
      await page.evaluate(
        ({ text, partialReply, reply, latestAIMessageId, productLabels }) => {
          const marks: Record<string, number> = {};
          window.__sendMarks = marks;
          document
            .querySelector('button[aria-label="메시지 전송"]')!
            .addEventListener(
              "click",
              () => {
                marks.send = performance.now();
              },
              { once: true },
            );
          const observer = new MutationObserver(() => {
            const log = document.querySelector('[role="log"]');
            if (!log || !marks.send) return;
            if (!marks.user && log.textContent?.includes(text))
              marks.user = performance.now();
            if (!marks.first && log.textContent?.includes(partialReply))
              marks.first = performance.now();
            const latestAI = log.querySelector(
              `[data-message-id="${latestAIMessageId}"]`,
            );
            const cards = Array.from(
              latestAI?.querySelectorAll(
                '[aria-label="AI 추천 상품"] article[aria-label]',
              ) ?? [],
            );
            if (
              !marks.products &&
              latestAI?.textContent?.includes(reply) &&
              productLabels.every((label) =>
                cards.some(
                  (card) =>
                    card.getAttribute("aria-label") === label &&
                    card.checkVisibility(),
                ),
              )
            ) {
              marks.products = performance.now();
              observer.disconnect();
            }
          });
          observer.observe(document.body, {
            subtree: true,
            childList: true,
            characterData: true,
            attributes: true,
          });
        },
        {
          text,
          partialReply,
          reply,
          latestAIMessageId: messages.at(-1)!.messageId + 2,
          productLabels: products.map(
            (product, index) =>
              `추천 상품 ${index + 1}: ${product.productName}`,
          ),
        },
      );
      const beforeY = await page.evaluate(() => scrollY);
      await page
        .getByRole("button", { name: "메시지 전송", exact: true })
        .click();
      await expect(page.getByText(partialReply, { exact: true })).toBeVisible();
      await expect(input).toBeDisabled();
      const streamingY = await page.evaluate(() => scrollY);
      await page.mouse.wheel(0, -400);
      await paint(page);
      await page.evaluate(() => {
        window.__sendMarks.finishRequested = performance.now();
      });
      expect(
        (await request.post(`${apiURL}/__test/finish-stream`)).ok(),
      ).toBeTruthy();
      await expect(input).toBeEnabled();
      await expect(
        page.getByRole("button", { name: "새 답변 보기" }),
      ).toBeVisible();
      const latestAI = log.locator(
        `[data-message-id="${messages.at(-1)!.messageId + 2}"]`,
      );
      await expect(latestAI).toContainText(reply);
      const latestProducts = latestAI.getByRole("region", {
        name: "AI 추천 상품",
      });
      if (noProducts) {
        await expect(latestProducts).toHaveCount(0);
        expect(
          await page.evaluate(() => window.__sendMarks.products),
        ).toBeUndefined();
        console.log(
          "상품 없는 응답: 상품 표시 시각을 기록하지 않는 회귀 검증 통과",
        );
        continue;
      }
      await expect(latestProducts.getByRole("article")).toHaveCount(
        products.length,
      );
      await expect
        .poll(() => page.evaluate(() => window.__sendMarks.products ?? 0))
        .toBeGreaterThan(0);
      const marks = await page.evaluate(() => window.__sendMarks);
      expect(marks.user).toBeGreaterThan(marks.send);
      expect(marks.first).toBeGreaterThan(marks.send);
      expect(marks.products).toBeGreaterThan(marks.first);
      expect(historyRequests).toHaveLength(1);
      await page.getByRole("button", { name: "새 답변 보기" }).click();
      await expect(page.getByText(reply, { exact: true })).toBeInViewport();
      const send = {
        userMs: marks.user - marks.send,
        firstAIMs: marks.first - marks.send,
        productsMs: marks.products - marks.send,
        finishToProductsMs: marks.products - marks.finishRequested,
        beforeY,
        streamingY,
        historyRequestCount: historyRequests.length,
      };
      // Middle of the loaded conversation, with fixed local images.
      await page.evaluate(() =>
        window.scrollBy({ top: -5000, behavior: "instant" }),
      );
      await paint(page);
      const carouselMessageId = await page.evaluate(() =>
        Array.from(document.querySelectorAll("[data-message-id]"))
          .find((row) => {
            const section = row.querySelector('[aria-label="AI 추천 상품"]');
            if (!section) return false;
            const rect = section.getBoundingClientRect();
            return rect.top > 60 && rect.top < 600;
          })
          ?.getAttribute("data-message-id"),
      );
      expect(carouselMessageId).toBeTruthy();
      const section = page
        .locator(`[data-message-id="${carouselMessageId}"]`)
        .getByRole("region", { name: "AI 추천 상품" });
      const carousel = section.locator(":scope > div").first();
      await carousel.scrollIntoViewIfNeeded();
      await page.evaluate(async () => {
        await Promise.all(
          Array.from(document.images, (img) => img.decode().catch(() => {})),
        );
      });
      const swipeY = await page.evaluate(() => scrollY);
      const box = (await carousel.boundingBox())!;
      const swipeStart = performance.now();
      await cdp.send("Input.synthesizeScrollGesture", {
        x: Math.round(box.x + box.width / 2),
        y: Math.round(Math.max(120, Math.min(550, box.y + 100))),
        xDistance: -250,
        yDistance: 0,
        speed: 600,
        gestureSourceType: "touch",
        preventFling: true,
      });
      await page.waitForTimeout(300);
      const swipe = {
        durationMs: performance.now() - swipeStart,
        scrollLeft: await carousel.evaluate((e) => e.scrollLeft),
        verticalDriftPx: (await page.evaluate(() => scrollY)) - swipeY,
      };
      expect(swipe.scrollLeft).toBeGreaterThan(0);
      expect(Math.abs(swipe.verticalDriftPx)).toBeLessThan(3);
      await page.getByRole("button", { name: "대화 목록 열기" }).click();
      await page.getByRole("button", { name: /검색/ }).click();
      const search = page.getByRole("searchbox", { name: "대화 내용 검색" });
      const searchStart = performance.now();
      await search.fill("출근");
      const links = page
        .getByRole("list", { name: "검색 결과" })
        .getByRole("link");
      await expect(links).toHaveCount(20);
      await paint(page);
      const searchMs = performance.now() - searchStart;
      const moreStart = performance.now();
      await links.last().scrollIntoViewIfNeeded();
      await expect(links).toHaveCount(40);
      await paint(page);
      const searchMoreMs = performance.now() - moreStart;
      const targetStart = performance.now();
      await links.first().click();
      await expect(page.locator('[data-message-id="19999"]')).toBeInViewport();
      await paint(page);
      const targetMs = performance.now() - targetStart;
      const targetY = (await page
        .locator('[data-message-id="19999"]')
        .boundingBox())!.y;
      if (run > 0)
        output.push({
          run,
          loaded: 20000,
          inputSamples,
          deleteSamples,
          compositionSamples,
          singleHeight,
          multilineHeight,
          resizeMs,
          send,
          swipe,
          searchMs,
          searchMoreMs,
          targetMs,
          targetY,
          requests,
        });
      await writeFile(
        `${directory}/summary.json`,
        JSON.stringify(
          {
            commit: "a82a7a93b202605c98bdaf96ce7838e7a98b75a5",
            browser: browser.version(),
            cpuRate: 4,
            warmups: 1,
            productMilestone:
              "latest AI message expected product cards visible in DOM; image decode excluded",
            results: output,
          },
          null,
          2,
        ),
      );
      console.log(`runtime ${run}/5 complete`);
    } finally {
      await context.close();
    }
  }
});
