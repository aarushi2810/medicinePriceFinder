import { useEffect, useRef } from 'react';

let chartLoader;

function loadChartJs() {
  if (window.Chart) return Promise.resolve(window.Chart);
  if (chartLoader) return chartLoader;

  chartLoader = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js';
    script.async = true;
    script.onload = () => resolve(window.Chart);
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return chartLoader;
}

function drawFallback(canvas, labels, values) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  const max = Math.max(...values, 1);
  const barWidth = Math.max(18, (width - 60) / values.length - 12);
  values.forEach((value, index) => {
    const x = 40 + index * (barWidth + 12);
    const barHeight = (height - 70) * (value / max);
    ctx.fillStyle = '#1D9E75';
    ctx.fillRect(x, height - 35 - barHeight, barWidth, barHeight);
    ctx.fillStyle = '#666';
    ctx.font = '11px system-ui';
    ctx.fillText(labels[index].slice(0, 8), x, height - 14);
  });
}

export default function SavingsChart({ title, labels, values, type = 'bar' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    let chart;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    loadChartJs()
      .then(Chart => {
        chart = new Chart(canvas, {
          type,
          data: {
            labels,
            datasets: [{
              label: title,
              data: values,
              backgroundColor: ['#1D9E75', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6'],
              borderRadius: 4,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: type === 'bar' ? { y: { beginAtZero: true } } : undefined,
          },
        });
      })
      .catch(() => {
        canvas.width = canvas.clientWidth || 420;
        canvas.height = 240;
        drawFallback(canvas, labels, values);
      });

    return () => {
      if (chart) chart.destroy();
    };
  }, [labels, title, type, values]);

  return (
    <section style={{ border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
      <h2 style={{ fontSize: 16, margin: '0 0 14px' }}>{title}</h2>
      <div style={{ height: 260 }}>
        <canvas ref={canvasRef} />
      </div>
    </section>
  );
}
