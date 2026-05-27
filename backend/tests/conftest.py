import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def app_factory(tmp_path, monkeypatch):
    """Returns a callable that builds a fresh FastAPI app with isolated env."""
    def _build(static_dir: str | None = None):
        monkeypatch.setenv("PRELEGAL_JWT_SECRET", "test-secret-test-secret-test-secret")
        monkeypatch.setenv("PRELEGAL_DB_PATH", str(tmp_path / "test.db"))
        monkeypatch.setenv("PRELEGAL_COOKIE_SECURE", "false")
        if static_dir is None:
            monkeypatch.delenv("PRELEGAL_STATIC_DIR", raising=False)
        else:
            monkeypatch.setenv("PRELEGAL_STATIC_DIR", static_dir)

        from prelegal.config import load_settings
        load_settings.cache_clear()
        from prelegal.main import create_app
        return create_app()
    return _build


@pytest.fixture
def client(app_factory):
    app = app_factory()
    with TestClient(app) as c:
        yield c
