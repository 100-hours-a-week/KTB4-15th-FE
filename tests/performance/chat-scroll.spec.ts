import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { test, expect } from "@playwright/test";
import { chatHistoryPage } from "../../src/mocks/chat-history";
import { apiURL, createdAt, products } from "../e2e/data/chat";
import type { ChatMessageResponse } from "../../src/features/chat/schema/chat";

const messages: ChatMessageResponse[] = Array.from({ length: 1000 }, (_, i) =>
  i % 2 === 0
    ? {
        messageId: i + 1,
        senderType: "USER",
        content: `질문 ${i + 1}: 출근할 때 입을 편안한 옷을 추천해 주세요.`,
        createdAt,
        generationStatus: "COMPLETED",
        recommendation: null,
      }
    : {
        messageId: i + 1,
        senderType: "AI",
        content: `답변 ${i + 1}: 편안한 출근룩을 추천해 드릴게요. 셔츠와 슬랙스를 함께 입으면 잘 어울려요.`,
        createdAt,
        generationStatus: null,
        recommendation: { recommendationId: i + 1, products },
      },
);

test("CPU 4배 감속에서 이전 메시지를 20개씩 불러오며 1000개까지 스크롤한다", async ({
  browser,
  request,
}, testInfo) => {
  const prepend = process.env.BENCH_PREPEND === "1";
  const down = !prepend && process.env.BENCH_SCROLL_DOWN === "1";
  const compareCpu = down && process.env.BENCH_COMPARE_CPU === "1";
  const scale = down && process.env.BENCH_SCROLL_SCALE === "1";
  const label =
    process.env.BENCH_LABEL ??
    (compareCpu
      ? "loaded-down-compare-cpu"
      : prepend
        ? "prepend-cpu4"
        : scale
          ? "loaded-down-scale-cpu4"
          : down
            ? "loaded-down-cpu4"
            : "pagination-cpu4");
  const counts = compareCpu
    ? [2000, 2000]
    : prepend
      ? [2000, 10_000]
      : scale
        ? [2000, 5000, 10_000]
        : down
          ? [200, 1000, 2000]
          : [1000];
  const runs = prepend ? 3 : scale ? 1 : down ? 3 : 5;
  const latestId =
    down || prepend
      ? Math.max(...counts) + (prepend ? 20 : 0)
      : messages.length;
  expect(label).toMatch(/^[a-zA-Z0-9_-]+$/);
  const directory = resolve("performance-results/chat-scroll", label);
  await mkdir(directory, { recursive: true });
  const reset = await request.post(`${apiURL}/__test/reset`, {
    data: { rooms: [{ chatRoomId: 1, title: "성능 측정", messages: [] }] },
  });
  expect(reset.ok()).toBeTruthy();
  const results = [];
  const prependResults = [];
  for (
    let index = scale ? counts.length : 0;
    index < counts.length * (runs + 1);
    index += 1
  ) {
    const run = Math.floor(index / counts.length);
    const condition = (index + run) % counts.length;
    const count = counts[condition];
    const cpuRate = compareCpu && condition === 0 ? 1 : 4;
    const roomMessages =
      down || prepend
        ? Array.from({ length: count + (prepend ? 20 : 0) }, (_, index) => {
            const id = latestId - count + index + 1 - (prepend ? 20 : 0);
            return { ...messages[(id - 1) % messages.length], messageId: id };
          })
        : messages;
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      serviceWorkers: "block",
    });
    try {
      const cursors: Array<number | null> = [];
      await context.route("**/*", async (route) => {
        const url = new URL(route.request().url());
        if (url.pathname === "/chat-rooms/1/messages") {
          cursors.push(Number(url.searchParams.get("before")) || null);
          const data = chatHistoryPage(
            { chatRoomId: 1, title: "성능 측정", messages: roomMessages },
            down || (prepend && !url.searchParams.has("before"))
              ? new URLSearchParams({ size: String(count) })
              : url.searchParams,
          );
          expect(data).not.toBeNull();
          expect(data!.messages).toHaveLength(
            down || (prepend && cursors.length === 1) ? count : 20,
          );
          // 네트워크 변동을 제거하고 응답 지연을 매 페이지 200ms로 고정한다.
          await new Promise((resolve) => setTimeout(resolve, 200));
          return route.fulfill({
            json: { code: "SUCCESS", message: "성공", data },
          });
        }
        if (url.hostname !== "127.0.0.1") return route.abort();
        return route.continue();
      });
      const page = await context.newPage();
      const session = await context.newCDPSession(page);
      await session.send("Emulation.setCPUThrottlingRate", { rate: cpuRate });
      await page.goto("http://127.0.0.1:3100/chat/1");
      const log = page.getByRole("log", { name: "채팅 메시지" });
      const messageRows = log.locator("[data-message-id]");
      await expect(log).toHaveAttribute(
        "data-loaded-message-count",
        String(down || prepend ? count : 20),
        { timeout: 60_000 },
      );
      await expect(messageRows.last()).toHaveAttribute(
        "data-message-id",
        String(latestId),
      );
      await page.evaluate(async () => {
        await document.fonts.ready;
        for (const image of document.images) image.loading = "eager";
        await Promise.all(
          Array.from(document.images, (image) =>
            image.decode().catch(() => {}),
          ),
        );
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: "instant",
        });
      });
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollHeight - innerHeight - scrollY,
          ),
        )
        .toBeLessThan(2);
      if (prepend) {
        await page.evaluate(
          (expected) => {
            const log = document.querySelector("[data-loaded-message-count]")!;
            const observer = new MutationObserver(() => {
              if (log.getAttribute("data-loaded-message-count") !== expected)
                return;
              performance.mark("prepend-committed");
              observer.disconnect();
            });
            observer.observe(log, {
              attributes: true,
              attributeFilter: ["data-loaded-message-count"],
            });
            performance.clearResourceTimings();
            window.scrollTo({ top: 0, behavior: "instant" });
          },
          String(count + 20),
        );
        await expect(log).toHaveAttribute(
          "data-loaded-message-count",
          String(count + 20),
        );
        expect(cursors).toEqual([null, latestId - count + 1]);
        const responseToCommitMs = await page.evaluate(() => {
          const response = performance
            .getEntriesByType("resource")
            .find((entry) => new URL(entry.name).searchParams.has("before")) as
            PerformanceResourceTiming | undefined;
          const commit = performance.getEntriesByName("prepend-committed")[0];
          if (!response || !commit || commit.startTime < response.responseEnd)
            throw new Error(
              "이전 메시지 응답과 DOM 반영 시각을 확인할 수 없습니다.",
            );
          return commit.startTime - response.responseEnd;
        });
        if (run > 0) {
          prependResults.push({ count, run, responseToCommitMs });
          console.log(
            `${count}개 + 20개: 응답 후 DOM 반영 ${responseToCommitMs.toFixed(1)}ms`,
          );
        }
        continue;
      }
      if (down) {
        await page.evaluate(() =>
          window.scrollBy({ top: -48_000, behavior: "instant" }),
        );
        await page.waitForTimeout(500);
      }
      const startY = await page.evaluate(() => scrollY);
      expect(cursors).toEqual([null]);
      expect(startY).toBeGreaterThan(0);
      // 입력 일정은 브라우저에서 생성해 느린 메인 스레드가 휠 전송 간격을 바꾸지 않게 한다.
      await session.send("Tracing.start", {
        categories:
          "devtools.timeline,toplevel,disabled-by-default-devtools.timeline,disabled-by-default-devtools.screenshot,disabled-by-default-v8.cpu_profiler,cc,benchmark,disabled-by-default-devtools.timeline.frame",
        transferMode: "ReturnAsStream",
      });
      const startedAt = performance.now();
      const pageLoads = [];
      if (down) {
        await session.send("Input.synthesizeScrollGesture", {
          x: 195,
          y: 400,
          yDistance: -36_000,
          speed: 12_000,
          gestureSourceType: "mouse",
          preventFling: true,
        });
      } else {
        for (let loaded = 20; loaded < 1000; loaded += 20) {
          const pageStartedAt = performance.now();
          // 상단에 남아도 IntersectionObserver가 다음 진입을 감지하도록 먼저 벗어난다.
          await session.send("Input.synthesizeScrollGesture", {
            x: 195,
            y: 400,
            yDistance: -400,
            speed: 12_000,
            gestureSourceType: "mouse",
            preventFling: true,
          });
          await expect
            .poll(() => page.evaluate(() => scrollY))
            .toBeGreaterThan(300);
          await session.send("Input.synthesizeScrollGesture", {
            x: 195,
            y: 400,
            yDistance: 8000,
            speed: 12_000,
            gestureSourceType: "mouse",
            preventFling: true,
          });
          await expect(log).toHaveAttribute(
            "data-loaded-message-count",
            String(loaded + 20),
            {
              timeout: 30_000,
            },
          );
          pageLoads.push(performance.now() - pageStartedAt);
        }
        expect(cursors).toEqual([
          null,
          ...Array.from({ length: 49 }, (_, index) => 981 - index * 20),
        ]);
      }
      const durationMs = performance.now() - startedAt;
      const completed = new Promise<{ stream?: string }>((resolve) =>
        session.once("Tracing.tracingComplete", resolve),
      );
      await session.send("Tracing.end");
      const { stream } = await completed;
      if (!stream) throw new Error("Chrome trace 스트림이 없습니다.");
      let trace = "";
      for (;;) {
        const chunk = await session.send("IO.read", { handle: stream });
        trace += chunk.base64Encoded
          ? Buffer.from(chunk.data, "base64").toString("utf8")
          : chunk.data;
        if (chunk.eof) break;
      }
      await session.send("IO.close", { handle: stream });
      const endY = await page.evaluate(() => scrollY);
      if (down) {
        expect(cursors).toEqual([null]);
        expect(Math.abs(endY - startY - 36_000)).toBeLessThan(4000);
        await expect(log).toHaveAttribute(
          "data-loaded-message-count",
          String(count),
        );
      }
      if (run === 0) {
        console.log(`예행 완료: ${count}개, CPU 배율 ${cpuRate}`);
        continue;
      }
      await writeFile(
        resolve(
          directory,
          down
            ? `${count}${compareCpu ? `-cpu${cpuRate}` : ""}-run-${run}.json.gz`
            : `run-${run}.json.gz`,
        ),
        gzipSync(trace, { level: 1 }),
      );
      const events = JSON.parse(trace).traceEvents as Array<{
        name: string;
        tid: number;
        pid: number;
        dur?: number;
        args?: {
          name?: string;
          frame_reporter?: { state?: string; has_missing_content?: boolean };
        };
      }>;
      const main = events.find(
        (event) =>
          event.name === "thread_name" && event.args?.name === "CrRendererMain",
      );
      expect(main).toBeDefined();
      const tasks = events
        .filter(
          (event) =>
            event.pid === main!.pid &&
            event.tid === main!.tid &&
            event.name === "RunTask" &&
            event.dur != null,
        )
        .map((event) => event.dur! / 1000);
      expect(tasks.length).toBeGreaterThan(0);
      const longTasks = tasks.filter((duration) => duration > 50);
      const frames = events.filter(
        (event) =>
          event.name === "PipelineReporter" && event.args?.frame_reporter,
      );
      if (down) expect(frames.length).toBeGreaterThan(0);
      results.push({
        frameReports: frames.length,
        cpuRate,
        missingContentReports: frames.filter(
          (event) => event.args?.frame_reporter?.has_missing_content,
        ).length,
        droppedFrameReports: frames.filter(
          (event) => event.args?.frame_reporter?.state === "STATE_DROPPED",
        ).length,
        run,
        durationMs,
        loadedMessageCount: count,
        mountedMessageCount: await messageRows.count(),
        previousPageRequests: cursors.length - 1,
        pageLoadTimesMs: pageLoads,
        startY,
        endY,
        longTaskCount: longTasks.length,
        longTaskTotalMs: longTasks.reduce((sum, value) => sum + value, 0),
        maxTaskMs: Math.max(...tasks),
      });
      console.log(
        `측정 ${count}개 ${run}/${runs} 완료: ${(durationMs / 1000).toFixed(1)}초, 긴 작업 ${longTasks.length}개`,
      );
    } finally {
      await context.close();
    }
  }
  if (prepend) {
    await writeFile(
      resolve(directory, "summary.json"),
      JSON.stringify(
        {
          browser: browser.version(),
          cpuRate: 4,
          pageSize: 20,
          responseDelayMs: 200,
          warmupRuns: 1,
          results: prependResults,
        },
        null,
        2,
      ),
    );
    return;
  }
  if (down) {
    const summary = {
      scenario: "loaded-down-cpu4-v1",
      browser: browser.version(),
      viewport: { width: 390, height: 844 },
      cpuRates: compareCpu ? [1, 4] : [4],
      warmupRuns: scale ? 0 : 1,
      startDistanceFromBottom: 48_000,
      scrollDistance: 36_000,
      scrollSpeed: 12_000,
      results,
    };
    await writeFile(
      resolve(directory, "summary.json"),
      JSON.stringify(summary, null, 2),
    );
    return;
  }
  const median = (values: number[]) => [...values].sort((a, b) => a - b)[2];
  const summary = {
    label,
    scenario: "pagination-cpu4-v1",
    browser: browser.version(),
    project: testInfo.project.name,
    fixtureSha256: createHash("sha256")
      .update(JSON.stringify(messages))
      .digest("hex"),
    messageCount: messages.length,
    viewport: { width: 390, height: 844 },
    cpuRate: 4,
    pageSize: 20,
    responseDelayMs: 200,
    scrollDistancePerPage: 8000,
    resetDownDistancePerPage: 400,
    scrollSpeed: 12_000,
    warmupRuns: 1,
    results,
    median: {
      durationMs: median(results.map((r) => r.durationMs)),
      missingContentReports: median(
        results.map((r) => r.missingContentReports),
      ),
      droppedFrameReports: median(results.map((r) => r.droppedFrameReports)),
      longTaskCount: median(results.map((r) => r.longTaskCount)),
      longTaskTotalMs: median(results.map((r) => r.longTaskTotalMs)),
      maxTaskMs: median(results.map((r) => r.maxTaskMs)),
    },
  };
  await writeFile(
    resolve(directory, "summary.json"),
    JSON.stringify(summary, null, 2),
  );
  console.log(JSON.stringify(summary, null, 2));
});
