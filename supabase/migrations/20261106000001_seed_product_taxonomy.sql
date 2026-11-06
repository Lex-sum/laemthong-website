-- Seed the product taxonomy from the meeting draft (Laemthong_Product_Structure_Draft.pdf,
-- 4 Nov 2569): 10 main categories, their sub categories and specs with values.
-- Admins edit it in /admin/categories afterwards.
--
-- RUN THIS WHEN THE NEW CATALOG CODE GOES LIVE: it moves the existing products to the
-- new categories and removes the 4 old ones, so a site still on the old code would show
-- the new category list. Requires 20261106000000_product_taxonomy.sql.
-- Generated — safe to re-run (existing rows are left as they are).

BEGIN;

-- 01 Welding Machines
INSERT INTO categories (slug, name, description, sort_order, parent_slug) VALUES
  ('welding-machines', '{"th":"เครื่องเชื่อมไฟฟ้า","en":"Welding Machines"}'::jsonb, '{"th":"","en":""}'::jsonb, 10, NULL),
  ('mma-welders', '{"th":"เครื่องเชื่อมธูป (MMA / ARC)","en":"Stick Welders (MMA / ARC)"}'::jsonb, '{"th":"","en":""}'::jsonb, 10, 'welding-machines'),
  ('mig-welders', '{"th":"เครื่องเชื่อม MIG / MAG / CO2","en":"MIG / MAG / CO2 Welders"}'::jsonb, '{"th":"","en":""}'::jsonb, 20, 'welding-machines'),
  ('tig-welders', '{"th":"เครื่องเชื่อม TIG / อาร์กอน","en":"TIG / Argon Welders"}'::jsonb, '{"th":"","en":""}'::jsonb, 30, 'welding-machines'),
  ('multi-process-welders', '{"th":"เครื่องเชื่อมหลายระบบ","en":"Multi-process Welders"}'::jsonb, '{"th":"","en":""}'::jsonb, 40, 'welding-machines'),
  ('spot-welders', '{"th":"เครื่องเชื่อมจุด (Spot)","en":"Spot Welders"}'::jsonb, '{"th":"","en":""}'::jsonb, 50, 'welding-machines')
ON CONFLICT (slug) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('welding-machines', 'input-power', '{"th":"ระบบไฟเข้า","en":"Input Power"}'::jsonb, 'multi', '', true, '[]'::jsonb, 10) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('220v-1ph', '{"th":"220V 1 เฟส","en":"220V single-phase"}'::jsonb, 10),
  ('380v-3ph', '{"th":"380V 3 เฟส","en":"380V three-phase"}'::jsonb, 20)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'welding-machines' AND a.key = 'input-power'
ON CONFLICT (attribute_id, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('welding-machines', 'max-current', '{"th":"กระแสเชื่อมสูงสุด","en":"Max Welding Current"}'::jsonb, 'number', 'A', true, '[{"min":null,"max":160},{"min":160,"max":250},{"min":250,"max":400},{"min":400,"max":null}]'::jsonb, 20) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('welding-machines', 'duty-cycle', '{"th":"Duty Cycle","en":"Duty Cycle"}'::jsonb, 'number', '%', false, '[]'::jsonb, 30) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('welding-machines', 'technology', '{"th":"เทคโนโลยี","en":"Technology"}'::jsonb, 'single', '', true, '[]'::jsonb, 40) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('inverter', '{"th":"Inverter","en":"Inverter"}'::jsonb, 10),
  ('transformer', '{"th":"Transformer","en":"Transformer"}'::jsonb, 20)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'welding-machines' AND a.key = 'technology'
ON CONFLICT (attribute_id, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('welding-machines', 'functions', '{"th":"ฟังก์ชันเสริม","en":"Functions"}'::jsonb, 'multi', '', true, '[]'::jsonb, 50) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('pulse', '{"th":"Pulse","en":"Pulse"}'::jsonb, 10),
  ('2t-4t', '{"th":"2T/4T","en":"2T/4T"}'::jsonb, 20),
  ('hot-start', '{"th":"Hot Start","en":"Hot Start"}'::jsonb, 30),
  ('anti-stick', '{"th":"Anti-stick","en":"Anti-stick"}'::jsonb, 40),
  ('synergic', '{"th":"Synergic","en":"Synergic"}'::jsonb, 50)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'welding-machines' AND a.key = 'functions'
ON CONFLICT (attribute_id, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('welding-machines', 'materials', '{"th":"วัสดุที่เชื่อมได้","en":"Weldable Materials"}'::jsonb, 'multi', '', true, '[]'::jsonb, 60) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('steel', '{"th":"เหล็ก","en":"Steel"}'::jsonb, 10),
  ('stainless', '{"th":"สแตนเลส","en":"Stainless Steel"}'::jsonb, 20),
  ('aluminium', '{"th":"อลูมิเนียม","en":"Aluminium"}'::jsonb, 30)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'welding-machines' AND a.key = 'materials'
ON CONFLICT (attribute_id, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('welding-machines', 'user-level', '{"th":"ระดับผู้ใช้","en":"User Level"}'::jsonb, 'single', '', true, '[]'::jsonb, 70) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('diy', '{"th":"งานบ้าน-DIY","en":"Home / DIY"}'::jsonb, 10),
  ('general', '{"th":"ช่างทั่วไป","en":"General Trade"}'::jsonb, 20),
  ('industrial', '{"th":"อุตสาหกรรม","en":"Industrial"}'::jsonb, 30)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'welding-machines' AND a.key = 'user-level'
ON CONFLICT (attribute_id, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('welding-machines', 'generator-compatible', '{"th":"ใช้กับเครื่องปั่นไฟได้","en":"Generator Compatible"}'::jsonb, 'boolean', '', true, '[]'::jsonb, 80) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('tig-welders', 'current-type', '{"th":"ชนิดกระแส","en":"Current Type"}'::jsonb, 'multi', '', true, '[]'::jsonb, 10) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('dc', '{"th":"DC","en":"DC"}'::jsonb, 10),
  ('ac-dc', '{"th":"AC/DC (เชื่อมอลูมิเนียมได้)","en":"AC/DC (for aluminium)"}'::jsonb, 20)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'tig-welders' AND a.key = 'current-type'
ON CONFLICT (attribute_id, key) DO NOTHING;

-- 02 Cutting Machines
INSERT INTO categories (slug, name, description, sort_order, parent_slug) VALUES
  ('cutting-machines', '{"th":"เครื่องตัดโลหะ","en":"Cutting Machines"}'::jsonb, '{"th":"","en":""}'::jsonb, 20, NULL),
  ('plasma-cutters', '{"th":"เครื่องตัดพลาสม่า","en":"Plasma Cutters"}'::jsonb, '{"th":"","en":""}'::jsonb, 10, 'cutting-machines'),
  ('cnc-cutters', '{"th":"เครื่องตัด CNC (แก๊ส / พลาสม่า)","en":"CNC Cutting Machines (Gas / Plasma)"}'::jsonb, '{"th":"","en":""}'::jsonb, 20, 'cutting-machines'),
  ('track-cutters', '{"th":"เครื่องตัดเดินราง / รางตัดแก๊ส","en":"Track Cutting Machines"}'::jsonb, '{"th":"","en":""}'::jsonb, 30, 'cutting-machines')
ON CONFLICT (slug) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('cutting-machines', 'cutting-process', '{"th":"ระบบตัด","en":"Cutting Process"}'::jsonb, 'multi', '', true, '[]'::jsonb, 10) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('gas', '{"th":"แก๊ส","en":"Gas"}'::jsonb, 10),
  ('plasma', '{"th":"พลาสม่า","en":"Plasma"}'::jsonb, 20)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'cutting-machines' AND a.key = 'cutting-process'
ON CONFLICT (attribute_id, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('cutting-machines', 'control', '{"th":"ระบบควบคุม","en":"Control"}'::jsonb, 'single', '', true, '[]'::jsonb, 20) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('manual', '{"th":"ใช้มือ","en":"Manual"}'::jsonb, 10),
  ('track', '{"th":"เดินราง","en":"Track"}'::jsonb, 20),
  ('cnc', '{"th":"CNC","en":"CNC"}'::jsonb, 30)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'cutting-machines' AND a.key = 'control'
ON CONFLICT (attribute_id, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('cutting-machines', 'max-cut-thickness', '{"th":"ความหนาตัดสูงสุด","en":"Max Cutting Thickness"}'::jsonb, 'number', 'mm', true, '[{"min":null,"max":20},{"min":20,"max":50},{"min":50,"max":null}]'::jsonb, 30) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('cutting-machines', 'clean-cut-thickness', '{"th":"ความหนาตัดสวย (Clean cut)","en":"Clean Cut Thickness"}'::jsonb, 'number', 'mm', false, '[]'::jsonb, 40) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('cutting-machines', 'input-power', '{"th":"ระบบไฟเข้า","en":"Input Power"}'::jsonb, 'multi', '', true, '[]'::jsonb, 50) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('220v-1ph', '{"th":"220V 1 เฟส","en":"220V single-phase"}'::jsonb, 10),
  ('380v-3ph', '{"th":"380V 3 เฟส","en":"380V three-phase"}'::jsonb, 20)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'cutting-machines' AND a.key = 'input-power'
ON CONFLICT (attribute_id, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('cutting-machines', 'built-in-compressor', '{"th":"ปั๊มลมในตัว","en":"Built-in Air Compressor"}'::jsonb, 'boolean', '', true, '[]'::jsonb, 60) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('cnc-cutters', 'table-size', '{"th":"ขนาดโต๊ะทำงาน","en":"Table Size"}'::jsonb, 'text', '', false, '[]'::jsonb, 10) ON CONFLICT (category_slug, key) DO NOTHING;

-- 03 Oxy-fuel Equipment
INSERT INTO categories (slug, name, description, sort_order, parent_slug) VALUES
  ('oxy-fuel-equipment', '{"th":"ชุดเชื่อม-ตัดแก๊ส","en":"Oxy-fuel Equipment"}'::jsonb, '{"th":"","en":""}'::jsonb, 30, NULL),
  ('gas-cutting-sets', '{"th":"ชุดตัดแก๊ส","en":"Gas Cutting Sets"}'::jsonb, '{"th":"","en":""}'::jsonb, 10, 'oxy-fuel-equipment'),
  ('gas-welding-sets', '{"th":"ชุดเชื่อมแก๊ส","en":"Gas Welding Sets"}'::jsonb, '{"th":"","en":""}'::jsonb, 20, 'oxy-fuel-equipment'),
  ('heating-sets', '{"th":"ชุดเผา","en":"Heating Sets"}'::jsonb, '{"th":"","en":""}'::jsonb, 30, 'oxy-fuel-equipment'),
  ('spraying-sets', '{"th":"ชุดพ่น","en":"Spraying Sets"}'::jsonb, '{"th":"","en":""}'::jsonb, 40, 'oxy-fuel-equipment'),
  ('torch-tips', '{"th":"หัวตัด / หัวเชื่อม / นมหนู","en":"Cutting & Welding Tips"}'::jsonb, '{"th":"","en":""}'::jsonb, 50, 'oxy-fuel-equipment'),
  ('torch-flashback-arrestors', '{"th":"ชุดกันไฟย้อนกลับ","en":"Flashback Arrestors"}'::jsonb, '{"th":"","en":""}'::jsonb, 60, 'oxy-fuel-equipment')
ON CONFLICT (slug) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('oxy-fuel-equipment', 'fuel-gas', '{"th":"ชนิดแก๊สเชื้อเพลิง","en":"Fuel Gas"}'::jsonb, 'multi', '', true, '[]'::jsonb, 10) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('acetylene', '{"th":"อะเซทิลีน (AC)","en":"Acetylene (AC)"}'::jsonb, 10),
  ('lpg', '{"th":"LPG","en":"LPG"}'::jsonb, 20)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'oxy-fuel-equipment' AND a.key = 'fuel-gas'
ON CONFLICT (attribute_id, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('oxy-fuel-equipment', 'set-type', '{"th":"รูปแบบ","en":"Set Type"}'::jsonb, 'single', '', true, '[]'::jsonb, 20) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('torch-kit', '{"th":"ชุดต่อด้าม","en":"Torch Kit"}'::jsonb, 10),
  ('complete-set', '{"th":"ชุดสำเร็จ","en":"Complete Set"}'::jsonb, 20)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'oxy-fuel-equipment' AND a.key = 'set-type'
ON CONFLICT (attribute_id, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('oxy-fuel-equipment', 'max-cut-thickness', '{"th":"ความหนาตัดสูงสุด","en":"Max Cutting Thickness"}'::jsonb, 'number', 'mm', true, '[{"min":null,"max":50},{"min":50,"max":150},{"min":150,"max":300},{"min":300,"max":null}]'::jsonb, 30) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('oxy-fuel-equipment', 'tip-size', '{"th":"เบอร์หัว","en":"Tip Size"}'::jsonb, 'multi', '', true, '[]'::jsonb, 40) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('no-000', '{"th":"เบอร์ 000","en":"No. 000"}'::jsonb, 10),
  ('no-00', '{"th":"เบอร์ 00","en":"No. 00"}'::jsonb, 20),
  ('no-0', '{"th":"เบอร์ 0","en":"No. 0"}'::jsonb, 30),
  ('no-1', '{"th":"เบอร์ 1","en":"No. 1"}'::jsonb, 40),
  ('no-2', '{"th":"เบอร์ 2","en":"No. 2"}'::jsonb, 50),
  ('no-3', '{"th":"เบอร์ 3","en":"No. 3"}'::jsonb, 60),
  ('no-4', '{"th":"เบอร์ 4","en":"No. 4"}'::jsonb, 70),
  ('no-5', '{"th":"เบอร์ 5","en":"No. 5"}'::jsonb, 80),
  ('no-6', '{"th":"เบอร์ 6","en":"No. 6"}'::jsonb, 90)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'oxy-fuel-equipment' AND a.key = 'tip-size'
ON CONFLICT (attribute_id, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('oxy-fuel-equipment', 'tip-angle', '{"th":"มุมหัว / ความยาว","en":"Tip Angle / Length"}'::jsonb, 'multi', '', true, '[]'::jsonb, 50) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('75', '{"th":"75°","en":"75°"}'::jsonb, 10),
  ('90', '{"th":"90°","en":"90°"}'::jsonb, 20),
  ('extra-long', '{"th":"ยาวพิเศษ","en":"Extra Long"}'::jsonb, 30)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'oxy-fuel-equipment' AND a.key = 'tip-angle'
ON CONFLICT (attribute_id, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('oxy-fuel-equipment', 'tip-material', '{"th":"วัสดุหัว","en":"Tip Material"}'::jsonb, 'single', '', true, '[]'::jsonb, 60) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('brass', '{"th":"ทองเหลือง","en":"Brass"}'::jsonb, 10),
  ('copper', '{"th":"ทองแดง","en":"Copper"}'::jsonb, 20)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'oxy-fuel-equipment' AND a.key = 'tip-material'
ON CONFLICT (attribute_id, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('oxy-fuel-equipment', 'mixing-system', '{"th":"ระบบผสมแก๊ส","en":"Gas Mixing System"}'::jsonb, 'single', '', true, '[]'::jsonb, 70) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('injector', '{"th":"หัวฉีด (Injector)","en":"Injector"}'::jsonb, 10),
  ('equal-pressure', '{"th":"แรงดันเท่ากัน","en":"Equal Pressure"}'::jsonb, 20)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'oxy-fuel-equipment' AND a.key = 'mixing-system'
ON CONFLICT (attribute_id, key) DO NOTHING;

-- 04 Regulators & Gas Control
INSERT INTO categories (slug, name, description, sort_order, parent_slug) VALUES
  ('regulators-gas-control', '{"th":"เกจ์และอุปกรณ์ควบคุมแก๊ส","en":"Regulators & Gas Control"}'::jsonb, '{"th":"","en":""}'::jsonb, 40, NULL),
  ('welding-regulators', '{"th":"เกจ์งานเชื่อมตัด","en":"Welding & Cutting Regulators"}'::jsonb, '{"th":"","en":""}'::jsonb, 10, 'regulators-gas-control'),
  ('flowmeters', '{"th":"Flow Meter (Ar / CO2)","en":"Flow Meters (Ar / CO2)"}'::jsonb, '{"th":"","en":""}'::jsonb, 20, 'regulators-gas-control'),
  ('high-pressure-regulators', '{"th":"เกจ์แรงดันสูง","en":"High-pressure Regulators"}'::jsonb, '{"th":"","en":""}'::jsonb, 30, 'regulators-gas-control'),
  ('high-purity-regulators', '{"th":"เกจ์แก๊สบริสุทธิ์สูง","en":"High-purity Regulators"}'::jsonb, '{"th":"","en":""}'::jsonb, 40, 'regulators-gas-control'),
  ('medical-regulators', '{"th":"เกจ์การแพทย์","en":"Medical Regulators"}'::jsonb, '{"th":"","en":""}'::jsonb, 50, 'regulators-gas-control'),
  ('manifolds', '{"th":"Manifold / ระบบจ่ายแก๊ส","en":"Manifolds & Gas Supply Systems"}'::jsonb, '{"th":"","en":""}'::jsonb, 60, 'regulators-gas-control')
ON CONFLICT (slug) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('regulators-gas-control', 'gas-type', '{"th":"ชนิดแก๊ส","en":"Gas Type"}'::jsonb, 'multi', '', true, '[]'::jsonb, 10) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('o2', '{"th":"O2","en":"O2"}'::jsonb, 10),
  ('acetylene', '{"th":"AC","en":"AC"}'::jsonb, 20),
  ('lpg', '{"th":"LPG","en":"LPG"}'::jsonb, 30),
  ('ar', '{"th":"Ar","en":"Ar"}'::jsonb, 40),
  ('co2', '{"th":"CO2","en":"CO2"}'::jsonb, 50),
  ('n2', '{"th":"N2","en":"N2"}'::jsonb, 60),
  ('h2', '{"th":"H2","en":"H2"}'::jsonb, 70),
  ('n2o', '{"th":"N2O","en":"N2O"}'::jsonb, 80),
  ('mixed', '{"th":"แก๊สผสม","en":"Mixed Gas"}'::jsonb, 90)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'regulators-gas-control' AND a.key = 'gas-type'
ON CONFLICT (attribute_id, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('regulators-gas-control', 'stage', '{"th":"ระดับลดแรงดัน","en":"Stage"}'::jsonb, 'single', '', true, '[]'::jsonb, 20) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('single', '{"th":"Single Stage","en":"Single Stage"}'::jsonb, 10),
  ('double', '{"th":"Double Stage","en":"Double Stage"}'::jsonb, 20)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'regulators-gas-control' AND a.key = 'stage'
ON CONFLICT (attribute_id, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('regulators-gas-control', 'max-inlet-pressure', '{"th":"แรงดันขาเข้าสูงสุด","en":"Max Inlet Pressure"}'::jsonb, 'number', 'bar', true, '[{"min":null,"max":200},{"min":200,"max":300},{"min":300,"max":null}]'::jsonb, 30) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('regulators-gas-control', 'max-outlet-pressure', '{"th":"แรงดันขาออกสูงสุด","en":"Max Outlet Pressure"}'::jsonb, 'number', 'bar', true, '[{"min":null,"max":10},{"min":10,"max":50},{"min":50,"max":null}]'::jsonb, 40) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('regulators-gas-control', 'purity-grade', '{"th":"เกรดความบริสุทธิ์","en":"Purity Grade"}'::jsonb, 'single', '', true, '[]'::jsonb, 50) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('industrial', '{"th":"อุตสาหกรรม","en":"Industrial"}'::jsonb, 10),
  ('5-0', '{"th":"5.0 (99.999%)","en":"5.0 (99.999%)"}'::jsonb, 20),
  ('6-0', '{"th":"6.0 (99.9999%)","en":"6.0 (99.9999%)"}'::jsonb, 30)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'regulators-gas-control' AND a.key = 'purity-grade'
ON CONFLICT (attribute_id, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('regulators-gas-control', 'body-material', '{"th":"วัสดุตัวเกจ์","en":"Body Material"}'::jsonb, 'single', '', true, '[]'::jsonb, 60) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('brass', '{"th":"ทองเหลือง","en":"Brass"}'::jsonb, 10),
  ('stainless', '{"th":"สแตนเลส","en":"Stainless Steel"}'::jsonb, 20)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'regulators-gas-control' AND a.key = 'body-material'
ON CONFLICT (attribute_id, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('regulators-gas-control', 'application', '{"th":"งานที่ใช้","en":"Application"}'::jsonb, 'multi', '', true, '[]'::jsonb, 70) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('welding-cutting', '{"th":"เชื่อมตัด","en":"Welding & Cutting"}'::jsonb, 10),
  ('lab', '{"th":"ห้องแล็บ","en":"Laboratory"}'::jsonb, 20),
  ('medical', '{"th":"การแพทย์","en":"Medical"}'::jsonb, 30),
  ('corrosive', '{"th":"แก๊สกัดกร่อน","en":"Corrosive Gas"}'::jsonb, 40)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'regulators-gas-control' AND a.key = 'application'
ON CONFLICT (attribute_id, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('regulators-gas-control', 'heater', '{"th":"ฮีตเตอร์ (CO2)","en":"Heater (CO2)"}'::jsonb, 'boolean', '', true, '[]'::jsonb, 80) ON CONFLICT (category_slug, key) DO NOTHING;

-- 05 Filler Metals & Consumables
INSERT INTO categories (slug, name, description, sort_order, parent_slug) VALUES
  ('filler-metals', '{"th":"ลวดเชื่อมและวัสดุสิ้นเปลือง","en":"Filler Metals & Consumables"}'::jsonb, '{"th":"","en":""}'::jsonb, 50, NULL),
  ('stick-electrodes', '{"th":"ลวดเชื่อมไฟฟ้า (ลวดธูป)","en":"Stick Electrodes"}'::jsonb, '{"th":"","en":""}'::jsonb, 10, 'filler-metals'),
  ('mig-wires', '{"th":"ลวด MIG / CO2","en":"MIG / CO2 Wires"}'::jsonb, '{"th":"","en":""}'::jsonb, 20, 'filler-metals'),
  ('flux-cored-wires', '{"th":"ลวดฟลักซ์คอร์","en":"Flux-cored Wires"}'::jsonb, '{"th":"","en":""}'::jsonb, 30, 'filler-metals'),
  ('tig-rods', '{"th":"ลวด TIG","en":"TIG Rods"}'::jsonb, '{"th":"","en":""}'::jsonb, 40, 'filler-metals'),
  ('brazing-rods', '{"th":"ลวดเชื่อมแก๊ส / ทองเหลือง / เงิน","en":"Gas Welding & Brazing Rods"}'::jsonb, '{"th":"","en":""}'::jsonb, 50, 'filler-metals'),
  ('flux', '{"th":"ผงประสาน (Flux)","en":"Flux"}'::jsonb, '{"th":"","en":""}'::jsonb, 60, 'filler-metals'),
  ('tungsten', '{"th":"ทังสเตน","en":"Tungsten Electrodes"}'::jsonb, '{"th":"","en":""}'::jsonb, 70, 'filler-metals')
ON CONFLICT (slug) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('filler-metals', 'process', '{"th":"ใช้กับระบบเชื่อม","en":"Welding Process"}'::jsonb, 'single', '', true, '[]'::jsonb, 10) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('mma', '{"th":"MMA","en":"MMA"}'::jsonb, 10),
  ('mig', '{"th":"MIG","en":"MIG"}'::jsonb, 20),
  ('tig', '{"th":"TIG","en":"TIG"}'::jsonb, 30),
  ('gas', '{"th":"แก๊ส","en":"Gas"}'::jsonb, 40)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'filler-metals' AND a.key = 'process'
ON CONFLICT (attribute_id, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('filler-metals', 'base-material', '{"th":"วัสดุชิ้นงาน","en":"Base Material"}'::jsonb, 'multi', '', true, '[]'::jsonb, 20) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('mild-steel', '{"th":"เหล็กเหนียว","en":"Mild Steel"}'::jsonb, 10),
  ('stainless', '{"th":"สแตนเลส","en":"Stainless Steel"}'::jsonb, 20),
  ('cast-iron', '{"th":"เหล็กหล่อ","en":"Cast Iron"}'::jsonb, 30),
  ('aluminium', '{"th":"อลูมิเนียม","en":"Aluminium"}'::jsonb, 40),
  ('hardfacing', '{"th":"พอกแข็ง","en":"Hardfacing"}'::jsonb, 50)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'filler-metals' AND a.key = 'base-material'
ON CONFLICT (attribute_id, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('filler-metals', 'aws-standard', '{"th":"มาตรฐาน AWS","en":"AWS Standard"}'::jsonb, 'multi', '', true, '[]'::jsonb, 30) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('e6013', '{"th":"E6013","en":"E6013"}'::jsonb, 10),
  ('e7018', '{"th":"E7018","en":"E7018"}'::jsonb, 20),
  ('er70s-6', '{"th":"ER70S-6","en":"ER70S-6"}'::jsonb, 30),
  ('er308l', '{"th":"ER308L","en":"ER308L"}'::jsonb, 40)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'filler-metals' AND a.key = 'aws-standard'
ON CONFLICT (attribute_id, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('filler-metals', 'diameter', '{"th":"ขนาดเส้นผ่านศูนย์กลาง","en":"Diameter"}'::jsonb, 'multi', '', true, '[]'::jsonb, 40) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('0-8', '{"th":"0.8 มม.","en":"0.8 mm"}'::jsonb, 10),
  ('1-0', '{"th":"1.0 มม.","en":"1.0 mm"}'::jsonb, 20),
  ('1-2', '{"th":"1.2 มม.","en":"1.2 mm"}'::jsonb, 30),
  ('2-6', '{"th":"2.6 มม.","en":"2.6 mm"}'::jsonb, 40),
  ('3-2', '{"th":"3.2 มม.","en":"3.2 mm"}'::jsonb, 50),
  ('4-0', '{"th":"4.0 มม.","en":"4.0 mm"}'::jsonb, 60)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'filler-metals' AND a.key = 'diameter'
ON CONFLICT (attribute_id, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('filler-metals', 'package', '{"th":"ขนาดบรรจุ","en":"Package"}'::jsonb, 'multi', '', true, '[]'::jsonb, 50) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('pack', '{"th":"ห่อ","en":"Pack"}'::jsonb, 10),
  ('box', '{"th":"กล่อง","en":"Box"}'::jsonb, 20),
  ('spool', '{"th":"ม้วน","en":"Spool"}'::jsonb, 30)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'filler-metals' AND a.key = 'package'
ON CONFLICT (attribute_id, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('filler-metals', 'position', '{"th":"ท่าเชื่อม","en":"Welding Position"}'::jsonb, 'single', '', true, '[]'::jsonb, 60) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('all', '{"th":"ทุกท่า","en":"All Positions"}'::jsonb, 10),
  ('flat', '{"th":"ท่าราบ","en":"Flat"}'::jsonb, 20)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'filler-metals' AND a.key = 'position'
ON CONFLICT (attribute_id, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('filler-metals', 'current-type', '{"th":"ชนิดกระแส","en":"Current Type"}'::jsonb, 'single', '', true, '[]'::jsonb, 70) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('ac', '{"th":"AC","en":"AC"}'::jsonb, 10),
  ('dc', '{"th":"DC","en":"DC"}'::jsonb, 20),
  ('ac-dc', '{"th":"AC / DC","en":"AC / DC"}'::jsonb, 30)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'filler-metals' AND a.key = 'current-type'
ON CONFLICT (attribute_id, key) DO NOTHING;

-- 06 Spare Parts & Accessories
INSERT INTO categories (slug, name, description, sort_order, parent_slug) VALUES
  ('spare-parts', '{"th":"อะไหล่และอุปกรณ์เสริม","en":"Spare Parts & Accessories"}'::jsonb, '{"th":"","en":""}'::jsonb, 60, NULL),
  ('welding-torches', '{"th":"หัวเชื่อม MIG / TIG","en":"MIG / TIG Torches"}'::jsonb, '{"th":"","en":""}'::jsonb, 10, 'spare-parts'),
  ('tips-nozzles', '{"th":"Contact Tip / Nozzle / Collet","en":"Contact Tips, Nozzles & Collets"}'::jsonb, '{"th":"","en":""}'::jsonb, 20, 'spare-parts'),
  ('holders-clamps', '{"th":"คีมจับลวด / คีมจับสายดิน","en":"Electrode Holders & Earth Clamps"}'::jsonb, '{"th":"","en":""}'::jsonb, 30, 'spare-parts'),
  ('welding-cables', '{"th":"สายเชื่อม","en":"Welding Cables"}'::jsonb, '{"th":"","en":""}'::jsonb, 40, 'spare-parts'),
  ('wire-feeders', '{"th":"ชุดป้อนลวด","en":"Wire Feeders"}'::jsonb, '{"th":"","en":""}'::jsonb, 50, 'spare-parts')
ON CONFLICT (slug) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('spare-parts', 'compatible-series', '{"th":"ใช้กับรุ่น / ซีรีส์","en":"Compatible Series"}'::jsonb, 'multi', '', true, '[]'::jsonb, 10) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('mb15', '{"th":"MIG MB15","en":"MIG MB15"}'::jsonb, 10),
  ('mb24', '{"th":"MIG MB24","en":"MIG MB24"}'::jsonb, 20),
  ('mb36', '{"th":"MIG MB36","en":"MIG MB36"}'::jsonb, 30),
  ('wp17', '{"th":"TIG WP-17","en":"TIG WP-17"}'::jsonb, 40),
  ('wp26', '{"th":"TIG WP-26","en":"TIG WP-26"}'::jsonb, 50)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'spare-parts' AND a.key = 'compatible-series'
ON CONFLICT (attribute_id, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('spare-parts', 'part-type', '{"th":"ประเภทอะไหล่","en":"Part Type"}'::jsonb, 'multi', '', true, '[]'::jsonb, 20) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('tip', '{"th":"Tip","en":"Tip"}'::jsonb, 10),
  ('nozzle', '{"th":"Nozzle","en":"Nozzle"}'::jsonb, 20),
  ('liner', '{"th":"Liner","en":"Liner"}'::jsonb, 30),
  ('collet', '{"th":"Collet","en":"Collet"}'::jsonb, 40)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'spare-parts' AND a.key = 'part-type'
ON CONFLICT (attribute_id, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('spare-parts', 'size', '{"th":"ขนาด","en":"Size"}'::jsonb, 'multi', '', true, '[]'::jsonb, 30) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('0-8', '{"th":"0.8 มม.","en":"0.8 mm"}'::jsonb, 10),
  ('1-0', '{"th":"1.0 มม.","en":"1.0 mm"}'::jsonb, 20),
  ('1-2', '{"th":"1.2 มม.","en":"1.2 mm"}'::jsonb, 30)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'spare-parts' AND a.key = 'size'
ON CONFLICT (attribute_id, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('spare-parts', 'rated-current', '{"th":"กระแสรองรับ","en":"Rated Current"}'::jsonb, 'number', 'A', true, '[{"min":null,"max":200},{"min":200,"max":350},{"min":350,"max":null}]'::jsonb, 40) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('spare-parts', 'cooling', '{"th":"ระบบระบายความร้อน","en":"Cooling"}'::jsonb, 'single', '', true, '[]'::jsonb, 50) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('air', '{"th":"ลม","en":"Air"}'::jsonb, 10),
  ('water', '{"th":"น้ำ","en":"Water"}'::jsonb, 20)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'spare-parts' AND a.key = 'cooling'
ON CONFLICT (attribute_id, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('spare-parts', 'cable-length', '{"th":"ความยาวสาย","en":"Cable Length"}'::jsonb, 'number', 'm', false, '[]'::jsonb, 60) ON CONFLICT (category_slug, key) DO NOTHING;

-- 07 Hoses, Fittings & Valves
INSERT INTO categories (slug, name, description, sort_order, parent_slug) VALUES
  ('hoses-fittings-valves', '{"th":"สายแก๊ส ข้อต่อ และวาล์ว","en":"Hoses, Fittings & Valves"}'::jsonb, '{"th":"","en":""}'::jsonb, 70, NULL),
  ('gas-hoses', '{"th":"สายแก๊ส","en":"Gas Hoses"}'::jsonb, '{"th":"","en":""}'::jsonb, 10, 'hoses-fittings-valves'),
  ('fittings', '{"th":"ข้อต่อ / คอปเปอร์","en":"Fittings & Couplers"}'::jsonb, '{"th":"","en":""}'::jsonb, 20, 'hoses-fittings-valves'),
  ('cylinder-valves', '{"th":"วาล์วท่อแก๊ส","en":"Cylinder Valves"}'::jsonb, '{"th":"","en":""}'::jsonb, 30, 'hoses-fittings-valves'),
  ('flashback-arrestors', '{"th":"ชุดกันไฟย้อน (ต่อเกจ์ / ต่อด้าม)","en":"Flashback Arrestors (Regulator / Torch)"}'::jsonb, '{"th":"","en":""}'::jsonb, 40, 'hoses-fittings-valves')
ON CONFLICT (slug) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('hoses-fittings-valves', 'gas-type', '{"th":"ชนิดแก๊ส","en":"Gas Type"}'::jsonb, 'multi', '', true, '[]'::jsonb, 10) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('o2', '{"th":"O2","en":"O2"}'::jsonb, 10),
  ('acetylene', '{"th":"AC","en":"AC"}'::jsonb, 20),
  ('lpg', '{"th":"LPG","en":"LPG"}'::jsonb, 30),
  ('ar', '{"th":"Ar","en":"Ar"}'::jsonb, 40),
  ('co2', '{"th":"CO2","en":"CO2"}'::jsonb, 50)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'hoses-fittings-valves' AND a.key = 'gas-type'
ON CONFLICT (attribute_id, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('hoses-fittings-valves', 'hose-size', '{"th":"ขนาดสาย","en":"Hose Size"}'::jsonb, 'multi', '', true, '[]'::jsonb, 20) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('hoses-fittings-valves', 'length', '{"th":"ความยาว","en":"Length"}'::jsonb, 'number', 'm', false, '[]'::jsonb, 30) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('hoses-fittings-valves', 'hose-type', '{"th":"รูปแบบสาย","en":"Hose Type"}'::jsonb, 'single', '', true, '[]'::jsonb, 40) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('single', '{"th":"สายเดี่ยว","en":"Single"}'::jsonb, 10),
  ('twin', '{"th":"สายคู่","en":"Twin"}'::jsonb, 20)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'hoses-fittings-valves' AND a.key = 'hose-type'
ON CONFLICT (attribute_id, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('hoses-fittings-valves', 'connection', '{"th":"ชนิดข้อต่อ / เกลียว","en":"Connection / Thread"}'::jsonb, 'multi', '', true, '[]'::jsonb, 50) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('hoses-fittings-valves', 'thread-direction', '{"th":"ทิศทางเกลียว","en":"Thread Direction"}'::jsonb, 'single', '', true, '[]'::jsonb, 60) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('right', '{"th":"เกลียวขวา (O2)","en":"Right-hand (O2)"}'::jsonb, 10),
  ('left', '{"th":"เกลียวซ้าย (เชื้อเพลิง)","en":"Left-hand (fuel gas)"}'::jsonb, 20)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'hoses-fittings-valves' AND a.key = 'thread-direction'
ON CONFLICT (attribute_id, key) DO NOTHING;

-- 08 Industrial & Specialty Gases
INSERT INTO categories (slug, name, description, sort_order, parent_slug) VALUES
  ('industrial-gases', '{"th":"แก๊สอุตสาหกรรมและแก๊สพิเศษ","en":"Industrial & Specialty Gases"}'::jsonb, '{"th":"","en":""}'::jsonb, 80, NULL),
  ('welding-gases', '{"th":"แก๊สงานเชื่อมตัด","en":"Welding & Cutting Gases"}'::jsonb, '{"th":"","en":""}'::jsonb, 10, 'industrial-gases'),
  ('general-industrial-gases', '{"th":"แก๊สอุตสาหกรรม","en":"Industrial Gases"}'::jsonb, '{"th":"","en":""}'::jsonb, 20, 'industrial-gases'),
  ('specialty-gases', '{"th":"แก๊สพิเศษ / แก๊สบริสุทธิ์สูง","en":"Specialty & High-purity Gases"}'::jsonb, '{"th":"","en":""}'::jsonb, 30, 'industrial-gases')
ON CONFLICT (slug) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('industrial-gases', 'gas-type', '{"th":"ชนิดแก๊ส","en":"Gas Type"}'::jsonb, 'multi', '', true, '[]'::jsonb, 10) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('o2', '{"th":"O2","en":"O2"}'::jsonb, 10),
  ('acetylene', '{"th":"AC","en":"AC"}'::jsonb, 20),
  ('ar', '{"th":"Ar","en":"Ar"}'::jsonb, 30),
  ('co2', '{"th":"CO2","en":"CO2"}'::jsonb, 40),
  ('n2', '{"th":"N2","en":"N2"}'::jsonb, 50),
  ('mixed', '{"th":"แก๊สผสม","en":"Mixed Gas"}'::jsonb, 60),
  ('specialty', '{"th":"Specialty","en":"Specialty"}'::jsonb, 70)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'industrial-gases' AND a.key = 'gas-type'
ON CONFLICT (attribute_id, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('industrial-gases', 'purity', '{"th":"ความบริสุทธิ์","en":"Purity"}'::jsonb, 'single', '', true, '[]'::jsonb, 20) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('industrial', '{"th":"อุตสาหกรรม","en":"Industrial"}'::jsonb, 10),
  ('5-0', '{"th":"5.0","en":"5.0"}'::jsonb, 20),
  ('6-0', '{"th":"6.0","en":"6.0"}'::jsonb, 30)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'industrial-gases' AND a.key = 'purity'
ON CONFLICT (attribute_id, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('industrial-gases', 'cylinder-size', '{"th":"ขนาดท่อบรรจุ","en":"Cylinder Size"}'::jsonb, 'multi', '', true, '[]'::jsonb, 30) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('industrial-gases', 'application', '{"th":"งานที่ใช้","en":"Application"}'::jsonb, 'multi', '', true, '[]'::jsonb, 40) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('welding-cutting', '{"th":"เชื่อมตัด","en":"Welding & Cutting"}'::jsonb, 10),
  ('lab', '{"th":"แล็บ","en":"Laboratory"}'::jsonb, 20),
  ('medical', '{"th":"การแพทย์","en":"Medical"}'::jsonb, 30),
  ('food', '{"th":"อาหาร","en":"Food"}'::jsonb, 40)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'industrial-gases' AND a.key = 'application'
ON CONFLICT (attribute_id, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('industrial-gases', 'service', '{"th":"บริการ","en":"Services"}'::jsonb, 'multi', '', true, '[]'::jsonb, 50) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('refill', '{"th":"เติมแก๊ส","en":"Refilling"}'::jsonb, 10),
  ('cylinder-rental', '{"th":"เช่าท่อ","en":"Cylinder Rental"}'::jsonb, 20),
  ('delivery', '{"th":"จัดส่ง","en":"Delivery"}'::jsonb, 30)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'industrial-gases' AND a.key = 'service'
ON CONFLICT (attribute_id, key) DO NOTHING;

-- 09 Safety & PPE
INSERT INTO categories (slug, name, description, sort_order, parent_slug) VALUES
  ('safety-ppe', '{"th":"อุปกรณ์ความปลอดภัย","en":"Safety & PPE"}'::jsonb, '{"th":"","en":""}'::jsonb, 90, NULL),
  ('welding-helmets', '{"th":"หน้ากากเชื่อม","en":"Welding Helmets"}'::jsonb, '{"th":"","en":""}'::jsonb, 10, 'safety-ppe'),
  ('gloves', '{"th":"ถุงมือ","en":"Gloves"}'::jsonb, '{"th":"","en":""}'::jsonb, 20, 'safety-ppe'),
  ('leather-apparel', '{"th":"เสื้อ / เอี๊ยมหนัง","en":"Leather Jackets & Aprons"}'::jsonb, '{"th":"","en":""}'::jsonb, 30, 'safety-ppe'),
  ('safety-glasses', '{"th":"แว่นตานิรภัย","en":"Safety Glasses"}'::jsonb, '{"th":"","en":""}'::jsonb, 40, 'safety-ppe'),
  ('welding-curtains', '{"th":"ม่าน / ผ้ากันไฟ","en":"Welding Curtains & Blankets"}'::jsonb, '{"th":"","en":""}'::jsonb, 50, 'safety-ppe'),
  ('fume-extractors', '{"th":"เครื่องดูดควัน","en":"Fume Extractors"}'::jsonb, '{"th":"","en":""}'::jsonb, 60, 'safety-ppe')
ON CONFLICT (slug) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('safety-ppe', 'standard', '{"th":"มาตรฐาน","en":"Standard"}'::jsonb, 'multi', '', true, '[]'::jsonb, 10) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('en379', '{"th":"EN379","en":"EN379"}'::jsonb, 10),
  ('ansi-z87', '{"th":"ANSI Z87","en":"ANSI Z87"}'::jsonb, 20)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'safety-ppe' AND a.key = 'standard'
ON CONFLICT (attribute_id, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('safety-ppe', 'size', '{"th":"ไซส์","en":"Size"}'::jsonb, 'multi', '', true, '[]'::jsonb, 20) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('s', '{"th":"S","en":"S"}'::jsonb, 10),
  ('m', '{"th":"M","en":"M"}'::jsonb, 20),
  ('l', '{"th":"L","en":"L"}'::jsonb, 30),
  ('xl', '{"th":"XL","en":"XL"}'::jsonb, 40)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'safety-ppe' AND a.key = 'size'
ON CONFLICT (attribute_id, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('safety-ppe', 'material', '{"th":"วัสดุ","en":"Material"}'::jsonb, 'multi', '', true, '[]'::jsonb, 30) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('leather', '{"th":"หนัง","en":"Leather"}'::jsonb, 10),
  ('fire-resistant', '{"th":"ผ้ากันไฟ","en":"Fire-resistant Fabric"}'::jsonb, 20),
  ('fiber', '{"th":"ไฟเบอร์","en":"Fiber"}'::jsonb, 30)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'safety-ppe' AND a.key = 'material'
ON CONFLICT (attribute_id, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('welding-helmets', 'helmet-type', '{"th":"ประเภทหน้ากาก","en":"Helmet Type"}'::jsonb, 'single', '', true, '[]'::jsonb, 10) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('auto-darkening', '{"th":"ปรับแสงอัตโนมัติ","en":"Auto-darkening"}'::jsonb, 10),
  ('passive', '{"th":"ธรรมดา","en":"Passive"}'::jsonb, 20)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'welding-helmets' AND a.key = 'helmet-type'
ON CONFLICT (attribute_id, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('welding-helmets', 'shade-range', '{"th":"ช่วงความเข้มแสง","en":"Shade Range"}'::jsonb, 'text', '', false, '[]'::jsonb, 20) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('welding-helmets', 'viewing-area', '{"th":"ขนาดช่องมอง","en":"Viewing Area"}'::jsonb, 'text', '', false, '[]'::jsonb, 30) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('welding-helmets', 'sensors', '{"th":"จำนวนเซนเซอร์","en":"Sensors"}'::jsonb, 'single', '', true, '[]'::jsonb, 40) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('2', '{"th":"2","en":"2"}'::jsonb, 10),
  ('4', '{"th":"4","en":"4"}'::jsonb, 20)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'welding-helmets' AND a.key = 'sensors'
ON CONFLICT (attribute_id, key) DO NOTHING;

-- 10 Tools & Workshop
INSERT INTO categories (slug, name, description, sort_order, parent_slug) VALUES
  ('tools-workshop', '{"th":"เครื่องมือช่างและโรงงาน","en":"Tools & Workshop"}'::jsonb, '{"th":"","en":""}'::jsonb, 100, NULL),
  ('electrode-ovens', '{"th":"ตู้อบ / กระบอกอบลวด","en":"Electrode Ovens"}'::jsonb, '{"th":"","en":""}'::jsonb, 10, 'tools-workshop'),
  ('grinders', '{"th":"เครื่องเจียร","en":"Grinders"}'::jsonb, '{"th":"","en":""}'::jsonb, 20, 'tools-workshop'),
  ('cutting-grinding-discs', '{"th":"ใบตัด / ใบเจียร","en":"Cutting & Grinding Discs"}'::jsonb, '{"th":"","en":""}'::jsonb, 30, 'tools-workshop'),
  ('clamps', '{"th":"แคลมป์ / ปากกาจับชิ้นงาน","en":"Clamps & Vises"}'::jsonb, '{"th":"","en":""}'::jsonb, 40, 'tools-workshop'),
  ('measuring-tools', '{"th":"เครื่องมือวัด","en":"Measuring Tools"}'::jsonb, '{"th":"","en":""}'::jsonb, 50, 'tools-workshop')
ON CONFLICT (slug) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('tools-workshop', 'size', '{"th":"ขนาด","en":"Size"}'::jsonb, 'multi', '', true, '[]'::jsonb, 10) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('tools-workshop', 'power-source', '{"th":"ระบบไฟ","en":"Power Source"}'::jsonb, 'multi', '', true, '[]'::jsonb, 20) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_options (attribute_id, key, label, sort_order)
SELECT a.id, v.key, v.label, v.sort_order FROM spec_attributes a CROSS JOIN (VALUES
  ('220v', '{"th":"220V","en":"220V"}'::jsonb, 10),
  ('380v', '{"th":"380V","en":"380V"}'::jsonb, 20),
  ('battery', '{"th":"แบตเตอรี่","en":"Battery"}'::jsonb, 30)
) AS v(key, label, sort_order)
WHERE a.category_slug = 'tools-workshop' AND a.key = 'power-source'
ON CONFLICT (attribute_id, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('electrode-ovens', 'max-temperature', '{"th":"อุณหภูมิสูงสุด","en":"Max Temperature"}'::jsonb, 'number', '°C', false, '[]'::jsonb, 10) ON CONFLICT (category_slug, key) DO NOTHING;
INSERT INTO spec_attributes (category_slug, key, name, type, unit, filterable, buckets, sort_order) VALUES ('electrode-ovens', 'capacity', '{"th":"ความจุ","en":"Capacity"}'::jsonb, 'number', 'kg', false, '[]'::jsonb, 20) ON CONFLICT (category_slug, key) DO NOTHING;

-- Existing products: move them out of the old flat categories
UPDATE products SET category_slug = 'regulators-gas-control' WHERE category_slug = 'flowmeter-regulator';
UPDATE products SET category_slug = 'safety-ppe' WHERE category_slug = 'safety-equipment';
DELETE FROM categories c WHERE c.slug IN ('machine', 'equipment-consumable', 'flowmeter-regulator', 'safety-equipment')
  AND NOT EXISTS (SELECT 1 FROM products p WHERE p.category_slug = c.slug);

COMMIT;
