process.env.NODE_ENV = 'test';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildMedicineRows,
  buildPharmacyTotals,
} = require('./reportService');

test('buildPharmacyTotals excludes unavailable medicines from totals', () => {
  const medicines = [
    {
      medicine: { id: 1 },
      prices: [
        { pharmacy_name: '1mg', price: 10, in_stock: true },
        { pharmacy_name: 'Netmeds', price: 12, in_stock: true },
      ],
    },
    {
      medicine: { id: 2 },
      prices: [
        { pharmacy_name: '1mg', price: 20, in_stock: false },
        { pharmacy_name: 'Netmeds', price: 18, in_stock: true },
      ],
    },
  ];

  const totals = buildPharmacyTotals(medicines, ['1mg', 'Netmeds']);

  assert.deepEqual(totals[0], {
    name: '1mg',
    total: 10,
    availableCount: 1,
    unavailableCount: 1,
    unavailableMedicineIds: [2],
    complete: false,
  });
  assert.equal(totals[1].total, 30);
  assert.equal(totals[1].complete, true);
});

test('buildMedicineRows calculates generic savings and NPPA violations', () => {
  const rows = buildMedicineRows([
    {
      medicine: {
        id: 1,
        brand_name: 'Brand A (Acme)',
        dosage: '500mg',
        salt_name: 'Salt A',
      },
      prices: [
        { pharmacy_name: '1mg', price: 10, in_stock: true },
        { pharmacy_name: 'Netmeds', price: 16, in_stock: true },
      ],
      summary: { nppa_ceiling: 8 },
    },
  ], new Map([
    [1, [{ id: 2, brand_name: 'Generic A', lowest_price: '6.00' }]],
  ]));

  assert.equal(rows[0].manufacturer, 'Acme');
  assert.equal(rows[0].selectedPharmacy, '1mg');
  assert.equal(rows[0].perMedicineSavings, 6);
  assert.equal(rows[0].genericSavings, 4);
  assert.equal(rows[0].nppaStatus, 'Above ceiling');
  assert.equal(rows[0].nppaDifference, 2);
});
