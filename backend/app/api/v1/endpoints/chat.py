from fastapi import APIRouter, Depends, HTTPException, status
from langchain_core.messages import HumanMessage
from sqlalchemy.orm import Session

from app.ai import build_agent, ChatRequest, ChatResponse
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User

router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
def chat(
    body: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not body.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty",
        )

    try:
        agent = build_agent(db, current_user)
        result = agent.invoke({"messages": [HumanMessage(content=body.message)]})
        response_text = result["messages"][-1].content
        return ChatResponse(response=response_text or "")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI service unavailable: {e}",
        )
