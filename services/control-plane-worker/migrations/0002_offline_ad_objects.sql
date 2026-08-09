PRAGMA foreign_keys = ON;

CREATE TABLE meta_ad_objects (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL,
  ad_account_id TEXT NOT NULL,
  parent_object_id TEXT,
  external_object_ref TEXT NOT NULL,
  object_level TEXT NOT NULL,
  display_name TEXT NOT NULL,
  source_kind TEXT NOT NULL DEFAULT 'FIXTURE',
  sync_run_id TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  FOREIGN KEY (workspace_id, ad_account_id)
    REFERENCES meta_ad_accounts(workspace_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, ad_account_id, sync_run_id)
    REFERENCES sync_runs(workspace_id, ad_account_id, id) ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id, ad_account_id, parent_object_id)
    REFERENCES meta_ad_objects(workspace_id, ad_account_id, id) ON DELETE RESTRICT,
  UNIQUE (workspace_id, ad_account_id, id),
  UNIQUE (workspace_id, ad_account_id, external_object_ref),
  CHECK (length(id) BETWEEN 3 AND 64),
  CHECK (length(external_object_ref) BETWEEN 1 AND 128),
  CHECK (length(display_name) BETWEEN 1 AND 160),
  CHECK (object_level IN ('CAMPAIGN', 'AD_SET', 'AD')),
  CHECK (source_kind = 'FIXTURE'),
  CHECK (
    (object_level = 'CAMPAIGN' AND parent_object_id IS NULL)
    OR (object_level IN ('AD_SET', 'AD') AND parent_object_id IS NOT NULL)
  )
);

CREATE INDEX idx_meta_ad_objects_account_level
  ON meta_ad_objects (workspace_id, ad_account_id, object_level, id);
CREATE INDEX idx_meta_ad_objects_parent
  ON meta_ad_objects (workspace_id, ad_account_id, parent_object_id);
