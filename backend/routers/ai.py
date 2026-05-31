from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, field_validator
import anthropic
import json
import re

from config import get_settings
from middleware.auth import get_current_user
from middleware.rate_limit import limiter
from models.user import User

settings = get_settings()
router = APIRouter(prefix="/ai", tags=["ai"])

SYSTEM_PROMPT = """You are a knowledgeable Islamic scholar assistant helping users understand the Quran.

Your role is STRICTLY limited to:
1. Explaining the meaning of a specific verse in clear, accessible language
2. Summarizing tafseer (commentary) provided to you
3. Simplifying classical Islamic scholarly language

You must NEVER:
- Invent or fabricate Quranic verses or hadith
- Issue fatwas or religious rulings
- Replace or paraphrase the Quran text itself
- Discuss political topics
- Go beyond the provided verse context

Always clarify that your explanation is a scholarly aid, not a religious ruling.
Keep responses concise (150-250 words). Be respectful and accurate."""

# Simple pattern to reject obviously injected prompts
_INJECTION_PATTERNS = re.compile(
    r"(ignore previous|disregard|new instruction|system prompt|you are now|jailbreak)",
    re.IGNORECASE,
)


class ExplainRequest(BaseModel):
    verse_key: str
    verse_text: str
    translation: str
    tafseer_context: str = ""

    @field_validator("verse_key")
    @classmethod
    def validate_verse_key(cls, v: str) -> str:
        parts = v.strip().split(":")
        if len(parts) != 2 or not all(p.isdigit() for p in parts):
            raise ValueError("Invalid verse key format")
        surah, ayah = int(parts[0]), int(parts[1])
        if not (1 <= surah <= 114) or ayah < 1:
            raise ValueError("Verse key out of range")
        return v.strip()

    @field_validator("verse_text", "translation")
    @classmethod
    def not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Field cannot be empty")
        if _INJECTION_PATTERNS.search(v):
            raise ValueError("Invalid content detected")
        return v[:2000]

    @field_validator("tafseer_context")
    @classmethod
    def cap_tafseer(cls, v: str) -> str:
        v = v.strip()
        if v and _INJECTION_PATTERNS.search(v):
            return ""   # silently drop suspicious tafseer context
        return v[:3000]


def _rate_key(request: Request) -> str:
    """Rate-limit by user ID from token if present, else by IP."""
    auth = request.headers.get("authorization", "")
    if auth.startswith("Bearer "):
        return f"ai:{auth[7:27]}"   # first 20 chars of token as key
    return f"ai:{request.client.host}"


@router.post("/explain")
@limiter.limit("10/minute", key_func=_rate_key)
async def explain(
    request: Request,
    body: ExplainRequest,
    user: User = Depends(get_current_user),
):
    if not settings.anthropic_api_key:
        raise HTTPException(status_code=503, detail="AI service not configured")

    user_message = (
        f"Please explain verse {body.verse_key} of the Quran.\n\n"
        f"Arabic text: {body.verse_text}\n"
        f"Translation: {body.translation}\n"
        + (f"Tafseer context: {body.tafseer_context}\n" if body.tafseer_context else "")
        + "\nProvide a clear, concise explanation suitable for someone learning about Islam."
    )

    async def stream():
        try:
            client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
            with client.messages.stream(
                model="claude-haiku-4-5-20251001",
                max_tokens=400,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": user_message}],
            ) as s:
                for text in s.text_stream:
                    yield f"data: {json.dumps({'text': text})}\n\n"
            yield "data: [DONE]\n\n"
        except Exception:
            yield f"data: {json.dumps({'error': 'AI service error'})}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")
