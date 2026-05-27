from fastapi.testclient import TestClient


def test_static_index_served_when_dir_present(app_factory, tmp_path):
    static_dir = tmp_path / "static"
    static_dir.mkdir()
    (static_dir / "index.html").write_text("<!doctype html><h1>prelegal</h1>")

    app = app_factory(static_dir=str(static_dir))
    with TestClient(app) as client:
        response = client.get("/")
        assert response.status_code == 200
        assert "<h1>prelegal</h1>" in response.text


def test_api_routes_take_priority_over_static(app_factory, tmp_path):
    static_dir = tmp_path / "static"
    static_dir.mkdir()
    (static_dir / "index.html").write_text("<h1>static</h1>")

    app = app_factory(static_dir=str(static_dir))
    with TestClient(app) as client:
        response = client.get("/api/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


def test_missing_static_dir_does_not_crash(app_factory):
    # static_dir=None — no mount, but app should still start and serve API
    app = app_factory(static_dir=None)
    with TestClient(app) as client:
        assert client.get("/api/health").status_code == 200
