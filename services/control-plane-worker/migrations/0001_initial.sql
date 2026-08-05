PRAGMA foreign_keys = ON;

CREATE TABLE workspaces (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  CHECK (length(id) BETWEEN 3 AND 64),
  CHECK (length(slug) BETWEEN 3 AND 64)
);

CREATE TABLE meta_ad_accounts (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL,
  external_account_ref TEXT NOT NULL,
  currency TEXT NOT NULL,
  timezone_name TEXT NOT NULL,
  source_kind TEXT NOT NULL DEFAULT 'FIXTURE',
  created_at TEXT NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE RESTRICT,
  UNIQUE (workspace_id, id),
  UNIQUE (workspace_id, external_account_ref),
  CHECK (length(currency) = 3),
  CHECK (source_kind = 'FIXTURE')
);

CREATE TABLE sync_runs (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL,
  ad_account_id TEXT NOT NULL,
  api_version TEXT NOT NULL,
  requested_start TEXT NOT NULL,
  requested_end TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, ad_account_id)
    REFERENCES meta_ad_accounts(workspace_id, id) ON DELETE RESTRICT,
  UNIQUE (workspace_id, id),
  UNIQUE (workspace_id, ad_account_id, id),
  CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETE', 'PARTIAL', 'FAILED')),
  CHECK (requested_start <= requested_end)
);

CREATE TABLE insights_daily (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL,
  ad_account_id TEXT NOT NULL,
  object_level TEXT NOT NULL,
  object_ref TEXT NOT NULL,
  date_start TEXT NOT NULL,
  date_stop TEXT NOT NULL,
  currency TEXT NOT NULL,
  timezone_name TEXT NOT NULL,
  attribution_spec_hash TEXT NOT NULL,
  api_version TEXT NOT NULL,
  sync_run_id TEXT NOT NULL,
  spend_minor_units INTEGER,
  impressions INTEGER,
  clicks INTEGER,
  click_metric_kind TEXT NOT NULL,
  conversions INTEGER,
  conversion_event_ref TEXT NOT NULL,
  stability_status TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, ad_account_id)
    REFERENCES meta_ad_accounts(workspace_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, ad_account_id, sync_run_id)
    REFERENCES sync_runs(workspace_id, ad_account_id, id) ON DELETE RESTRICT,
  UNIQUE (
    workspace_id,
    ad_account_id,
    object_level,
    object_ref,
    date_start,
    attribution_spec_hash,
    api_version
  ),
  CHECK (object_level IN ('ACCOUNT', 'CAMPAIGN', 'AD_SET', 'AD')),
  CHECK (length(currency) = 3),
  CHECK (date_start <= date_stop),
  CHECK (spend_minor_units IS NULL OR spend_minor_units >= 0),
  CHECK (impressions IS NULL OR impressions >= 0),
  CHECK (clicks IS NULL OR clicks >= 0),
  CHECK (click_metric_kind IN ('ALL_CLICKS', 'LINK_CLICKS')),
  CHECK (conversions IS NULL OR conversions >= 0),
  CHECK (length(conversion_event_ref) BETWEEN 1 AND 128),
  CHECK (stability_status IN ('PROVISIONAL', 'RECONCILING', 'STABLE'))
);

CREATE INDEX idx_meta_ad_accounts_workspace
  ON meta_ad_accounts (workspace_id);
CREATE INDEX idx_sync_runs_workspace_account
  ON sync_runs (workspace_id, ad_account_id, started_at);
CREATE INDEX idx_insights_daily_workspace_date
  ON insights_daily (workspace_id, date_start, object_level);
CREATE INDEX idx_insights_daily_account_range
  ON insights_daily (
    workspace_id,
    ad_account_id,
    object_level,
    date_start,
    date_stop
  );
