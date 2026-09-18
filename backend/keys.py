"""Per-request API keys, with the server's own keys as a rate-limited fallback.

A visitor can supply their own Groq / Tavily keys via the ``X-Groq-Key`` and
``X-Tavily-Key`` headers. When both are present the request runs entirely on
their quota, so it bypasses the per-IP rate limit; otherwise it falls back to
the server's keys from the environment and stays rate limited.

Keys are used for the lifetime of one request and never stored or logged.
"""

from __future__ import annotations

import os
from dataclasses import dataclass

from fastapi import HTTPException, Request

from ratelimit import rate_limit

GROQ_HEADER = "x-groq-key"
TAVILY_HEADER = "x-tavily-key"

# Groq keys look like "gsk_..."; Tavily like "tvly-...". We only sanity-check
# length and charset — the provider is the real authority on validity.
_MIN_KEY_CHARS = 20
_MAX_KEY_CHARS = 200


@dataclass(frozen=True)
class Keys:
    """Resolved credentials for a single request."""

    groq: str
    tavily: str
    own: bool  # True when the caller supplied both keys themselves


def _clean(raw: str | None, label: str) -> str:
    if raw is None:
        return ""
    key = raw.strip()
    if not key:
        return ""
    if not (_MIN_KEY_CHARS <= len(key) <= _MAX_KEY_CHARS) or not key.isprintable():
        raise HTTPException(status_code=400, detail=f"That {label} API key looks malformed.")
    return key


def resolve(request: Request) -> Keys:
    """FastAPI dependency: caller's keys if both are given, else the server's.

    Rate limiting applies only to requests running on the server's keys. Supplying
    just one key is rejected rather than silently half-billed to the server, which
    would let a caller drain one quota while appearing to bring their own.
    """
    groq = _clean(request.headers.get(GROQ_HEADER), "Groq")
    tavily = _clean(request.headers.get(TAVILY_HEADER), "Tavily")

    if groq and tavily:
        return Keys(groq=groq, tavily=tavily, own=True)
    if groq or tavily:
        raise HTTPException(
            status_code=400,
            detail="Provide both a Groq and a Tavily key, or neither to use the shared demo quota.",
        )

    rate_limit(request)

    server_groq = os.getenv("GROQ_API_KEY", "").strip()
    server_tavily = os.getenv("TAVILY_API_KEY", "").strip()
    if not server_groq or not server_tavily:
        raise HTTPException(
            status_code=503,
            detail="The shared demo quota is unavailable. Add your own Groq and Tavily "
            "API keys to continue.",
        )
    return Keys(groq=server_groq, tavily=server_tavily, own=False)
