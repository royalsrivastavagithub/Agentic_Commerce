from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_ollama import ChatOllama
from sqlalchemy.orm import Session

from app.ai.prompts import SYSTEM_PROMPT
from app.ai.tools import make_tools
from app.models.product import Product
from app.models.user import User


def get_model(temperature: float = 0.1) -> ChatOllama:
    return ChatOllama(model="gemma4", temperature=temperature)


def _product_to_dict(p: Product) -> dict:
    return {
        "id": p.id,
        "title": p.title,
        "price": p.price,
        "thumbnail": p.thumbnail,
        "rating": p.rating,
        "discount_percentage": p.discount_percentage,
        "brand": p.brand,
        "description": p.description,
        "review_count": p.review_count,
        "stock": p.stock,
    }


def run_chat(db: Session, user: User, history: list[dict], current_message: str) -> tuple[str, list[dict]]:
    model = get_model()
    found_products: list[Product] = []
    tools = make_tools(db, user, found_products)

    messages = [SystemMessage(content=SYSTEM_PROMPT)]
    for h in history:
        if h["role"] == "user":
            messages.append(HumanMessage(content=h["content"]))
        else:
            messages.append(AIMessage(content=h["content"]))
    messages.append(HumanMessage(content=current_message))

    model_with_tools = model.bind_tools(tools)

    for _ in range(6):
        result = model_with_tools.invoke(messages)

        if not result.tool_calls:
            return result.content or "", [_product_to_dict(p) for p in found_products]

        messages.append(result)
        for tc in result.tool_calls:
            tool_result = ""
            for t in tools:
                if t.name == tc["name"]:
                    tool_result = t.invoke(tc["args"]) or ""
                    break
            messages.append(ToolMessage(content=str(tool_result), tool_call_id=tc["id"]))

    return "I'm having trouble processing your request. Please try again.", [_product_to_dict(p) for p in found_products]
