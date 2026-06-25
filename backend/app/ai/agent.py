from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_ollama import ChatOllama
from sqlalchemy.orm import Session

from app.ai.prompts import SYSTEM_PROMPT
from app.ai.tools import make_tools
from app.models.user import User


def get_model(temperature: float = 0.1) -> ChatOllama:
    return ChatOllama(model="gemma4", temperature=temperature)


def run_chat(db: Session, user: User, history: list[dict], current_message: str) -> str:
    model = get_model()
    tools = make_tools(db, user)

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
            return result.content or ""

        messages.append(result)
        for tc in result.tool_calls:
            tool_result = ""
            for t in tools:
                if t.name == tc["name"]:
                    tool_result = t.invoke(tc["args"]) or ""
                    break
            messages.append(ToolMessage(content=str(tool_result), tool_call_id=tc["id"]))

    return "I'm having trouble processing your request. Please try again."
