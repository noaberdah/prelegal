import json
from types import SimpleNamespace

import pytest


def _completion_returning(payload: dict):
    """Build a stub for litellm.completion that returns a fixed ChatTurn JSON."""

    def _stub(*args, **kwargs):
        message = SimpleNamespace(content=json.dumps(payload))
        choice = SimpleNamespace(message=message)
        return SimpleNamespace(choices=[choice])

    return _stub


@pytest.fixture
def chat_client(app_factory, monkeypatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
    from fastapi.testclient import TestClient

    app = app_factory()
    return TestClient(app), monkeypatch


@pytest.fixture
def unconfigured_client(app_factory, monkeypatch):
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    from fastapi.testclient import TestClient

    app = app_factory()
    return TestClient(app)


def _payload(messages=None, fields=None):
    return {
        "messages": messages or [],
        "current_fields": fields or {},
    }


def test_chat_returns_parsed_turn(chat_client):
    client, monkeypatch = chat_client
    stub = _completion_returning(
        {
            "assistant_message": "Hi! What's the purpose of the NDA?",
            "extracted_fields": {},
            "document_ready": False,
        }
    )
    monkeypatch.setattr("prelegal.chat.completion", stub)

    response = client.post("/api/chat", json=_payload())
    assert response.status_code == 200
    body = response.json()
    assert body["assistant_message"].startswith("Hi!")
    assert body["document_ready"] is False
    assert body["extracted_fields"]["purpose"] is None


def test_chat_forwards_extracted_fields(chat_client):
    client, monkeypatch = chat_client
    stub = _completion_returning(
        {
            "assistant_message": "Got it. Who is Party 1?",
            "extracted_fields": {
                "purpose": "Evaluating a partnership.",
                "effective_date": "2026-05-27",
            },
            "document_ready": False,
        }
    )
    monkeypatch.setattr("prelegal.chat.completion", stub)

    response = client.post(
        "/api/chat",
        json=_payload(
            messages=[
                {"role": "assistant", "content": "Hi! What's the purpose?"},
                {"role": "user", "content": "Evaluating a partnership."},
            ],
        ),
    )
    assert response.status_code == 200
    body = response.json()
    assert body["extracted_fields"]["purpose"] == "Evaluating a partnership."
    assert body["extracted_fields"]["effective_date"] == "2026-05-27"


def test_chat_503_when_key_missing(unconfigured_client):
    response = unconfigured_client.post("/api/chat", json=_payload())
    assert response.status_code == 503
    assert "OPENROUTER_API_KEY" in response.json()["detail"]


def test_chat_validates_request_shape(chat_client):
    client, _ = chat_client
    response = client.post("/api/chat", json={"messages": "not a list"})
    assert response.status_code == 422


def test_chat_502_on_upstream_failure(chat_client):
    client, monkeypatch = chat_client

    def boom(*args, **kwargs):
        raise RuntimeError("upstream down")

    monkeypatch.setattr("prelegal.chat.completion", boom)
    response = client.post("/api/chat", json=_payload())
    assert response.status_code == 502
