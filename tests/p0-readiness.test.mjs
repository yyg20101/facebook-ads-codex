import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  MetaReadError,
  P0ConfigError,
  assertMetaReadAuthorized,
  loadAndValidateConfig,
  parseEnvText,
  safeFailure,
  validateConfigValues,
  verifyMetaRead
} from "../scripts/lib/p0-readiness.mjs";

const temporaryDirectories = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function validValues(overrides = {}) {
  return {
    META_GRAPH_API_VERSION: "v25.0",
    META_APP_ID: "1234567890",
    META_ALLOWED_AD_ACCOUNT_IDS: "act_1234567890",
    META_ACCESS_TOKEN: `test-token-${"x".repeat(40)}`,
    CLOUDFLARE_ACCOUNT_ID: "a".repeat(32),
    CLOUDFLARE_ZONE_ID: "b".repeat(32),
    CLOUDFLARE_TARGET_DOMAIN: "ads.example.test",
    CLOUDFLARE_PLAN: "Free",
    ...overrides
  };
}

function configText(values) {
  return Object.entries(values)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}

function temporaryFile(contents, mode = 0o600) {
  const directory = mkdtempSync(join(tmpdir(), "p0-readiness-"));
  temporaryDirectories.push(directory);
  const path = join(directory, "input.env");
  writeFileSync(path, contents, { mode });
  chmodSync(path, mode);
  return path;
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}

function successFetch({ visibleId = "act_1234567890" } = {}) {
  return vi.fn(async (url, options) => {
    expect(options.method).toBe("GET");
    expect(options.headers.Authorization).toMatch(/^Bearer /);
    expect(url.searchParams.has("access_token")).toBe(false);

    const path = url.pathname.replace(/^\/v25\.0/, "");
    if (path === "/me/permissions") {
      return jsonResponse({
        data: [{ permission: "ads_read", status: "granted" }]
      });
    }
    if (path === "/me/adaccounts") {
      return jsonResponse({
        data: [
          {
            id: visibleId,
            account_status: 1,
            currency: "USD",
            timezone_name: "Test/Zone"
          }
        ]
      });
    }
    if (path === `/${visibleId}`) {
      return jsonResponse({
        id: visibleId,
        account_status: 1,
        currency: "USD",
        timezone_name: "Test/Zone"
      });
    }
    if (path === `/${visibleId}/campaigns`) {
      return jsonResponse({
        data: [{ id: "campaign_secret", objective: "OUTCOME_SALES" }],
        summary: { total_count: 25 }
      });
    }
    if (path === `/${visibleId}/adsets`) {
      return jsonResponse({
        data: [{ id: "adset_secret", attribution_spec: [{ event_type: "CLICK_THROUGH" }] }],
        summary: { total_count: 125 }
      });
    }
    if (path === `/${visibleId}/ads`) {
      return jsonResponse({
        data: [{ id: "ad_secret", effective_status: "ACTIVE" }],
        summary: { total_count: 1250 }
      });
    }
    if (path === `/${visibleId}/insights`) {
      return jsonResponse({
        data: [
          {
            spend: "999.99",
            impressions: "5000",
            clicks: "100",
            actions: [{ action_type: "purchase", value: "7" }],
            date_stop: "2026-08-05"
          }
        ]
      });
    }
    throw new Error(`unexpected test path: ${path}`);
  });
}

describe("Phase 0 local configuration", () => {
  it("accepts a valid chmod 600 local file and returns only safe summary fields", () => {
    const values = validValues();
    const path = temporaryFile(configText(values));
    const result = loadAndValidateConfig(path);

    expect(result.accountIds).toEqual(["act_1234567890"]);
    expect(result.summary).toMatchObject({
      graphApiVersion: "v25.0",
      accessTokenConfigured: true,
      allowedAccountCount: 1,
      filePermissionsSafe: true
    });
    expect(JSON.stringify(result.summary)).not.toContain(values.META_ACCESS_TOKEN);
    expect(JSON.stringify(result.summary)).not.toContain("act_1234567890");
  });

  it("rejects placeholders and missing fields", () => {
    const result = validateConfigValues({
      META_GRAPH_API_VERSION: "v25.0",
      META_APP_ID: "REPLACE_LATER",
      META_ALLOWED_AD_ACCOUNT_IDS: "act_REPLACE_LATER",
      META_ACCESS_TOKEN: "REPLACE_LATER"
    });
    expect(result.errors.length).toBeGreaterThan(4);
  });

  it("rejects duplicate and oversized account allowlists", () => {
    const duplicate = validateConfigValues(
      validValues({
        META_ALLOWED_AD_ACCOUNT_IDS: "act_12345,act_12345"
      })
    );
    expect(duplicate.errors).toContain(
      "META_ALLOWED_AD_ACCOUNT_IDS: duplicate IDs are not allowed"
    );

    const oversized = validateConfigValues(
      validValues({
        META_ALLOWED_AD_ACCOUNT_IDS: Array.from(
          { length: 11 },
          (_, index) => `act_${10000 + index}`
        ).join(",")
      })
    );
    expect(oversized.errors).toContain(
      "META_ALLOWED_AD_ACCOUNT_IDS: expected between 1 and 10 IDs"
    );
  });

  it("rejects group-readable local configuration", () => {
    const path = temporaryFile(configText(validValues()), 0o640);
    expect(() => loadAndValidateConfig(path)).toThrow(P0ConfigError);
  });

  it("rejects duplicate env keys without echoing their values", () => {
    const parsed = parseEnvText("META_APP_ID=11111\nMETA_APP_ID=22222\n");
    expect(parsed.errors).toEqual(["duplicate field: META_APP_ID"]);
    expect(parsed.errors.join(" ")).not.toContain("22222");
  });

  it("requires a unique explicit authorization flag", () => {
    const authorized = temporaryFile(
      "meta_read_validation_authorized: true\n"
    );
    expect(() => assertMetaReadAuthorized(authorized)).not.toThrow();

    const unauthorized = temporaryFile(
      "meta_read_validation_authorized: false\n"
    );
    expect(() => assertMetaReadAuthorized(unauthorized)).toThrowError(
      expect.objectContaining({ code: "META_READ_VALIDATION_NOT_AUTHORIZED" })
    );
  });
});

describe("Meta read-only validation", () => {
  it("validates allowlisted GET endpoints and emits a redacted report", async () => {
    const values = validValues();
    const fetchImpl = successFetch();
    const report = await verifyMetaRead({
      values,
      accountIds: ["act_1234567890"],
      fetchImpl,
      delay: vi.fn()
    });

    expect(report.result).toBe("PASS");
    expect(report.accounts).toEqual([
      expect.objectContaining({
        alias: "AA-01",
        objectVolumeBuckets: {
          campaigns: "1-100",
          adsets: "101-1000",
          ads: ">1000"
        },
        objectiveContextPresent: true,
        attributionContextPresent: true,
        insightsSamplePresent: true,
        conversionEventDataPresent: true
      })
    ]);
    const serialized = JSON.stringify(report);
    for (const sensitive of [
      values.META_ACCESS_TOKEN,
      "act_1234567890",
      "campaign_secret",
      "adset_secret",
      "ad_secret",
      "999.99"
    ]) {
      expect(serialized).not.toContain(sensitive);
    }
    expect(fetchImpl).toHaveBeenCalledTimes(7);
  });

  it("fails when ads_read is not granted", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ data: [] }));
    await expect(
      verifyMetaRead({
        values: validValues(),
        accountIds: ["act_1234567890"],
        fetchImpl,
        delay: vi.fn()
      })
    ).rejects.toMatchObject({ code: "ADS_READ_NOT_GRANTED" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("fails when the temporary token also grants ads_management", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        data: [
          { permission: "ads_read", status: "granted" },
          { permission: "ads_management", status: "granted" }
        ]
      })
    );
    await expect(
      verifyMetaRead({
        values: validValues(),
        accountIds: ["act_1234567890"],
        fetchImpl,
        delay: vi.fn()
      })
    ).rejects.toMatchObject({ code: "ADS_MANAGEMENT_MUST_NOT_BE_GRANTED" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("fails for zero visible accounts and an account outside the allowlist", async () => {
    const zeroAccounts = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ data: [{ permission: "ads_read", status: "granted" }] })
      )
      .mockResolvedValueOnce(jsonResponse({ data: [] }));
    await expect(
      verifyMetaRead({
        values: validValues(),
        accountIds: ["act_1234567890"],
        fetchImpl: zeroAccounts,
        delay: vi.fn()
      })
    ).rejects.toMatchObject({ code: "NO_VISIBLE_AD_ACCOUNTS" });

    await expect(
      verifyMetaRead({
        values: validValues(),
        accountIds: ["act_9999999999"],
        fetchImpl: successFetch(),
        delay: vi.fn()
      })
    ).rejects.toMatchObject({ code: "ALLOWLIST_ACCOUNT_NOT_VISIBLE" });
  });

  it("retries 429 and 5xx twice but never retries authorization failures", async () => {
    const success = successFetch();
    const retryingFetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, 429))
      .mockResolvedValueOnce(jsonResponse({}, 503))
      .mockImplementation(success);
    const delay = vi.fn();
    await verifyMetaRead({
      values: validValues(),
      accountIds: ["act_1234567890"],
      fetchImpl: retryingFetch,
      delay
    });
    expect(delay).toHaveBeenCalledTimes(2);

    const denied = vi.fn(async () => jsonResponse({}, 403));
    await expect(
      verifyMetaRead({
        values: validValues(),
        accountIds: ["act_1234567890"],
        fetchImpl: denied,
        delay: vi.fn()
      })
    ).rejects.toMatchObject({ code: "META_AUTH_OR_PERMISSION_DENIED" });
    expect(denied).toHaveBeenCalledTimes(1);
  });

  it("returns PARTIAL when required Gate evidence is readable but absent", async () => {
    const baseFetch = successFetch();
    const fetchImpl = vi.fn(async (url, options) => {
      if (url.pathname.endsWith("/insights")) {
        return jsonResponse({ data: [] });
      }
      return baseFetch(url, options);
    });
    const report = await verifyMetaRead({
      values: validValues(),
      accountIds: ["act_1234567890"],
      fetchImpl,
      delay: vi.fn()
    });
    expect(report.result).toBe("PARTIAL");
    expect(report.missingEvidence).toEqual([
      "insights_sample",
      "insights_data_through"
    ]);
  });

  it("classifies invalid JSON, timeout, and incomplete pagination safely", async () => {
    const invalidJson = vi.fn(async () => new Response("not-json"));
    await expect(
      verifyMetaRead({
        values: validValues(),
        accountIds: ["act_1234567890"],
        fetchImpl: invalidJson,
        delay: vi.fn()
      })
    ).rejects.toMatchObject({ code: "META_INVALID_JSON" });

    const timeout = vi.fn(async () => {
      throw new DOMException("test timeout", "AbortError");
    });
    await expect(
      verifyMetaRead({
        values: validValues(),
        accountIds: ["act_1234567890"],
        fetchImpl: timeout,
        delay: vi.fn()
      })
    ).rejects.toMatchObject({ code: "META_REQUEST_TIMEOUT" });

    let calls = 0;
    const paginated = vi.fn(async (url) => {
      if (url.pathname.endsWith("/me/permissions")) {
        return jsonResponse({
          data: [{ permission: "ads_read", status: "granted" }]
        });
      }
      calls += 1;
      return jsonResponse({
        data: [],
        paging: { next: "untrusted-url", cursors: { after: `cursor-${calls}` } }
      });
    });
    await expect(
      verifyMetaRead({
        values: validValues(),
        accountIds: ["act_1234567890"],
        fetchImpl: paginated,
        delay: vi.fn()
      })
    ).rejects.toMatchObject({ code: "META_PAGINATION_INCOMPLETE" });
    expect(calls).toBe(10);
  });

  it("never exposes an unknown thrown error", () => {
    expect(safeFailure(new Error("EA-sensitive-raw-error"))).toEqual({
      result: "FAIL",
      category: "UNEXPECTED_SAFE_FAILURE"
    });
    expect(
      safeFailure(new MetaReadError("META_REQUEST_REJECTED", 400))
    ).toEqual({
      result: "FAIL",
      category: "META_READ_VALIDATION",
      code: "META_REQUEST_REJECTED",
      status: 400
    });
  });
});
