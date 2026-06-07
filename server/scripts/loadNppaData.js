const fs   = require('fs');
const path = require('path');
const db   = require('../db');
require('dotenv').config({ path: path.join(__dirname, '../.env') });



function parseCSV(filePath) {
  const raw   = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split('\n');

  // Find the real header row — it's the first row that has 6+ non-empty cells
  let headerIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    const cells = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
    if (cells.filter(c => c.length > 0).length >= 6) {
      headerIdx = i;
      break;
    }
  }

  const headers = lines[headerIdx]
    .split(',')
    .map(c => c.replace(/^"|"$/g, '').trim());

  const rows = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle quoted cells that may contain commas
    const cells = [];
    let inQuote = false;
    let cell    = '';
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === ',' && !inQuote) { cells.push(cell.trim()); cell = ''; continue; }
      cell += ch;
    }
    cells.push(cell.trim());

    const row = {};
    headers.forEach((h, idx) => { row[h] = cells[idx] || ''; });
    rows.push(row);
  }

  return rows;
}

function parseCeilingPrice(raw) {
  if (!raw) return null;
  
  const match = raw.match(/[\d]+\.[\d]+|[\d]+/);
  return match ? parseFloat(match[0]) : null;
}

function parseForm(unitStr) {
  const u = (unitStr || '').toLowerCase();
  if (u.includes('tablet'))  return 'tablet';
  if (u.includes('capsule')) return 'capsule';
  if (u.includes('syrup') || u.includes('ml')) return 'syrup';
  if (u.includes('injection') || u.includes('vial')) return 'injection';
  if (u.includes('cream') || u.includes('ointment')) return 'topical';
  if (u.includes('drop'))    return 'drops';
  return 'other';
}

function cleanName(name) {
  return (name || '')
    .replace(/\s+/g, ' ')
    .replace(/\\n/g, ' ')
    .trim()
    .slice(0, 200);  // DB column limit
}

//  Load ceiling prices into salts table

async function loadCeilingPrices() {
  console.log('\n Loading All Drugs Ceiling Prices.csv...');

  const rows = parseCSV(path.join(__dirname, '../data/All Drugs Ceiling Prices.csv'));
  console.log(`   Found ${rows.length} rows`);

  let inserted = 0, skipped = 0;

  for (const row of rows) {
    const formulation = cleanName(row['Formulation'] || row[' Formulation']);
    const dosage      = cleanName(row['Dosage & Strength'] || row[' Dosage & Strength']);
    const ceilingRaw  = row['Ceiling Price ( Excluding Taxes) (Rs.)(Per Unit)'] ||
                        row[' Ceiling Price ( Excluding Taxes) (Rs.)(Per Unit)'];

    if (!formulation || formulation.length < 2) { skipped++; continue; }

    const saltName     = dosage ? `${formulation} ${dosage}` : formulation;
    const ceilingPrice = parseCeilingPrice(ceilingRaw);

    try {
      await db.query(`
        INSERT INTO salts (salt_name, nppa_ceiling_price)
        VALUES ($1, $2)
        ON CONFLICT (salt_name)
        DO UPDATE SET nppa_ceiling_price = EXCLUDED.nppa_ceiling_price
      `, [saltName.slice(0, 200), ceilingPrice]);
      inserted++;
    } catch (err) {
      skipped++;
    }
  }

  console.log(`    Salts: ${inserted} inserted/updated, ${skipped} skipped`);
}

// Load retail prices into medicines + prices 

async function loadRetailPrices() {
  console.log('\n Loading Retail Price Information.csv...');

  const rows = parseCSV(path.join(__dirname, '../data/Retail Price Information.csv'));
  console.log(`   Found ${rows.length} rows`);

  // Ensure a "NPPA Standard" pharmacy exists — represents govt approved retail
  const pharmaRes = await db.query(`
    INSERT INTO pharmacies (name, type, address)
    VALUES ('NPPA Standard', 'online', 'Government approved retail price')
    ON CONFLICT DO NOTHING
    RETURNING id
  `);

  const pharmaQuery  = await db.query(`SELECT id FROM pharmacies WHERE name = 'NPPA Standard'`);
  const nppaPharmacy = pharmaQuery.rows[0].id;

  // Load all existing salts for matching
  const saltsResult = await db.query(`SELECT id, salt_name FROM salts`);
  const saltMap     = new Map();
  for (const s of saltsResult.rows) {
    saltMap.set(s.salt_name.toLowerCase(), s.id);
  }

  let medInserted = 0, priceInserted = 0, saltCreated = 0, skipped = 0;

  for (const row of rows) {
    const medicineName = cleanName(row['Medicines'] || row[' Medicines']);
    const formulation  = cleanName(row['Formulations'] || row[' Formulations']);
    const company      = cleanName(row['Marketing  Company'] || row[' Marketing  Company'] || row['Marketing Company']);
    const units        = cleanName(row['Units'] || row[' Units']);
    const priceRaw     = row['Retail Prices (Rs.)(Exclusive Local Taxes/GST)'] ||
                         row[' Retail Prices (Rs.)(Exclusive Local Taxes/GST)'];

    if (!medicineName || !priceRaw) { skipped++; continue; }

    const price = parseFloat(String(priceRaw).replace(/[^0-9.]/g, ''));
    if (isNaN(price) || price <= 0) { skipped++; continue; }

    const form      = parseForm(units);
    const brandName = company && company.length > 2 ? company : medicineName;

    try {
      // Try to find matching salt by medicine name
      let saltId = null;
      const medLower = medicineName.toLowerCase();

      // Direct match first
      for (const [key, id] of saltMap) {
        if (key.includes(medLower) || medLower.includes(key.split(' ')[0])) {
          saltId = id;
          break;
        }
      }

      // If no match, create a new salt without ceiling price
      if (!saltId) {
        const saltName = formulation
          ? `${medicineName} (${formulation})`.slice(0, 200)
          : medicineName;

        const newSalt = await db.query(`
          INSERT INTO salts (salt_name)
          VALUES ($1)
          ON CONFLICT (salt_name) DO UPDATE SET salt_name = EXCLUDED.salt_name
          RETURNING id
        `, [saltName]);

        saltId = newSalt.rows[0].id;
        saltMap.set(saltName.toLowerCase(), saltId);
        saltCreated++;
      }

      // Insert medicine
      const medRes = await db.query(`
        INSERT INTO medicines (brand_name, dosage, form, salt_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING
        RETURNING id
      `, [
        brandName.slice(0, 200),
        formulation.slice(0, 100) || units.slice(0, 100),
        form,
        saltId
      ]);

      if (medRes.rows.length > 0) {
        const medId = medRes.rows[0].id;
        medInserted++;

        // Insert price under NPPA Standard pharmacy
        await db.query(`
          INSERT INTO prices (medicine_id, pharmacy_id, price, mrp)
          VALUES ($1, $2, $3, $3)
          ON CONFLICT (medicine_id, pharmacy_id)
          DO UPDATE SET price = EXCLUDED.price, updated_at = NOW()
        `, [medId, nppaPharmacy, price]);

        priceInserted++;
      }

    } catch (err) {
      skipped++;
    }
  }

  console.log(`    Medicines: ${medInserted} inserted`);
  console.log(`    Prices: ${priceInserted} inserted`);
  console.log(`    New salts created: ${saltCreated}`);
  console.log(`     Skipped: ${skipped}`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(' Loading NPPA real data into database...');
  try {
    await loadCeilingPrices();
    await loadRetailPrices();
    console.log('\nDone. Your DB now has real government data.');
  } catch (err) {
    console.error('Fatal error:', err.message);
  } finally {
    process.exit(0);
  }
}

main();