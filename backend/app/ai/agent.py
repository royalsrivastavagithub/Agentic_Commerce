from langchain_ollama import ChatOllama
from langgraph.prebuilt import create_react_agent
from sqlalchemy.orm import Session

from app.ai.prompts import SYSTEM_PROMPT
from app.ai.tools import make_tools
from app.models.user import User


def get_model(temperature: float = 0.1) -> ChatOllama:
    return ChatOllama(model="gemma4", temperature=temperature)


def build_agent(db: Session, user: User):
    model = get_model()
    tools = make_tools(db, user)
    return create_react_agent(model, tools, prompt=SYSTEM_PROMPT)
