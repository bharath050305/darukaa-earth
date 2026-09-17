def test_create_and_list_projects(client, auth_headers):
    resp = client.post(
        "/api/projects",
        json={"name": "Test Project", "description": "A demo project", "project_type": "carbon"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    project_id = resp.json()["id"]

    resp = client.get("/api/projects", headers=auth_headers)
    assert resp.status_code == 200
    projects = resp.json()
    assert len(projects) == 1
    assert projects[0]["id"] == project_id
    assert projects[0]["site_count"] == 0


def test_projects_require_auth(client):
    resp = client.get("/api/projects")
    assert resp.status_code == 401


def test_get_missing_project_404(client, auth_headers):
    resp = client.get("/api/projects/999", headers=auth_headers)
    assert resp.status_code == 404


def test_delete_project(client, auth_headers):
    resp = client.post("/api/projects", json={"name": "Deletable"}, headers=auth_headers)
    project_id = resp.json()["id"]
    resp = client.delete(f"/api/projects/{project_id}", headers=auth_headers)
    assert resp.status_code == 204
    resp = client.get(f"/api/projects/{project_id}", headers=auth_headers)
    assert resp.status_code == 404
