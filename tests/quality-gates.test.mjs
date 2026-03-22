import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("RSS endpoint is DB-backed instead of content-collection backed", () => {
  const rssEndpoint = readFileSync("src/pages/rss.xml.js", "utf8");

  assert.ok(rssEndpoint.includes("getDb("), "expected RSS endpoint to use DB access");
  assert.ok(!rssEndpoint.includes("getCollection("), "RSS endpoint should not depend on content collections");
});

test("package scripts include launch quality gates", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const scripts = pkg.scripts ?? {};

  assert.ok(typeof scripts.lint === "string" && scripts.lint.length > 0, "missing lint script");
  assert.ok(typeof scripts.typecheck === "string" && scripts.typecheck.length > 0, "missing typecheck script");
  assert.ok(typeof scripts.test === "string" && scripts.test.length > 0, "missing test script");
});
