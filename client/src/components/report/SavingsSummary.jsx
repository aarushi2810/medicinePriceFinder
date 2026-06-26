function formatPrice(value) {
  return `₹${Number(value || 0).toFixed(2)}`;
}

export default function SavingsSummary({ summary }) {
  const cards = [
    { label: 'Current total', value: formatPrice(summary?.currentTotal) },
    { label: 'Cheapest total', value: formatPrice(summary?.cheapestTotal), color: '#1D9E75' },
    { label: 'Money saved', value: formatPrice(summary?.totalSavings), color: '#1D9E75' },
    { label: 'Percentage saved', value: `${Number(summary?.savingsPercentage || 0).toFixed(1)}%` },
  ];

  return (
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 1, border: '1px solid #eee', borderRadius: 8, overflow: 'hidden', background: '#eee' }}>
      {cards.map(card => (
        <div key={card.label} style={{ background: '#fff', padding: 18 }}>
          <div style={{ fontSize: 22, fontWeight: 750, color: card.color || '#111' }}>{card.value}</div>
          <div style={{ fontSize: 12, color: '#777', marginTop: 4 }}>{card.label}</div>
        </div>
      ))}
    </section>
  );
}
