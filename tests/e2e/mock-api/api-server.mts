import { createServer } from "node:http";
import { Readable } from "node:stream";
import { getResponse } from "msw";
import { apiURL } from "../data/chat.ts";
import { requests, testHandlers, unhandled } from "./api-handlers.ts";

// SSR과 브라우저가 같은 상태를 조회하도록 MSW 응답을 로컬 HTTP로 제공한다.
createServer(async (incoming, outgoing) => {
  outgoing.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:3100");
  outgoing.setHeader("Access-Control-Allow-Credentials", "true");
  outgoing.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept");
  outgoing.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, OPTIONS",
  );
  if (incoming.method === "OPTIONS") {
    outgoing.writeHead(204).end();
    return;
  }
  try {
    const chunks = [];
    for await (const chunk of incoming) chunks.push(Buffer.from(chunk));
    const body = Buffer.concat(chunks).toString();
    const url = new URL(incoming.url!, apiURL);
    const request = new Request(url, {
      method: incoming.method,
      headers: incoming.headers as Record<string, string>,
      ...(body && { body }),
    });
    if (!url.pathname.startsWith("/__test/") && url.pathname !== "/health") {
      requests.push({
        method: request.method,
        path: url.pathname,
        body: body ? JSON.parse(body) : null,
      });
    }
    const response = await getResponse(testHandlers, request);
    if (!response) {
      unhandled.push(`${request.method} ${url.pathname}`);
      outgoing.writeHead(500).end("Unhandled test API");
      return;
    }
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.flushHeaders();
    if (response.body) {
      const bodyStream = Readable.fromWeb(
        response.body as import("node:stream/web").ReadableStream,
      );
      bodyStream.on("error", (error) => outgoing.destroy(error));
      outgoing.on("close", () => bodyStream.destroy());
      bodyStream.pipe(outgoing);
    } else outgoing.end();
  } catch (error) {
    console.error(error);
    outgoing.writeHead(500).end("Test API error");
  }
}).listen(3101, "127.0.0.1");
