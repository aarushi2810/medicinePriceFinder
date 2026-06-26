const db = require('../db');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const MEDICINES = [
  // Paracetamol
  { name: 'Crocin',        dosage: '500mg', prices: [{ ph: '1mg', p: 28.50, m: 32 }, { ph: 'Netmeds', p: 30.00, m: 32 }, { ph: 'PharmEasy', p: 27.80, m: 32 }, { ph: 'Apollo Pharmacy', p: 32.00, m: 32 }]},
  { name: 'Dolo',          dosage: '500mg', prices: [{ ph: '1mg', p: 23.50, m: 28 }, { ph: 'Netmeds', p: 25.00, m: 28 }, { ph: 'PharmEasy', p: 22.80, m: 28 }, { ph: 'Apollo Pharmacy', p: 28.00, m: 28 }]},
  { name: 'Calpol',        dosage: '500mg', prices: [{ ph: '1mg', p: 25.50, m: 30 }, { ph: 'Netmeds', p: 27.00, m: 30 }, { ph: 'PharmEasy', p: 24.90, m: 30 }]},
  { name: 'Dolo 650',      dosage: '650mg', prices: [{ ph: '1mg', p: 30.00, m: 34 }, { ph: 'Netmeds', p: 32.50, m: 34 }, { ph: 'PharmEasy', p: 29.50, m: 34 }, { ph: 'Apollo Pharmacy', p: 34.00, m: 34 }]},
  { name: 'Crocin 650',    dosage: '650mg', prices: [{ ph: '1mg', p: 31.00, m: 36 }, { ph: 'Netmeds', p: 33.00, m: 36 }, { ph: 'PharmEasy', p: 30.50, m: 36 }]},
  // Antibiotics
  { name: 'Mox',           dosage: '500mg', prices: [{ ph: '1mg', p: 89.00, m: 110 }, { ph: 'Netmeds', p: 95.00, m: 110 }, { ph: 'PharmEasy', p: 86.00, m: 110 }, { ph: 'Apollo Pharmacy', p: 118.00, m: 118 }]},
  { name: 'Novamox',       dosage: '500mg', prices: [{ ph: '1mg', p: 92.00, m: 112 }, { ph: 'Netmeds', p: 97.00, m: 112 }, { ph: 'PharmEasy', p: 89.50, m: 112 }]},
  { name: 'Azithral',      dosage: '500mg', prices: [{ ph: '1mg', p: 98.00, m: 118 }, { ph: 'Netmeds', p: 104.00, m: 118 }, { ph: 'PharmEasy', p: 95.00, m: 118 }, { ph: 'Apollo Pharmacy', p: 125.00, m: 125 }]},
  { name: 'Zithromax',     dosage: '500mg', prices: [{ ph: '1mg', p: 142.00, m: 165 }, { ph: 'Netmeds', p: 148.00, m: 165 }, { ph: 'PharmEasy', p: 138.00, m: 165 }]},
  { name: 'Cifran',        dosage: '500mg', prices: [{ ph: '1mg', p: 82.00, m: 102 }, { ph: 'Netmeds', p: 87.00, m: 102 }, { ph: 'PharmEasy', p: 79.50, m: 102 }]},
  { name: 'Ciplox',        dosage: '500mg', prices: [{ ph: '1mg', p: 88.00, m: 108 }, { ph: 'Netmeds', p: 92.00, m: 108 }, { ph: 'PharmEasy', p: 85.00, m: 108 }]},
  // Diabetes
  { name: 'Glycomet',      dosage: '500mg', prices: [{ ph: '1mg', p: 27.60, m: 34.50 }, { ph: 'Netmeds', p: 29.00, m: 34.50 }, { ph: 'PharmEasy', p: 26.80, m: 34.50 }, { ph: 'Apollo Pharmacy', p: 34.50, m: 34.50 }]},
  { name: 'Glucophage',    dosage: '500mg', prices: [{ ph: '1mg', p: 38.00, m: 46 }, { ph: 'Netmeds', p: 40.00, m: 46 }, { ph: 'PharmEasy', p: 36.50, m: 46 }]},
  { name: 'Januvia',       dosage: '100mg', prices: [{ ph: '1mg', p: 178.00, m: 210 }, { ph: 'Netmeds', p: 185.00, m: 210 }, { ph: 'PharmEasy', p: 172.00, m: 210 }]},
  // Cholesterol
  { name: 'Atorva',        dosage: '10mg',  prices: [{ ph: '1mg', p: 63.00, m: 78 }, { ph: 'Netmeds', p: 68.00, m: 78 }, { ph: 'PharmEasy', p: 61.50, m: 78 }, { ph: 'Apollo Pharmacy', p: 78.00, m: 78 }]},
  { name: 'Lipitor',       dosage: '10mg',  prices: [{ ph: '1mg', p: 195.00, m: 230 }, { ph: 'Netmeds', p: 205.00, m: 230 }, { ph: 'PharmEasy', p: 190.00, m: 230 }]},
  { name: 'Rosuvas',       dosage: '10mg',  prices: [{ ph: '1mg', p: 112.00, m: 135 }, { ph: 'Netmeds', p: 118.00, m: 135 }, { ph: 'PharmEasy', p: 108.00, m: 135 }]},
  // Blood pressure
  { name: 'Amlip',         dosage: '5mg',   prices: [{ ph: '1mg', p: 28.00, m: 35 }, { ph: 'Netmeds', p: 30.50, m: 35 }, { ph: 'PharmEasy', p: 27.00, m: 35 }, { ph: 'Apollo Pharmacy', p: 35.00, m: 35 }]},
  { name: 'Norvasc',       dosage: '5mg',   prices: [{ ph: '1mg', p: 88.00, m: 105 }, { ph: 'Netmeds', p: 92.00, m: 105 }, { ph: 'PharmEasy', p: 85.00, m: 105 }]},
  { name: 'Telma',         dosage: '40mg',  prices: [{ ph: '1mg', p: 78.00, m: 95 }, { ph: 'Netmeds', p: 83.00, m: 95 }, { ph: 'PharmEasy', p: 75.00, m: 95 }]},
  // Gastric
  { name: 'Omez',          dosage: '20mg',  prices: [{ ph: '1mg', p: 38.00, m: 48 }, { ph: 'Netmeds', p: 41.00, m: 48 }, { ph: 'PharmEasy', p: 37.00, m: 48 }, { ph: 'Apollo Pharmacy', p: 48.00, m: 48 }]},
  { name: 'Pan 40',        dosage: '40mg',  prices: [{ ph: '1mg', p: 52.00, m: 65 }, { ph: 'Netmeds', p: 55.50, m: 65 }, { ph: 'PharmEasy', p: 50.00, m: 65 }, { ph: 'Apollo Pharmacy', p: 65.00, m: 65 }]},
  { name: 'Pantodac',      dosage: '40mg',  prices: [{ ph: '1mg', p: 58.00, m: 72 }, { ph: 'Netmeds', p: 62.00, m: 72 }, { ph: 'PharmEasy', p: 56.00, m: 72 }]},
  { name: 'Razo',          dosage: '20mg',  prices: [{ ph: '1mg', p: 68.00, m: 82 }, { ph: 'Netmeds', p: 72.00, m: 82 }, { ph: 'PharmEasy', p: 65.00, m: 82 }]},
  // Allergy
  { name: 'Cetzine',       dosage: '10mg',  prices: [{ ph: '1mg', p: 16.00, m: 22 }, { ph: 'Netmeds', p: 18.00, m: 22 }, { ph: 'PharmEasy', p: 15.50, m: 22 }, { ph: 'Apollo Pharmacy', p: 22.00, m: 22 }]},
  { name: 'Zyrtec',        dosage: '10mg',  prices: [{ ph: '1mg', p: 42.00, m: 52 }, { ph: 'Netmeds', p: 45.00, m: 52 }, { ph: 'PharmEasy', p: 40.00, m: 52 }]},
  { name: 'Allegra',       dosage: '120mg', prices: [{ ph: '1mg', p: 98.00, m: 118 }, { ph: 'Netmeds', p: 102.00, m: 118 }, { ph: 'PharmEasy', p: 95.00, m: 118 }]},
  // Pain / Anti-inflammatory
  { name: 'Brufen',        dosage: '400mg', prices: [{ ph: '1mg', p: 19.50, m: 25 }, { ph: 'Netmeds', p: 21.00, m: 25 }, { ph: 'PharmEasy', p: 18.80, m: 25 }, { ph: 'Apollo Pharmacy', p: 25.00, m: 25 }]},
  { name: 'Combiflam',     dosage: '400mg', prices: [{ ph: '1mg', p: 28.00, m: 35 }, { ph: 'Netmeds', p: 30.00, m: 35 }, { ph: 'PharmEasy', p: 27.00, m: 35 }]},
  { name: 'Voveran',       dosage: '50mg',  prices: [{ ph: '1mg', p: 22.00, m: 28 }, { ph: 'Netmeds', p: 24.00, m: 28 }, { ph: 'PharmEasy', p: 21.00, m: 28 }]},
  // Cardiac / Aspirin
  { name: 'Ecosprin',      dosage: '75mg',  prices: [{ ph: '1mg', p: 17.50, m: 22 }, { ph: 'Netmeds', p: 19.00, m: 22 }, { ph: 'PharmEasy', p: 16.80, m: 22 }, { ph: 'Apollo Pharmacy', p: 22.00, m: 22 }]},
  { name: 'Disprin',       dosage: '350mg', prices: [{ ph: '1mg', p: 12.00, m: 15 }, { ph: 'Netmeds', p: 13.00, m: 15 }, { ph: 'PharmEasy', p: 11.50, m: 15 }]},
  // Thyroid
  { name: 'Thyronorm',     dosage: '50mcg', prices: [{ ph: '1mg', p: 42.00, m: 52 }, { ph: 'Netmeds', p: 45.00, m: 52 }, { ph: 'PharmEasy', p: 40.50, m: 52 }]},
  { name: 'Eltroxin',      dosage: '50mcg', prices: [{ ph: '1mg', p: 38.00, m: 48 }, { ph: 'Netmeds', p: 41.00, m: 48 }, { ph: 'PharmEasy', p: 36.50, m: 48 }]},
  // Vitamins / Supplements
  { name: 'Shelcal',       dosage: '500mg', prices: [{ ph: '1mg', p: 95.00, m: 115 }, { ph: 'Netmeds', p: 100.00, m: 115 }, { ph: 'PharmEasy', p: 92.00, m: 115 }]},
  { name: 'Calcirol',      dosage: '60000IU', prices: [{ ph: '1mg', p: 38.00, m: 48 }, { ph: 'Netmeds', p: 41.00, m: 48 }, { ph: 'PharmEasy', p: 36.00, m: 48 }]},
  { name: 'Becosules',     dosage: '',      prices: [{ ph: '1mg', p: 32.00, m: 40 }, { ph: 'Netmeds', p: 35.00, m: 40 }, { ph: 'PharmEasy', p: 30.50, m: 40 }]},
  // Respiratory
  { name: 'Asthalin',      dosage: '2mg',   prices: [{ ph: '1mg', p: 18.00, m: 23 }, { ph: 'Netmeds', p: 20.00, m: 23 }, { ph: 'PharmEasy', p: 17.50, m: 23 }]},
  { name: 'Deriphyllin',   dosage: '150mg', prices: [{ ph: '1mg', p: 25.00, m: 32 }, { ph: 'Netmeds', p: 27.00, m: 32 }, { ph: 'PharmEasy', p: 24.00, m: 32 }]},
  // Anxiety / Sleep
  { name: 'Lonazep',       dosage: '0.5mg', prices: [{ ph: '1mg', p: 32.00, m: 40 }, { ph: 'Netmeds', p: 34.00, m: 40 }, { ph: 'PharmEasy', p: 30.50, m: 40 }]},
  // Skin
  { name: 'Betnovate',     dosage: '0.1%',  prices: [{ ph: '1mg', p: 42.00, m: 52 }, { ph: 'Netmeds', p: 45.00, m: 52 }, { ph: 'PharmEasy', p: 40.00, m: 52 }]},
  { name: 'Soframycin',    dosage: '1%',    prices: [{ ph: '1mg', p: 38.00, m: 47 }, { ph: 'Netmeds', p: 40.00, m: 47 }, { ph: 'PharmEasy', p: 36.50, m: 47 }]},
  // Eye drops
  { name: 'Genteal',       dosage: '0.3%',  prices: [{ ph: '1mg', p: 85.00, m: 102 }, { ph: 'Netmeds', p: 88.00, m: 102 }, { ph: 'PharmEasy', p: 82.00, m: 102 }]},
  // Antifungal
  { name: 'Fluconaz',      dosage: '150mg', prices: [{ ph: '1mg', p: 48.00, m: 60 }, { ph: 'Netmeds', p: 51.00, m: 60 }, { ph: 'PharmEasy', p: 46.00, m: 60 }]},
  // Iron
  { name: 'Feronia-XT',    dosage: '100mg', prices: [{ ph: '1mg', p: 62.00, m: 78 }, { ph: 'Netmeds', p: 65.00, m: 78 }, { ph: 'PharmEasy', p: 59.50, m: 78 }]},
  // Cough
  { name: 'Benadryl',      dosage: '100ml', prices: [{ ph: '1mg', p: 58.00, m: 72 }, { ph: 'Netmeds', p: 62.00, m: 72 }, { ph: 'PharmEasy', p: 56.00, m: 72 }]},
  { name: 'Ascoril LS',    dosage: '100ml', prices: [{ ph: '1mg', p: 85.00, m: 105 }, { ph: 'Netmeds', p: 90.00, m: 105 }, { ph: 'PharmEasy', p: 82.00, m: 105 }]},
  // Ulcer
  { name: 'Sucrafil',      dosage: '200ml', prices: [{ ph: '1mg', p: 78.00, m: 95 }, { ph: 'Netmeds', p: 82.00, m: 95 }, { ph: 'PharmEasy', p: 75.00, m: 95 }]},
  // Nausea
  { name: 'Emeset',        dosage: '4mg',   prices: [{ ph: '1mg', p: 45.00, m: 56 }, { ph: 'Netmeds', p: 48.00, m: 56 }, { ph: 'PharmEasy', p: 43.00, m: 56 }]},
  // Gout
  { name: 'Zyloric',       dosage: '100mg', prices: [{ ph: '1mg', p: 28.00, m: 35 }, { ph: 'Netmeds', p: 30.00, m: 35 }, { ph: 'PharmEasy', p: 27.00, m: 35 }]},

  // ══════════════════════════════════════════════════════════════════════════════
  // NEW — Dermatology
  // ══════════════════════════════════════════════════════════════════════════════
  { name: 'Candid',          dosage: '1%',     prices: [{ ph: '1mg', p: 68.00, m: 85 }, { ph: 'Netmeds', p: 72.00, m: 85 }, { ph: 'PharmEasy', p: 65.00, m: 85 }, { ph: 'Apollo Pharmacy', p: 85.00, m: 85 }]},
  { name: 'Clobetasol',      dosage: '0.05%',  prices: [{ ph: '1mg', p: 52.00, m: 65 }, { ph: 'Netmeds', p: 55.00, m: 65 }, { ph: 'PharmEasy', p: 50.00, m: 65 }]},
  { name: 'Ketoconazole',    dosage: '200mg',  prices: [{ ph: '1mg', p: 78.00, m: 98 }, { ph: 'Netmeds', p: 82.00, m: 98 }, { ph: 'PharmEasy', p: 75.00, m: 98 }, { ph: 'Apollo Pharmacy', p: 96.00, m: 98 }]},

  // ══════════════════════════════════════════════════════════════════════════════
  // NEW — Psychiatric
  // ══════════════════════════════════════════════════════════════════════════════
  { name: 'Nexito',          dosage: '10mg',   prices: [{ ph: '1mg', p: 82.00, m: 102 }, { ph: 'Netmeds', p: 87.00, m: 102 }, { ph: 'PharmEasy', p: 79.00, m: 102 }, { ph: 'Apollo Pharmacy', p: 100.00, m: 102 }]},
  { name: 'Oleanz',          dosage: '5mg',    prices: [{ ph: '1mg', p: 58.00, m: 72 }, { ph: 'Netmeds', p: 62.00, m: 72 }, { ph: 'PharmEasy', p: 56.00, m: 72 }]},
  { name: 'Librium',         dosage: '10mg',   prices: [{ ph: '1mg', p: 22.00, m: 28 }, { ph: 'Netmeds', p: 24.00, m: 28 }, { ph: 'PharmEasy', p: 21.00, m: 28 }, { ph: 'Apollo Pharmacy', p: 27.50, m: 28 }]},

  // ══════════════════════════════════════════════════════════════════════════════
  // NEW — Pediatric
  // ══════════════════════════════════════════════════════════════════════════════
  { name: 'Calpol Syrup',    dosage: '120mg/5ml', prices: [{ ph: '1mg', p: 38.00, m: 48 }, { ph: 'Netmeds', p: 41.00, m: 48 }, { ph: 'PharmEasy', p: 36.50, m: 48 }, { ph: 'Apollo Pharmacy', p: 47.00, m: 48 }]},
  { name: 'Meftal-P',        dosage: '50mg',   prices: [{ ph: '1mg', p: 28.00, m: 35 }, { ph: 'Netmeds', p: 30.00, m: 35 }, { ph: 'PharmEasy', p: 27.00, m: 35 }]},
  { name: 'Ondem',           dosage: '4mg',    prices: [{ ph: '1mg', p: 42.00, m: 52 }, { ph: 'Netmeds', p: 45.00, m: 52 }, { ph: 'PharmEasy', p: 40.00, m: 52 }, { ph: 'Apollo Pharmacy', p: 51.00, m: 52 }]},

  // ══════════════════════════════════════════════════════════════════════════════
  // NEW — Gynecology
  // ══════════════════════════════════════════════════════════════════════════════
  { name: 'Mifeprin',        dosage: '200mg',  prices: [{ ph: '1mg', p: 285.00, m: 350 }, { ph: 'Netmeds', p: 298.00, m: 350 }, { ph: 'PharmEasy', p: 275.00, m: 350 }]},
  { name: 'Regestrone',      dosage: '5mg',    prices: [{ ph: '1mg', p: 42.00, m: 52 }, { ph: 'Netmeds', p: 45.00, m: 52 }, { ph: 'PharmEasy', p: 40.00, m: 52 }, { ph: 'Apollo Pharmacy', p: 52.00, m: 52 }]},
  { name: 'Duphaston',       dosage: '10mg',   prices: [{ ph: '1mg', p: 435.00, m: 540 }, { ph: 'Netmeds', p: 458.00, m: 540 }, { ph: 'PharmEasy', p: 420.00, m: 540 }, { ph: 'Apollo Pharmacy', p: 535.00, m: 540 }]},

  // ══════════════════════════════════════════════════════════════════════════════
  // NEW — Cardiac
  // ══════════════════════════════════════════════════════════════════════════════
  { name: 'Concor',          dosage: '5mg',    prices: [{ ph: '1mg', p: 108.00, m: 132 }, { ph: 'Netmeds', p: 112.00, m: 132 }, { ph: 'PharmEasy', p: 104.00, m: 132 }, { ph: 'Apollo Pharmacy', p: 130.00, m: 132 }]},
  { name: 'Stamlo',          dosage: '5mg',    prices: [{ ph: '1mg', p: 32.00, m: 40 }, { ph: 'Netmeds', p: 34.00, m: 40 }, { ph: 'PharmEasy', p: 31.00, m: 40 }]},
  { name: 'Repace',          dosage: '50mg',   prices: [{ ph: '1mg', p: 88.00, m: 108 }, { ph: 'Netmeds', p: 92.00, m: 108 }, { ph: 'PharmEasy', p: 85.00, m: 108 }, { ph: 'Apollo Pharmacy', p: 106.00, m: 108 }]},
  { name: 'Cardace',         dosage: '5mg',    prices: [{ ph: '1mg', p: 72.00, m: 90 }, { ph: 'Netmeds', p: 76.00, m: 90 }, { ph: 'PharmEasy', p: 69.00, m: 90 }]},

  // ══════════════════════════════════════════════════════════════════════════════
  // NEW — Diabetes extended
  // ══════════════════════════════════════════════════════════════════════════════
  { name: 'Amaryl',          dosage: '2mg',    prices: [{ ph: '1mg', p: 78.00, m: 96 }, { ph: 'Netmeds', p: 82.00, m: 96 }, { ph: 'PharmEasy', p: 75.00, m: 96 }, { ph: 'Apollo Pharmacy', p: 95.00, m: 96 }]},
  { name: 'Galvus',          dosage: '50mg',   prices: [{ ph: '1mg', p: 245.00, m: 298 }, { ph: 'Netmeds', p: 255.00, m: 298 }, { ph: 'PharmEasy', p: 238.00, m: 298 }]},
  { name: 'Trajenta',        dosage: '5mg',    prices: [{ ph: '1mg', p: 395.00, m: 482 }, { ph: 'Netmeds', p: 412.00, m: 482 }, { ph: 'PharmEasy', p: 385.00, m: 482 }, { ph: 'Apollo Pharmacy', p: 478.00, m: 482 }]},

  // ══════════════════════════════════════════════════════════════════════════════
  // NEW — Antibiotic extended
  // ══════════════════════════════════════════════════════════════════════════════
  { name: 'Augmentin',       dosage: '625mg',  prices: [{ ph: '1mg', p: 165.00, m: 205 }, { ph: 'Netmeds', p: 175.00, m: 205 }, { ph: 'PharmEasy', p: 160.00, m: 205 }, { ph: 'Apollo Pharmacy', p: 202.00, m: 205 }]},
  { name: 'Taxim-O',         dosage: '200mg',  prices: [{ ph: '1mg', p: 108.00, m: 135 }, { ph: 'Netmeds', p: 115.00, m: 135 }, { ph: 'PharmEasy', p: 105.00, m: 135 }]},
  { name: 'Monocef',         dosage: '1g',     prices: [{ ph: '1mg', p: 82.00, m: 102 }, { ph: 'Netmeds', p: 87.00, m: 102 }, { ph: 'PharmEasy', p: 79.00, m: 102 }, { ph: 'Apollo Pharmacy', p: 100.00, m: 102 }]},

  // ══════════════════════════════════════════════════════════════════════════════
  // NEW — Vitamins extended
  // ══════════════════════════════════════════════════════════════════════════════
  { name: 'Limcee',          dosage: '500mg',  prices: [{ ph: '1mg', p: 18.00, m: 23 }, { ph: 'Netmeds', p: 20.00, m: 23 }, { ph: 'PharmEasy', p: 17.50, m: 23 }]},
  { name: 'Neurobion Forte', dosage: '',       prices: [{ ph: '1mg', p: 28.00, m: 34 }, { ph: 'Netmeds', p: 30.00, m: 34 }, { ph: 'PharmEasy', p: 27.00, m: 34 }, { ph: 'Apollo Pharmacy', p: 34.00, m: 34 }]},
  { name: 'Supradyn',        dosage: '',       prices: [{ ph: '1mg', p: 42.00, m: 52 }, { ph: 'Netmeds', p: 45.00, m: 52 }, { ph: 'PharmEasy', p: 40.00, m: 52 }, { ph: 'Apollo Pharmacy', p: 51.00, m: 52 }]},

  // ══════════════════════════════════════════════════════════════════════════════
  // NEW — GI extended
  // ══════════════════════════════════════════════════════════════════════════════
  { name: 'Librax',          dosage: '5mg',    prices: [{ ph: '1mg', p: 22.00, m: 28 }, { ph: 'Netmeds', p: 24.00, m: 28 }, { ph: 'PharmEasy', p: 21.00, m: 28 }]},
  { name: 'Colimex',         dosage: '20mg',   prices: [{ ph: '1mg', p: 38.00, m: 48 }, { ph: 'Netmeds', p: 41.00, m: 48 }, { ph: 'PharmEasy', p: 36.00, m: 48 }, { ph: 'Apollo Pharmacy', p: 47.00, m: 48 }]},
  { name: 'Cremaffin',       dosage: '225ml',  prices: [{ ph: '1mg', p: 118.00, m: 145 }, { ph: 'Netmeds', p: 125.00, m: 145 }, { ph: 'PharmEasy', p: 115.00, m: 145 }]},

  // ══════════════════════════════════════════════════════════════════════════════
  // NEW — Respiratory extended
  // ══════════════════════════════════════════════════════════════════════════════
  { name: 'Foracort',        dosage: '200mcg', prices: [{ ph: '1mg', p: 342.00, m: 420 }, { ph: 'Netmeds', p: 358.00, m: 420 }, { ph: 'PharmEasy', p: 330.00, m: 420 }, { ph: 'Apollo Pharmacy', p: 415.00, m: 420 }]},
  { name: 'Montair',         dosage: '10mg',   prices: [{ ph: '1mg', p: 138.00, m: 170 }, { ph: 'Netmeds', p: 145.00, m: 170 }, { ph: 'PharmEasy', p: 132.00, m: 170 }]},
  { name: 'Seroflo',         dosage: '250mcg', prices: [{ ph: '1mg', p: 412.00, m: 505 }, { ph: 'Netmeds', p: 428.00, m: 505 }, { ph: 'PharmEasy', p: 398.00, m: 505 }, { ph: 'Apollo Pharmacy', p: 500.00, m: 505 }]},

  // ══════════════════════════════════════════════════════════════════════════════
  // NEW — Anti-inflammatory extended
  // ══════════════════════════════════════════════════════════════════════════════
  { name: 'Zerodol-P',       dosage: '100mg',  prices: [{ ph: '1mg', p: 52.00, m: 65 }, { ph: 'Netmeds', p: 55.00, m: 65 }, { ph: 'PharmEasy', p: 50.00, m: 65 }, { ph: 'Apollo Pharmacy', p: 64.00, m: 65 }]},
  { name: 'Hifenac',         dosage: '100mg',  prices: [{ ph: '1mg', p: 62.00, m: 78 }, { ph: 'Netmeds', p: 66.00, m: 78 }, { ph: 'PharmEasy', p: 60.00, m: 78 }]},
  { name: 'Flexon',          dosage: '500mg',  prices: [{ ph: '1mg', p: 32.00, m: 40 }, { ph: 'Netmeds', p: 34.00, m: 40 }, { ph: 'PharmEasy', p: 31.00, m: 40 }, { ph: 'Apollo Pharmacy', p: 39.00, m: 40 }]},

  // ══════════════════════════════════════════════════════════════════════════════
  // NEW — Antihypertensive (BP)
  // ══════════════════════════════════════════════════════════════════════════════
  { name: 'Telma-H',        dosage: '40mg',   prices: [{ ph: '1mg', p: 112.00, m: 138 }, { ph: 'Netmeds', p: 118.00, m: 138 }, { ph: 'PharmEasy', p: 108.00, m: 138 }, { ph: 'Apollo Pharmacy', p: 136.00, m: 138 }]},
  { name: 'Losar',          dosage: '50mg',   prices: [{ ph: '1mg', p: 78.00, m: 96 }, { ph: 'Netmeds', p: 82.00, m: 96 }, { ph: 'PharmEasy', p: 75.00, m: 96 }, { ph: 'Apollo Pharmacy', p: 94.00, m: 96 }]},
  { name: 'Envas',          dosage: '5mg',    prices: [{ ph: '1mg', p: 22.00, m: 28 }, { ph: 'Netmeds', p: 24.00, m: 28 }, { ph: 'PharmEasy', p: 21.00, m: 28 }]},
  { name: 'Olmezest',       dosage: '20mg',   prices: [{ ph: '1mg', p: 95.00, m: 118 }, { ph: 'Netmeds', p: 100.00, m: 118 }, { ph: 'PharmEasy', p: 92.00, m: 118 }, { ph: 'Apollo Pharmacy', p: 116.00, m: 118 }]},
  { name: 'Dytor',          dosage: '10mg',   prices: [{ ph: '1mg', p: 48.00, m: 60 }, { ph: 'Netmeds', p: 51.00, m: 60 }, { ph: 'PharmEasy', p: 46.00, m: 60 }]},
  { name: 'Minipress XL',   dosage: '5mg',    prices: [{ ph: '1mg', p: 68.00, m: 85 }, { ph: 'Netmeds', p: 72.00, m: 85 }, { ph: 'PharmEasy', p: 65.00, m: 85 }, { ph: 'Apollo Pharmacy', p: 83.00, m: 85 }]},

  // ══════════════════════════════════════════════════════════════════════════════
  // NEW — Diabetes (more brands)
  // ══════════════════════════════════════════════════════════════════════════════
  { name: 'Glimisave',      dosage: '2mg',    prices: [{ ph: '1mg', p: 52.00, m: 65 }, { ph: 'Netmeds', p: 55.00, m: 65 }, { ph: 'PharmEasy', p: 50.00, m: 65 }]},
  { name: 'Pioz',           dosage: '15mg',   prices: [{ ph: '1mg', p: 72.00, m: 90 }, { ph: 'Netmeds', p: 76.00, m: 90 }, { ph: 'PharmEasy', p: 69.00, m: 90 }, { ph: 'Apollo Pharmacy', p: 88.00, m: 90 }]},
  { name: 'Forxiga',        dosage: '10mg',   prices: [{ ph: '1mg', p: 395.00, m: 485 }, { ph: 'Netmeds', p: 412.00, m: 485 }, { ph: 'PharmEasy', p: 382.00, m: 485 }, { ph: 'Apollo Pharmacy', p: 480.00, m: 485 }]},
  { name: 'Jardiance',      dosage: '10mg',   prices: [{ ph: '1mg', p: 425.00, m: 520 }, { ph: 'Netmeds', p: 442.00, m: 520 }, { ph: 'PharmEasy', p: 410.00, m: 520 }, { ph: 'Apollo Pharmacy', p: 515.00, m: 520 }]},
  { name: 'Lantus',         dosage: '100IU/ml', prices: [{ ph: '1mg', p: 785.00, m: 960 }, { ph: 'Netmeds', p: 812.00, m: 960 }, { ph: 'PharmEasy', p: 768.00, m: 960 }]},
  { name: 'Volix',          dosage: '0.3mg',  prices: [{ ph: '1mg', p: 98.00, m: 122 }, { ph: 'Netmeds', p: 104.00, m: 122 }, { ph: 'PharmEasy', p: 95.00, m: 122 }, { ph: 'Apollo Pharmacy', p: 120.00, m: 122 }]},

  // ══════════════════════════════════════════════════════════════════════════════
  // NEW — Gastric / Liver
  // ══════════════════════════════════════════════════════════════════════════════
  { name: 'Domstal',        dosage: '10mg',   prices: [{ ph: '1mg', p: 38.00, m: 48 }, { ph: 'Netmeds', p: 41.00, m: 48 }, { ph: 'PharmEasy', p: 36.50, m: 48 }, { ph: 'Apollo Pharmacy', p: 47.00, m: 48 }]},
  { name: 'Rabesec',        dosage: '20mg',   prices: [{ ph: '1mg', p: 72.00, m: 90 }, { ph: 'Netmeds', p: 76.00, m: 90 }, { ph: 'PharmEasy', p: 69.00, m: 90 }]},
  { name: 'Udiliv',         dosage: '300mg',  prices: [{ ph: '1mg', p: 175.00, m: 215 }, { ph: 'Netmeds', p: 185.00, m: 215 }, { ph: 'PharmEasy', p: 170.00, m: 215 }, { ph: 'Apollo Pharmacy', p: 212.00, m: 215 }]},
  { name: 'Vomikind',       dosage: '4mg',    prices: [{ ph: '1mg', p: 32.00, m: 40 }, { ph: 'Netmeds', p: 34.00, m: 40 }, { ph: 'PharmEasy', p: 30.50, m: 40 }]},

  // ══════════════════════════════════════════════════════════════════════════════
  // NEW — Neuro / Pain
  // ══════════════════════════════════════════════════════════════════════════════
  { name: 'Pregabalin',     dosage: '75mg',   prices: [{ ph: '1mg', p: 88.00, m: 110 }, { ph: 'Netmeds', p: 92.00, m: 110 }, { ph: 'PharmEasy', p: 85.00, m: 110 }, { ph: 'Apollo Pharmacy', p: 108.00, m: 110 }]},
  { name: 'Gabantin',       dosage: '300mg',  prices: [{ ph: '1mg', p: 78.00, m: 98 }, { ph: 'Netmeds', p: 82.00, m: 98 }, { ph: 'PharmEasy', p: 75.00, m: 98 }]},
  { name: 'Ultracet',       dosage: '325mg',  prices: [{ ph: '1mg', p: 62.00, m: 78 }, { ph: 'Netmeds', p: 66.00, m: 78 }, { ph: 'PharmEasy', p: 59.00, m: 78 }, { ph: 'Apollo Pharmacy', p: 76.00, m: 78 }]},
  { name: 'Tryptomer',      dosage: '25mg',   prices: [{ ph: '1mg', p: 12.00, m: 15 }, { ph: 'Netmeds', p: 13.00, m: 15 }, { ph: 'PharmEasy', p: 11.50, m: 15 }]},

  // ══════════════════════════════════════════════════════════════════════════════
  // NEW — Cardiac (more)
  // ══════════════════════════════════════════════════════════════════════════════
  { name: 'Clopitab',       dosage: '75mg',   prices: [{ ph: '1mg', p: 52.00, m: 65 }, { ph: 'Netmeds', p: 55.00, m: 65 }, { ph: 'PharmEasy', p: 50.00, m: 65 }, { ph: 'Apollo Pharmacy', p: 64.00, m: 65 }]},
  { name: 'Ecosprin AV',    dosage: '75/20mg', prices: [{ ph: '1mg', p: 58.00, m: 72 }, { ph: 'Netmeds', p: 62.00, m: 72 }, { ph: 'PharmEasy', p: 56.00, m: 72 }, { ph: 'Apollo Pharmacy', p: 71.00, m: 72 }]},
  { name: 'Betaloc',        dosage: '50mg',   prices: [{ ph: '1mg', p: 42.00, m: 52 }, { ph: 'Netmeds', p: 45.00, m: 52 }, { ph: 'PharmEasy', p: 40.00, m: 52 }]},
  { name: 'Dilzem',         dosage: '30mg',   prices: [{ ph: '1mg', p: 28.00, m: 35 }, { ph: 'Netmeds', p: 30.00, m: 35 }, { ph: 'PharmEasy', p: 27.00, m: 35 }, { ph: 'Apollo Pharmacy', p: 34.00, m: 35 }]},

  // ══════════════════════════════════════════════════════════════════════════════
  // NEW — Antibiotics (more)
  // ══════════════════════════════════════════════════════════════════════════════
  { name: 'Levoflox',       dosage: '500mg',  prices: [{ ph: '1mg', p: 72.00, m: 90 }, { ph: 'Netmeds', p: 76.00, m: 90 }, { ph: 'PharmEasy', p: 69.00, m: 90 }, { ph: 'Apollo Pharmacy', p: 88.00, m: 90 }]},
  { name: 'Furadantin',     dosage: '100mg',  prices: [{ ph: '1mg', p: 48.00, m: 60 }, { ph: 'Netmeds', p: 51.00, m: 60 }, { ph: 'PharmEasy', p: 46.00, m: 60 }]},
  { name: 'Doxt-SL',        dosage: '100mg',  prices: [{ ph: '1mg', p: 52.00, m: 65 }, { ph: 'Netmeds', p: 55.00, m: 65 }, { ph: 'PharmEasy', p: 50.00, m: 65 }, { ph: 'Apollo Pharmacy', p: 64.00, m: 65 }]},
  { name: 'Metrogyl',       dosage: '400mg',  prices: [{ ph: '1mg', p: 18.00, m: 23 }, { ph: 'Netmeds', p: 20.00, m: 23 }, { ph: 'PharmEasy', p: 17.50, m: 23 }]},

  // ══════════════════════════════════════════════════════════════════════════════
  // NEW — Vitamins / Supplements (more)
  // ══════════════════════════════════════════════════════════════════════════════
  { name: 'Folvite',        dosage: '5mg',    prices: [{ ph: '1mg', p: 12.00, m: 15 }, { ph: 'Netmeds', p: 13.00, m: 15 }, { ph: 'PharmEasy', p: 11.50, m: 15 }, { ph: 'Apollo Pharmacy', p: 15.00, m: 15 }]},
  { name: 'Methycobal',     dosage: '500mcg', prices: [{ ph: '1mg', p: 108.00, m: 135 }, { ph: 'Netmeds', p: 115.00, m: 135 }, { ph: 'PharmEasy', p: 105.00, m: 135 }]},
  { name: 'CCM',            dosage: '500mg',  prices: [{ ph: '1mg', p: 78.00, m: 98 }, { ph: 'Netmeds', p: 82.00, m: 98 }, { ph: 'PharmEasy', p: 75.00, m: 98 }, { ph: 'Apollo Pharmacy', p: 96.00, m: 98 }]},
  { name: 'Zincovit',       dosage: '',       prices: [{ ph: '1mg', p: 85.00, m: 105 }, { ph: 'Netmeds', p: 90.00, m: 105 }, { ph: 'PharmEasy', p: 82.00, m: 105 }, { ph: 'Apollo Pharmacy', p: 103.00, m: 105 }]},

  // ══════════════════════════════════════════════════════════════════════════════
  // NEW — Skin / Allergy (more)
  // ══════════════════════════════════════════════════════════════════════════════
  { name: 'Montair LC',     dosage: '10mg',   prices: [{ ph: '1mg', p: 148.00, m: 182 }, { ph: 'Netmeds', p: 155.00, m: 182 }, { ph: 'PharmEasy', p: 142.00, m: 182 }, { ph: 'Apollo Pharmacy', p: 180.00, m: 182 }]},
  { name: 'Levocet',        dosage: '5mg',    prices: [{ ph: '1mg', p: 42.00, m: 52 }, { ph: 'Netmeds', p: 45.00, m: 52 }, { ph: 'PharmEasy', p: 40.00, m: 52 }]},
  { name: 'HCQS',           dosage: '200mg',  prices: [{ ph: '1mg', p: 38.00, m: 48 }, { ph: 'Netmeds', p: 41.00, m: 48 }, { ph: 'PharmEasy', p: 36.50, m: 48 }, { ph: 'Apollo Pharmacy', p: 47.00, m: 48 }]},
  { name: 'Wysolone',       dosage: '5mg',    prices: [{ ph: '1mg', p: 14.00, m: 18 }, { ph: 'Netmeds', p: 15.00, m: 18 }, { ph: 'PharmEasy', p: 13.50, m: 18 }]},

  // ══════════════════════════════════════════════════════════════════════════════
  // NEW — Women's Health
  // ══════════════════════════════════════════════════════════════════════════════
  { name: 'Susten',         dosage: '200mg',  prices: [{ ph: '1mg', p: 285.00, m: 350 }, { ph: 'Netmeds', p: 298.00, m: 350 }, { ph: 'PharmEasy', p: 275.00, m: 350 }, { ph: 'Apollo Pharmacy', p: 345.00, m: 350 }]},
  { name: 'Premarin',       dosage: '0.625mg', prices: [{ ph: '1mg', p: 195.00, m: 240 }, { ph: 'Netmeds', p: 205.00, m: 240 }, { ph: 'PharmEasy', p: 188.00, m: 240 }]},
  { name: 'Letoval',        dosage: '2.5mg',  prices: [{ ph: '1mg', p: 165.00, m: 205 }, { ph: 'Netmeds', p: 175.00, m: 205 }, { ph: 'PharmEasy', p: 160.00, m: 205 }, { ph: 'Apollo Pharmacy', p: 202.00, m: 205 }]},

  // ══════════════════════════════════════════════════════════════════════════════
  // NEW — Diabetes (more brands)
  // ══════════════════════════════════════════════════════════════════════════════
  { name: 'Glyciphage',      dosage: '500mg',  prices: [{ ph: '1mg', p: 26.00, m: 33 }, { ph: 'Netmeds', p: 28.00, m: 33 }, { ph: 'PharmEasy', p: 25.00, m: 33 }, { ph: 'Apollo Pharmacy', p: 32.50, m: 33 }]},
  { name: 'Obimet',          dosage: '500mg',  prices: [{ ph: '1mg', p: 28.00, m: 35 }, { ph: 'Netmeds', p: 30.00, m: 35 }, { ph: 'PharmEasy', p: 27.00, m: 35 }]},
  { name: 'Gluformin',       dosage: '500mg',  prices: [{ ph: '1mg', p: 24.50, m: 31 }, { ph: 'Netmeds', p: 26.50, m: 31 }, { ph: 'PharmEasy', p: 23.80, m: 31 }, { ph: 'Apollo Pharmacy', p: 30.50, m: 31 }]},
  { name: 'Jalra',           dosage: '50mg',   prices: [{ ph: '1mg', p: 225.00, m: 278 }, { ph: 'Netmeds', p: 238.00, m: 278 }, { ph: 'PharmEasy', p: 218.00, m: 278 }, { ph: 'Apollo Pharmacy', p: 275.00, m: 278 }]},
  { name: 'Ziten',           dosage: '20mg',   prices: [{ ph: '1mg', p: 145.00, m: 180 }, { ph: 'Netmeds', p: 152.00, m: 180 }, { ph: 'PharmEasy', p: 140.00, m: 180 }]},
  { name: 'Glizid',          dosage: '80mg',   prices: [{ ph: '1mg', p: 35.00, m: 44 }, { ph: 'Netmeds', p: 38.00, m: 44 }, { ph: 'PharmEasy', p: 33.50, m: 44 }, { ph: 'Apollo Pharmacy', p: 43.00, m: 44 }]},

  // ══════════════════════════════════════════════════════════════════════════════
  // NEW — BP (more brands)
  // ══════════════════════════════════════════════════════════════════════════════
  { name: 'Amlong',          dosage: '5mg',    prices: [{ ph: '1mg', p: 30.00, m: 38 }, { ph: 'Netmeds', p: 32.00, m: 38 }, { ph: 'PharmEasy', p: 29.00, m: 38 }, { ph: 'Apollo Pharmacy', p: 37.50, m: 38 }]},
  { name: 'Cilacar',         dosage: '10mg',   prices: [{ ph: '1mg', p: 98.00, m: 120 }, { ph: 'Netmeds', p: 104.00, m: 120 }, { ph: 'PharmEasy', p: 95.00, m: 120 }, { ph: 'Apollo Pharmacy', p: 118.00, m: 120 }]},
  { name: 'Arkamin',         dosage: '0.1mg',  prices: [{ ph: '1mg', p: 18.00, m: 23 }, { ph: 'Netmeds', p: 20.00, m: 23 }, { ph: 'PharmEasy', p: 17.50, m: 23 }]},
  { name: 'Prazopress',      dosage: '5mg',    prices: [{ ph: '1mg', p: 52.00, m: 65 }, { ph: 'Netmeds', p: 55.00, m: 65 }, { ph: 'PharmEasy', p: 50.00, m: 65 }, { ph: 'Apollo Pharmacy', p: 64.00, m: 65 }]},
  { name: 'Inderal',         dosage: '40mg',   prices: [{ ph: '1mg', p: 15.00, m: 19 }, { ph: 'Netmeds', p: 16.50, m: 19 }, { ph: 'PharmEasy', p: 14.50, m: 19 }, { ph: 'Apollo Pharmacy', p: 18.50, m: 19 }]},
  { name: 'Telmikind',       dosage: '40mg',   prices: [{ ph: '1mg', p: 62.00, m: 78 }, { ph: 'Netmeds', p: 66.00, m: 78 }, { ph: 'PharmEasy', p: 60.00, m: 78 }]},

  // ══════════════════════════════════════════════════════════════════════════════
  // NEW — Pain / Fever (more brands)
  // ══════════════════════════════════════════════════════════════════════════════
  { name: 'Saridon',         dosage: '250mg',  prices: [{ ph: '1mg', p: 22.00, m: 28 }, { ph: 'Netmeds', p: 24.00, m: 28 }, { ph: 'PharmEasy', p: 21.00, m: 28 }, { ph: 'Apollo Pharmacy', p: 27.50, m: 28 }]},
  { name: 'Crocin Advance',  dosage: '500mg',  prices: [{ ph: '1mg', p: 32.00, m: 40 }, { ph: 'Netmeds', p: 34.50, m: 40 }, { ph: 'PharmEasy', p: 30.50, m: 40 }, { ph: 'Apollo Pharmacy', p: 39.50, m: 40 }]},
  { name: 'Nicip',           dosage: '100mg',  prices: [{ ph: '1mg', p: 28.00, m: 35 }, { ph: 'Netmeds', p: 30.00, m: 35 }, { ph: 'PharmEasy', p: 27.00, m: 35 }]},
  { name: 'Nise',            dosage: '100mg',  prices: [{ ph: '1mg', p: 42.00, m: 52 }, { ph: 'Netmeds', p: 45.00, m: 52 }, { ph: 'PharmEasy', p: 40.00, m: 52 }, { ph: 'Apollo Pharmacy', p: 51.00, m: 52 }]},
  { name: 'Sumo',            dosage: '500mg',  prices: [{ ph: '1mg', p: 35.00, m: 44 }, { ph: 'Netmeds', p: 38.00, m: 44 }, { ph: 'PharmEasy', p: 34.00, m: 44 }]},
  { name: 'Flexura D',       dosage: '250mg',  prices: [{ ph: '1mg', p: 72.00, m: 90 }, { ph: 'Netmeds', p: 76.00, m: 90 }, { ph: 'PharmEasy', p: 69.00, m: 90 }, { ph: 'Apollo Pharmacy', p: 88.00, m: 90 }]},
  { name: 'Naprosyn',        dosage: '500mg',  prices: [{ ph: '1mg', p: 58.00, m: 72 }, { ph: 'Netmeds', p: 62.00, m: 72 }, { ph: 'PharmEasy', p: 56.00, m: 72 }]},

  // ══════════════════════════════════════════════════════════════════════════════
  // NEW — Antibiotics (more brands)
  // ══════════════════════════════════════════════════════════════════════════════
  { name: 'Norflox',         dosage: '400mg',  prices: [{ ph: '1mg', p: 38.00, m: 48 }, { ph: 'Netmeds', p: 41.00, m: 48 }, { ph: 'PharmEasy', p: 36.50, m: 48 }, { ph: 'Apollo Pharmacy', p: 47.00, m: 48 }]},
  { name: 'Oflomac',         dosage: '200mg',  prices: [{ ph: '1mg', p: 52.00, m: 65 }, { ph: 'Netmeds', p: 55.00, m: 65 }, { ph: 'PharmEasy', p: 50.00, m: 65 }]},
  { name: 'Dalacin',         dosage: '300mg',  prices: [{ ph: '1mg', p: 165.00, m: 205 }, { ph: 'Netmeds', p: 175.00, m: 205 }, { ph: 'PharmEasy', p: 160.00, m: 205 }, { ph: 'Apollo Pharmacy', p: 202.00, m: 205 }]},
  { name: 'Zinnat',          dosage: '250mg',  prices: [{ ph: '1mg', p: 195.00, m: 240 }, { ph: 'Netmeds', p: 205.00, m: 240 }, { ph: 'PharmEasy', p: 188.00, m: 240 }, { ph: 'Apollo Pharmacy', p: 238.00, m: 240 }]},

  // ══════════════════════════════════════════════════════════════════════════════
  // NEW — GI (more brands)
  // ══════════════════════════════════════════════════════════════════════════════
  { name: 'Nexpro',          dosage: '40mg',   prices: [{ ph: '1mg', p: 125.00, m: 155 }, { ph: 'Netmeds', p: 132.00, m: 155 }, { ph: 'PharmEasy', p: 120.00, m: 155 }, { ph: 'Apollo Pharmacy', p: 152.00, m: 155 }]},
  { name: 'Zinetac',         dosage: '150mg',  prices: [{ ph: '1mg', p: 22.00, m: 28 }, { ph: 'Netmeds', p: 24.00, m: 28 }, { ph: 'PharmEasy', p: 21.00, m: 28 }]},
  { name: 'Gelusil',         dosage: '15ml',   prices: [{ ph: '1mg', p: 55.00, m: 68 }, { ph: 'Netmeds', p: 58.00, m: 68 }, { ph: 'PharmEasy', p: 52.00, m: 68 }, { ph: 'Apollo Pharmacy', p: 67.00, m: 68 }]},
  { name: 'Mucaine',         dosage: '200ml',  prices: [{ ph: '1mg', p: 95.00, m: 118 }, { ph: 'Netmeds', p: 100.00, m: 118 }, { ph: 'PharmEasy', p: 92.00, m: 118 }]},

  // ══════════════════════════════════════════════════════════════════════════════
  // NEW — Psychiatric (more brands)
  // ══════════════════════════════════════════════════════════════════════════════
  { name: 'Cipralex',        dosage: '20mg',   prices: [{ ph: '1mg', p: 165.00, m: 205 }, { ph: 'Netmeds', p: 175.00, m: 205 }, { ph: 'PharmEasy', p: 160.00, m: 205 }, { ph: 'Apollo Pharmacy', p: 202.00, m: 205 }]},
  { name: 'Ativan',          dosage: '2mg',    prices: [{ ph: '1mg', p: 18.00, m: 23 }, { ph: 'Netmeds', p: 20.00, m: 23 }, { ph: 'PharmEasy', p: 17.50, m: 23 }]},
  { name: 'Restyl',          dosage: '0.5mg',  prices: [{ ph: '1mg', p: 22.00, m: 28 }, { ph: 'Netmeds', p: 24.00, m: 28 }, { ph: 'PharmEasy', p: 21.00, m: 28 }, { ph: 'Apollo Pharmacy', p: 27.50, m: 28 }]},
  { name: 'Fludac',          dosage: '20mg',   prices: [{ ph: '1mg', p: 35.00, m: 44 }, { ph: 'Netmeds', p: 38.00, m: 44 }, { ph: 'PharmEasy', p: 34.00, m: 44 }]},

  // ══════════════════════════════════════════════════════════════════════════════
  // NEW — Misc common OTC
  // ══════════════════════════════════════════════════════════════════════════════
  { name: 'Otrivin',         dosage: '0.1%',   prices: [{ ph: '1mg', p: 72.00, m: 90 }, { ph: 'Netmeds', p: 76.00, m: 90 }, { ph: 'PharmEasy', p: 69.00, m: 90 }, { ph: 'Apollo Pharmacy', p: 88.00, m: 90 }]},
  { name: 'Candid-B',        dosage: '1%',     prices: [{ ph: '1mg', p: 82.00, m: 102 }, { ph: 'Netmeds', p: 87.00, m: 102 }, { ph: 'PharmEasy', p: 79.00, m: 102 }, { ph: 'Apollo Pharmacy', p: 100.00, m: 102 }]},
  { name: 'Panderm',         dosage: '15g',    prices: [{ ph: '1mg', p: 95.00, m: 118 }, { ph: 'Netmeds', p: 100.00, m: 118 }, { ph: 'PharmEasy', p: 92.00, m: 118 }]},
  { name: 'Mintop',          dosage: '5%',     prices: [{ ph: '1mg', p: 485.00, m: 595 }, { ph: 'Netmeds', p: 508.00, m: 595 }, { ph: 'PharmEasy', p: 472.00, m: 595 }, { ph: 'Apollo Pharmacy', p: 590.00, m: 595 }]},
  { name: 'Volini Gel',      dosage: '30g',    prices: [{ ph: '1mg', p: 92.00, m: 115 }, { ph: 'Netmeds', p: 98.00, m: 115 }, { ph: 'PharmEasy', p: 89.00, m: 115 }]},
  { name: 'Moov',            dosage: '50g',    prices: [{ ph: '1mg', p: 88.00, m: 110 }, { ph: 'Netmeds', p: 92.00, m: 110 }, { ph: 'PharmEasy', p: 85.00, m: 110 }, { ph: 'Apollo Pharmacy', p: 108.00, m: 110 }]},
  { name: 'Ibugesic Plus',   dosage: '400mg',  prices: [{ ph: '1mg', p: 32.00, m: 40 }, { ph: 'Netmeds', p: 34.00, m: 40 }, { ph: 'PharmEasy', p: 31.00, m: 40 }, { ph: 'Apollo Pharmacy', p: 39.00, m: 40 }]},
];

async function getOrCreatePharmacy(name) {
  const r = await db.query(`SELECT id FROM pharmacies WHERE name = $1`, [name]);
  if (r.rows.length) return r.rows[0].id;
  const i = await db.query(
    `INSERT INTO pharmacies (name, type) VALUES ($1, 'online') RETURNING id`, [name]
  );
  return i.rows[0].id;
}

async function main() {
  console.log(` Seeding ${MEDICINES.length} medicines...\n`);
  let pricesAdded = 0, notFound = 0;

  for (const drug of MEDICINES) {
    const medRes = await db.query(
      `SELECT id FROM medicines WHERE LOWER(brand_name) = LOWER($1) LIMIT 1`,
      [drug.name]
    );

    if (!medRes.rows.length) {
      console.log(`  ⚠️  Not in DB: ${drug.name}`);
      notFound++;
      continue;
    }

    const medId = medRes.rows[0].id;

    for (const p of drug.prices) {
      const pharmId = await getOrCreatePharmacy(p.ph);
      await db.query(`
        INSERT INTO prices (medicine_id, pharmacy_id, price, mrp, updated_at, data_source, last_verified_at)
        VALUES ($1, $2, $3, $4, NOW(), 'Seed', NULL)
        ON CONFLICT (medicine_id, pharmacy_id)
        DO UPDATE SET
          price = EXCLUDED.price,
          mrp = EXCLUDED.mrp,
          data_source = 'Seed',
          last_verified_at = NULL,
          updated_at = NOW()
      `, [medId, pharmId, p.p, p.m]);
      await db.query(`
        INSERT INTO price_history (medicine_id, pharmacy_id, price, recorded_on)
        VALUES ($1, $2, $3, CURRENT_DATE) ON CONFLICT DO NOTHING
      `, [medId, pharmId, p.p]);
      pricesAdded++;
    }

    console.log(`  ✓ ${drug.name} — ${drug.prices.length} pharmacies`);
  }

  console.log(`\n Done. ${pricesAdded} prices added. ${notFound} medicines not found in DB.`);
  console.log(`   If any medicines show "Not in DB", run: node scripts/addMissingMedicines.js`);
  process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });
