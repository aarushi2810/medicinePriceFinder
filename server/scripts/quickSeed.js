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
        INSERT INTO prices (medicine_id, pharmacy_id, price, mrp, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (medicine_id, pharmacy_id)
        DO UPDATE SET price = EXCLUDED.price, mrp = EXCLUDED.mrp, updated_at = NOW()
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