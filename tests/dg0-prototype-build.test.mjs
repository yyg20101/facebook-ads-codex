import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildArtifacts
} from "../scripts/build-dg0-prototypes.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const GENERATED = resolve(ROOT, "docs/discovery/prototypes/generated");

test("builds 27 SVG files plus manifest and gallery", () => {
  const artifacts = buildArtifacts();
  assert.equal(
    [...artifacts.keys()].filter((name) => name.endsWith(".svg")).length,
    27
  );
  assert.ok(artifacts.has("manifest.json"));
  assert.ok(artifacts.has("gallery.md"));
});

test("tracked generated files exactly match the model", async () => {
  const artifacts = buildArtifacts();
  const actualNames = (await readdir(GENERATED)).sort();
  assert.deepEqual(actualNames, [...artifacts.keys()].sort());
  for (const [name, expected] of artifacts) {
    const actual = await readFile(resolve(GENERATED, name), "utf8");
    assert.equal(actual, expected, `${name} is stale; run npm run prototype:build`);
  }
});
