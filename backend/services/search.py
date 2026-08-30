"""Web search, split out from text generation.

Uses the Tavily Search API (https://tavily.com). Needs ``TAVILY_API_KEY`` (free
tier: 1,000 searches/month, no card). Results are plain {title, url, snippet}
dicts that the LLM layer turns into structured job / contact data — no ranking
here.
"""

from __future__ import annotations

import concurrent.futures
import os
from typing import TypedDict

import httpx

_ENDPOINT = "https://api.tavily.com/search"


class SearchResult(TypedDict):
    title: str
    url: str
    snippet: str


def search(query: str, max_results: int = 8) -> list[SearchResult]:
    """Run one Tavily search. Returns [] on any failure rather than raising."""
    key = os.getenv("TAVILY_API_KEY")
    if not key:
        print("search: TAVILY_API_KEY not set — returning no results")
        return []

    try:
        resp = httpx.post(
            _ENDPOINT,
            json={
                "query": query,
                "max_results": min(max(max_results, 1), 20),
                "search_depth": "basic",
                "include_answer": False,
                "include_raw_content": False,
            },
            headers={"Authorization": f"Bearer {key}"},
            timeout=20.0,
        )
        resp.raise_for_status()
        rows = resp.json().get("results", [])
    except Exception:  # noqa: BLE001 - search is best-effort
        return []

    results: list[SearchResult] = []
    for row in rows or []:
        url = (row.get("url") or "").strip()
        if not url:
            continue
        results.append(
            {
                "title": (row.get("title") or "").strip(),
                "url": url,
                "snippet": (row.get("content") or "").strip(),
            }
        )
    return results


def search_many(queries: list[str], per_query: int = 6) -> list[SearchResult]:
    """Fan out several queries in parallel, de-duplicate by URL, preserve order."""
    seen: set[str] = set()
    merged: list[SearchResult] = []

    with concurrent.futures.ThreadPoolExecutor(max_workers=min(len(queries) or 1, 5)) as pool:
        for batch in pool.map(lambda q: search(q, per_query), queries):
            for item in batch:
                if item["url"] in seen:
                    continue
                seen.add(item["url"])
                merged.append(item)
    return merged


def as_context(results: list[SearchResult], limit: int = 16, snippet_chars: int = 220) -> str:
    """Render results as a compact numbered block for an LLM prompt."""
    lines = []
    for i, r in enumerate(results[:limit], 1):
        snippet = r["snippet"][:snippet_chars].rstrip()
        lines.append(f"[{i}] {r['title']}\n{r['url']}\n{snippet}")
    return "\n\n".join(lines) if lines else "(no search results)"
