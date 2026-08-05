import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  cloudflareTest,
  readD1Migrations
} from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

const serviceDirectory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    cloudflareTest(async () => ({
      wrangler: {
        configPath: path.join(serviceDirectory, "wrangler.jsonc")
      },
      miniflare: {
        bindings: {
          TEST_MIGRATIONS: await readD1Migrations(
            path.join(serviceDirectory, "migrations")
          ),
          TEST_FIXTURES: await readD1Migrations(
            path.join(serviceDirectory, "fixtures")
          )
        }
      }
    }))
  ],
  test: {
    include: [path.join(serviceDirectory, "test/**/*.spec.ts")],
    setupFiles: [path.join(serviceDirectory, "test/setup.ts")]
  }
});
