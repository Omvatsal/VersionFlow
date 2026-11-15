'use client';

type ChartItem = { label: string; value: number };

export function HorizontalBars({ items, color, empty }: { items: ChartItem[]; color: string; empty: string }) {
  if (!items.length) return <div className="analytics-chart-empty">{empty}</div>;
  const max = Math.max(...items.map((item) => item.value), 1);
  return <div className="analytics-horizontal-bars" role="img" aria-label="Horizontal bar chart">{items.slice(0, 8).map((item) => <div className="analytics-horizontal-row" key={item.label}><span title={item.label}>{item.label}</span><div><i style={{ width: `${item.value / max * 100}%`, background: color }}/></div><b>{item.value}</b></div>)}</div>;
}

export function VerticalBars({ items, color, empty }: { items: ChartItem[]; color: string; empty: string }) {
  if (!items.length) return <div className="analytics-chart-empty">{empty}</div>;
  const max = Math.max(...items.map((item) => item.value), 1);
  return <div className="analytics-vertical-bars" role="img" aria-label="Vertical bar chart">{items.slice(0, 8).map((item) => <div className="analytics-vertical-column" key={item.label}><b>{item.value}</b><div className="analytics-vertical-track"><i style={{ height: `${item.value / max * 100}%`, background: color }}/></div><span title={item.label}>{item.label}</span></div>)}</div>;
}
