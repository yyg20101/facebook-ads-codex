import {
  DEFAULT_CONFIG_PATH,
  STATUS_PATH,
  assertMetaReadAuthorized,
  loadAndValidateConfig,
  safeFailure,
  verifyMetaRead
} from "./lib/p0-readiness.mjs";

try {
  assertMetaReadAuthorized(STATUS_PATH);
  const { values, accountIds } = loadAndValidateConfig(DEFAULT_CONFIG_PATH);
  const report = await verifyMetaRead({ values, accountIds });
  console.log(JSON.stringify(report, null, 2));
  if (report.result !== "PASS") {
    process.exitCode = 1;
  }
} catch (error) {
  console.error(JSON.stringify(safeFailure(error), null, 2));
  process.exitCode = 1;
}
