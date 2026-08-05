import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

export const EXPECTED_GRAPH_API_VERSION = "v25.0";
export const DEFAULT_CONFIG_PATH = resolve(
  process.cwd(),
  "config/p0-readiness.local.env"
);
export const STATUS_PATH = resolve(
  process.cwd(),
  "docs/project/status-and-authorizations.md"
);

const REQUIRED_KEYS = [
  "META_GRAPH_API_VERSION",
  "META_APP_ID",
  "META_ALLOWED_AD_ACCOUNT_IDS",
  "META_ACCESS_TOKEN",
  "CLOUDFLARE_ACCOUNT_ID",
  "CLOUDFLARE_TARGET_DOMAIN",
  "CLOUDFLARE_PLAN"
];
const PLACEHOLDER_PATTERN = /^(?:REPLACE_LATER|OPTIONAL_LATER|TBD|CHANGEME)$/i;

export class P0ConfigError extends Error {
  constructor(errors) {
    super("Phase 0 local configuration is invalid");
    this.name = "P0ConfigError";
    this.errors = errors;
  }
}

export class MetaReadError extends Error {
  constructor(code, status = null) {
    super(code);
    this.name = "MetaReadError";
    this.code = code;
    this.status = status;
  }
}

export function parseEnvText(text) {
  const values = {};
  const errors = [];

  for (const [index, rawLine] of text.split(/\r?\n/).entries()) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const match = rawLine.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (!match) {
      errors.push(`line ${index + 1}: expected KEY=VALUE`);
      continue;
    }
    const [, key, rawValue] = match;
    if (Object.hasOwn(values, key)) {
      errors.push(`duplicate field: ${key}`);
      continue;
    }
    let value = rawValue.trim();
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }

  return { values, errors };
}

function isPlaceholder(value) {
  return !value || PLACEHOLDER_PATTERN.test(value);
}

function validHostname(value) {
  if (value.length > 253 || value.includes("://") || value.includes("/")) {
    return false;
  }
  return value
    .split(".")
    .every(
      (label) =>
        /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/.test(label)
    );
}

export function validateConfigValues(values, { mode = 0o600 } = {}) {
  const errors = [];
  for (const key of REQUIRED_KEYS) {
    if (isPlaceholder(values[key])) {
      errors.push(`${key}: missing or still a placeholder`);
    }
  }

  if (values.META_GRAPH_API_VERSION !== EXPECTED_GRAPH_API_VERSION) {
    errors.push(
      `META_GRAPH_API_VERSION: expected ${EXPECTED_GRAPH_API_VERSION}; recheck the official Meta workspace before changing it`
    );
  }
  if (
    !isPlaceholder(values.META_APP_ID) &&
    !/^\d{5,30}$/.test(values.META_APP_ID)
  ) {
    errors.push("META_APP_ID: expected a numeric App ID");
  }

  const accountIds = (values.META_ALLOWED_AD_ACCOUNT_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (accountIds.length < 1 || accountIds.length > 10) {
    errors.push("META_ALLOWED_AD_ACCOUNT_IDS: expected between 1 and 10 IDs");
  }
  if (new Set(accountIds).size !== accountIds.length) {
    errors.push("META_ALLOWED_AD_ACCOUNT_IDS: duplicate IDs are not allowed");
  }
  if (
    accountIds.some(
      (accountId) =>
        accountId !== "act_REPLACE_LATER" && !/^act_\d{5,30}$/.test(accountId)
    )
  ) {
    errors.push("META_ALLOWED_AD_ACCOUNT_IDS: every ID must use act_<digits>");
  }
  if (
    !isPlaceholder(values.META_ACCESS_TOKEN) &&
    values.META_ACCESS_TOKEN.length < 20
  ) {
    errors.push("META_ACCESS_TOKEN: value is unexpectedly short");
  }
  if (
    !isPlaceholder(values.CLOUDFLARE_ACCOUNT_ID) &&
    !/^[a-f0-9]{32}$/i.test(values.CLOUDFLARE_ACCOUNT_ID)
  ) {
    errors.push("CLOUDFLARE_ACCOUNT_ID: expected a 32-character identifier");
  }
  if (
    values.CLOUDFLARE_ZONE_ID &&
    !/^OPTIONAL_LATER$/i.test(values.CLOUDFLARE_ZONE_ID) &&
    !/^[a-f0-9]{32}$/i.test(values.CLOUDFLARE_ZONE_ID)
  ) {
    errors.push("CLOUDFLARE_ZONE_ID: expected a 32-character identifier or OPTIONAL_LATER");
  }
  if (
    !isPlaceholder(values.CLOUDFLARE_TARGET_DOMAIN) &&
    !validHostname(values.CLOUDFLARE_TARGET_DOMAIN)
  ) {
    errors.push("CLOUDFLARE_TARGET_DOMAIN: expected a hostname without scheme or path");
  }
  if (
    !isPlaceholder(values.CLOUDFLARE_PLAN) &&
    !/^(?:free|pro|business|enterprise)$/i.test(values.CLOUDFLARE_PLAN)
  ) {
    errors.push("CLOUDFLARE_PLAN: expected Free, Pro, Business, or Enterprise");
  }
  if ((mode & 0o077) !== 0) {
    errors.push("local configuration permissions must be 600");
  }

  return {
    errors,
    accountIds,
    summary: {
      graphApiVersion: values.META_GRAPH_API_VERSION || "MISSING",
      appIdConfigured: !isPlaceholder(values.META_APP_ID),
      accessTokenConfigured: !isPlaceholder(values.META_ACCESS_TOKEN),
      allowedAccountCount: accountIds.filter(
        (accountId) => accountId !== "act_REPLACE_LATER"
      ).length,
      cloudflareAccountConfigured: !isPlaceholder(
        values.CLOUDFLARE_ACCOUNT_ID
      ),
      cloudflareZoneConfigured:
        Boolean(values.CLOUDFLARE_ZONE_ID) &&
        !isPlaceholder(values.CLOUDFLARE_ZONE_ID),
      cloudflareDomainConfigured: !isPlaceholder(
        values.CLOUDFLARE_TARGET_DOMAIN
      ),
      cloudflarePlanConfigured: !isPlaceholder(values.CLOUDFLARE_PLAN),
      filePermissionsSafe: (mode & 0o077) === 0
    }
  };
}

export function loadAndValidateConfig(path = DEFAULT_CONFIG_PATH) {
  let text;
  let mode;
  try {
    text = readFileSync(path, "utf8");
    mode = statSync(path).mode & 0o777;
  } catch {
    throw new P0ConfigError([
      "local configuration is missing; copy config/p0-readiness.example.env first"
    ]);
  }

  const parsed = parseEnvText(text);
  const validation = validateConfigValues(parsed.values, { mode });
  const errors = [...parsed.errors, ...validation.errors];
  if (errors.length > 0) {
    throw new P0ConfigError(errors);
  }
  return {
    values: parsed.values,
    accountIds: validation.accountIds,
    summary: validation.summary
  };
}

export function assertMetaReadAuthorized(path = STATUS_PATH) {
  const text = readFileSync(path, "utf8");
  const matches = [
    ...text.matchAll(/^meta_read_validation_authorized:\s*(true|false)\s*$/gm)
  ];
  if (matches.length !== 1 || matches[0][1] !== "true") {
    throw new MetaReadError("META_READ_VALIDATION_NOT_AUTHORIZED");
  }
}

function countBucket(totalCount) {
  if (!Number.isInteger(totalCount) || totalCount < 0) return "UNAVAILABLE";
  if (totalCount === 0) return "0";
  if (totalCount <= 100) return "1-100";
  if (totalCount <= 1000) return "101-1000";
  return ">1000";
}

function responseCount(payload) {
  return payload?.summary?.total_count;
}

function createMetaClient({ version, token, fetchImpl, delay, timeoutMs }) {
  const baseUrl = `https://graph.facebook.com/${version}`;

  return async function request(path, params = {}) {
    const url = new URL(`${baseUrl}${path}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      let response;
      try {
        response = await fetchImpl(url, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal
        });
      } catch (error) {
        clearTimeout(timer);
        if (error?.name === "AbortError") {
          throw new MetaReadError("META_REQUEST_TIMEOUT");
        }
        throw new MetaReadError("META_NETWORK_ERROR");
      }
      clearTimeout(timer);

      if ((response.status === 429 || response.status >= 500) && attempt < 2) {
        await delay(100 * 2 ** attempt);
        continue;
      }
      if (!response.ok) {
        const code =
          response.status === 401 || response.status === 403
            ? "META_AUTH_OR_PERMISSION_DENIED"
            : response.status === 429
              ? "META_RATE_LIMIT_EXHAUSTED"
              : response.status >= 500
                ? "META_SERVER_ERROR"
                : "META_REQUEST_REJECTED";
        throw new MetaReadError(code, response.status);
      }
      try {
        return await response.json();
      } catch {
        throw new MetaReadError("META_INVALID_JSON", response.status);
      }
    }
    throw new MetaReadError("META_RETRY_EXHAUSTED");
  };
}

async function listVisibleAccounts(request) {
  const accounts = [];
  let after;
  for (let page = 0; page < 10; page += 1) {
    const payload = await request("/me/adaccounts", {
      fields: "id,account_status,currency,timezone_name",
      limit: 100,
      ...(after ? { after } : {})
    });
    if (!Array.isArray(payload?.data)) {
      throw new MetaReadError("META_SCHEMA_MISMATCH");
    }
    accounts.push(...payload.data);
    after = payload?.paging?.cursors?.after;
    if (!payload?.paging?.next) {
      return accounts;
    }
    if (typeof after !== "string" || after.length > 2048) {
      throw new MetaReadError("META_PAGINATION_INCOMPLETE");
    }
  }
  throw new MetaReadError("META_PAGINATION_INCOMPLETE");
}

export async function verifyMetaRead({
  values,
  accountIds,
  fetchImpl = globalThis.fetch,
  delay = (milliseconds) =>
    new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds)),
  timeoutMs = 15_000
}) {
  const request = createMetaClient({
    version: values.META_GRAPH_API_VERSION,
    token: values.META_ACCESS_TOKEN,
    fetchImpl,
    delay,
    timeoutMs
  });

  const permissions = await request("/me/permissions");
  const adsReadGranted = permissions?.data?.some(
    (permission) =>
      permission?.permission === "ads_read" && permission?.status === "granted"
  );
  if (!adsReadGranted) {
    throw new MetaReadError("ADS_READ_NOT_GRANTED");
  }
  const adsManagementGranted = permissions?.data?.some(
    (permission) =>
      permission?.permission === "ads_management" &&
      permission?.status === "granted"
  );
  if (adsManagementGranted) {
    throw new MetaReadError("ADS_MANAGEMENT_MUST_NOT_BE_GRANTED");
  }

  const visibleAccounts = await listVisibleAccounts(request);
  if (visibleAccounts.length === 0) {
    throw new MetaReadError("NO_VISIBLE_AD_ACCOUNTS");
  }
  const visibleIds = new Set(visibleAccounts.map((account) => account?.id));
  if (accountIds.some((accountId) => !visibleIds.has(accountId))) {
    throw new MetaReadError("ALLOWLIST_ACCOUNT_NOT_VISIBLE");
  }

  const accountResults = [];
  for (const [index, accountId] of accountIds.entries()) {
    const [account, campaigns, adsets, ads, insights] = await Promise.all([
      request(`/${accountId}`, {
        fields: "id,account_status,currency,timezone_name"
      }),
      request(`/${accountId}/campaigns`, {
        fields: "id,objective,effective_status",
        limit: 1,
        summary: true
      }),
      request(`/${accountId}/adsets`, {
        fields: "id,attribution_spec,effective_status",
        limit: 1,
        summary: true
      }),
      request(`/${accountId}/ads`, {
        fields: "id,effective_status",
        limit: 1,
        summary: true
      }),
      request(`/${accountId}/insights`, {
        level: "account",
        fields: "spend,impressions,clicks,actions",
        date_preset: "last_7d",
        limit: 1
      })
    ]);

    for (const payload of [campaigns, adsets, ads, insights]) {
      if (!Array.isArray(payload?.data)) {
        throw new MetaReadError("META_SCHEMA_MISMATCH");
      }
    }
    const insight = insights.data[0];
    accountResults.push({
      alias: `AA-${String(index + 1).padStart(2, "0")}`,
      accountContext: {
        statusPresent: account?.account_status !== undefined,
        currencyPresent: Boolean(account?.currency),
        timezonePresent: Boolean(account?.timezone_name)
      },
      objectVolumeBuckets: {
        campaigns: countBucket(responseCount(campaigns)),
        adsets: countBucket(responseCount(adsets)),
        ads: countBucket(responseCount(ads))
      },
      objectiveContextPresent: Boolean(campaigns.data[0]?.objective),
      attributionContextPresent: Boolean(adsets.data[0]?.attribution_spec),
      insightsSamplePresent: Boolean(insight),
      conversionEventDataPresent:
        Array.isArray(insight?.actions) && insight.actions.length > 0,
      dataThroughPresent: Boolean(insight?.date_stop)
    });
  }

  const missingEvidence = [];
  for (const account of accountResults) {
    if (!Object.values(account.accountContext).every(Boolean)) {
      missingEvidence.push(`${account.alias}:account_context`);
    }
    if (
      Object.values(account.objectVolumeBuckets).some(
        (bucket) => bucket === "UNAVAILABLE"
      )
    ) {
      missingEvidence.push(`${account.alias}:object_volume`);
    }
  }
  if (!accountResults.some((account) => account.objectiveContextPresent)) {
    missingEvidence.push("campaign_objective_context");
  }
  if (!accountResults.some((account) => account.attributionContextPresent)) {
    missingEvidence.push("adset_attribution_context");
  }
  if (!accountResults.some((account) => account.insightsSamplePresent)) {
    missingEvidence.push("insights_sample");
  }
  if (!accountResults.some((account) => account.dataThroughPresent)) {
    missingEvidence.push("insights_data_through");
  }

  return {
    result: missingEvidence.length === 0 ? "PASS" : "PARTIAL",
    checkedAt: new Date().toISOString(),
    graphApiVersion: values.META_GRAPH_API_VERSION,
    permission: "ads_read",
    visibleAccountCount: visibleAccounts.length,
    validatedAccountCount: accountResults.length,
    accounts: accountResults,
    missingEvidence,
    limitations: [
      "last_7d is a bounded connection check, not a product history default",
      "exact identifiers, metrics, names, cursors, and raw responses are not retained"
    ]
  };
}

export function safeFailure(error) {
  if (error instanceof P0ConfigError) {
    return { result: "FAIL", category: "CONFIGURATION", errors: error.errors };
  }
  if (error instanceof MetaReadError) {
    return {
      result: "FAIL",
      category: "META_READ_VALIDATION",
      code: error.code,
      ...(error.status ? { status: error.status } : {})
    };
  }
  return { result: "FAIL", category: "UNEXPECTED_SAFE_FAILURE" };
}
