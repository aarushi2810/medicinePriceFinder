function formatPrice(value) {
  return value == null ? '—' : `₹${Number(value).toFixed(2)}`;
}

export default function NPPASection({ medicines, summary }) {
  const violations = (medicines || []).filter(row => row.nppaStatus === 'Above ceiling');

  return (
    <section style={{ border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 16, margin: 0 }}>NPPA analysis</h2>
        <span style={{
          padding: '4px 10px',
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 700,
          color: violations.length ? '#A32D2D' : '#085041',
          background: violations.length ? '#fde8e8' : '#E1F5EE',
        }}>
          {summary?.nppaViolationCount || 0} above ceiling
        </span>
      </div>

      {violations.length === 0 ? (
        <p style={{ color: '#666', fontSize: 13, margin: 0 }}>No selected cheapest prices exceed the NPPA ceiling.</p>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {violations.map(row => (
            <div key={row.medicine.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13, padding: '8px 0', borderTop: '1px solid #f3f3f3' }}>
              <span>{row.medicine.brand_name}</span>
              <span style={{ color: '#A32D2D' }}>{formatPrice(row.selectedPrice)} vs ceiling {formatPrice(row.nppaCeiling)} · +{formatPrice(row.nppaDifference)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
