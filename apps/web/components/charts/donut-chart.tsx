'use client';
export function DonutChart({ items }: { items: Array<{ label: string; value: number }> }) { const total = items.reduce((sum, item) => sum + item.value, 0); return <div className="donut-layout"><div className="donut"><span>{total}</span></div><div className="chart-legend">{items.map((item) => <span key={item.label}><i />{item.label}<b>{item.value}</b></span>)}</div></div>; }
