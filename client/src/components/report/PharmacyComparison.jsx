function formatPrice(value) {
  return `₹${Number(value || 0).toFixed(2)}`;
}

export default function PharmacyComparison({ pharmacies }) {
  return (
    <section style={{ border: '1px solid #eee', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #eee', fontWeight: 700 }}>Pharmacy comparison</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead style={{ background: '#fafafa', color: '#777' }}>
            <tr>
              <th style={th}>Pharmacy</th>
              <th style={th}>Total cost</th>
              <th style={th}>Availability</th>
              <th style={th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {(pharmacies || []).map(row => (
              <tr key={row.name} style={{ borderTop: '1px solid #f3f3f3' }}>
                <td style={td}>{row.name}</td>
                <td style={td}>{formatPrice(row.total)}</td>
                <td style={td}>{row.availableCount} available · {row.unavailableCount} unavailable</td>
                <td style={td}>
                  {row.winner ? <Badge text="Winner" color="#085041" bg="#E1F5EE" /> : row.complete ? <Badge text="Complete" /> : <Badge text="Partial" color="#92400e" bg="#fffbeb" />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Badge({ text, color = '#555', bg = '#f4f4f4' }) {
  return <span style={{ color, background: bg, padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{text}</span>;
}

const th = { textAlign: 'left', padding: '10px 16px', fontWeight: 650 };
const td = { padding: '12px 16px', verticalAlign: 'top' };
