'use client';

import { lifecycleColors } from './chart-colors';

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

  return <div className="donut-layout"><div className="donut" role="img" aria-label={`Status distribution: ${items.map((item) => `${item.label} ${item.value}`).join(', ')}`} data-tooltip={items.map((item) => `${item.label}: ${item.value}`).join(' · ')} style={{ background: total ? `conic-gradient(${gradient})` : '#252525' }}><span>{total}</span></div><div className="chart-legend">{items.map((item) => <span key={item.label} title={`${item.label}: ${item.value}`} data-tooltip={`${item.label}: ${item.value}`}><i style={{ background: colorFor(item.label), color: colorFor(item.label) }} />{item.label}<b>{item.value}</b></span>)}</div></div>;
}
