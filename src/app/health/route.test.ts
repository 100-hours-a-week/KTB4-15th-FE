import assert from "node:assert/strict";
import test from "node:test";

import { GET } from "./route.ts";

test("GET /health returns an UP liveness response", async () => {
  const response = GET();

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "UP" });
});
