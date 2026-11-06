-- Product taxonomy: main / sub categories and category-bound specs with values.
-- Safe to run while the current site is live: it only adds things (and backs up the
-- old free-text specs). The old products.specifications column is dropped by a later
-- migration, once every deployment uses the new specs.

-- ── 1. Sub categories ───────────────────────────────────────────────────────
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS parent_slug text REFERENCES categories(slug)
    ON UPDATE CASCADE ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_slug);

-- At most two levels: a parent must be a main category, and a category that has
-- sub categories can't become a sub category itself.
CREATE OR REPLACE FUNCTION categories_check_depth()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.parent_slug IS NOT NULL THEN
    IF NEW.parent_slug = NEW.slug THEN
      RAISE EXCEPTION 'A category cannot be its own parent';
    END IF;
    IF EXISTS (SELECT 1 FROM categories WHERE slug = NEW.parent_slug AND parent_slug IS NOT NULL) THEN
      RAISE EXCEPTION 'Sub categories can only be added to a main category';
    END IF;
    IF EXISTS (SELECT 1 FROM categories WHERE parent_slug = NEW.slug) THEN
      RAISE EXCEPTION 'A category with sub categories cannot become a sub category';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS categories_depth ON categories;
CREATE TRIGGER categories_depth
  BEFORE INSERT OR UPDATE OF parent_slug ON categories
  FOR EACH ROW EXECUTE FUNCTION categories_check_depth();

-- ── 2. Spec definitions ─────────────────────────────────────────────────────
-- Specs of a main category apply to all of its sub categories.
CREATE TABLE IF NOT EXISTS spec_attributes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_slug text NOT NULL REFERENCES categories(slug) ON UPDATE CASCADE ON DELETE CASCADE,
  key           text NOT NULL CHECK (key ~ '^[a-z0-9-]+$'),
  name          jsonb NOT NULL,                      -- {"th": "...", "en": "..."}
  type          text NOT NULL CHECK (type IN ('single', 'multi', 'number', 'boolean', 'text')),
  unit          text NOT NULL DEFAULT '',
  filterable    boolean NOT NULL DEFAULT true,
  buckets       jsonb NOT NULL DEFAULT '[]',         -- number ranges for filters, min < value <= max: [{"min": 160, "max": 250}]
  sort_order    integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_slug, key)
);
CREATE INDEX IF NOT EXISTS idx_spec_attributes_category ON spec_attributes(category_slug, sort_order);

CREATE TABLE IF NOT EXISTS spec_options (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_id uuid NOT NULL REFERENCES spec_attributes(id) ON DELETE CASCADE,
  key          text NOT NULL CHECK (key ~ '^[a-z0-9-]+$'),
  label        jsonb NOT NULL,                       -- {"th": "...", "en": "..."}
  sort_order   integer NOT NULL DEFAULT 0,
  UNIQUE (attribute_id, key)
);
CREATE INDEX IF NOT EXISTS idx_spec_options_attribute ON spec_options(attribute_id, sort_order);

-- ── 3. Product values ───────────────────────────────────────────────────────
-- One row per chosen option (a multi-choice spec has several rows), or one row
-- holding a number / yes-no / text value.
CREATE TABLE IF NOT EXISTS product_spec_values (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_slug text NOT NULL REFERENCES products(slug) ON UPDATE CASCADE ON DELETE CASCADE,
  attribute_id uuid NOT NULL REFERENCES spec_attributes(id) ON DELETE CASCADE,
  option_id    uuid REFERENCES spec_options(id) ON DELETE CASCADE,
  number_value numeric,
  bool_value   boolean,
  text_value   jsonb,                                -- {"th": "...", "en": "..."}
  UNIQUE NULLS NOT DISTINCT (product_slug, attribute_id, option_id)
);
CREATE INDEX IF NOT EXISTS idx_psv_product ON product_spec_values(product_slug);
CREATE INDEX IF NOT EXISTS idx_psv_option ON product_spec_values(attribute_id, option_id);
CREATE INDEX IF NOT EXISTS idx_psv_number ON product_spec_values(attribute_id, number_value);

ALTER TABLE spec_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE spec_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_spec_values ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Public read spec_attributes" ON spec_attributes FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Public read spec_options" ON spec_options FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Public read product_spec_values" ON product_spec_values FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 4. Catalog search ───────────────────────────────────────────────────────
-- p_filters: {"<attribute id>": {"options": ["<option id>", ...]}
--                             | {"ranges": [{"min": 160, "max": 250}, ...]}   (min < value <= max)
--                             | {"bool": true}}
-- Values inside one spec are OR-ed; different specs are AND-ed.
-- p_search is matched with ILIKE as given (the caller escapes % and _).
CREATE OR REPLACE FUNCTION search_products(
  p_category text DEFAULT NULL,
  p_brand    text DEFAULT NULL,
  p_search   text DEFAULT NULL,
  p_filters  jsonb DEFAULT '{}'
)
RETURNS SETOF products
LANGUAGE sql STABLE SECURITY INVOKER
AS $$
  SELECT p.*
  FROM products p
  WHERE (p_category IS NULL
         OR p.category_slug = p_category
         OR p.category_slug IN (SELECT c.slug FROM categories c WHERE c.parent_slug = p_category))
    AND (p_brand IS NULL OR p.brand_slug = p_brand)
    AND (p_search IS NULL
         OR p.slug ILIKE '%' || p_search || '%'
         OR p.name->>'th' ILIKE '%' || p_search || '%'
         OR p.name->>'en' ILIKE '%' || p_search || '%'
         OR p.short_description->>'th' ILIKE '%' || p_search || '%'
         OR p.short_description->>'en' ILIKE '%' || p_search || '%')
    AND NOT EXISTS (
      SELECT 1
      FROM jsonb_each(COALESCE(p_filters, '{}'::jsonb)) AS f(attribute_id, cond)
      WHERE NOT EXISTS (
        SELECT 1
        FROM product_spec_values v
        WHERE v.product_slug = p.slug
          AND v.attribute_id = f.attribute_id::uuid
          AND (
            (f.cond ? 'options' AND v.option_id::text IN (SELECT jsonb_array_elements_text(f.cond->'options')))
            OR (f.cond ? 'ranges' AND EXISTS (
                  SELECT 1 FROM jsonb_array_elements(f.cond->'ranges') r
                  WHERE (r->>'min' IS NULL OR v.number_value > (r->>'min')::numeric)
                    AND (r->>'max' IS NULL OR v.number_value <= (r->>'max')::numeric)))
            OR (f.cond ? 'bool' AND v.bool_value = (f.cond->>'bool')::boolean)
          )
      )
    );
$$;

-- Filter counts for the specs of a category (and its main category). Each spec is
-- counted against the products matching every OTHER selected filter, so the choices
-- inside one spec keep showing how many products they would add.
-- bucket = index into spec_attributes.buckets; option_id / bucket are null for yes-no specs.
CREATE OR REPLACE FUNCTION product_facets(
  p_category text,
  p_brand    text DEFAULT NULL,
  p_search   text DEFAULT NULL,
  p_filters  jsonb DEFAULT '{}'
)
RETURNS TABLE (attribute_id uuid, option_id uuid, bucket integer, product_count bigint)
LANGUAGE sql STABLE SECURITY INVOKER
AS $$
  WITH attrs AS (
    SELECT a.*
    FROM spec_attributes a
    WHERE a.filterable
      AND a.category_slug IN (
        SELECT p_category
        UNION SELECT c.parent_slug FROM categories c WHERE c.slug = p_category AND c.parent_slug IS NOT NULL)
  ),
  scoped AS (
    SELECT a.id AS aid, a.type, a.buckets, s.slug
    FROM attrs a
    CROSS JOIN LATERAL search_products(p_category, p_brand, p_search,
                                       COALESCE(p_filters, '{}'::jsonb) - a.id::text) s
  )
  SELECT sc.aid, v.option_id, NULL::integer, count(DISTINCT sc.slug)
  FROM scoped sc
  JOIN product_spec_values v ON v.product_slug = sc.slug AND v.attribute_id = sc.aid
  WHERE sc.type IN ('single', 'multi')
  GROUP BY sc.aid, v.option_id
  UNION ALL
  SELECT sc.aid, NULL::uuid, (b.ord - 1)::integer, count(DISTINCT sc.slug)
  FROM scoped sc
  CROSS JOIN LATERAL jsonb_array_elements(sc.buckets) WITH ORDINALITY AS b(r, ord)
  JOIN product_spec_values v ON v.product_slug = sc.slug AND v.attribute_id = sc.aid
  WHERE sc.type = 'number'
    AND (b.r->>'min' IS NULL OR v.number_value > (b.r->>'min')::numeric)
    AND (b.r->>'max' IS NULL OR v.number_value <= (b.r->>'max')::numeric)
  GROUP BY sc.aid, b.ord
  UNION ALL
  SELECT sc.aid, NULL::uuid, NULL::integer, count(DISTINCT sc.slug)
  FROM scoped sc
  JOIN product_spec_values v ON v.product_slug = sc.slug AND v.attribute_id = sc.aid
  WHERE sc.type = 'boolean' AND v.bool_value
  GROUP BY sc.aid;
$$;

GRANT EXECUTE ON FUNCTION search_products(text, text, text, jsonb) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION product_facets(text, text, text, jsonb) TO anon, authenticated, service_role;

-- ── 5. Back up the old free-text specs ─────────────────────────────────────
-- (the column itself is dropped by a later migration)
CREATE TABLE IF NOT EXISTS products_specifications_backup (
  slug           text PRIMARY KEY,
  specifications jsonb NOT NULL,
  backed_up_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE products_specifications_backup ENABLE ROW LEVEL SECURITY;
INSERT INTO products_specifications_backup (slug, specifications)
SELECT slug, specifications FROM products
WHERE specifications IS NOT NULL AND specifications <> '[]'::jsonb
ON CONFLICT (slug) DO NOTHING;

-- ── 6. Security fix: batch_reorder is SECURITY DEFINER and was callable with the
-- public anon key, letting anyone reorder products/categories/brands/services.
-- Only the admin panel (service role) may call it.
REVOKE EXECUTE ON FUNCTION batch_reorder(text, text[], int[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION batch_reorder(text, text[], int[]) TO service_role;
