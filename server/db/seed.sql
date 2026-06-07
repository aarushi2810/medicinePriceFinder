-- PHARMACIES
INSERT INTO pharmacies (name, type, lat, lng, address) VALUES
  ('1mg',       'online', NULL,     NULL,     'online'),
  ('Netmeds',   'online', NULL,     NULL,     'online'),
  ('PharmEasy', 'online', NULL,     NULL,     'online'),
  ('Apollo Pharmacy', 'local', 30.3398, 76.3869, 'Patiala, Punjab'),
  ('MedPlus',         'local', 30.3412, 76.3891, 'Patiala, Punjab');

-- SALTS (with NPPA ceiling prices from govt data)
INSERT INTO salts (salt_name, nppa_ceiling_price) VALUES
  ('Paracetamol 500mg',      2.30),
  ('Paracetamol 650mg',      2.80),
  ('Amoxicillin 500mg',     18.50),
  ('Metformin 500mg',        3.20),
  ('Atorvastatin 10mg',      8.75),
  ('Omeprazole 20mg',        4.50),
  ('Azithromycin 500mg',    32.00),
  ('Cetirizine 10mg',        2.10),
  ('Pantoprazole 40mg',      6.80),
  ('Amlodipine 5mg',         3.50),
  ('Ibuprofen 400mg',        3.80),
  ('Metronidazole 400mg',    2.90),
  ('Ciprofloxacin 500mg',   15.20),
  ('Ranitidine 150mg',       3.10),
  ('Aspirin 75mg',           1.80);

-- MEDICINES (branded drugs per salt)
INSERT INTO medicines (brand_name, dosage, form, salt_id) VALUES
  -- Paracetamol 500mg
  ('Crocin',      '500mg', 'tablet', 1),
  ('Calpol',      '500mg', 'tablet', 1),
  ('Dolo',        '500mg', 'tablet', 1),
  -- Paracetamol 650mg
  ('Dolo 650',    '650mg', 'tablet', 2),
  ('Crocin 650',  '650mg', 'tablet', 2),
  -- Amoxicillin
  ('Mox',         '500mg', 'capsule', 3),
  ('Novamox',     '500mg', 'capsule', 3),
  -- Metformin
  ('Glycomet',    '500mg', 'tablet', 4),
  ('Glucophage',  '500mg', 'tablet', 4),
  -- Atorvastatin
  ('Atorva',      '10mg',  'tablet', 5),
  ('Lipitor',     '10mg',  'tablet', 5),
  -- Omeprazole
  ('Omez',        '20mg',  'capsule', 6),
  ('Prilosec',    '20mg',  'capsule', 6),
  -- Azithromycin
  ('Azithral',    '500mg', 'tablet', 7),
  ('Zithromax',   '500mg', 'tablet', 7),
  -- Cetirizine
  ('Cetzine',     '10mg',  'tablet', 8),
  ('Zyrtec',      '10mg',  'tablet', 8),
  -- Pantoprazole
  ('Pan 40',      '40mg',  'tablet', 9),
  ('Pantodac',    '40mg',  'tablet', 9),
  -- Amlodipine
  ('Amlip',       '5mg',   'tablet', 10),
  ('Norvasc',     '5mg',   'tablet', 10),
  -- Ibuprofen
  ('Brufen',      '400mg', 'tablet', 11),
  ('Combiflam',   '400mg', 'tablet', 11),
  -- Ciprofloxacin
  ('Cifran',      '500mg', 'tablet', 13),
  ('Ciplox',      '500mg', 'tablet', 13),
  -- Aspirin
  ('Ecosprin',    '75mg',  'tablet', 15),
  ('Disprin',     '75mg',  'tablet', 15);

-- PRICES (realistic Indian pharmacy prices)
-- medicine_id, pharmacy_id, price, mrp
INSERT INTO prices (medicine_id, pharmacy_id, price, mrp) VALUES
  -- Crocin 500mg
  (1, 1, 28.50, 32.00),   -- 1mg
  (1, 2, 30.00, 32.00),   -- Netmeds
  (1, 3, 27.80, 32.00),   -- PharmEasy
  (1, 4, 32.00, 32.00),   -- Apollo (MRP — no discount)
  (1, 5, 31.50, 32.00),   -- MedPlus
  -- Calpol 500mg
  (2, 1, 26.00, 30.00),
  (2, 2, 28.50, 30.00),
  (2, 3, 25.50, 30.00),
  -- Dolo 500mg
  (3, 1, 24.00, 28.00),
  (3, 2, 26.00, 28.00),
  (3, 3, 23.50, 28.00),
  (3, 4, 28.00, 28.00),
  -- Dolo 650
  (4, 1, 30.00, 34.00),
  (4, 2, 32.00, 34.00),
  (4, 3, 29.50, 34.00),
  (4, 4, 34.00, 34.00),
  (4, 5, 33.00, 34.00),
  -- Mox (Amoxicillin)
  (6, 1, 95.00, 110.00),
  (6, 2, 102.00, 110.00),
  (6, 3, 92.00, 110.00),
  (6, 4, 115.00, 115.00),  -- NPPA breach! (>18.50 per tablet)
  -- Glycomet (Metformin)
  (8, 1, 42.00, 48.00),
  (8, 2, 45.00, 48.00),
  (8, 3, 41.00, 48.00),
  (8, 4, 48.00, 48.00),
  -- Atorva
  (10, 1, 68.00, 78.00),
  (10, 2, 72.00, 78.00),
  (10, 3, 65.00, 78.00),
  -- Azithral
  (14, 1, 145.00, 165.00),
  (14, 2, 152.00, 165.00),
  (14, 3, 142.00, 165.00),
  (14, 4, 170.00, 170.00),  -- NPPA breach!
  -- Ecosprin
  (25, 1, 18.00, 22.00),
  (25, 2, 20.00, 22.00),
  (25, 3, 17.50, 22.00),
  (25, 4, 22.00, 22.00);