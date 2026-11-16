'use client';
import { chartColors } from './chart-colors';

type ChartItem = { label: string; value: number };
const fallbackPalette = [chartColors.blue, chartColors.violet, chartColors.emerald, chartColors.amber, chartColors.rose, chartColors.orange, chartColors.slate, '#b8a0df'];

export function HorizontalBars({ items, color, empty }: { items: ChartItem[]; color: string; empty: string }) {
  if (!items.length) return <div className="analytics-chart-empty">{empty}</div>;
  const max = Math.max(...items.map((item) => item.value), 1);
  return <div className="analytics-horizontal-bars" role="img" aria-label="Horizontal bar chart">{items.slice(0, 8).map((item) => <div className="analytics-horizontal-row" key={item.label} title={`${item.label}: ${item.value}`} data-tooltip={`${item.label}: ${item.value}`}><span title={item.label}>{item.label}</span><div><i style={{ width: `${item.value / max * 100}%`, color, background: color }}/></div><b>{item.value}</b></div>)}</div>;
}

export function VerticalBars({ items, color, colors, empty, glow = true }: { items: ChartItem[]; color: string; colors?: string[]; empty: string; glow?: boolean }) {
  if (!items.length) return <div className="analytics-chart-empty">{empty}</div>;
  const max = Math.max(...items.map((item) => item.value), 1);
  return <div className={`analytics-vertical-bars${glow ? '' : ' analytics-vertical-bars--flat'}`} role="img" aria-label="Vertical bar chart">{items.slice(0, 8).map((item, index) => { const barColor = colors?.[index] || fallbackPalette[index % fallbackPalette.length] || color; return <div className="analytics-vertical-column" key={item.label} title={`${item.label}: ${item.value}`} data-tooltip={`${item.label}: ${item.value}`}><b>{item.value}</b><div className="analytics-vertical-track"><i style={{ height: `${item.value / max * 100}%`, width: '36px', marginInline: 'auto', color: barColor, background: barColor }}/></div><span title={item.label}>{item.label}</span></div>; })}</div>;
}
