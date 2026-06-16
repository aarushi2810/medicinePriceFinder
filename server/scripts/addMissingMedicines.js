const db = require('../db');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const MISSING_MEDICINES = [
  // Baseline medicines (original list)
  { brand: 'Crocin', salt: 'Paracetamol 500mg', dosage: '500mg', form: 'tablet', ceiling: 2.30 },
  { brand: 'Calpol', salt: 'Paracetamol 500mg', dosage: '500mg', form: 'tablet', ceiling: 2.30 },
  { brand: 'Dolo', salt: 'Paracetamol 500mg', dosage: '500mg', form: 'tablet', ceiling: 2.30 },
  { brand: 'Dolo 650', salt: 'Paracetamol 650mg', dosage: '650mg', form: 'tablet', ceiling: 2.80 },
  { brand: 'Crocin 650', salt: 'Paracetamol 650mg', dosage: '650mg', form: 'tablet', ceiling: 2.80 },
  { brand: 'Mox', salt: 'Amoxicillin 500mg', dosage: '500mg', form: 'capsule', ceiling: 18.50 },
  { brand: 'Novamox', salt: 'Amoxicillin 500mg', dosage: '500mg', form: 'capsule', ceiling: 18.50 },
  { brand: 'Azithral', salt: 'Azithromycin 500mg', dosage: '500mg', form: 'tablet', ceiling: 32.00 },
  { brand: 'Zithromax', salt: 'Azithromycin 500mg', dosage: '500mg', form: 'tablet', ceiling: 32.00 },
  { brand: 'Cifran', salt: 'Ciprofloxacin 500mg', dosage: '500mg', form: 'tablet', ceiling: 15.20 },
  { brand: 'Ciplox', salt: 'Ciprofloxacin 500mg', dosage: '500mg', form: 'tablet', ceiling: 15.20 },
  { brand: 'Glycomet', salt: 'Metformin 500mg', dosage: '500mg', form: 'tablet', ceiling: 3.20 },
  { brand: 'Glucophage', salt: 'Metformin 500mg', dosage: '500mg', form: 'tablet', ceiling: 3.20 },
  { brand: 'Atorva', salt: 'Atorvastatin 10mg', dosage: '10mg', form: 'tablet', ceiling: 8.75 },
  { brand: 'Lipitor', salt: 'Atorvastatin 10mg', dosage: '10mg', form: 'tablet', ceiling: 8.75 },
  { brand: 'Amlip', salt: 'Amlodipine 5mg', dosage: '5mg', form: 'tablet', ceiling: 3.50 },
  { brand: 'Norvasc', salt: 'Amlodipine 5mg', dosage: '5mg', form: 'tablet', ceiling: 3.50 },
  { brand: 'Omez', salt: 'Omeprazole 20mg', dosage: '20mg', form: 'capsule', ceiling: 4.50 },
  { brand: 'Pan 40', salt: 'Pantoprazole 40mg', dosage: '40mg', form: 'tablet', ceiling: 6.80 },
  { brand: 'Pantodac', salt: 'Pantoprazole 40mg', dosage: '40mg', form: 'tablet', ceiling: 6.80 },
  { brand: 'Cetzine', salt: 'Cetirizine 10mg', dosage: '10mg', form: 'tablet', ceiling: 2.10 },
  { brand: 'Zyrtec', salt: 'Cetirizine 10mg', dosage: '10mg', form: 'tablet', ceiling: 2.10 },
  { brand: 'Brufen', salt: 'Ibuprofen 400mg', dosage: '400mg', form: 'tablet', ceiling: 3.80 },
  { brand: 'Combiflam', salt: 'Ibuprofen 400mg', dosage: '400mg', form: 'tablet', ceiling: 3.80 },
  { brand: 'Ecosprin', salt: 'Aspirin 75mg', dosage: '75mg', form: 'tablet', ceiling: 1.80 },
  { brand: 'Disprin', salt: 'Aspirin 75mg', dosage: '75mg', form: 'tablet', ceiling: 1.80 },

  // New medicines list
  { brand: 'Januvia', salt: 'Sitagliptin 100mg', dosage: '100mg', form: 'tablet', ceiling: 38.50 },
  { brand: 'Rosuvas', salt: 'Rosuvastatin 10mg', dosage: '10mg', form: 'tablet', ceiling: 12.50 },
  { brand: 'Telma', salt: 'Telmisartan 40mg', dosage: '40mg', form: 'tablet', ceiling: 7.20 },
  { brand: 'Razo', salt: 'Rabeprazole 20mg', dosage: '20mg', form: 'tablet', ceiling: 9.80 },
  { brand: 'Allegra', salt: 'Fexofenadine 120mg', dosage: '120mg', form: 'tablet', ceiling: 11.20 },
  { brand: 'Voveran', salt: 'Diclofenac 50mg', dosage: '50mg', form: 'tablet', ceiling: 3.50 },
  { brand: 'Thyronorm', salt: 'Thyroxine 50mcg', dosage: '50mcg', form: 'tablet', ceiling: 1.80 },
  { brand: 'Eltroxin', salt: 'Thyroxine 50mcg', dosage: '50mcg', form: 'tablet', ceiling: 1.80 },
  { brand: 'Shelcal', salt: 'Calcium + Vitamin D3 500mg', dosage: '500mg', form: 'tablet', ceiling: 8.50 },
  { brand: 'Calcirol', salt: 'Cholecalciferol 60000IU', dosage: '60000IU', form: 'capsule', ceiling: 28.00 },
  { brand: 'Becosules', salt: 'Vitamin B Complex', dosage: 'B-Complex', form: 'capsule', ceiling: 2.50 },
  { brand: 'Asthalin', salt: 'Salbutamol 2mg', dosage: '2mg', form: 'tablet', ceiling: 0.80 },
  { brand: 'Deriphyllin', salt: 'Etofyline + Theophylline 150mg', dosage: '150mg', form: 'tablet', ceiling: 2.10 },
  { brand: 'Lonazep', salt: 'Clonazepam 0.5mg', dosage: '0.5mg', form: 'tablet', ceiling: 2.80 },
  { brand: 'Betnovate', salt: 'Betamethasone 0.1%', dosage: '0.1%', form: 'topical', ceiling: 15.50 },
  { brand: 'Soframycin', salt: 'Framycetin 1%', dosage: '1%', form: 'topical', ceiling: 12.00 },
  { brand: 'Genteal', salt: 'Carboxymethylcellulose 0.3%', dosage: '0.3%', form: 'drops', ceiling: 95.00 },
  { brand: 'Fluconaz', salt: 'Fluconazole 150mg', dosage: '150mg', form: 'tablet', ceiling: 25.00 },
  { brand: 'Feronia-XT', salt: 'Ferrous Ascorbate + Folic Acid', dosage: '100mg', form: 'tablet', ceiling: 12.50 },
  { brand: 'Benadryl', salt: 'Diphenhydramine 100ml', dosage: '100ml', form: 'syrup', ceiling: 85.00 },
  { brand: 'Ascoril LS', salt: 'Levosalbutamol + Ambroxol + Guaiphenesin', dosage: '100ml', form: 'syrup', ceiling: 98.00 },
  { brand: 'Sucrafil', salt: 'Sucralfate 200ml', dosage: '200ml', form: 'syrup', ceiling: 185.00 },
  { brand: 'Emeset', salt: 'Ondansetron 4mg', dosage: '4mg', form: 'tablet', ceiling: 5.50 },
  { brand: 'Zyloric', salt: 'Allopurinol 100mg', dosage: '100mg', form: 'tablet', ceiling: 2.80 },
  { brand: 'Candid', salt: 'Clotrimazole 1%', dosage: '1%', form: 'topical', ceiling: 75.00 },
  { brand: 'Clobetasol', salt: 'Clobetasol 0.05%', dosage: '0.05%', form: 'topical', ceiling: 45.00 },
  { brand: 'Ketoconazole', salt: 'Ketoconazole 200mg', dosage: '200mg', form: 'tablet', ceiling: 15.00 },
  { brand: 'Nexito', salt: 'Escitalopram 10mg', dosage: '10mg', form: 'tablet', ceiling: 9.50 },
  { brand: 'Oleanz', salt: 'Olanzapine 5mg', dosage: '5mg', form: 'tablet', ceiling: 6.80 },
  { brand: 'Librium', salt: 'Chlordiazepoxide 10mg', dosage: '10mg', form: 'tablet', ceiling: 4.50 },
  { brand: 'Calpol Syrup', salt: 'Paracetamol 120mg/5ml', dosage: '120mg/5ml', form: 'syrup', ceiling: 25.00 },
  { brand: 'Meftal-P', salt: 'Mefenamic Acid 50mg', dosage: '50mg', form: 'tablet', ceiling: 3.20 },
  { brand: 'Ondem', salt: 'Ondansetron 4mg', dosage: '4mg', form: 'tablet', ceiling: 5.50 },
  { brand: 'Mifeprin', salt: 'Mifepristone 200mg', dosage: '200mg', form: 'tablet', ceiling: 320.00 },
  { brand: 'Regestrone', salt: 'Norethisterone 5mg', dosage: '5mg', form: 'tablet', ceiling: 5.80 },
  { brand: 'Duphaston', salt: 'Dydrogesterone 10mg', dosage: '10mg', form: 'tablet', ceiling: 55.00 },
  { brand: 'Concor', salt: 'Bisoprolol 5mg', dosage: '5mg', form: 'tablet', ceiling: 6.50 },
  { brand: 'Stamlo', salt: 'Amlodipine 5mg', dosage: '5mg', form: 'tablet', ceiling: 3.50 },
  { brand: 'Repace', salt: 'Losartan 50mg', dosage: '50mg', form: 'tablet', ceiling: 7.80 },
  { brand: 'Cardace', salt: 'Ramipril 5mg', dosage: '5mg', form: 'tablet', ceiling: 6.20 },
  { brand: 'Amaryl', salt: 'Glimepiride 2mg', dosage: '2mg', form: 'tablet', ceiling: 7.50 },
  { brand: 'Galvus', salt: 'Vildagliptin 50mg', dosage: '50mg', form: 'tablet', ceiling: 22.00 },
  { brand: 'Trajenta', salt: 'Linagliptin 5mg', dosage: '5mg', form: 'tablet', ceiling: 35.00 },
  { brand: 'Augmentin', salt: 'Amoxicillin + Clavulanic Acid 625mg', dosage: '625mg', form: 'tablet', ceiling: 20.50 },
  { brand: 'Taxim-O', salt: 'Cefixime 200mg', dosage: '200mg', form: 'tablet', ceiling: 12.80 },
  { brand: 'Monocef', salt: 'Ceftriaxone 1g', dosage: '1g', form: 'injection', ceiling: 65.00 },
  { brand: 'Limcee', salt: 'Vitamin C 500mg', dosage: '500mg', form: 'tablet', ceiling: 1.80 },
  { brand: 'Neurobion Forte', salt: 'Vitamin B Complex + Vitamin B12', dosage: 'Forte', form: 'tablet', ceiling: 2.20 },
  { brand: 'Supradyn', salt: 'Multivitamin + Minerals', dosage: 'Daily', form: 'tablet', ceiling: 3.50 },
  { brand: 'Librax', salt: 'Chlordiazepoxide + Clidinium', dosage: '5mg/2.5mg', form: 'tablet', ceiling: 6.00 },
  { brand: 'Colimex', salt: 'Dicyclomine + Paracetamol', dosage: '20mg/325mg', form: 'tablet', ceiling: 4.80 },
  { brand: 'Cremaffin', salt: 'Liquid Paraffin + Milk of Magnesia', dosage: '225ml', form: 'syrup', ceiling: 145.00 },
  { brand: 'Foracort', salt: 'Budesonide + Formoterol', dosage: '200mcg', form: 'other', ceiling: 380.00 },
  { brand: 'Montair', salt: 'Montelukast 10mg', dosage: '10mg', form: 'tablet', ceiling: 14.50 },
  { brand: 'Seroflo', salt: 'Salmeterol + Fluticasone', dosage: '250mcg', form: 'other', ceiling: 480.00 },
  { brand: 'Zerodol-P', salt: 'Aceclofenac + Paracetamol', dosage: '100mg/325mg', form: 'tablet', ceiling: 6.20 },
  { brand: 'Hifenac', salt: 'Aceclofenac 100mg', dosage: '100mg', form: 'tablet', ceiling: 4.50 },
  { brand: 'Flexon', salt: 'Ibuprofen + Paracetamol', dosage: '400mg/325mg', form: 'tablet', ceiling: 3.50 },

  // ── New batch: Antihypertensive ──
  { brand: 'Telma-H', salt: 'Telmisartan + Hydrochlorothiazide 40mg/12.5mg', dosage: '40mg/12.5mg', form: 'tablet', ceiling: 9.80 },
  { brand: 'Losar', salt: 'Losartan 50mg', dosage: '50mg', form: 'tablet', ceiling: 7.80 },
  { brand: 'Envas', salt: 'Enalapril 5mg', dosage: '5mg', form: 'tablet', ceiling: 4.20 },
  { brand: 'Olmezest', salt: 'Olmesartan 20mg', dosage: '20mg', form: 'tablet', ceiling: 12.50 },
  { brand: 'Dytor', salt: 'Torsemide 10mg', dosage: '10mg', form: 'tablet', ceiling: 5.80 },
  { brand: 'Minipress XL', salt: 'Prazosin 5mg', dosage: '5mg', form: 'tablet', ceiling: 8.50 },

  // ── New batch: Diabetes ──
  { brand: 'Glimisave', salt: 'Glimepiride 2mg', dosage: '2mg', form: 'tablet', ceiling: 7.50 },
  { brand: 'Pioz', salt: 'Pioglitazone 15mg', dosage: '15mg', form: 'tablet', ceiling: 6.80 },
  { brand: 'Forxiga', salt: 'Dapagliflozin 10mg', dosage: '10mg', form: 'tablet', ceiling: 45.00 },
  { brand: 'Jardiance', salt: 'Empagliflozin 25mg', dosage: '25mg', form: 'tablet', ceiling: 48.00 },
  { brand: 'Lantus', salt: 'Insulin Glargine 100IU/ml', dosage: '100IU/ml', form: 'injection', ceiling: 820.00 },
  { brand: 'Volix', salt: 'Voglibose 0.3mg', dosage: '0.3mg', form: 'tablet', ceiling: 8.50 },

  // ── New batch: Gastric / Liver ──
  { brand: 'Domstal', salt: 'Domperidone 10mg', dosage: '10mg', form: 'tablet', ceiling: 2.80 },
  { brand: 'Rabesec', salt: 'Rabeprazole 20mg', dosage: '20mg', form: 'capsule', ceiling: 9.80 },
  { brand: 'Udiliv', salt: 'Ursodeoxycholic Acid 300mg', dosage: '300mg', form: 'tablet', ceiling: 18.50 },
  { brand: 'Vomikind', salt: 'Ondansetron 4mg', dosage: '4mg', form: 'tablet', ceiling: 5.50 },

  // ── New batch: Neuro / Pain ──
  { brand: 'Pregabalin', salt: 'Pregabalin 75mg', dosage: '75mg', form: 'capsule', ceiling: 12.50 },
  { brand: 'Gabantin', salt: 'Gabapentin 300mg', dosage: '300mg', form: 'capsule', ceiling: 8.50 },
  { brand: 'Ultracet', salt: 'Tramadol + Paracetamol 37.5mg/325mg', dosage: '37.5mg/325mg', form: 'tablet', ceiling: 6.80 },
  { brand: 'Tryptomer', salt: 'Amitriptyline 25mg', dosage: '25mg', form: 'tablet', ceiling: 3.20 },

  // ── New batch: Cardiac ──
  { brand: 'Clopitab', salt: 'Clopidogrel 75mg', dosage: '75mg', form: 'tablet', ceiling: 8.50 },
  { brand: 'Ecosprin AV', salt: 'Aspirin + Atorvastatin 75mg/10mg', dosage: '75mg/10mg', form: 'capsule', ceiling: 12.80 },
  { brand: 'Betaloc', salt: 'Metoprolol 50mg', dosage: '50mg', form: 'tablet', ceiling: 5.50 },
  { brand: 'Dilzem', salt: 'Diltiazem 30mg', dosage: '30mg', form: 'tablet', ceiling: 4.80 },

  // ── New batch: Antibiotics ──
  { brand: 'Levoflox', salt: 'Levofloxacin 500mg', dosage: '500mg', form: 'tablet', ceiling: 12.50 },
  { brand: 'Furadantin', salt: 'Nitrofurantoin 100mg', dosage: '100mg', form: 'capsule', ceiling: 6.80 },
  { brand: 'Doxt-SL', salt: 'Doxycycline 100mg', dosage: '100mg', form: 'capsule', ceiling: 8.50 },
  { brand: 'Metrogyl', salt: 'Metronidazole 400mg', dosage: '400mg', form: 'tablet', ceiling: 3.80 },

  // ── New batch: Vitamins / Supplements ──
  { brand: 'Folvite', salt: 'Folic Acid 5mg', dosage: '5mg', form: 'tablet', ceiling: 0.80 },
  { brand: 'Methycobal', salt: 'Methylcobalamin 500mcg', dosage: '500mcg', form: 'tablet', ceiling: 5.50 },
  { brand: 'CCM', salt: 'Calcium Citrate Malate + D3', dosage: '500mg', form: 'tablet', ceiling: 12.00 },
  { brand: 'Zincovit', salt: 'Multivitamin + Zinc', dosage: '', form: 'tablet', ceiling: 8.50 },

  // ── New batch: Skin / Allergy ──
  { brand: 'Montair LC', salt: 'Montelukast + Levocetirizine', dosage: '10mg/5mg', form: 'tablet', ceiling: 12.50 },
  { brand: 'Levocet', salt: 'Levocetirizine 5mg', dosage: '5mg', form: 'tablet', ceiling: 3.20 },
  { brand: 'HCQS', salt: 'Hydroxychloroquine 200mg', dosage: '200mg', form: 'tablet', ceiling: 6.50 },
  { brand: 'Wysolone', salt: 'Prednisolone 10mg', dosage: '10mg', form: 'tablet', ceiling: 4.80 },

  // ── New batch: Women's Health ──
  { brand: 'Susten', salt: 'Progesterone 200mg', dosage: '200mg', form: 'capsule', ceiling: 25.00 },
  { brand: 'Premarin', salt: 'Conjugated Estrogen 0.625mg', dosage: '0.625mg', form: 'tablet', ceiling: 12.50 },
  { brand: 'Letoval', salt: 'Letrozole 2.5mg', dosage: '2.5mg', form: 'tablet', ceiling: 15.00 }
];

async function main() {
  console.log('Inserting missing salts and medicines...');
  let saltsAdded = 0;
  let medsAdded = 0;

  for (const item of MISSING_MEDICINES) {
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
