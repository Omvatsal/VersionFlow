export const chartColors = {
  orange: '#e97849',
  blue: '#7fa8d6',
  violet: '#9b8bd3',
  emerald: '#74b98d',
  amber: '#d9a65d',
  rose: '#d87a83',
  slate: '#8290a6',
} as const;

export const lifecycleColors: Record<string, string> = {
  draft: chartColors.blue,
  active: chartColors.emerald,
  published: chartColors.emerald,
  deprecated: chartColors.amber,
  sunset: chartColors.rose,
};

export const severityColors: Record<string, string> = {
  critical: chartColors.rose,
  high: chartColors.amber,
  medium: '#c7a36a',
  low: chartColors.emerald,
  informational: chartColors.blue,
};
