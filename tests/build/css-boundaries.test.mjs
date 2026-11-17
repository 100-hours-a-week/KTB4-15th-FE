import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { runInNewContext } from "node:vm";

// Run after a production build: these assertions cover the emitted CSS, not just imports.
function routeCss(route) {
  const context = {};
  runInNewContext(
    readFileSync(
      `.next/server/app/${route}/page_client-reference-manifest.js`,
      "utf8",
    ),
    context,
  );
  const manifest = Object.values(context.__RSC_MANIFEST)[0];
  const paths = new Set(
    Object.values(manifest.entryCSSFiles)
      .flat()
      .map((entry) => entry.path),
  );
  return [...paths]
    .map((path) => readFileSync(join(".next", path), "utf8"))
    .join("\n");
}

for (const [route, required, excluded] of [
  [
    "(service)/fitting",
    ["fitting-full-body-photo-section", "fitting-outfit-section"],
    ["chat-", "login-form", "signup-form", "fitting-wardrobe-screen"],
  ],
  [
    "(service)/chat",
    ["chat-intro", "chat-composer"],
    ["login-form", "signup-form", "fitting-outfit-section", "wishlist-screen"],
  ],
  [
    "(service)/fitting/wardrobe",
    ["fitting-wardrobe-screen"],
    ["chat-", "login-form", "signup-form"],
  ],
  [
    "(public)/(auth)/login",
    ["login-form"],
    ["chat-", "fitting-outfit-section", "ranking-screen"],
  ],
  [
    "(service)/ranking",
    ["ranking-screen"],
    ["chat-", "login-form", "signup-form"],
  ],
]) {
  test(`${route}: initial CSS keeps its screen and excludes unrelated screens`, () => {
    const modules = [
      ...routeCss(route).matchAll(/([A-Za-z0-9_-]+)-module-scss-module__/g),
    ].map((match) => match[1]);
    for (const name of required) assert.ok(modules.includes(name), name);
    for (const name of excluded) {
      assert.ok(
        !modules.some((module) =>
          name.endsWith("-") ? module.startsWith(name) : module === name,
        ),
        name,
      );
    }
  });
}
