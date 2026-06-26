function formatPrice(value) {
  return value == null ? '—' : `₹${Number(value).toFixed(2)}`;
}

export default function MedicineSavingsTable({ medicines }) {
  return (
    <section style={{ border: '1px solid #eee', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #eee', fontWeight: 700 }}>Medicine savings</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead style={{ background: '#fafafa', color: '#777' }}>
            <tr>
              <th style={th}>Medicine</th>
              <th style={th}>Selected pharmacy</th>
              <th style={th}>Price</th>
              <th style={th}>Generic</th>
              <th style={th}>Generic price</th>
              <th style={th}>Savings</th>
              <th style={th}>NPPA status</th>
            </tr>
          </thead>
          <tbody>
            {(medicines || []).map(row => (
              <tr key={row.medicine.id} style={{ borderTop: '1px solid #f3f3f3' }}>
                <td style={td}>
                  <div style={{ fontWeight: 700, color: '#111' }}>{row.medicine.brand_name}</div>
                  <div style={{ color: '#888', fontSize: 12 }}>{row.salt} {row.strength || ''}</div>
                </td>
                <td style={td}>{row.selectedPharmacy || 'Unavailable'}</td>
                <td style={td}>{formatPrice(row.selectedPrice)}</td>
                <td style={td}>{row.generic?.brand_name || '—'}</td>
                <td style={td}>{formatPrice(row.genericPrice)}</td>
                <td style={{ ...td, color: '#1D9E75', fontWeight: 700 }}>{formatPrice(row.genericSavings || row.perMedicineSavings)}</td>
                <td style={td}>
                  <span style={{
                    color: row.nppaStatus === 'Above ceiling' ? '#A32D2D' : '#085041',
                    background: row.nppaStatus === 'Above ceiling' ? '#fde8e8' : '#E1F5EE',
                    padding: '3px 8px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                  }}>
                    {row.nppaStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const th = { textAlign: 'left', padding: '10px 16px', fontWeight: 650 };
const td = { padding: '12px 16px', verticalAlign: 'top' };
