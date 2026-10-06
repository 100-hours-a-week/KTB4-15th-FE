import assert from "node:assert/strict";
import test from "node:test";
import { NetworkError, TimeoutError } from "ky";

import {
  getApiErrorMessage,
  OfflineError,
} from "../../src/shared/api/error.ts";

const request = new Request("https://example.com");

test("getApiErrorMessage returns actionable connection messages", () => {
  assert.equal(
    getApiErrorMessage(new OfflineError(), "fallback"),
    "인터넷 연결을 확인해 주세요.",
  );
  assert.equal(
    getApiErrorMessage(new NetworkError(request), "fallback"),
    "서버에 연결할 수 없어요. 인터넷 연결을 확인해 주세요.",
  );
  assert.equal(
    getApiErrorMessage(new TimeoutError(request), "fallback"),
    "응답이 지연되고 있어요. 잠시 후 다시 시도해 주세요.",
  );
  assert.equal(getApiErrorMessage(new Error(), "fallback"), "fallback");
});
