import os

os.environ.setdefault("DATABASE_URL", "postgresql+psycopg2://darukaa:darukaa@localhost:5433/darukaa_test")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

from app.database import Base, SessionLocal, engine
from app.main import app


@pytest.fixture(scope="session", autouse=True)
def _setup_database():
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
        conn.commit()
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def _clean_tables():
    yield
    db = SessionLocal()
    try:
        for table in reversed(Base.metadata.sorted_tables):
            db.execute(table.delete())
        db.commit()
    finally:
        db.close()


@pytest.fixture()
def client():
    return TestClient(app)


@pytest.fixture()
def auth_headers(client):
    client.post(
        "/api/auth/register",
        json={"email": "tester@example.com", "password": "supersecret1", "full_name": "Tester"},
    )
    resp = client.post(
        "/api/auth/login",
        data={"username": "tester@example.com", "password": "supersecret1"},
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
