import logging
from typing import Literal

from fastapi import APIRouter, HTTPException, Request
from litellm import completion
from pydantic import BaseModel, Field

from .config import Settings

log = logging.getLogger("prelegal.chat")

router = APIRouter()

MODEL = "openrouter/openai/gpt-oss-120b:free"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}


class Party(BaseModel):
    company: str | None = None
    print_name: str | None = None
    title: str | None = None
    notice_address: str | None = None


class NDAFields(BaseModel):
    purpose: str | None = None
    effective_date: str | None = Field(default=None, description="ISO date YYYY-MM-DD")
    mnda_term_kind: Literal["expires", "until_terminated"] | None = None
    mnda_term_years: int | None = None
    confidentiality_term_kind: Literal["years", "perpetuity"] | None = None
    confidentiality_term_years: int | None = None
    governing_law_state: str | None = None
    jurisdiction: str | None = None
    party1: Party | None = None
    party2: Party | None = None


class ChatTurn(BaseModel):
    assistant_message: str
    extracted_fields: NDAFields
    document_ready: bool


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    current_fields: NDAFields


SYSTEM_PROMPT = """You are an assistant helping a user draft a Common Paper Mutual Non-Disclosure Agreement (MNDA).

You collect the information needed to fill the NDA's cover page through a friendly, guided conversation:

Required fields:
- purpose: a one-sentence description of how the parties will use each other's confidential information
- effective_date: ISO date (YYYY-MM-DD)
- mnda_term_kind: "expires" (after N years) or "until_terminated" (continues until either party terminates)
- mnda_term_years: integer, only if mnda_term_kind == "expires"
- confidentiality_term_kind: "years" (confidentiality lasts N years) or "perpetuity"
- confidentiality_term_years: integer, only if confidentiality_term_kind == "years"
- governing_law_state: US state name (e.g. "Delaware")
- jurisdiction: city/county + state (e.g. "New Castle County, Delaware")
- party1, party2: each has company, print_name, title, notice_address (email or postal address)

How to behave:
- On the first turn, briefly introduce yourself and ask about the purpose. One question per turn unless the user volunteers more.
- Accept batched answers and extract everything you learn.
- Walk through the fields in a sensible order: purpose -> parties -> effective date -> term -> confidentiality term -> governing law/jurisdiction.
- Use today's date as the default effective date if the user doesn't care.
- Suggest sensible defaults (e.g. "1 year", "Delaware") if the user is unsure.
- Be concise. Don't repeat the entire form; just ask for what's missing.

Output rules (ChatTurn JSON):
- assistant_message: your next message to the user (plain text, friendly, no markdown).
- extracted_fields: every field you have learned at any point in the conversation, including those carried over from earlier turns. Only include fields the user has actually provided or confirmed; omit (null) anything you have not yet learned.
- document_ready: true once every required field is populated and the user has had a chance to review. Once true, invite the user to download the PDF; they can still ask for revisions.
"""


def _build_messages(req: ChatRequest) -> list[dict]:
    system = (
        SYSTEM_PROMPT
        + "\n\nFields collected so far (carry these forward; do not drop them):\n"
        + req.current_fields.model_dump_json()
    )
    history = [{"role": "system", "content": system}]
    if not req.messages:
        history.append(
            {"role": "user", "content": "Start the conversation by greeting me and asking the first question."}
        )
    else:
        history.extend({"role": m.role, "content": m.content} for m in req.messages)
    return history


@router.post("", response_model=ChatTurn)
def chat(body: ChatRequest, request: Request) -> ChatTurn:
    settings: Settings = request.app.state.settings
    if not settings.openrouter_api_key:
        raise HTTPException(
            status_code=503,
            detail="AI chat is not configured (OPENROUTER_API_KEY is missing).",
        )
    try:
        response = completion(
            model=MODEL,
            messages=_build_messages(body),
            response_format=ChatTurn,
            reasoning_effort="low",
            extra_body=EXTRA_BODY,
            api_key=settings.openrouter_api_key,
        )
        raw = response.choices[0].message.content
        return ChatTurn.model_validate_json(raw)
    except HTTPException:
        raise
    except Exception as exc:
        log.exception("chat completion failed")
        raise HTTPException(status_code=502, detail="AI chat upstream error") from exc
