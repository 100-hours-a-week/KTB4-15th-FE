import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

let startPromise: ReturnType<typeof worker.start> | undefined;

export function startBrowserMocks() {
  return (startPromise ??= worker.start({ onUnhandledFrame: "warn" }));
}
