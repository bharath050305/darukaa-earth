import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createSite, deleteSite, fetchProject, fetchSites } from '../api/endpoints';
import { MapView } from '../components/MapView';
import { NewSiteModal } from '../components/NewSiteModal';
import type { PolygonGeometry, Project, Site } from '../types';

export function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [pendingGeometry, setPendingGeometry] = useState<PolygonGeometry | null>(null);

  async function loadData() {
    const id = Number(projectId);
    const [projectData, siteData] = await Promise.all([fetchProject(id), fetchSites(id)]);
    setProject(projectData);
    setSites(siteData);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function handleCreateSite(payload: { name: string; site_type: string }) {
    if (!pendingGeometry || !project) return;
    await createSite(project.id, { ...payload, geometry: pendingGeometry });
    setPendingGeometry(null);
    await loadData();
  }

  async function handleDeleteSite(siteId: number) {
    if (!confirm('Delete this site and all of its analytics history?')) return;
    await deleteSite(siteId);
    await loadData();
  }

  if (!project) return <div className="p-8 text-slate-500">Loading project...</div>;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <button onClick={() => navigate('/')} className="mb-4 text-sm text-emerald-700 hover:underline">
        ← Back to projects
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-emerald-900">{project.name}</h1>
        <p className="text-sm text-slate-500">{project.description}</p>
      </div>

      <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium text-slate-700">Site boundaries</h2>
          <p className="text-xs text-slate-400">Use the polygon tool (top-left) to draw a new site</p>
        </div>
        <MapView sites={sites} drawable onPolygonCreate={setPendingGeometry} />
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-medium text-slate-700">Sites ({sites.length})</h2>
        {sites.length === 0 && (
          <p className="text-sm text-slate-500">No sites yet. Draw a polygon above to add one.</p>
        )}
        <ul className="divide-y divide-slate-100">
          {sites.map((site) => (
            <li key={site.id} className="flex items-center justify-between py-3">
              <div>
                <Link to={`/sites/${site.id}`} className="font-medium text-emerald-800 hover:underline">
                  {site.name}
                </Link>
                <p className="text-xs text-slate-500">
                  {site.site_type.replace('_', ' ')} · {site.area_hectares.toFixed(1)} ha
                </p>
              </div>
              <button
                onClick={() => handleDeleteSite(site.id)}
                className="text-xs text-red-500 hover:underline"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>

      {pendingGeometry && (
        <NewSiteModal
          geometry={pendingGeometry}
          onClose={() => setPendingGeometry(null)}
          onCreate={handleCreateSite}
        />
      )}
    </div>
  );
}
