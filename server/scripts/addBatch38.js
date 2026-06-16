const db = require('../db');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const BATCH_38 = [
  { brand: 'Glyciphage', salt: 'Metformin 500mg', dosage: '500mg', form: 'tablet', ceiling: 3.20 },
  { brand: 'Obimet', salt: 'Metformin 500mg', dosage: '500mg', form: 'tablet', ceiling: 3.20 },
  { brand: 'Gluformin', salt: 'Metformin 500mg', dosage: '500mg', form: 'tablet', ceiling: 3.20 },
  { brand: 'Jalra', salt: 'Vildagliptin 50mg', dosage: '50mg', form: 'tablet', ceiling: 22.00 },
  { brand: 'Ziten', salt: 'Teneligliptin 20mg', dosage: '20mg', form: 'tablet', ceiling: 15.00 },
  { brand: 'Glizid', salt: 'Gliclazide 80mg', dosage: '80mg', form: 'tablet', ceiling: 4.80 },
  { brand: 'Amlong', salt: 'Amlodipine 5mg', dosage: '5mg', form: 'tablet', ceiling: 3.50 },
  { brand: 'Cilacar', salt: 'Cilnidipine 10mg', dosage: '10mg', form: 'tablet', ceiling: 8.50 },
  { brand: 'Arkamin', salt: 'Clonidine 0.1mg', dosage: '0.1mg', form: 'tablet', ceiling: 1.50 },
  { brand: 'Prazopress', salt: 'Prazosin 5mg', dosage: '5mg', form: 'tablet', ceiling: 8.50 },
  { brand: 'Inderal', salt: 'Propranolol 40mg', dosage: '40mg', form: 'tablet', ceiling: 4.20 },
  { brand: 'Telmikind', salt: 'Telmisartan 40mg', dosage: '40mg', form: 'tablet', ceiling: 7.20 },
  { brand: 'Saridon', salt: 'Paracetamol + Propyphenazone + Caffeine', dosage: '250mg', form: 'tablet', ceiling: 3.00 },
  { brand: 'Crocin Advance', salt: 'Paracetamol 500mg', dosage: '500mg', form: 'tablet', ceiling: 2.30 },
  { brand: 'Nicip', salt: 'Nimesulide 100mg', dosage: '100mg', form: 'tablet', ceiling: 3.50 },
  { brand: 'Nise', salt: 'Nimesulide 100mg', dosage: '100mg', form: 'tablet', ceiling: 3.50 },
  { brand: 'Sumo', salt: 'Nimesulide + Paracetamol', dosage: '500mg', form: 'tablet', ceiling: 4.20 },
  { brand: 'Flexura D', salt: 'Metaxalone + Diclofenac', dosage: '250mg', form: 'tablet', ceiling: 15.00 },
  { brand: 'Naprosyn', salt: 'Naproxen 500mg', dosage: '500mg', form: 'tablet', ceiling: 6.80 },
  { brand: 'Norflox', salt: 'Norfloxacin 400mg', dosage: '400mg', form: 'tablet', ceiling: 4.50 },
  { brand: 'Oflomac', salt: 'Ofloxacin 200mg', dosage: '200mg', form: 'tablet', ceiling: 5.20 },
  { brand: 'Dalacin', salt: 'Clindamycin 300mg', dosage: '300mg', form: 'capsule', ceiling: 28.00 },
  { brand: 'Zinnat', salt: 'Cefuroxime 250mg', dosage: '250mg', form: 'tablet', ceiling: 32.00 },
  { brand: 'Nexpro', salt: 'Esomeprazole 40mg', dosage: '40mg', form: 'tablet', ceiling: 11.50 },
  { brand: 'Zinetac', salt: 'Ranitidine 150mg', dosage: '150mg', form: 'tablet', ceiling: 1.50 },
  { brand: 'Gelusil', salt: 'Aluminium Hydroxide + Magnesium Hydroxide + Simethicone', dosage: '15ml', form: 'syrup', ceiling: 12.00 },
  { brand: 'Mucaine', salt: 'Oxetacaine + Aluminium Hydroxide + Magnesium Hydroxide', dosage: '200ml', form: 'syrup', ceiling: 115.00 },
  { brand: 'Cipralex', salt: 'Escitalopram 20mg', dosage: '20mg', form: 'tablet', ceiling: 18.00 },
  { brand: 'Ativan', salt: 'Lorazepam 2mg', dosage: '2mg', form: 'tablet', ceiling: 2.50 },
  { brand: 'Restyl', salt: 'Alprazolam 0.5mg', dosage: '0.5mg', form: 'tablet', ceiling: 2.20 },
  { brand: 'Fludac', salt: 'Fluoxetine 20mg', dosage: '20mg', form: 'capsule', ceiling: 4.80 },
  { brand: 'Otrivin', salt: 'Xylometazoline 0.1%', dosage: '0.1%', form: 'drops', ceiling: 72.00 },
  { brand: 'Candid-B', salt: 'Clotrimazole + Beclomethasone', dosage: '1%', form: 'topical', ceiling: 82.00 },
  { brand: 'Panderm', salt: 'Clobetasol + Neomycin + Miconazole', dosage: '15g', form: 'topical', ceiling: 95.00 },
  { brand: 'Mintop', salt: 'Minoxidil 5%', dosage: '5%', form: 'topical', ceiling: 485.00 },
  { brand: 'Volini Gel', salt: 'Diclofenac + Methyl Salicylate + Menthol', dosage: '30g', form: 'topical', ceiling: 92.00 },
  { brand: 'Moov', salt: 'Wintergreen Oil + Pudina Satva + Eucalyptus Oil', dosage: '50g', form: 'topical', ceiling: 88.00 },
  { brand: 'Ibugesic Plus', salt: 'Ibuprofen + Paracetamol 400mg', dosage: '400mg', form: 'tablet', ceiling: 3.50 }
];

async function main() {
  console.log('Inserting batch of 38 missing medicines and salts...');
  let saltsAdded = 0;
  let medsAdded = 0;

  for (const item of BATCH_38) {
    // 1. Get or create salt
    let saltId;
    const saltRes = await db.query('SELECT id FROM salts WHERE LOWER(salt_name) = LOWER($1)', [item.salt]);
    if (saltRes.rows.length) {
      saltId = saltRes.rows[0].id;
    } else {
      const insSalt = await db.query(
        'INSERT INTO salts (salt_name, nppa_ceiling_price) VALUES ($1, $2) RETURNING id',
        [item.salt, item.ceiling]
      );
      saltId = insSalt.rows[0].id;
      saltsAdded++;
    }

    // 2. Create medicine if not exists
    const medRes = await db.query('SELECT id FROM medicines WHERE LOWER(brand_name) = LOWER($1)', [item.brand]);
    if (!medRes.rows.length) {
      await db.query(
        'INSERT INTO medicines (brand_name, dosage, form, salt_id) VALUES ($1, $2, $3, $4)',
        [item.brand, item.dosage, item.form, saltId]
      );
      medsAdded++;
    }
  }

  console.log(`Finished: ${saltsAdded} salts and ${medsAdded} medicines added successfully.`);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
