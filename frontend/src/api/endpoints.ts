import { apiClient } from './client';
import type { PolygonGeometry, Project, Site, SiteDetail, User } from '../types';

export async function registerUser(payload: { email: string; password: string; full_name: string }) {
  const { data } = await apiClient.post<User>('/api/auth/register', payload);
  return data;
}

export async function loginUser(email: string, password: string) {
  const form = new URLSearchParams();
  form.set('username', email);
  form.set('password', password);
  const { data } = await apiClient.post<{ access_token: string; token_type: string }>(
    '/api/auth/login',
    form,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  );
  return data;
}

export async function fetchCurrentUser() {
  const { data } = await apiClient.get<User>('/api/auth/me');
  return data;
}

export async function fetchProjects() {
  const { data } = await apiClient.get<Project[]>('/api/projects');
  return data;
}

export async function fetchProject(projectId: number) {
  const { data } = await apiClient.get<Project>(`/api/projects/${projectId}`);
  return data;
}

export async function createProject(payload: { name: string; description?: string; project_type: string }) {
  const { data } = await apiClient.post<Project>('/api/projects', payload);
  return data;
}

export async function deleteProject(projectId: number) {
  await apiClient.delete(`/api/projects/${projectId}`);
}

export async function fetchSites(projectId?: number) {
  const { data } = await apiClient.get<Site[]>('/api/sites', {
    params: projectId ? { project_id: projectId } : undefined,
  });
  return data;
}

export async function fetchSiteDetail(siteId: number) {
  const { data } = await apiClient.get<SiteDetail>(`/api/sites/${siteId}`);
  return data;
}

export async function createSite(
  projectId: number,
  payload: { name: string; site_type: string; geometry: PolygonGeometry },
) {
  const { data } = await apiClient.post<Site>(`/api/projects/${projectId}/sites`, payload);
  return data;
}

export async function deleteSite(siteId: number) {
  await apiClient.delete(`/api/sites/${siteId}`);
}
