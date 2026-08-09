import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createForwardTestCase,
  listForwardTestCases,
} from "../evals/facebook-ads-analysis/session-cases.mjs";

export const FORWARD_TEST_PREPARATION_SCHEMA_VERSION =
  "facebook-ads-analysis-forward-test-preparation/v1";

export function prepareForwardTestCase(caseId) {
  return {
    preparation_schema_version: FORWARD_TEST_PREPARATION_SCHEMA_VERSION,
    preparation_status: "READY",
    execution_status: "NOT_RUN",
    case: createForwardTestCase(caseId),
    external_write: false,
  };
}

export function listPreparedForwardTestCases() {
  return {
    preparation_schema_version: FORWARD_TEST_PREPARATION_SCHEMA_VERSION,
    preparation_status: "READY",
    execution_status: "NOT_RUN",
    cases: listForwardTestCases(),
    external_write: false,
  };
}

function rejected(reason) {
  return {
    preparation_status: "REJECTED",
    code: "INVALID_FORWARD_TEST_CASE",
    reason,
    execution_status: "NOT_RUN",
    external_write: false,
  };
}

function main() {
  const [argument, ...extra] = process.argv.slice(2);
  if (!argument || extra.length > 0) {
    process.stderr.write(
      "usage: node prepare-facebook-ads-analysis-forward-test.mjs <--list|FWD-FBA-NNN>\n",
    );
    process.exitCode = 2;
    return;
  }

  try {
    const result =
      argument === "--list"
        ? listPreparedForwardTestCases()
        : prepareForwardTestCase(argument);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(
      `${JSON.stringify(rejected(error instanceof Error ? error.message : String(error)), null, 2)}\n`,
    );
    process.exitCode = 2;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
