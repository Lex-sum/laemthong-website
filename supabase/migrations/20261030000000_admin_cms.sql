-- Admin CMS: editable site text, services in DB, single company info source,
-- inquiry workflow, and an activity log.
-- Safe to re-run. Run this file on its own in the Supabase SQL Editor — do not re-run older migrations.

-- ── Site text overrides (merged over messages/*.json at request time) ───────
CREATE TABLE IF NOT EXISTS site_content (
  key        TEXT PRIMARY KEY,           -- next-intl message path, e.g. "hero.title"
  value      JSONB NOT NULL,             -- {"th": "...", "en": "..."}
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Public read site_content" ON site_content FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Services: extra fields + seed the 4 existing services ──────────────────
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS short_description JSONB NOT NULL DEFAULT '{"th":"","en":""}',
  ADD COLUMN IF NOT EXISTS process_steps     JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS expertise         JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS meta_title        JSONB NOT NULL DEFAULT '{"th":"","en":""}',
  ADD COLUMN IF NOT EXISTS meta_description  JSONB NOT NULL DEFAULT '{"th":"","en":""}',
  ADD COLUMN IF NOT EXISTS is_primary        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS image_url         TEXT;

INSERT INTO services
  (slug, title, description, icon, features, sort_order, short_description,
   process_steps, expertise, meta_title, meta_description, is_primary)
VALUES
  ('consulting', $json${"th":"ให้คำปรึกษาทางเทคนิค","en":"Technical Consulting"}$json$::jsonb, $json${"th":"ทีมวิศวกรผู้เชี่ยวชาญของเราให้บริการคำปรึกษาทางเทคนิคอย่างครบวงจร ตั้งแต่การเลือกอุปกรณ์ที่เหมาะสม การปรับปรุงกระบวนการเชื่อม ไปจนถึงการเพิ่มประสิทธิภาพการผลิต ด้วยประสบการณ์กว่า 60 ปีในอุตสาหกรรม เราเข้าใจความท้าทายเฉพาะของงานอุตสาหกรรมการผลิตในประเทศไทย","en":"Our team of experienced engineers provides comprehensive technical consulting services to help you select the right equipment, optimize welding processes, and improve production efficiency. With over 60 years of industry expertise, we understand the unique challenges of industrial manufacturing in Thailand."}$json$::jsonb, 'wrench',
   $json$[{"th":"ให้คำแนะนำเลือกอุปกรณ์และข้อมูลจำเพาะ","en":"Equipment selection and specification guidance"},{"th":"ปรับปรุงกระบวนการเชื่อมและพัฒนาพารามิเตอร์","en":"Welding process optimization and parameter development"},{"th":"วิเคราะห์ประสิทธิภาพสายการผลิต","en":"Production line efficiency analysis"},{"th":"ประเมินการเลือกวัสดุและความเข้ากันได้","en":"Material selection and compatibility assessment"},{"th":"ลดต้นทุนด้วยการปรับปรุงกระบวนการ","en":"Cost reduction through process improvement"},{"th":"ศึกษาความเป็นไปได้ของระบบอัตโนมัติและการบูรณาการ","en":"Automation feasibility studies and integration"}]$json$::jsonb,
   10, $json${"th":"บริการให้คำปรึกษาด้านการเชื่อม การตัด และระบบอัตโนมัติ ออกแบบโซลูชันเฉพาะตามความต้องการของคุณ","en":"Expert consultation for industrial welding, cutting, and automation solutions tailored to your specific operational needs."}$json$::jsonb,
   $json$[{"title":{"th":"ประเมินเบื้องต้น","en":"Initial Assessment"},"description":{"th":"เราเข้าเยี่ยมชมสถานที่ของคุณเพื่อทำความเข้าใจกระบวนการ อุปกรณ์ และปัญหาที่พบ","en":"We visit your facility to understand your current processes, equipment, and challenges."}},{"title":{"th":"วิเคราะห์และแนะนำ","en":"Analysis & Recommendations"},"description":{"th":"วิศวกรของเราวิเคราะห์ความต้องการและพัฒนาโซลูชันเฉพาะสำหรับคุณ","en":"Our engineers analyze your requirements and develop tailored solutions."}},{"title":{"th":"เสนอแนวทาง","en":"Solution Proposal"},"description":{"th":"นำเสนอคำแนะนำโดยละเอียดพร้อมข้อมูลจำเพาะอุปกรณ์และประมาณการค่าใช้จ่าย","en":"We present detailed recommendations with equipment specifications and cost estimates."}},{"title":{"th":"สนับสนุนการดำเนินงาน","en":"Implementation Support"},"description":{"th":"แนะนำทีมงานของคุณตลอดการติดตั้ง ปรับพารามิเตอร์ และตรวจสอบกระบวนการ","en":"We guide your team through equipment setup, parameter optimization, and process validation."}}]$json$::jsonb,
   $json$[{"th":"ระบบเชื่อม MIG/MAG","en":"MIG/MAG Welding Systems"},{"th":"งานเชื่อม TIG","en":"TIG Welding Applications"},{"th":"ระบบตัดพลาสมา","en":"Plasma Cutting Systems"},{"th":"อุปกรณ์ตัดแก๊ส","en":"Oxy-Fuel Cutting Equipment"},{"th":"ระบบอัตโนมัติและหุ่นยนต์เชื่อม","en":"Welding Automation & Robotics"},{"th":"ระบบดูดควันเชื่อม","en":"Fume Extraction Solutions"}]$json$::jsonb,
   $json${"th":"ให้คำปรึกษาทางเทคนิค - อุปกรณ์เชื่อมและตัดอุตสาหกรรม","en":"Technical Consulting - Industrial Welding & Cutting"}$json$::jsonb, $json${"th":"บริการให้คำปรึกษาทางเทคนิคสำหรับอุปกรณ์เชื่อม ตัด และระบบอัตโนมัติ การปรับปรุงกระบวนการ เลือกอุปกรณ์ และวิเคราะห์ประสิทธิภาพการผลิต","en":"Expert technical consulting for industrial welding, cutting, and automation equipment. Process optimization, equipment selection, and production efficiency analysis."}$json$::jsonb, true),
  ('calibration', $json${"th":"สอบเทียบอุปกรณ์","en":"Equipment Calibration"}$json$::jsonb, $json${"th":"บริการสอบเทียบของเราให้ผลลัพธ์ที่แม่นยำและสอบกลับได้ สำหรับทั้งเครื่องเชื่อมและเครื่องมือวัด การสอบเทียบที่ถูกต้องช่วยให้อุปกรณ์ของคุณทำงานภายในพารามิเตอร์ที่กำหนด รักษาคุณภาพผลิตภัณฑ์ และเป็นไปตามมาตรฐานอุตสาหกรรมและข้อกำหนดกฎหมาย","en":"Our calibration services provide traceable, accurate calibration for both welding equipment and measurement instruments. Proper calibration ensures your equipment operates within specified parameters, maintains product quality, and meets industry standards and regulatory requirements."}$json$::jsonb, 'wrench',
   $json$[{"th":"สอบเทียบกระแสและแรงดันเครื่องเชื่อม","en":"Welding machine output calibration (current, voltage)"},{"th":"สอบเทียบเครื่องวัดอัตราการไหลของแก๊ส","en":"Gas flow meter calibration"},{"th":"สอบเทียบเครื่องวัดอุณหภูมิ","en":"Temperature measurement device calibration"},{"th":"สอบเทียบเกจวัดความดัน","en":"Pressure gauge calibration"},{"th":"สอบเทียบเครื่องมือวัดขนาด","en":"Dimensional measurement instrument calibration"},{"th":"ใบรับรองการสอบเทียบพร้อมการสอบกลับได้","en":"Calibration certificates with full traceability"}]$json$::jsonb,
   20, $json${"th":"บริการสอบเทียบเครื่องเชื่อมและเครื่องมือวัดด้วยมาตรฐานสูง เพื่อความแม่นยำและการปฏิบัติตามข้อกำหนด","en":"Precision calibration services for welding equipment and measurement instruments ensuring accuracy and compliance."}$json$::jsonb,
   $json$[{"title":{"th":"นัดหมาย","en":"Scheduling"},"description":{"th":"ติดต่อเราเพื่อนัดหมายการสอบเทียบ ณ สถานที่ของคุณหรือห้องปฏิบัติการของเรา","en":"Contact us to schedule a calibration appointment at your facility or our laboratory."}},{"title":{"th":"ตรวจสอบก่อนสอบเทียบ","en":"Pre-Calibration Inspection"},"description":{"th":"ตรวจสอบสภาพอุปกรณ์และบันทึกค่าการทำงานปัจจุบัน","en":"We inspect equipment condition and document current performance readings."}},{"title":{"th":"ดำเนินการสอบเทียบ","en":"Calibration Procedure"},"description":{"th":"สอบเทียบอย่างแม่นยำด้วยมาตรฐานอ้างอิงที่สอบกลับได้","en":"Precision calibration performed using traceable reference standards."}},{"title":{"th":"ออกเอกสาร","en":"Documentation"},"description":{"th":"ออกใบรับรองการสอบเทียบโดยละเอียดพร้อมข้อมูลการวัดและบันทึกการสอบกลับ","en":"Detailed calibration certificate issued with measurement data and traceability records."}}]$json$::jsonb,
   $json$[{"th":"สอบเทียบเครื่องเชื่อม","en":"Welding Machine Calibration"},{"th":"การวัดกระแสและแรงดัน","en":"Current & Voltage Measurement"},{"th":"การวัดอัตราการไหลแก๊ส","en":"Gas Flow Measurement"},{"th":"เครื่องมือวัดอุณหภูมิ","en":"Temperature Instruments"},{"th":"เกจวัดความดัน","en":"Pressure Gauges"},{"th":"เกจวัดขนาด","en":"Dimensional Gauges"}]$json$::jsonb,
   $json${"th":"สอบเทียบอุปกรณ์ - เครื่องเชื่อมและเครื่องมือวัด","en":"Equipment Calibration - Welding & Measurement Instruments"}$json$::jsonb, $json${"th":"บริการสอบเทียบเครื่องเชื่อมและเครื่องมือวัดอย่างมืออาชีพ พร้อมใบรับรองการสอบเทียบที่สอบกลับได้","en":"Professional calibration services for welding equipment and measurement instruments. Traceable calibration with certificates for compliance and quality assurance."}$json$::jsonb, true),
  ('repair', $json${"th":"ซ่อมบำรุงอุปกรณ์","en":"Equipment Repair"}$json$::jsonb, $json${"th":"ทีมช่างผู้เชี่ยวชาญที่ผ่านการอบรมจากโรงงานผู้ผลิต ให้บริการซ่อมเครื่องเชื่อมและอุปกรณ์ตัดทุกยี่ห้อ เราใช้อะไหล่แท้และปฏิบัติตามขั้นตอนที่ผู้ผลิตกำหนด เพื่อคืนสภาพอุปกรณ์ของคุณให้ทำงานได้เต็มประสิทธิภาพ โดยใช้เวลาหยุดทำงานน้อยที่สุด","en":"Our factory-trained technicians provide expert repair services for all major brands of welding and cutting equipment. We use genuine replacement parts and follow manufacturer-recommended procedures to restore your equipment to full operational capacity with minimal downtime."}$json$::jsonb, 'wrench',
   $json$[{"th":"ช่างผู้เชี่ยวชาญผ่านการอบรมจากโรงงานผู้ผลิต","en":"Factory-trained expert technicians"},{"th":"ใช้อะไหล่แท้จากผู้ผลิตเท่านั้น","en":"Genuine manufacturer replacement parts"},{"th":"บริการซ่อมทั้งที่หน้างานและในโรงงาน","en":"On-site and workshop repair options"},{"th":"โปรแกรมบำรุงรักษาเชิงป้องกัน","en":"Preventive maintenance programs"},{"th":"บริการแก้ไขปัญหาฉุกเฉิน","en":"Emergency breakdown response"},{"th":"รับประกันคุณภาพงานซ่อมทุกครั้ง","en":"Quality guarantee on all repairs"}]$json$::jsonb,
   30, $json${"th":"บริการซ่อมเครื่องเชื่อมและอุปกรณ์ตัดรวดเร็วและเชื่อถือได้ ใช้อะไหล่แท้จากผู้ผลิต","en":"Fast, reliable repair services for all welding and cutting equipment with genuine replacement parts."}$json$::jsonb,
   $json$[{"title":{"th":"แจ้งปัญหา","en":"Report Issue"},"description":{"th":"ติดต่อเราพร้อมรายละเอียดอุปกรณ์และอาการของปัญหา","en":"Contact us with equipment details and a description of the problem."}},{"title":{"th":"วินิจฉัย","en":"Diagnosis"},"description":{"th":"ช่างเทคนิควินิจฉัยปัญหาและจัดทำใบประเมินค่าซ่อม","en":"Our technicians diagnose the issue and provide a detailed repair estimate."}},{"title":{"th":"ดำเนินการซ่อม","en":"Repair"},"description":{"th":"ซ่อมอุปกรณ์ด้วยอะไหล่แท้และทดสอบอย่างละเอียด","en":"Equipment is repaired using genuine parts and thoroughly tested."}},{"title":{"th":"ส่งคืนพร้อมรับประกัน","en":"Return & Warranty"},"description":{"th":"ส่งคืนอุปกรณ์ที่ซ่อมแล้วพร้อมใบรับประกันงานซ่อม","en":"Repaired equipment is returned with a warranty on the work performed."}}]$json$::jsonb,
   $json$[{"th":"เครื่องเชื่อม MIG/MAG","en":"MIG/MAG Welding Machines"},{"th":"ระบบเชื่อม TIG","en":"TIG Welding Systems"},{"th":"อุปกรณ์ตัดพลาสมา","en":"Plasma Cutting Equipment"},{"th":"ระบบป้อนลวด","en":"Wire Feed Systems"},{"th":"อินเวอร์เตอร์แหล่งจ่ายไฟ","en":"Power Source Inverters"},{"th":"บอร์ดควบคุมและอิเล็กทรอนิกส์","en":"Control Boards & Electronics"}]$json$::jsonb,
   $json${"th":"ซ่อมบำรุงอุปกรณ์ - เครื่องเชื่อมและตัด","en":"Equipment Repair - Welding & Cutting Machines"}$json$::jsonb, $json${"th":"บริการซ่อมเครื่องเชื่อมและอุปกรณ์ตัดอุตสาหกรรม โดยช่างผู้เชี่ยวชาญ อะไหล่แท้ ซ่อมรวดเร็ว","en":"Professional repair services for industrial welding and cutting equipment. Factory-trained technicians, genuine parts, and fast turnaround."}$json$::jsonb, false),
  ('training', $json${"th":"ฝึกอบรมการใช้งาน","en":"Training Programs"}$json$::jsonb, $json${"th":"เราให้บริการฝึกอบรมครบวงจร ออกแบบมาเพื่อช่วยให้ทีมงานของคุณใช้งานเครื่องเชื่อมและอุปกรณ์ตัดได้อย่างเต็มศักยภาพ ตั้งแต่การฝึกอบรมพื้นฐานสำหรับผู้ปฏิบัติงาน ไปจนถึงเทคนิคขั้นสูง โดยปรับหลักสูตรตามระดับทักษะของทีมงานและงานที่ใช้จริง","en":"We offer comprehensive training programs designed to help your workforce get the most out of their welding and cutting equipment. From basic operator training to advanced process techniques, our programs are tailored to your team's skill level and your specific applications."}$json$::jsonb, 'wrench',
   $json$[{"th":"ฝึกอบรมการใช้งานอุปกรณ์ภาคปฏิบัติ","en":"Hands-on equipment operation training"},{"th":"หลักสูตรพัฒนาเทคนิคการเชื่อม","en":"Welding technique improvement courses"},{"th":"อบรมความปลอดภัยและแนวปฏิบัติที่ดี","en":"Safety and best practices workshops"},{"th":"ฝึกอบรมการบำรุงรักษาอุปกรณ์","en":"Equipment maintenance training"},{"th":"แนะนำเทคโนโลยีใหม่","en":"New technology introduction sessions"},{"th":"โปรแกรมฝึกอบรมเฉพาะสำหรับทีมของคุณ","en":"Customized programs for your team"}]$json$::jsonb,
   40, $json${"th":"โปรแกรมฝึกอบรมภาคปฏิบัติสำหรับช่างเชื่อม ช่างเทคนิค และวิศวกร เพื่อใช้งานอุปกรณ์ได้อย่างเต็มประสิทธิภาพ","en":"Hands-on training programs for welding operators, technicians, and engineers to maximize equipment utilization."}$json$::jsonb,
   $json$[{"title":{"th":"ประเมินความต้องการ","en":"Needs Assessment"},"description":{"th":"เราประเมินระดับทักษะปัจจุบันและความต้องการในการฝึกอบรมของทีมงาน","en":"We assess your team's current skill level and training requirements."}},{"title":{"th":"ออกแบบหลักสูตร","en":"Program Design"},"description":{"th":"พัฒนาหลักสูตรเฉพาะตามความต้องการของคุณ","en":"Customized training curriculum developed for your specific needs."}},{"title":{"th":"ดำเนินการฝึกอบรม","en":"Training Delivery"},"description":{"th":"ฝึกอบรมภาคปฏิบัติ ณ สถานที่ของคุณหรือศูนย์ฝึกอบรมของเรา","en":"Hands-on training conducted at your facility or our training center."}},{"title":{"th":"ออกใบรับรอง","en":"Certification"},"description":{"th":"ผู้เข้าอบรมได้รับใบรับรองการผ่านการฝึกอบรมพร้อมประเมินทักษะ","en":"Participants receive certificates of completion with skills assessment."}}]$json$::jsonb,
   $json$[{"th":"ใบรับรองช่างเชื่อม","en":"Welding Operator Certification"},{"th":"การใช้งานอุปกรณ์","en":"Equipment Operation"},{"th":"ขั้นตอนความปลอดภัย","en":"Safety Procedures"},{"th":"เทคนิคกระบวนการ","en":"Process Techniques"},{"th":"การบำรุงรักษาเบื้องต้น","en":"Maintenance Basics"},{"th":"การตรวจสอบคุณภาพ","en":"Quality Inspection"}]$json$::jsonb,
   $json${"th":"ฝึกอบรมการใช้งาน - งานเชื่อมและตัด","en":"Training Programs - Welding & Cutting Operations"}$json$::jsonb, $json${"th":"โปรแกรมฝึกอบรมสำหรับช่างเชื่อมและช่างเทคนิค หลักสูตรภาคปฏิบัติครอบคลุมการใช้งานอุปกรณ์ ความปลอดภัย และเทคนิคขั้นสูง","en":"Professional training programs for welding operators and technicians. Hands-on courses covering equipment operation, safety, and advanced techniques."}$json$::jsonb, false)
ON CONFLICT (slug) DO NOTHING;

-- Move service images from page_images into the service rows
UPDATE services s
SET image_url = p.image_url
FROM page_images p
WHERE p.key = 'service-' || s.slug AND s.image_url IS NULL;

-- ── Company info: business hours + stats (single source of truth) ──────────
ALTER TABLE company_info
  ADD COLUMN IF NOT EXISTS business_hours JSONB NOT NULL DEFAULT '{"th":"","en":""}',
  ADD COLUMN IF NOT EXISTS stats          JSONB NOT NULL DEFAULT '{}';

UPDATE company_info
SET business_hours = $json${"th":"จันทร์ - เสาร์ 8:00 - 17:00","en":"Monday - Saturday 8:00 AM - 5:00 PM"}$json$::jsonb
WHERE id = 1 AND business_hours = '{"th":"","en":""}'::jsonb;

UPDATE company_info
SET stats = $json${"years":60,"brands":19,"products":5000,"clients":10000}$json$::jsonb
WHERE id = 1 AND stats = '{}'::jsonb;

-- ── Contact inquiries: workflow status + internal note ─────────────────────
ALTER TABLE contact_inquiries
  ADD COLUMN IF NOT EXISTS status     TEXT NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS note       TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
DO $$ BEGIN
  ALTER TABLE contact_inquiries
    ADD CONSTRAINT contact_inquiries_status_check CHECK (status IN ('new', 'in_progress', 'done'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS contact_inquiries_status_idx ON contact_inquiries (status);

-- ── Activity log (service role only) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_log (
  id         BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id    UUID,
  user_email TEXT,
  action     TEXT NOT NULL,              -- create | update | delete | reorder | ...
  entity     TEXT NOT NULL,              -- product | brand | service | content | ...
  entity_id  TEXT,
  summary    TEXT
);
CREATE INDEX IF NOT EXISTS activity_log_created_at_idx ON activity_log (created_at DESC);
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- ── batch_reorder: allow services ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION batch_reorder(
  p_table text,
  p_slugs text[],
  p_sort_orders int[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  i int;
BEGIN
  IF p_table NOT IN ('brands', 'categories', 'products', 'services') THEN
    RAISE EXCEPTION 'Invalid table: %', p_table;
  END IF;

  IF array_length(p_slugs, 1) IS DISTINCT FROM array_length(p_sort_orders, 1) THEN
    RAISE EXCEPTION 'slugs and sort_orders arrays must have the same length';
  END IF;

  FOR i IN 1..array_length(p_slugs, 1) LOOP
    EXECUTE format('UPDATE %I SET sort_order = $1 WHERE slug = $2', p_table)
      USING p_sort_orders[i], p_slugs[i];
  END LOOP;
END;
$$;
