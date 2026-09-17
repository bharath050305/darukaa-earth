import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSites } from '../api/endpoints';
import { MapView } from '../components/MapView';
import type { Site } from '../types';

export function GlobalMapPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSites().then(setSites);
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="mb-1 text-2xl font-semibold text-emerald-900">All sites</h1>
      <p className="mb-6 text-sm text-slate-500">
        Every site across all of your projects. Click a site to view its analytics.
      </p>
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <MapView
          sites={sites}
          onSiteClick={(site) => navigate(`/sites/${site.id}`)}
          heightClassName="h-[600px]"
        />
      </div>
    </div>
  );
}
