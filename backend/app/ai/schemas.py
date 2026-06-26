from pydantic import BaseModel


class ChatRequest(BaseModel):
    conversation_id: int | None = None
    message: str


class ChatResponse(BaseModel):
    response: str
    products: list[dict] = []
    conversation_id: int | None = None
