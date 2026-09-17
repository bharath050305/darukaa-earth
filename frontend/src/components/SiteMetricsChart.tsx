import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { SiteMetric } from '../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export function SiteMetricsChart({ metrics }: { metrics: SiteMetric[] }) {
  const labels = metrics.map((m) =>
    new Date(m.recorded_on).toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
  );

  const data = {
    labels,
    datasets: [
      {
        label: 'Carbon stock (tCO₂e)',
        data: metrics.map((m) => m.carbon_tons),
        borderColor: '#15803d',
        backgroundColor: 'rgba(21, 128, 61, 0.15)',
        yAxisID: 'y',
        tension: 0.3,
      },
      {
        label: 'Biodiversity index',
        data: metrics.map((m) => m.biodiversity_index),
        borderColor: '#0891b2',
        backgroundColor: 'rgba(8, 145, 178, 0.15)',
        yAxisID: 'y1',
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { position: 'top' as const },
      title: { display: false },
    },
    scales: {
      y: {
        type: 'linear' as const,
        position: 'left' as const,
        title: { display: true, text: 'Carbon (tCO₂e)' },
      },
      y1: {
        type: 'linear' as const,
        position: 'right' as const,
        min: 0,
        max: 1,
        grid: { drawOnChartArea: false },
        title: { display: true, text: 'Biodiversity index' },
      },
    },
  };

  return <Line data={data} options={options} />;
}
