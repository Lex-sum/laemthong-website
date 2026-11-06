-- Drop the old free-text product specs (replaced by spec_attributes / product_spec_values).
--
-- RUN THIS LAST — only after EVERY site using this database (including the live site)
-- runs the new catalog code. Old code still reads products.specifications and its
-- product pages would fail without it.
-- The old values were copied to products_specifications_backup by
-- 20261106000000_product_taxonomy.sql.

ALTER TABLE products DROP COLUMN IF EXISTS specifications;
