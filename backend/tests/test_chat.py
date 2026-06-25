from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient


def test_chat_requires_auth(client: TestClient):
    resp = client.post("/api/v1/chat", json={"message": "hello"})
    assert resp.status_code == 401


def test_chat_empty_message(client: TestClient, user_token_headers: dict):
    resp = client.post(
        "/api/v1/chat",
        json={"message": ""},
        headers=user_token_headers,
    )
    assert resp.status_code == 400
    assert resp.json()["detail"] == "Message cannot be empty"


@patch("app.api.v1.endpoints.chat.run_chat")
def test_chat_success(mock_run_chat, client: TestClient, user_token_headers: dict):
    mock_run_chat.return_value = "I can help you find products!"

    resp = client.post(
        "/api/v1/chat",
        json={"message": "show me laptops"},
        headers=user_token_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["response"] == "I can help you find products!"


@patch("app.api.v1.endpoints.chat.run_chat")
def test_chat_empty_response(mock_run_chat, client: TestClient, user_token_headers: dict):
    mock_run_chat.return_value = ""

    resp = client.post(
        "/api/v1/chat",
        json={"message": "hello"},
        headers=user_token_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["response"] == ""


@patch("app.api.v1.endpoints.chat.run_chat")
def test_chat_with_history(mock_run_chat, client: TestClient, user_token_headers: dict):
    mock_run_chat.return_value = "Yes, your name is Royal!"

    resp = client.post(
        "/api/v1/chat",
        json={
            "message": "what is my name?",
            "history": [
                {"role": "user", "content": "hi my name is royal"},
                {"role": "assistant", "content": "Hello Royal! Welcome."},
            ],
        },
        headers=user_token_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["response"] == "Yes, your name is Royal!"
    args = mock_run_chat.call_args[0]
    assert args[2] == [
        {"role": "user", "content": "hi my name is royal"},
        {"role": "assistant", "content": "Hello Royal! Welcome."},
    ]
    assert args[3] == "what is my name?"


@patch("app.api.v1.endpoints.chat.run_chat")
def test_chat_agent_error(mock_run_chat, client: TestClient, user_token_headers: dict):
    mock_run_chat.side_effect = Exception("Ollama not running")

    resp = client.post(
        "/api/v1/chat",
        json={"message": "hello"},
        headers=user_token_headers,
    )
    assert resp.status_code == 503
    assert "AI service unavailable" in resp.json()["detail"]
