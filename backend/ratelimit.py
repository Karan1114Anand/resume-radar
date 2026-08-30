"""In-memory per-IP rate limiter.

Sufficient for a single-instance prototype (matches PRD 9: "middleware on
Render"). Swap for Redis if the backend scales horizontally.
"""

from __future__ import annotations

import os
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request

_MAX = int(os.getenv("RATE_LIMIT_MAX", "8"))
_WINDOW_SECONDS = int(os.getenv("RATE_LIMIT_WINDOW_MINUTES", "60")) * 60

_hits: dict[str, deque[float]] = defaultdict(deque)


def _client_ip(request: Request) -> str:
    """Real client IP.

    Render / Vercel terminate TLS at their edge and forward the request with an
    ``X-Forwarded-For`` header, appending the connecting IP as the last entry.
    Without this, ``request.client.host`` is the platform's proxy address —
    constant for every visitor — which would make the whole service share one
    rate-limit bucket. Take the last hop (the address the trusted proxy saw);
    fall back to the socket peer for local / direct requests.
    """
    xff = request.headers.get("x-forwarded-for")
    if xff:
        parts = [p.strip() for p in xff.split(",") if p.strip()]
        if parts:
            return parts[-1]
    return request.client.host if request.client else "unknown"


def rate_limit(request: Request) -> None:
    """FastAPI dependency: raise 429 when an IP exceeds the window budget."""
    ip = _client_ip(request)
    now = time.time()
    bucket = _hits[ip]
    while bucket and bucket[0] <= now - _WINDOW_SECONDS:
        bucket.popleft()
    if len(bucket) >= _MAX:
        retry_after = int(bucket[0] + _WINDOW_SECONDS - now) + 1
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit reached ({_MAX} per {_WINDOW_SECONDS // 60} min). "
            f"Try again in {retry_after // 60 + 1} min.",
            headers={"Retry-After": str(retry_after)},
        )
    bucket.append(now)
