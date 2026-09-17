import { type FormEvent, useState } from 'react';
import type { PolygonGeometry } from '../types';

interface NewSiteModalProps {
  geometry: PolygonGeometry;
  onClose: () => void;
  onCreate: (payload: { name: string; site_type: string }) => Promise<void>;
}

export function NewSiteModal({ onClose, onCreate }: NewSiteModalProps) {
  const [name, setName] = useState('');
  const [siteType, setSiteType] = useState('reforestation');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onCreate({ name, site_type: siteType });
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-lg font-semibold text-emerald-900">Name this site</h2>
        <p className="mb-4 text-sm text-slate-500">
          Polygon boundary captured. Give the site a name and type to save it.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Site name</label>
            <input
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
              placeholder="e.g. North Block"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Site type</label>
            <select
              value={siteType}
              onChange={(e) => setSiteType(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
            >
              <option value="reforestation">Reforestation</option>
              <option value="conservation">Conservation</option>
              <option value="habitat_restoration">Habitat restoration</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save site'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
