from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str = Field(min_length=1, max_length=255)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    project_type: str = "carbon"


class ProjectRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    project_type: str
    owner_id: int
    created_at: datetime
    site_count: int = 0


class SiteCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    site_type: str = "reforestation"
    geometry: dict[str, Any] = Field(
        description="GeoJSON Polygon geometry, e.g. {'type': 'Polygon', 'coordinates': [[[lng, lat], ...]]}"
    )


class SiteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    name: str
    site_type: str
    area_hectares: float
    created_at: datetime
    geometry: dict[str, Any] | None = None


class SiteMetricRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    recorded_on: date
    carbon_tons: float
    biodiversity_index: float
    ndvi: float


class SiteDetail(SiteRead):
    metrics: list[SiteMetricRead] = []
