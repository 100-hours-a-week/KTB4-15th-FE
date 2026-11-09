import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { test, expect } from "@playwright/test";
import { apiURL, createdAt, products } from "../e2e/data/chat";

test("채팅방 초기 로딩 LCP 기준선을 5회 측정한다", async ({
  browser,
  request,
}) => {
  const label = process.env.BENCH_LABEL ?? "baseline";
  expect(label).toMatch(/^[a-zA-Z0-9_-]+$/);
  const directory = resolve("performance-results/chat-lcp", label);
  await mkdir(directory, { recursive: true });
  const room239 = process.env.BENCH_ROOM239 === "1";
  const fixed = room239
    ? JSON.parse(
        await readFile(
          resolve(
            "performance-results/chat-lcp/room239-fixture/fixed-response.json",
          ),
          "utf8",
        ),
      )
    : null;
  const roomId = room239 ? 239 : 1;
  const response = await request.post(`${apiURL}/__test/reset`, {
    data: {
      preserveRecommendationProducts: room239,
      rooms: [
        {
          chatRoomId: roomId,
          title: "LCP 측정",
          messages:
            fixed?.data.messages ??
            Array.from({ length: 20 }, (_, index) => ({
              messageId: index + 1,
              senderType: index % 2 === 0 ? "USER" : "AI",
              content:
                index % 2 === 0
                  ? "출근할 때 입을 옷을 추천해 주세요."
                  : "편안한 출근룩을 추천해 드릴게요. 셔츠와 슬랙스를 함께 입으면 잘 어울려요.",
              createdAt,
              generationStatus: index % 2 === 0 ? "COMPLETED" : null,
              recommendation:
                index % 2 === 0
                  ? null
                  : { recommendationId: index + 1, products },
            })),
        },
      ],
    },
  });
  expect(response.ok()).toBeTruthy();
  if (fixed) {
    const verified = await (
      await request.get(`${apiURL}/chat-rooms/${roomId}/messages?size=20`)
    ).json();
    expect(verified.data.messages).toEqual(fixed.data.messages);
  }
  // 두 조건 모두 같은 HTML 전달 경로를 사용하고 preload 유무만 바꾼다.
  const errorPreloadExperiment = process.env.BENCH_ERROR_PRELOAD;
  let errorChunkUrl: string | undefined;
  if (errorPreloadExperiment != null) {
    expect(["0", "1"]).toContain(errorPreloadExperiment);
    const chunkDirectory = resolve(".next/static/chunks");
    const candidates = [];
    for (const file of await readdir(chunkDirectory)) {
      if (
        file.endsWith(".js") &&
        (await readFile(resolve(chunkDirectory, file), "utf8")).includes(
          "화면을 불러오지 못했어요",
        )
      ) {
        candidates.push(file);
      }
    }
    expect(candidates).toHaveLength(1);
    errorChunkUrl = `/_next/static/chunks/${candidates[0]}`;
  }
  const imagePreloadExperiment = process.env.BENCH_IMAGE_PRELOAD;
  let imageUrl: URL | undefined;
  if (imagePreloadExperiment != null) {
    expect(room239).toBe(true);
    expect(errorPreloadExperiment).toBeUndefined();
    expect(["0", "1"]).toContain(imagePreloadExperiment);
    const baseline = JSON.parse(
      await readFile(
        resolve(
          "performance-results/chat-lcp/room239-product-actions-after/results.json",
        ),
        "utf8",
      ),
    );
    const urls = new Set<string>(
      baseline.runs.map(
        (run: { candidates: { url: string }[] }) => run.candidates.at(-1)?.url,
      ),
    );
    expect(urls.size).toBe(1);
    imageUrl = new URL([...urls][0]);
    expect(imageUrl.origin).toBe("http://127.0.0.1:3100");
    expect(imageUrl.pathname).toBe("/_next/image");
    expect(imageUrl.searchParams.get("url")).toMatch(
      /^\/bench-chat239\/[a-z0-9]+\.webp$/,
    );
  }
  const preloadTag =
    errorPreloadExperiment === "1"
      ? `<link rel="preload" as="script" href="${errorChunkUrl}">`
      : imagePreloadExperiment === "1" && imageUrl
        ? `<link rel="preload" as="image" fetchpriority="high" href="${imageUrl.href.replaceAll("&", "&amp;")}">`
        : "";
  const interceptDocument =
    errorPreloadExperiment != null || imagePreloadExperiment != null;
  const runs = [];
  for (let run = 1; run <= 5; run += 1) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      serviceWorkers: "block",
    });
    try {
      if (interceptDocument) {
        // HTML 교체 응답은 public으로 분류되므로 로컬 API 통신을 허용한다.
        await context.grantPermissions(["local-network-access"], {
          origin: "http://127.0.0.1:3100",
        });
      }
      const page = await context.newPage();
      const session = await context.newCDPSession(page);
      const notificationStreams: Array<{
        requestId: string;
        url: string;
        status?: number;
        finished: boolean;
      }> = [];
      session.on("Network.requestWillBeSent", (event) => {
        if (
          new URL(event.request.url).pathname.endsWith("/notifications/stream")
        ) {
          notificationStreams.push({
            requestId: event.requestId,
            url: event.request.url,
            finished: false,
          });
        }
      });
      session.on("Network.responseReceived", (event) => {
        const stream = notificationStreams.find(
          (item) => item.requestId === event.requestId,
        );
        if (stream) stream.status = event.response.status;
      });
      session.on("Network.loadingFinished", (event) => {
        const stream = notificationStreams.find(
          (item) => item.requestId === event.requestId,
        );
        if (stream) stream.finished = true;
      });
      await session.send("Network.enable");
      await session.send("Network.setCacheDisabled", { cacheDisabled: true });
      await session.send("Network.emulateNetworkConditions", {
        offline: false,
        latency: 150,
        downloadThroughput: 1_600_000 / 8,
        uploadThroughput: 750_000 / 8,
      });
      await session.send("Emulation.setCPUThrottlingRate", { rate: 4 });
      await page.addInitScript(() => {
        const entries: unknown[] = [];
        Object.assign(window, { lcpEntries: entries });
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const candidate = entry as LargestContentfulPaint;
            entries.push({
              ...candidate.toJSON(),
              element: candidate.element?.outerHTML.slice(0, 1200),
            });
          }
        }).observe({ type: "largest-contentful-paint", buffered: true });
      });
      const tracing = process.env.BENCH_TRACE === "1";
      if (tracing) {
        await session.send("Tracing.start", {
          categories:
            "devtools.timeline,v8.execute,blink.user_timing,loading,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.frame,disabled-by-default-v8.cpu_profiler",
          transferMode: "ReturnAsStream",
        });
      }
      const notificationConnected =
        process.env.BENCH_EXPECT_NOTIFICATION_SSE === "1"
          ? page.waitForEvent("console", {
              predicate: (message) =>
                message.text() === "[notification-sse] connected",
              timeout: 60_000,
            })
          : Promise.resolve();
      if (interceptDocument) {
        await page.route(
          `http://127.0.0.1:3100/chat/${roomId}`,
          async (route) => {
            const response = await route.fetch();
            expect(response.status()).toBe(200);
            const html = await response.text();
            expect(html).toContain("<head>");
            await route.fulfill({
              response,
              body: html.replace("<head>", `<head>${preloadTag}`),
            });
          },
        );
      }
      await Promise.all([
        page.goto(`http://127.0.0.1:3100/chat/${roomId}`),
        notificationConnected,
      ]);
      await expect(
        page.getByRole("log", { name: "채팅 메시지" }),
      ).toHaveAttribute("data-loaded-message-count", "20", { timeout: 60_000 });
      // 입력하면 LCP 관측이 끝나므로 조작 없이 이미지와 지연 렌더링을 기다린다.
      await page.waitForTimeout(8000);
      const result = await page.evaluate(() => ({
        candidates: (window as unknown as { lcpEntries: unknown[] }).lcpEntries,
        navigation: performance
          .getEntriesByType("navigation")
          .map((entry) => entry.toJSON()),
        paint: performance
          .getEntriesByType("paint")
          .map((entry) => entry.toJSON()),
        resources: performance
          .getEntriesByType("resource")
          .map((entry) => entry.toJSON()),
      }));
      expect(result.candidates.length).toBeGreaterThan(0);
      if (imageUrl) {
        const imageResources = result.resources.filter(
          (resource) => resource.name === imageUrl.href,
        );
        expect(imageResources).toHaveLength(1);
        expect(result.candidates.at(-1)).toMatchObject({ url: imageUrl.href });
        if (imagePreloadExperiment === "1") {
          expect(imageResources[0].initiatorType).toBe("link");
        }
      }
      if (errorChunkUrl) {
        const errorResources = result.resources.filter((resource) =>
          resource.name.endsWith(errorChunkUrl),
        );
        expect(errorResources).toHaveLength(1);
        if (errorPreloadExperiment === "1") {
          expect(errorResources[0].initiatorType).toBe("link");
        }
      }
      if (process.env.BENCH_EXPECT_NOTIFICATION_SSE === "1") {
        expect(notificationStreams).toHaveLength(1);
        expect(notificationStreams[0]).toMatchObject({
          status: 200,
          finished: false,
        });
      }
      runs.push({ run, ...result, notificationStreams });
      if (tracing) {
        const complete = new Promise<string>((resolve) => {
          session.once("Tracing.tracingComplete", (event) =>
            resolve(event.stream!),
          );
        });
        await session.send("Tracing.end");
        const handle = await complete;
        const chunks: Buffer[] = [];
        for (;;) {
          const chunk = await session.send("IO.read", { handle });
          chunks.push(
            Buffer.from(chunk.data, chunk.base64Encoded ? "base64" : "utf8"),
          );
          if (chunk.eof) break;
        }
        await session.send("IO.close", { handle });
        await writeFile(
          resolve(directory, `run-${run}.trace.json`),
          Buffer.concat(chunks),
        );
      }
      await page.screenshot({ path: resolve(directory, `run-${run}.png`) });
    } finally {
      await context.close();
    }
  }
  await writeFile(
    resolve(directory, "results.json"),
    JSON.stringify(
      {
        conditions: {
          imagePreloadExperiment: imagePreloadExperiment ?? null,
          imageUrl: imageUrl?.href ?? null,
          errorPreloadExperiment: errorPreloadExperiment ?? null,
          errorChunkUrl: errorChunkUrl ?? null,
          notificationSseVerified:
            process.env.BENCH_EXPECT_NOTIFICATION_SSE === "1",
          room: roomId,
          snapshotSha256: fixed
            ? createHash("sha256").update(JSON.stringify(fixed)).digest("hex")
            : null,
          tracing: process.env.BENCH_TRACE === "1",
          cpu: 4,
          viewport: "390x844",
          latencyMs: 150,
          downloadMbps: 1.6,
          uploadMbps: 0.75,
          cache: "disabled; fresh context per run",
          api: room239
            ? "frozen room 239 response and local image bytes"
            : "local mock; latest 20 messages; product images are local fixtures",
          settleMs: 8000,
        },
        runs,
      },
      null,
      2,
    ),
  );
});
