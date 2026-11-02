-- Products with an "in_sap" flag (slug matches a SAP B1 item code), for the
-- In SAP / Not in SAP filter on /admin/products.
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
