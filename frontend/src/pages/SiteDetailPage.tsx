import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchSiteDetail } from '../api/endpoints';
import { MapView } from '../components/MapView';
import { SiteMetricsChart } from '../components/SiteMetricsChart';
import type { SiteDetail } from '../types';

export function SiteDetailPage() {
  const { siteId } = useParams();
  const navigate = useNavigate();
  const [site, setSite] = useState<SiteDetail | null>(null);

  useEffect(() => {
    fetchSiteDetail(Number(siteId)).then(setSite);
  }, [siteId]);

  if (!site) return <div className="p-8 text-slate-500">Loading site...</div>;

  const latest = site.metrics[site.metrics.length - 1];

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <button onClick={() => navigate(-1)} className="mb-4 text-sm text-emerald-700 hover:underline">
        ← Back
      </button>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-emerald-900">{site.name}</h1>
          <p className="text-sm text-slate-500">
            {site.site_type.replace('_', ' ')} · {site.area_hectares.toFixed(1)} hectares
          </p>
        </div>
      </div>

      {latest && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Current carbon stock" value={`${latest.carbon_tons.toLocaleString()} tCO₂e`} />
          <StatCard label="Biodiversity index" value={latest.biodiversity_index.toFixed(2)} />
          <StatCard label="NDVI (vegetation health)" value={latest.ndvi.toFixed(2)} />
        </div>
      )}

      <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-medium text-slate-700">Boundary</h2>
        <MapView sites={[site]} selectedSiteId={site.id} heightClassName="h-72" />
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-medium text-slate-700">Performance over time (24 months)</h2>
        <SiteMetricsChart metrics={site.metrics} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-semibold text-emerald-900">{value}</p>
    </div>
  );
}
