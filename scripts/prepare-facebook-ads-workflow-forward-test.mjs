import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createWorkflowForwardTestCase,
  listWorkflowForwardTestCases,
} from "../evals/facebook-ads-workflow-skills/session-cases.mjs";

export const WORKFLOW_FORWARD_TEST_PREPARATION_SCHEMA_VERSION =
  "facebook-ads-workflow-forward-test-preparation/v1";

export function prepareWorkflowForwardTestCase(caseId) {
  return {
    preparation_schema_version:
      WORKFLOW_FORWARD_TEST_PREPARATION_SCHEMA_VERSION,
    preparation_status: "READY",
    execution_status: "NOT_RUN",
    case: createWorkflowForwardTestCase(caseId),
    external_write: false,
  };
}

export function listPreparedWorkflowForwardTestCases() {
  return {
    preparation_schema_version:
      WORKFLOW_FORWARD_TEST_PREPARATION_SCHEMA_VERSION,
    preparation_status: "READY",
    execution_status: "NOT_RUN",
    cases: listWorkflowForwardTestCases(),
    external_write: false,
  };
}

function rejected(reason) {
  return {
    preparation_status: "REJECTED",
    code: "INVALID_WORKFLOW_FORWARD_TEST_CASE",
    reason,
    execution_status: "NOT_RUN",
    external_write: false,
  };
}

function main() {
  const [argument, ...extra] = process.argv.slice(2);
  if (!argument || extra.length > 0) {
    process.stderr.write(
      "usage: node prepare-facebook-ads-workflow-forward-test.mjs <--list|FWD-FBW-NNN>\n",
    );
    process.exitCode = 2;
    return;
  }

  try {
    const result =
      argument === "--list"
        ? listPreparedWorkflowForwardTestCases()
        : prepareWorkflowForwardTestCase(argument);
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
