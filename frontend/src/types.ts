export interface User {
  id: number;
  email: string;
  full_name: string;
  created_at: string;
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  project_type: string;
  owner_id: number;
  created_at: string;
  site_count: number;
}

export interface PolygonGeometry {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface Site {
  id: number;
  project_id: number;
  name: string;
  site_type: string;
  area_hectares: number;
  created_at: string;
  geometry: PolygonGeometry | null;
}

export interface SiteMetric {
  recorded_on: string;
  carbon_tons: number;
  biodiversity_index: number;
  ndvi: number;
}

export interface SiteDetail extends Site {
  metrics: SiteMetric[];
}
