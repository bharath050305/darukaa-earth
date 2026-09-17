SQUARE_POLYGON = {
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
}


def _create_project(client, auth_headers):
    resp = client.post("/api/projects", json={"name": "Geo Project"}, headers=auth_headers)
    return resp.json()["id"]


def test_create_site_with_polygon(client, auth_headers):
    project_id = _create_project(client, auth_headers)
    resp = client.post(
        f"/api/projects/{project_id}/sites",
        json={"name": "Site A", "site_type": "reforestation", "geometry": SQUARE_POLYGON},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Site A"
    assert body["area_hectares"] > 0
    assert body["geometry"]["type"] == "Polygon"


def test_create_site_invalid_geometry_rejected(client, auth_headers):
    project_id = _create_project(client, auth_headers)
    resp = client.post(
        f"/api/projects/{project_id}/sites",
        json={"name": "Bad Site", "geometry": {"type": "Point", "coordinates": [0, 0]}},
        headers=auth_headers,
    )
    assert resp.status_code == 400


def test_list_sites_for_map(client, auth_headers):
    project_id = _create_project(client, auth_headers)
    client.post(
        f"/api/projects/{project_id}/sites",
        json={"name": "Site A", "geometry": SQUARE_POLYGON},
        headers=auth_headers,
    )
    resp = client.get("/api/sites", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_site_detail_has_metrics(client, auth_headers):
    project_id = _create_project(client, auth_headers)
    create_resp = client.post(
        f"/api/projects/{project_id}/sites",
        json={"name": "Site A", "geometry": SQUARE_POLYGON},
        headers=auth_headers,
    )
    site_id = create_resp.json()["id"]

    resp = client.get(f"/api/sites/{site_id}", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert len(body["metrics"]) == 24
    assert body["metrics"][0]["carbon_tons"] > 0


def test_site_scoped_to_owner_project(client, auth_headers):
    project_id = _create_project(client, auth_headers)
    resp = client.post(
        f"/api/projects/{project_id + 999}/sites",
        json={"name": "Site A", "geometry": SQUARE_POLYGON},
        headers=auth_headers,
    )
    assert resp.status_code == 404
