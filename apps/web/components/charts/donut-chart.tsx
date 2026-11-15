'use client';

const lifecycleColors: Record<string, string> = {
  draft: '#7186a8',
  active: '#81bf91',
  published: '#81bf91',
  deprecated: '#e5aa5d',
  sunset: '#e56f5d',
};

function colorFor(label: string) {
  return lifecycleColors[label.toLowerCase()] || '#9b9b9b';
}

export function DonutChart({ items }: { items: Array<{ label: string; value: number }> }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  let cursor = 0;
  const gradient = items.map((item) => {
    const start = cursor;
    cursor += total ? item.value / total * 100 : 0;
    return `${colorFor(item.label)} ${start}% ${cursor}%`;
  }).join(', ');

  return <div className="donut-layout"><div className="donut" style={{ background: total ? `conic-gradient(${gradient})` : '#252525' }}><span>{total}</span></div><div className="chart-legend">{items.map((item) => <span key={item.label}><i style={{ background: colorFor(item.label) }} />{item.label}<b>{item.value}</b></span>)}</div></div>;
}
