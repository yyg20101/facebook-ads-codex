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
    'insight_campaign_01_20260802', 'ws_fixture_01', 'aa_fixture_01',
    'CAMPAIGN', 'fixture-campaign-01', '2026-08-02', '2026-08-02',
    'USD', 'Etc/UTC', 'fixture-attribution-context', 'v25.0',
    'sync_fixture_01', 10000, 8000, 160, 'ALL_CLICKS', 4,
    'fixture-purchase', 'STABLE', '2026-08-05T00:00:01Z'
  ),
  (
    'insight_adset_01_20260802', 'ws_fixture_01', 'aa_fixture_01',
    'AD_SET', 'fixture-ad-set-01', '2026-08-02', '2026-08-02',
    'USD', 'Etc/UTC', 'fixture-attribution-context', 'v25.0',
    'sync_fixture_01', 6000, 4800, 100, 'ALL_CLICKS', 3,
    'fixture-purchase', 'STABLE', '2026-08-05T00:00:01Z'
  ),
  (
    'insight_adset_02_20260802', 'ws_fixture_01', 'aa_fixture_01',
    'AD_SET', 'fixture-ad-set-02', '2026-08-02', '2026-08-02',
    'USD', 'Etc/UTC', 'fixture-attribution-context', 'v25.0',
    'sync_fixture_01', 4000, 3200, 60, 'ALL_CLICKS', 1,
    'fixture-purchase', 'STABLE', '2026-08-05T00:00:01Z'
  ),
  (
    'insight_ad_01_20260802', 'ws_fixture_01', 'aa_fixture_01',
    'AD', 'fixture-ad-01', '2026-08-02', '2026-08-02',
    'USD', 'Etc/UTC', 'fixture-attribution-context', 'v25.0',
    'sync_fixture_01', 3500, 2800, 60, 'ALL_CLICKS', 2,
    'fixture-purchase', 'STABLE', '2026-08-05T00:00:01Z'
  ),
  (
    'insight_ad_02_20260802', 'ws_fixture_01', 'aa_fixture_01',
    'AD', 'fixture-ad-02', '2026-08-02', '2026-08-02',
    'USD', 'Etc/UTC', 'fixture-attribution-context', 'v25.0',
    'sync_fixture_01', 2500, 2000, 40, 'ALL_CLICKS', 1,
    'fixture-purchase', 'STABLE', '2026-08-05T00:00:01Z'
  ),
  (
    'insight_ad_03_20260802', 'ws_fixture_01', 'aa_fixture_01',
    'AD', 'fixture-ad-03', '2026-08-02', '2026-08-02',
    'USD', 'Etc/UTC', 'fixture-attribution-context', 'v25.0',
    'sync_fixture_01', 2200, 1800, 35, 'ALL_CLICKS', 1,
    'fixture-purchase', 'STABLE', '2026-08-05T00:00:01Z'
  ),
  (
    'insight_ad_04_20260802', 'ws_fixture_01', 'aa_fixture_01',
    'AD', 'fixture-ad-04', '2026-08-02', '2026-08-02',
    'USD', 'Etc/UTC', 'fixture-attribution-context', 'v25.0',
    'sync_fixture_01', 1800, 1400, 25, 'ALL_CLICKS', 0,
    'fixture-purchase', 'STABLE', '2026-08-05T00:00:01Z'
  ),
  (
    'insight_campaign_01_20260803', 'ws_fixture_01', 'aa_fixture_01',
    'CAMPAIGN', 'fixture-campaign-01', '2026-08-03', '2026-08-03',
    'USD', 'Etc/UTC', 'fixture-attribution-context', 'v25.0',
    'sync_fixture_01', 11000, 9000, 198, 'ALL_CLICKS', 5,
    'fixture-purchase', 'STABLE', '2026-08-05T00:00:01Z'
  ),
  (
    'insight_adset_01_20260803', 'ws_fixture_01', 'aa_fixture_01',
    'AD_SET', 'fixture-ad-set-01', '2026-08-03', '2026-08-03',
    'USD', 'Etc/UTC', 'fixture-attribution-context', 'v25.0',
    'sync_fixture_01', 6500, 5200, 120, 'ALL_CLICKS', 3,
    'fixture-purchase', 'STABLE', '2026-08-05T00:00:01Z'
  ),
  (
    'insight_adset_02_20260803', 'ws_fixture_01', 'aa_fixture_01',
    'AD_SET', 'fixture-ad-set-02', '2026-08-03', '2026-08-03',
    'USD', 'Etc/UTC', 'fixture-attribution-context', 'v25.0',
    'sync_fixture_01', 4500, 3800, 78, 'ALL_CLICKS', 2,
    'fixture-purchase', 'STABLE', '2026-08-05T00:00:01Z'
  ),
  (
    'insight_ad_01_20260803', 'ws_fixture_01', 'aa_fixture_01',
    'AD', 'fixture-ad-01', '2026-08-03', '2026-08-03',
    'USD', 'Etc/UTC', 'fixture-attribution-context', 'v25.0',
    'sync_fixture_01', 3800, 3000, 72, 'ALL_CLICKS', 2,
    'fixture-purchase', 'STABLE', '2026-08-05T00:00:01Z'
  ),
  (
    'insight_ad_02_20260803', 'ws_fixture_01', 'aa_fixture_01',
    'AD', 'fixture-ad-02', '2026-08-03', '2026-08-03',
    'USD', 'Etc/UTC', 'fixture-attribution-context', 'v25.0',
    'sync_fixture_01', 2700, 2200, 48, 'ALL_CLICKS', 1,
    'fixture-purchase', 'STABLE', '2026-08-05T00:00:01Z'
  ),
  (
    'insight_ad_03_20260803', 'ws_fixture_01', 'aa_fixture_01',
    'AD', 'fixture-ad-03', '2026-08-03', '2026-08-03',
    'USD', 'Etc/UTC', 'fixture-attribution-context', 'v25.0',
    'sync_fixture_01', 2500, 2100, 45, 'ALL_CLICKS', 1,
    'fixture-purchase', 'STABLE', '2026-08-05T00:00:01Z'
  ),
  (
    'insight_ad_04_20260803', 'ws_fixture_01', 'aa_fixture_01',
    'AD', 'fixture-ad-04', '2026-08-03', '2026-08-03',
    'USD', 'Etc/UTC', 'fixture-attribution-context', 'v25.0',
    'sync_fixture_01', 2000, 1700, 33, 'ALL_CLICKS', 1,
    'fixture-purchase', 'STABLE', '2026-08-05T00:00:01Z'
  ),
  (
    'insight_campaign_01_20260804', 'ws_fixture_01', 'aa_fixture_01',
    'CAMPAIGN', 'fixture-campaign-01', '2026-08-04', '2026-08-04',
    'USD', 'Etc/UTC', 'fixture-attribution-context', 'v25.0',
    'sync_fixture_01', 12345, 10000, 250, 'ALL_CLICKS', 7,
    'fixture-purchase', 'STABLE', '2026-08-05T00:00:01Z'
  ),
  (
    'insight_adset_01_20260804', 'ws_fixture_01', 'aa_fixture_01',
    'AD_SET', 'fixture-ad-set-01', '2026-08-04', '2026-08-04',
    'USD', 'Etc/UTC', 'fixture-attribution-context', 'v25.0',
    'sync_fixture_01', 7000, 5600, 150, 'ALL_CLICKS', 5,
    'fixture-purchase', 'STABLE', '2026-08-05T00:00:01Z'
  ),
  (
    'insight_adset_02_20260804', 'ws_fixture_01', 'aa_fixture_01',
    'AD_SET', 'fixture-ad-set-02', '2026-08-04', '2026-08-04',
    'USD', 'Etc/UTC', 'fixture-attribution-context', 'v25.0',
    'sync_fixture_01', 5345, 4400, 100, 'ALL_CLICKS', 2,
    'fixture-purchase', 'STABLE', '2026-08-05T00:00:01Z'
  ),
  (
    'insight_ad_01_20260804', 'ws_fixture_01', 'aa_fixture_01',
    'AD', 'fixture-ad-01', '2026-08-04', '2026-08-04',
    'USD', 'Etc/UTC', 'fixture-attribution-context', 'v25.0',
    'sync_fixture_01', 4200, 3300, 95, 'ALL_CLICKS', 3,
    'fixture-purchase', 'STABLE', '2026-08-05T00:00:01Z'
  ),
  (
    'insight_ad_02_20260804', 'ws_fixture_01', 'aa_fixture_01',
    'AD', 'fixture-ad-02', '2026-08-04', '2026-08-04',
    'USD', 'Etc/UTC', 'fixture-attribution-context', 'v25.0',
    'sync_fixture_01', 2800, 2300, 55, 'ALL_CLICKS', 2,
    'fixture-purchase', 'STABLE', '2026-08-05T00:00:01Z'
  ),
  (
    'insight_ad_03_20260804', 'ws_fixture_01', 'aa_fixture_01',
    'AD', 'fixture-ad-03', '2026-08-04', '2026-08-04',
    'USD', 'Etc/UTC', 'fixture-attribution-context', 'v25.0',
    'sync_fixture_01', 3000, 2500, 60, 'ALL_CLICKS', 1,
    'fixture-purchase', 'STABLE', '2026-08-05T00:00:01Z'
  ),
  (
    'insight_ad_04_20260804', 'ws_fixture_01', 'aa_fixture_01',
    'AD', 'fixture-ad-04', '2026-08-04', '2026-08-04',
    'USD', 'Etc/UTC', 'fixture-attribution-context', 'v25.0',
    'sync_fixture_01', 2345, 1900, 40, 'ALL_CLICKS', 1,
    'fixture-purchase', 'STABLE', '2026-08-05T00:00:01Z'
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

INSERT INTO meta_ad_objects (
  id,
  workspace_id,
  ad_account_id,
  parent_object_id,
  external_object_ref,
  object_level,
  display_name,
  source_kind,
  sync_run_id,
  fetched_at
)
VALUES
  (
    'campaign_fixture_01',
    'ws_fixture_01',
    'aa_fixture_01',
    NULL,
    'fixture-campaign-01',
    'CAMPAIGN',
    '虚构转化测试 Campaign',
    'FIXTURE',
    'sync_fixture_01',
    '2026-08-05T00:00:01Z'
  ),
  (
    'adset_fixture_01',
    'ws_fixture_01',
    'aa_fixture_01',
    'campaign_fixture_01',
    'fixture-ad-set-01',
    'AD_SET',
    '虚构广泛受众 Ad Set',
    'FIXTURE',
    'sync_fixture_01',
    '2026-08-05T00:00:01Z'
  ),
  (
    'adset_fixture_02',
    'ws_fixture_01',
    'aa_fixture_01',
    'campaign_fixture_01',
    'fixture-ad-set-02',
    'AD_SET',
    '虚构兴趣受众 Ad Set',
    'FIXTURE',
    'sync_fixture_01',
    '2026-08-05T00:00:01Z'
  ),
  (
    'ad_fixture_01',
    'ws_fixture_01',
    'aa_fixture_01',
    'adset_fixture_01',
    'fixture-ad-01',
    'AD',
    '虚构短视频素材 Ad',
    'FIXTURE',
    'sync_fixture_01',
    '2026-08-05T00:00:01Z'
  ),
  (
    'ad_fixture_02',
    'ws_fixture_01',
    'aa_fixture_01',
    'adset_fixture_01',
    'fixture-ad-02',
    'AD',
    '虚构轮播素材 Ad',
    'FIXTURE',
    'sync_fixture_01',
    '2026-08-05T00:00:01Z'
  ),
  (
    'ad_fixture_03',
    'ws_fixture_01',
    'aa_fixture_01',
    'adset_fixture_02',
    'fixture-ad-03',
    'AD',
    '虚构静态素材 Ad',
    'FIXTURE',
    'sync_fixture_01',
    '2026-08-05T00:00:01Z'
  ),
  (
    'ad_fixture_04',
    'ws_fixture_01',
    'aa_fixture_01',
    'adset_fixture_02',
    'fixture-ad-04',
    'AD',
    '虚构对照素材 Ad',
    'FIXTURE',
    'sync_fixture_01',
    '2026-08-05T00:00:01Z'
  )
ON CONFLICT(id) DO NOTHING;
