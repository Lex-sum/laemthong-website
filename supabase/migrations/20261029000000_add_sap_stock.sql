-- Stock snapshot pushed one-way from SAP Business One via POST /api/stock-sync.
-- item_code matches products.slug when the item exists on the website.
-- No RLS policies: only the service role (API route + admin panel) can read/write.
-- Safe to re-run (IF NOT EXISTS). Run this file on its own — do not re-run older migrations.

CREATE TABLE IF NOT EXISTS sap_stock (
  item_code  TEXT PRIMARY KEY,
  item_name  TEXT NOT NULL DEFAULT '',
  on_hand    NUMERIC NOT NULL DEFAULT 0,
  available  NUMERIC NOT NULL DEFAULT 0,
  sync_id    UUID NOT NULL,
  synced_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sap_stock_sync_id_idx ON sap_stock (sync_id);

ALTER TABLE sap_stock ENABLE ROW LEVEL SECURITY;
