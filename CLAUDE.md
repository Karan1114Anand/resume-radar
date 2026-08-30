# ResumeRadar

AI-powered resume job matcher. Upload a PDF resume, pick a location, get matched
jobs/internships, a hiring contact, and a ready-to-send outreach email.

One-liner: "Upload your resume. Radar finds the rest."

## Monorepo structure

- `/frontend` — Next.js 14 (App Router), Tailwind CSS. Deploys to Vercel.
- `/backend` — FastAPI (Python 3.12). Deploys to Render.
- `PRD_ResumeRadar.txt` — source of truth for product decisions.

## Key commands

Frontend:
```
cd frontend && npm install && npm run dev     # http://localhost:3000
npm run build                                  # production build
```

Backend (uses a venv at `backend/.venv` — host Python is externally managed):
```
cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn main:app --reload              # http://localhost:8000
```

## Environment variables

Frontend (`frontend/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Backend (`backend/.env`):
```
GROQ_API_KEY=your_key_here
LLM_MODEL=openai/gpt-oss-20b
TAVILY_API_KEY=your_tavily_key_here
ALLOWED_ORIGIN=http://localhost:3000
RATE_LIMIT_MAX=8
RATE_LIMIT_WINDOW_MINUTES=60
```

## Stack

- Next.js 14, React 18, Tailwind CSS, TypeScript
- FastAPI, Uvicorn, Pydantic
- Text generation and web search are split into two services:
  - `backend/services/llm.py` — Groq, model from `LLM_MODEL` (`openai/gpt-oss-20b`),
    via the `groq` SDK. Text-in / structured-JSON-out only; never hits the network
    for search. All four features use `response_format` json_schema (strict). PRD
    named Claude; swapped to Groq per the owner.
  - `backend/services/search.py` — Tavily Search API (`TAVILY_API_KEY`; free tier
    1,000 searches/mo, no card). `search_many` runs queries in parallel + de-dupes.
    Best-effort: returns `[]` on failure or missing key, never raises.
- Job/contact flow: route builds queries → `search.search_many()` (parallel,
  de-duped) → `llm.rank_jobs()` / `llm.extract_contact()` scores/extracts
  structured data from the search results. LLM is told to use only URLs present
  in the results and never invent listings or people.
- `groq.RateLimitError` → 429, `groq.APIStatusError` → 502 (handlers in `main.py`;
  routes re-raise `APIStatusError` past their generic catch).

## Code style

- React: functional components only, hooks, no class components
- Async: `async/await`, never `.then()` chains
- No inline styles in JSX — Tailwind utility classes only, no custom CSS files
- Python: type hints on route signatures, Pydantic models for request/response
- Keep all LLM calls isolated in `backend/services/llm.py`; all web search in
  `backend/services/search.py`. Routes orchestrate the two — services never
  import each other except `llm.py` importing search's `SearchResult`/`as_context`.
- Keep all frontend backend calls isolated in `frontend/lib/api.ts`

## API route contracts

Every LLM-backed route (`/parse-resume`, `/match-jobs`, `/draft-outreach`,
`/find-contact`, `/generate-email`) depends on `rate_limit` and shares ONE
per-client-IP bucket: `RATE_LIMIT_MAX` requests / `RATE_LIMIT_WINDOW_MINUTES`,
`429` past that. Client IP is taken from the last `X-Forwarded-For` hop (Render's
proxy) with a socket-peer fallback.

- `GET  /health` → `{"status":"ok"}` (not rate limited)
- `POST /parse-resume` — multipart form, field `file` (PDF; `%PDF-` magic + 5 MB
  + 30-page caps) →
  `{full_name, email, phone, skills[], experience[{company,role,duration,description}],
    education[{institution,degree,year}], projects[]}`
- `POST /match-jobs` — `{profile, locations: string[], job_type: string}` →
  `[{title, company, location, work_mode, match_score, match_reason, posted_date, url}]`
  (top 10; `match_reason` is second-person, addressed to "you")
- `POST /draft-outreach` — `{profile, job}` → `{contact: {...}, email: {subject, body}}`
  — **one LLM call**: contact extraction + first-person outreach email. The
  frontend uses this (not `/find-contact` + `/generate-email`) to spend one model
  call per role acted on.
- `POST /find-contact` — `{company: string, job_title: string}` →
  `{found: bool, name?, title?, linkedin_url?, email?, confidence?}`
  (still available; superseded by `/draft-outreach` in the UI)
- `POST /generate-email` — `{profile, job, contact}` → `{subject: string, body: string}`
  (first-person, from the job seeker; used by the UI only for "regenerate")

`generate_email` / `draft_outreach` never let the model write the job seeker's
name (the small model mangles unusual names, e.g. "Advitha" → "Adithya"):
`_finalize_email` strips any closing/name the model added and appends
`Best regards,\n{full_name}\n{email}\n{phone}` verbatim from the profile, and
scrubs names out of the subject (with a synthesised fallback).

A global middleware rejects any request body over 6 MB with `413`.

## When compacting, always preserve

- Current phase
- List of completed files
- Pending tasks
- All API route contracts (above)
