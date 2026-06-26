from datetime import datetime

from sqlalchemy.orm import Session

from app.models.conversation import Conversation, ConversationMessage


MAX_HISTORY = 6


class ConversationState:
    def __init__(self) -> None:
        self.last_results: list[int] = []
        self.selected_product: int | None = None
        self.last_intent: str | None = None


def get_or_create_conversation(db: Session, user_id: int, conversation_id: int | None = None) -> Conversation:
    if conversation_id:
        conv = db.query(Conversation).filter(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id,
        ).first()
        if conv:
            return conv

    conv = Conversation(user_id=user_id)
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


def add_message(
    db: Session,
    conversation_id: int,
    role: str,
    content: str,
    product_ids: list[int] | None = None,
) -> ConversationMessage:
    msg = ConversationMessage(
        conversation_id=conversation_id,
        role=role,
        content=content,
        product_ids=product_ids,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def get_recent_history(db: Session, conversation_id: int, keep_last: int = MAX_HISTORY) -> list[dict]:
    messages = (
        db.query(ConversationMessage)
        .filter(ConversationMessage.conversation_id == conversation_id)
        .order_by(ConversationMessage.id.desc())
        .limit(keep_last)
        .all()
    )
    messages.reverse()
    return [{"role": m.role, "content": m.content, "product_ids": m.product_ids or []} for m in messages]


def get_message_product_ids(db: Session, conversation_id: int) -> list[int]:
    ids: list[int] = []
    messages = (
        db.query(ConversationMessage)
        .filter(ConversationMessage.conversation_id == conversation_id)
        .order_by(ConversationMessage.id.desc())
        .limit(MAX_HISTORY)
        .all()
    )
    for m in messages:
        if m.product_ids:
            ids.extend(m.product_ids)
    return ids
