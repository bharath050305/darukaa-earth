from fastapi import APIRouter, Depends, HTTPException, status
from geoalchemy2 import Geography
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.geo import geojson_to_wkt_element, wkb_to_geojson
from app.mock_metrics import generate_monthly_metrics
from app.models import Project, Site, SiteMetric, User
from app.schemas import SiteCreate, SiteDetail, SiteRead

router = APIRouter(tags=["sites"])


def _site_to_read(site: Site) -> SiteRead:
    result = SiteRead.model_validate(site)
    result.geometry = wkb_to_geojson(site.boundary)
    return result


def _owned_project(db: Session, project_id: int, user: User) -> Project:
    project = db.query(Project).filter(Project.id == project_id, Project.owner_id == user.id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


@router.post(
    "/api/projects/{project_id}/sites",
    response_model=SiteRead,
    status_code=status.HTTP_201_CREATED,
)
def create_site(
    project_id: int,
    payload: SiteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _owned_project(db, project_id, current_user)

    try:
        wkt_geom = geojson_to_wkt_element(payload.geometry)
    except Exception as exc:  # noqa: BLE001 - surfaced as 400 to the client
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid geometry: {exc}"
        ) from exc

    site = Site(
        project_id=project_id,
        name=payload.name,
        site_type=payload.site_type,
        boundary=wkt_geom,
    )
    db.add(site)
    db.flush()

    area_row = db.execute(select(func.ST_Area(func.cast(site.boundary, Geography)) / 10000.0)).scalar()
    site.area_hectares = round(area_row or 0.0, 2)

    for metric in generate_monthly_metrics(site.name, site.area_hectares):
        db.add(SiteMetric(site_id=site.id, **metric))

    db.commit()
    db.refresh(site)
    return _site_to_read(site)


@router.get("/api/sites", response_model=list[SiteRead])
def list_sites(
    project_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Site).join(Project).filter(Project.owner_id == current_user.id)
    if project_id is not None:
        query = query.filter(Site.project_id == project_id)
    sites = query.order_by(Site.created_at.desc()).all()
    return [_site_to_read(site) for site in sites]


@router.get("/api/sites/{site_id}", response_model=SiteDetail)
def get_site(
    site_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    site = (
        db.query(Site).join(Project).filter(Site.id == site_id, Project.owner_id == current_user.id).first()
    )
    if not site:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")

    detail = SiteDetail.model_validate(site)
    detail.geometry = wkb_to_geojson(site.boundary)
    detail.metrics = sorted(site.metrics, key=lambda m: m.recorded_on)
    return detail


@router.delete("/api/sites/{site_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_site(
    site_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    site = (
        db.query(Site).join(Project).filter(Site.id == site_id, Project.owner_id == current_user.id).first()
    )
    if not site:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")
    db.delete(site)
    db.commit()
