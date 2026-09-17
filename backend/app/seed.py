"""Seed the database with a demo user, sample projects and sites.

Run with: python -m app.seed
"""

from geoalchemy2 import Geography
from sqlalchemy import func, select

from app.database import SessionLocal
from app.geo import geojson_to_wkt_element
from app.mock_metrics import generate_monthly_metrics
from app.models import Project, Site, SiteMetric, User
from app.security import hash_password

DEMO_EMAIL = "demo@darukaa.earth"
DEMO_PASSWORD = "DarukaaDemo123!"

SAMPLE_SITES = [
    {
        "project": "Amazon Basin Reforestation",
        "project_type": "carbon",
        "description": "Reforestation and avoided-deforestation project across the Amazon basin.",
        "sites": [
            {
                "name": "Tapajos North Block",
                "site_type": "reforestation",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [-54.95, -2.75],
                            [-54.80, -2.75],
                            [-54.80, -2.60],
                            [-54.95, -2.60],
                            [-54.95, -2.75],
                        ]
                    ],
                },
            },
            {
                "name": "Xingu River Buffer",
                "site_type": "conservation",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [-52.40, -3.30],
                            [-52.20, -3.30],
                            [-52.20, -3.10],
                            [-52.40, -3.10],
                            [-52.40, -3.30],
                        ]
                    ],
                },
            },
        ],
    },
    {
        "project": "Western Ghats Biodiversity Corridor",
        "project_type": "biodiversity",
        "description": "Habitat restoration corridor connecting fragmented forest patches.",
        "sites": [
            {
                "name": "Wayanad Corridor Segment 1",
                "site_type": "habitat_restoration",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [76.05, 11.60],
                            [76.15, 11.60],
                            [76.15, 11.70],
                            [76.05, 11.70],
                            [76.05, 11.60],
                        ]
                    ],
                },
            }
        ],
    },
]


def run():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == DEMO_EMAIL).first()
        if not user:
            user = User(
                email=DEMO_EMAIL,
                hashed_password=hash_password(DEMO_PASSWORD),
                full_name="Demo Administrator",
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"Created demo user: {DEMO_EMAIL} / {DEMO_PASSWORD}")
        else:
            print("Demo user already exists, skipping user creation.")
            if user.projects:
                print("Demo data already seeded, skipping.")
                return

        for project_data in SAMPLE_SITES:
            project = Project(
                name=project_data["project"],
                description=project_data["description"],
                project_type=project_data["project_type"],
                owner_id=user.id,
            )
            db.add(project)
            db.flush()

            for site_data in project_data["sites"]:
                site = Site(
                    project_id=project.id,
                    name=site_data["name"],
                    site_type=site_data["site_type"],
                    boundary=geojson_to_wkt_element(site_data["geometry"]),
                )
                db.add(site)
                db.flush()

                area = db.execute(
                    select(func.ST_Area(func.cast(site.boundary, Geography)) / 10000.0)
                ).scalar()
                site.area_hectares = round(area or 0.0, 2)

                for metric in generate_monthly_metrics(site.name, site.area_hectares):
                    db.add(SiteMetric(site_id=site.id, **metric))

        db.commit()
        print("Seed data created successfully.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
