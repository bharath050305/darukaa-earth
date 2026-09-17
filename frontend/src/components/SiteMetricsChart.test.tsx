import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SiteMetricsChart } from './SiteMetricsChart';
import type { SiteMetric } from '../types';

const metrics: SiteMetric[] = [
  { recorded_on: '2025-01-01', carbon_tons: 100, biodiversity_index: 0.5, ndvi: 0.4 },
  { recorded_on: '2025-02-01', carbon_tons: 110, biodiversity_index: 0.55, ndvi: 0.42 },
];

describe('SiteMetricsChart', () => {
  it('renders a canvas for the chart without crashing', () => {
    const { container } = render(<SiteMetricsChart metrics={metrics} />);
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });
});
