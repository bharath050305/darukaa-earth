import json
from typing import Any

from geoalchemy2.shape import to_shape
from shapely.geometry import shape
from sqlalchemy import func


def geojson_to_wkt_element(geometry: dict[str, Any]):
    """Validate a GeoJSON polygon and return a WKTElement-ready WKT string."""
    from geoalchemy2.elements import WKTElement

    geom = shape(geometry)
    if geom.geom_type != "Polygon":
        raise ValueError("Only Polygon geometries are supported")
    return WKTElement(geom.wkt, srid=4326)


def wkb_to_geojson(wkb_geometry) -> dict[str, Any] | None:
    if wkb_geometry is None:
        return None
    shapely_geom = to_shape(wkb_geometry)
    return json.loads(json.dumps(shapely_geom.__geo_interface__))


def area_hectares_expression(boundary_column):
    """SQL expression computing geodesic area (hectares) of a geography polygon."""
    return func.ST_Area(func.cast(boundary_column, __import__("geoalchemy2").Geography)) / 10000.0
