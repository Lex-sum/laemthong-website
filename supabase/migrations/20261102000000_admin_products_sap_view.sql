-- Views for the SAP B1 match filters in the admin panel (product slug = SAP item code):
--   admin_products_sap   → /admin/products       In SAP / Not in SAP
--   admin_sap_stock_web  → /admin/sap-products   On website / Not on website
-- Safe to re-run. Run this file on its own in the Supabase SQL Editor.

CREATE OR REPLACE VIEW admin_products_sap
WITH (security_invoker = true) AS
SELECT
  p.*,
  EXISTS (SELECT 1 FROM sap_stock s WHERE s.item_code = p.slug) AS in_sap
FROM products p;

-- Admin panel only (service role). sap_stock is private, so keep this off the public API.
REVOKE ALL ON admin_products_sap FROM anon, authenticated;
GRANT SELECT ON admin_products_sap TO service_role;

CREATE OR REPLACE VIEW admin_sap_stock_web
WITH (security_invoker = true) AS
SELECT
  s.*,
  EXISTS (SELECT 1 FROM products p WHERE p.slug = s.item_code) AS on_web
FROM sap_stock s;

REVOKE ALL ON admin_sap_stock_web FROM anon, authenticated;
GRANT SELECT ON admin_sap_stock_web TO service_role;
