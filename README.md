# Darukaa.Earth

A full-stack geospatial analytics platform for managing and visualizing carbon and biodiversity
projects. Administrators can create projects, draw site boundaries on an interactive map, and
review carbon/biodiversity performance over time.

**Live demo:** _add your deployed Render URL here_
**Demo login:** `demo@darukaa.earth` / `DarukaaDemo123!` (seeded automatically, see [Seeding demo data](#seeding-demo-data))

---

## 1. High-level architecture

```
┌──────────────────────┐        HTTPS / JSON        ┌───────────────────────┐
│   React SPA (Vite)   │  ────────────────────────▶ │   FastAPI backend     │
│  Mapbox GL JS + Draw  │  ◀──────────────────────── │   JWT auth, REST API  │
│  Chart.js dashboards  │                             │   SQLAlchemy + Alembic│
└──────────────────────┘                             └───────────┬───────────┘
                                                                   │ SQL (psycopg2)
                                                                   ▼
                                                     ┌───────────────────────┐
                                                     │ PostgreSQL + PostGIS  │
                                                     │ (geometry columns,    │
                                                     │  spatial area calc.)  │
                                                     └───────────────────────┘
```

- **Frontend** — React 19 + TypeScript, built with Vite. `zustand` holds auth state, `axios`
  talks to the API, `react-router-dom` handles routing, `mapbox-gl` + `@mapbox/mapbox-gl-draw`
  render the interactive map and polygon-drawing tool, and `chart.js`/`react-chartjs-2` render
  the time-series analytics charts. Styling uses Tailwind CSS v4.
- **Backend** — FastAPI (Python), chosen for its async performance, automatic OpenAPI docs
  (`/docs`), and first-class Pydantic validation. SQLAlchemy 2.0 + GeoAlchemy2 model the
  geospatial schema; Alembic manages migrations.
- **Database** — PostgreSQL 16 with the PostGIS extension. Site boundaries are stored as native
  `POLYGON` geometries (SRID 4326), which lets the database compute geodesic area
  (`ST_Area` on a `geography` cast) instead of doing that math in application code.
- **Auth** — Stateless JWT bearer tokens (`python-jose` + `passlib`/bcrypt for password hashing).
  Every project/site/metric endpoint is scoped to the authenticated user's own data.

### Why this stack (trade-offs)

| Decision | Reasoning | Trade-off accepted |
|---|---|---|
| FastAPI over Django/Flask | Native async, Pydantic-based validation, auto-generated OpenAPI docs speed up frontend integration | Less batteries-included than Django (no admin panel) — not needed for this scope |
| PostGIS geometry column vs. storing GeoJSON as text | Enables real spatial queries (area, containment, future "sites near me") and validates geometry at the DB layer | Slightly heavier local setup (requires the PostGIS extension, not vanilla Postgres) |
| Zustand over Redux/Context | Minimal boilerplate for a small, single-slice auth store | Would need more structure if the app grew many stores |
| Synthetic/mocked time-series metrics | No live satellite feed available in this environment; the brief explicitly allows mock data | Numbers are illustrative, not real carbon measurements — clearly documented below |
| oxlint (Rust-based) instead of ESLint | Vite's current React+TS template ships oxlint by default; it's dramatically faster and covers the React hooks rules we need | Smaller plugin ecosystem than ESLint if more custom rules are needed later |

---

## 2. Database schema

```
users
├─ id            PK
├─ email         unique, indexed
├─ hashed_password
├─ full_name
└─ created_at

projects
├─ id            PK
├─ name
├─ description
├─ project_type  ("carbon" | "biodiversity")
├─ owner_id      FK → users.id (cascade delete)
└─ created_at

sites
├─ id            PK
├─ project_id    FK → projects.id (cascade delete)
├─ name
├─ site_type     ("reforestation" | "conservation" | "habitat_restoration")
├─ boundary      GEOMETRY(POLYGON, 4326)   ← PostGIS column
├─ area_hectares FLOAT                     ← computed via ST_Area at creation time
└─ created_at

site_metrics
├─ id                 PK
├─ site_id            FK → sites.id (cascade delete)
├─ recorded_on        DATE
├─ carbon_tons        FLOAT
├─ biodiversity_index FLOAT (0-1)
├─ ndvi               FLOAT (-1 to 1)
└─ UNIQUE(site_id, recorded_on)
```

One user owns many projects; one project has many sites; one site has many monthly metric
records (24 months are generated automatically when a site is created), which power the
site-detail charts.

Migrations live in [`backend/alembic/versions`](backend/alembic/versions) — the initial
migration (`0001_initial_schema.py`) also runs `CREATE EXTENSION IF NOT EXISTS postgis`.

### Dataset note

There is no public, ready-to-use API for per-polygon carbon/biodiversity time series, so
`app/mock_metrics.py` deterministically generates a 24-month synthetic series per site (seeded
on the site name, with a growth trend + seasonal signal + bounded noise). This keeps demo data
stable across restarts while still looking like a real monitoring feed. The sample projects in
`app/seed.py` use real-world coordinates (Amazon basin, Western Ghats) so the map view looks
realistic.

---

## 3. Local setup

### Prerequisites
- Docker + Docker Compose (recommended — spins up Postgres/PostGIS, backend and frontend together)
- OR: Python 3.12+, Node.js 20+, and a local PostgreSQL 16 with PostGIS if you prefer running
  services natively.
- A free [Mapbox](https://www.mapbox.com/) access token (for `VITE_MAPBOX_TOKEN`).

### Option A — Docker Compose (fastest)

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env      # then paste your Mapbox token into VITE_MAPBOX_TOKEN
docker compose up --build
```

- Backend API: http://localhost:8000 (docs at `/docs`)
- Frontend: http://localhost:4173

Run migrations and seed demo data once the containers are healthy:

```bash
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.seed
```

### Option B — Run services natively

**Backend**
```bash
cd backend
python -m venv .venv
./.venv/Scripts/activate        # or `source .venv/bin/activate` on macOS/Linux
pip install -r requirements-dev.txt
cp .env.example .env            # edit DATABASE_URL to point at your local Postgres+PostGIS
alembic upgrade head
python -m app.seed              # creates demo@darukaa.earth / DarukaaDemo123! + sample projects
uvicorn app.main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
cp .env.example .env            # set VITE_API_URL and VITE_MAPBOX_TOKEN
npm run dev
```

### Seeding demo data

`python -m app.seed` (run once, from `backend/`) creates a demo administrator account and two
sample projects (Amazon Basin Reforestation, Western Ghats Biodiversity Corridor) with sites and
24 months of metrics each, so the map and charts are populated immediately after setup.

### Running tests

```bash
# Backend (needs a running Postgres+PostGIS — docker compose up -d db)
cd backend && pytest -v --cov=app

# Frontend
cd frontend && npm run test
```

---

## 4. CI/CD pipeline

Defined in [`.github/workflows/ci.yml`](.github/workflows/ci.yml), it runs on every push/PR to
`main`:

1. **`backend` job** — spins up a `postgis/postgis` service container, installs
   `requirements-dev.txt`, then runs `ruff check` (lint), `black --check` (format verification),
   and `pytest --cov` (unit/integration tests against the real PostGIS service).
2. **`frontend` job** — installs npm deps, runs `prettier --check`, `oxlint`, `tsc --noEmit`,
   `vitest run`, and finally `npm run build` to catch build-time regressions.
3. **`deploy` job** — runs only on pushes to `main`, after both jobs above succeed. It calls
   Render's deploy hooks (`RENDER_BACKEND_DEPLOY_HOOK` / `RENDER_FRONTEND_DEPLOY_HOOK` repo
   secrets) if configured; if not set, Render's own auto-deploy-on-push (`autoDeploy: true` in
   [`render.yaml`](render.yaml)) still ships the change — the explicit hook call just lets you
   gate deploys strictly behind CI passing rather than a bare push.

### Pre-commit hooks (Husky + lint-staged)

The repo root has its own `package.json` with Husky + lint-staged
(see [`.husky/pre-commit`](.husky/pre-commit)). On every `git commit`:
- Staged frontend files are formatted with **Prettier**.
- Staged backend `*.py` files are auto-fixed with **ruff** and formatted with **black**.

Install once after cloning: `npm install` at the repo root (the `prepare` script wires up the
git hook automatically via Husky).

### Deployment

The app deploys to **Render.com** using the [`render.yaml`](render.yaml) Blueprint:
- `darukaa-backend` — a Docker web service built from `backend/Dockerfile`, running
  `alembic upgrade head` then `uvicorn` on boot, wired to a managed `darukaa-db` Postgres
  instance (PostGIS-enabled) via `DATABASE_URL`.
- `darukaa-frontend` — a static site built with `npm run build`, served from `frontend/dist`,
  configured with a SPA rewrite rule so client-side routing works on refresh.

To deploy: push this repo to GitHub, then in the Render dashboard choose **New → Blueprint** and
point it at the repository. Render reads `render.yaml` and provisions all three resources
automatically. Set the `VITE_MAPBOX_TOKEN` secret in the Render dashboard for the frontend
service (marked `sync: false` in the blueprint so it isn't committed to source control).

---

## 5. API overview

All endpoints are prefixed `/api`. Interactive docs are available at `/docs` (Swagger UI) once
the backend is running.

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Create a new administrator account |
| POST | `/api/auth/login` | Exchange email/password for a JWT |
| GET | `/api/auth/me` | Current authenticated user |
| GET/POST | `/api/projects` | List / create projects |
| GET/DELETE | `/api/projects/{id}` | Fetch / delete a project |
| POST | `/api/projects/{id}/sites` | Add a site (GeoJSON polygon) to a project |
| GET | `/api/sites` | All sites for the current user (optionally `?project_id=`) — used for the map view |
| GET/DELETE | `/api/sites/{id}` | Site detail with 24-month metric history / delete |

---

## 6. Project structure

```
darukaa-earth/
├── backend/            FastAPI app, SQLAlchemy models, Alembic migrations, pytest suite
├── frontend/            React + Vite SPA (Mapbox, Chart.js, Tailwind)
├── docker-compose.yml   Local dev: Postgres+PostGIS, backend, frontend
├── render.yaml           Render Blueprint (backend web service, static frontend, managed DB)
├── .github/workflows/    CI/CD (lint, test, build, deploy)
└── .husky/               Pre-commit hook (lint-staged)
```
