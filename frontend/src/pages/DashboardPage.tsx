import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createProject, fetchProjects } from '../api/endpoints';
import { NewProjectModal } from '../components/NewProjectModal';
import type { Project } from '../types';

export function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  async function loadProjects() {
    setLoading(true);
    try {
      setProjects(await fetchProjects());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  async function handleCreate(payload: { name: string; description: string; project_type: string }) {
    await createProject(payload);
    await loadProjects();
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-emerald-900">Projects</h1>
          <p className="text-sm text-slate-500">Manage carbon and biodiversity projects and their sites.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-md bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900"
        >
          + New project
        </button>
      </div>

      {loading && <p className="text-slate-500">Loading projects...</p>}

      {!loading && projects.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          No projects yet. Create your first project to start adding sites.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Link
            key={project.id}
            to={`/projects/${project.id}`}
            className="rounded-xl border border-emerald-900/10 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="mb-2 flex items-center justify-between">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  project.project_type === 'carbon'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-cyan-100 text-cyan-800'
                }`}
              >
                {project.project_type}
              </span>
              <span className="text-xs text-slate-400">{project.site_count} site(s)</span>
            </div>
            <h2 className="text-lg font-semibold text-slate-800">{project.name}</h2>
            <p className="mt-1 line-clamp-2 text-sm text-slate-500">{project.description}</p>
          </Link>
        ))}
      </div>

      {showModal && <NewProjectModal onClose={() => setShowModal(false)} onCreate={handleCreate} />}
    </div>
  );
}
