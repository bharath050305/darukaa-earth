import MapboxDraw from '@mapbox/mapbox-gl-draw';
import mapboxgl from 'mapbox-gl';
import { useEffect, useRef } from 'react';
import type { PolygonGeometry, Site } from '../types';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN ?? '';

const SITE_TYPE_COLORS: Record<string, string> = {
  reforestation: '#15803d',
  conservation: '#0891b2',
  habitat_restoration: '#a16207',
};

interface MapViewProps {
  sites: Site[];
  selectedSiteId?: number;
  onSiteClick?: (site: Site) => void;
  drawable?: boolean;
  onPolygonCreate?: (geometry: PolygonGeometry) => void;
  heightClassName?: string;
}

export function MapView({
  sites,
  selectedSiteId,
  onSiteClick,
  drawable = false,
  onPolygonCreate,
  heightClassName = 'h-[480px]',
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const onSiteClickRef = useRef(onSiteClick);
  const onPolygonCreateRef = useRef(onPolygonCreate);
  onSiteClickRef.current = onSiteClick;
  onPolygonCreateRef.current = onPolygonCreate;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    if (!MAPBOX_TOKEN) {
      return;
    }
    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-10, 10],
      zoom: 1.5,
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    if (drawable) {
      const draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: { polygon: true, trash: true },
      });
      drawRef.current = draw;
      map.addControl(draw, 'top-left');

      map.on('draw.create', () => {
        const data = draw.getAll();
        const feature = data.features[data.features.length - 1];
        if (feature && feature.geometry.type === 'Polygon' && onPolygonCreateRef.current) {
          onPolygonCreateRef.current(feature.geometry as PolygonGeometry);
        }
      });
    }

    map.on('load', () => {
      map.addSource('sites', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'sites-fill',
        type: 'fill',
        source: 'sites',
        paint: {
          'fill-color': ['coalesce', ['get', 'color'], '#15803d'],
          'fill-opacity': 0.35,
        },
      });
      map.addLayer({
        id: 'sites-outline',
        type: 'line',
        source: 'sites',
        paint: {
          'line-color': ['coalesce', ['get', 'color'], '#15803d'],
          'line-width': 2,
        },
      });
      map.on('click', 'sites-fill', (e) => {
        const feature = e.features?.[0];
        if (feature && onSiteClickRef.current) {
          const site = sites.find((s) => s.id === feature.properties?.id);
          if (site) onSiteClickRef.current(site);
        }
      });
      map.on('mouseenter', 'sites-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'sites-fill', () => {
        map.getCanvas().style.cursor = '';
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawable]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const applySource = () => {
      const source = map.getSource('sites') as mapboxgl.GeoJSONSource | undefined;
      if (!source) return;

      const features = sites
        .filter((site) => site.geometry)
        .map((site) => ({
          type: 'Feature' as const,
          geometry: site.geometry!,
          properties: {
            id: site.id,
            name: site.name,
            color: SITE_TYPE_COLORS[site.site_type] ?? '#15803d',
          },
        }));
      source.setData({ type: 'FeatureCollection', features });

      if (features.length > 0 && !selectedSiteId) {
        const bounds = new mapboxgl.LngLatBounds();
        features.forEach((f) => {
          f.geometry.coordinates[0].forEach((coord) => bounds.extend(coord as [number, number]));
        });
        map.fitBounds(bounds, { padding: 60, maxZoom: 12, duration: 0 });
      }
    };

    if (map.isStyleLoaded()) {
      applySource();
    } else {
      map.once('load', applySource);
    }
  }, [sites, selectedSiteId]);

  if (!MAPBOX_TOKEN) {
    return (
      <div
        className={`flex ${heightClassName} items-center justify-center rounded-lg border border-dashed border-amber-400 bg-amber-50 p-6 text-center text-sm text-amber-800`}
      >
        Mapbox access token missing. Set{' '}
        <code className="mx-1 rounded bg-amber-100 px-1">VITE_MAPBOX_TOKEN</code> in your frontend environment
        to enable the interactive map.
      </div>
    );
  }

  return <div ref={containerRef} className={`${heightClassName} w-full rounded-lg`} />;
}
