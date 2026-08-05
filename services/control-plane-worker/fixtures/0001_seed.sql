INSERT INTO workspaces (id, slug, display_name, created_at)
VALUES ('ws_fixture_01', 'fixture-workspace', '虚构演示工作区', '2026-08-05T00:00:00Z')
ON CONFLICT(id) DO NOTHING;

INSERT INTO meta_ad_accounts (
  id,
  workspace_id,
  external_account_ref,
  currency,
  timezone_name,
  source_kind,
  created_at
)
VALUES (
  'aa_fixture_01',
  'ws_fixture_01',
  'fixture-ad-account-01',
  'USD',
  'Etc/UTC',
  'FIXTURE',
  '2026-08-05T00:00:00Z'
)
ON CONFLICT(id) DO NOTHING;

INSERT INTO sync_runs (
  id,
  workspace_id,
  ad_account_id,
  api_version,
  requested_start,
  requested_end,
  status,
  started_at,
  completed_at
)
VALUES (
  'sync_fixture_01',
  'ws_fixture_01',
  'aa_fixture_01',
  'v25.0',
  '2026-07-29',
  '2026-08-04',
  'COMPLETE',
  '2026-08-05T00:00:00Z',
  '2026-08-05T00:00:01Z'
)
ON CONFLICT(id) DO NOTHING;

INSERT INTO insights_daily (
  id,
  workspace_id,
  ad_account_id,
  object_level,
  object_ref,
  date_start,
  date_stop,
  currency,
  timezone_name,
  attribution_spec_hash,
  api_version,
  sync_run_id,
  spend_minor_units,
  impressions,
  clicks,
  click_metric_kind,
  conversions,
  conversion_event_ref,
  stability_status,
  fetched_at
)
VALUES
  (
    'insight_fixture_01',
    'ws_fixture_01',
    'aa_fixture_01',
    'ACCOUNT',
    'fixture-ad-account-01',
    '2026-08-02',
    '2026-08-02',
    'USD',
    'Etc/UTC',
    'fixture-attribution-context',
    'v25.0',
    'sync_fixture_01',
    10000,
    8000,
    160,
    'ALL_CLICKS',
    4,
    'fixture-purchase',
    'STABLE',
    '2026-08-05T00:00:01Z'
  ),
  (
    'insight_fixture_02',
    'ws_fixture_01',
    'aa_fixture_01',
    'ACCOUNT',
    'fixture-ad-account-01',
    '2026-08-03',
    '2026-08-03',
    'USD',
    'Etc/UTC',
    'fixture-attribution-context',
    'v25.0',
    'sync_fixture_01',
    11000,
    9000,
    198,
    'ALL_CLICKS',
    5,
    'fixture-purchase',
    'STABLE',
    '2026-08-05T00:00:01Z'
  ),
  (
    'insight_fixture_03',
    'ws_fixture_01',
    'aa_fixture_01',
    'ACCOUNT',
    'fixture-ad-account-01',
    '2026-08-04',
    '2026-08-04',
    'USD',
    'Etc/UTC',
    'fixture-attribution-context',
    'v25.0',
    'sync_fixture_01',
    12345,
    10000,
    250,
    'ALL_CLICKS',
    7,
    'fixture-purchase',
    'STABLE',
    '2026-08-05T00:00:01Z'
  )
ON CONFLICT(id) DO NOTHING;
