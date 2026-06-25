from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from langchain_core.messages import AIMessage


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


@patch("app.api.v1.endpoints.chat.build_agent")
def test_chat_success(mock_build_agent, client: TestClient, user_token_headers: dict):
    mock_agent = MagicMock()
    mock_agent.invoke.return_value = {
        "messages": [AIMessage(content="I can help you find products!")]
    }
    mock_build_agent.return_value = mock_agent

    resp = client.post(
        "/api/v1/chat",
        json={"message": "show me laptops"},
        headers=user_token_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["response"] == "I can help you find products!"
    mock_agent.invoke.assert_called_once()


@patch("app.api.v1.endpoints.chat.build_agent")
def test_chat_empty_response(mock_build_agent, client: TestClient, user_token_headers: dict):
    mock_agent = MagicMock()
    mock_agent.invoke.return_value = {"messages": [AIMessage(content="")]}
    mock_build_agent.return_value = mock_agent

    resp = client.post(
        "/api/v1/chat",
        json={"message": "hello"},
        headers=user_token_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["response"] == ""


@patch("app.api.v1.endpoints.chat.build_agent")
def test_chat_agent_error(mock_build_agent, client: TestClient, user_token_headers: dict):
    mock_build_agent.side_effect = Exception("Ollama not running")

    resp = client.post(
        "/api/v1/chat",
        json={"message": "hello"},
        headers=user_token_headers,
    )
    assert resp.status_code == 503
    assert "AI service unavailable" in resp.json()["detail"]
