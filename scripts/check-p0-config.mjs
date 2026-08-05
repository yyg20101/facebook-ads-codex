import {
  DEFAULT_CONFIG_PATH,
  loadAndValidateConfig,
  safeFailure
} from "./lib/p0-readiness.mjs";

try {
  const { summary } = loadAndValidateConfig(DEFAULT_CONFIG_PATH);
  console.log(JSON.stringify({ result: "PASS", ...summary }, null, 2));
} catch (error) {
  console.error(JSON.stringify(safeFailure(error), null, 2));
  process.exitCode = 1;
}
