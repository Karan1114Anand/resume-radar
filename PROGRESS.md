# ResumeRadar — Progress

## Current phase

Phase 4 (polish & deploy) — in progress.

- Frontend theme: **vintage-paper office**, normal step flow (NOT a game — a
  walk-around top-down build and then a raycaster FPS were both tried and then
  reverted at the owner's request). Cream / parchment / `corp` blue palette,
  Special Elite + Bitter fonts, no brand names.
  - `app/page.tsx` — 3-step flow: Upload → Confirm → Preferences, with a Stepper,
    the `OfficeScene` SVG desk illustration, Reception/Sales/Corner-Office
    how-it-works cards, and the `TalkingHead` confessional card.
  - `app/analyze/page.tsx` — matches page: `FilterBar` + `JobCard` list, empty /
    notFound / error states.
  - `JobCard`: expanding a card makes **no API call** — it shows job detail +
    listing link + a "Draft my outreach" button. That button fires ONE call
    (`/draft-outreach`), result cached in sessionStorage per job. "Regenerate"
    reuses the found contact (`/generate-email`, email only).
  - `lib/storage.ts` — `INPUTS_KEY` / `JOBS_KEY` + `readDraft`/`writeDraft`
    (per-job outreach cache, `resumeradar:draft:<url>`).
  - `components/`: `Button`, `Nav`, `Footer` (office-icon rows), `UploadZone`,
    `ProfileSummaryCard`, `LoadingScreen`, `FilterBar`, `JobCard`,
    `MatchScoreBadge`, `ContactCard`, `EmailPreview`, `OfficeScene`, `TalkingHead`.
  - `app/icon.svg` — radar favicon (kept from the reverted work; fixes a 404).
- Verified in headless Chrome + `npm run build` clean after the revert.
- Backend: **text generation and web search split into two services.**
  `services/llm.py` = Groq structured JSON only (no network search).
  `services/search.py` = **Tavily Search API** (`TAVILY_API_KEY`; free 1,000/mo,
  no credit card — Brave was rejected for requiring a card). `search_many` runs
  queries in parallel + de-dupes. `_job_queries` = 4, `_contact_queries` = 2,
  `per_query` 8. Best-effort: `[]` on failure or missing key.
  Routes orchestrate: build queries → `search.search_many()` → `llm.rank_jobs()`
  / `llm.extract_contact()`. All 4 LLM calls use strict json_schema.
  `TAVILY_API_KEY` is set locally.
- **LLM-call reduction (for public traffic):** the per-job flow used to auto-fire
  `find-contact` + `generate-email` (2 calls) the moment a user *expanded* a card.
  Now: expand = 0 calls; a deliberate "Draft my outreach" button fires ONE new
  `POST /draft-outreach` (`{profile, job}` → `{contact, email}`) that does contact
  extraction + email in a single model call. Browsing 5 roles + drafting 1 went
  from ~12 calls to 3 (parse + match + 1 draft). Drafts cached per job in
  sessionStorage. `RATE_LIMIT_MAX` 3 → 8, shared bucket across match + draft.
  `/find-contact` and `/generate-email` still exist (email route powers "Regenerate").
- **Email POV fixed:** `generate_email` + `draft_outreach` force strict first
  person ("I", "my"), no inflating experience. `match_reason` → second person.
- **Name-mangling fixed:** the 20b model rewrote unusual names ("Advitha" →
  "Adithya/Adithha") when it wrote the sign-off. Now the model is told to write
  NO name/closing/signature; `_finalize_email` strips whatever it adds anyway
  and appends `Best regards,\n{full_name}\n{email}\n{phone}` verbatim from the
  parsed profile, plus scrubs names from the subject (synthesised fallback).
  Unit + live tested.
- **Verified live 2026-08-31:** parse 200; match 200 (2nd-person reasons, real
  postings, ~10s); draft-outreach 200 (first-person email + named contact, ~6s,
  ONE call). Tavily quality beats the old DuckDuckGo path.
- Switched `LLM_MODEL` to `openai/gpt-oss-20b` (free tier gives it ~500k TPD vs
  200k for 120b) on a fresh Groq key/project. **Full pipeline verified live
  2026-08-31:** parse-resume 200, match-jobs 200 (9 jobs, ~10s), find-contact
  200 ({found:false} graceful path), generate-email 200 (~2s, good quality).
- Known quality gaps (prompt-tuning, not blockers): `company` sometimes empty
  when a match comes from an aggregator page; LLM occasionally overstates YoE.

### Security review (2026-08-31) — fixes applied

- **Deps:** `pip-audit` flagged 53 vulns (pypdf 5.1.0 = DoS-via-crafted-PDF class;
  python-multipart, python-dotenv, starlette). Upgraded: fastapi 0.141.1 /
  starlette 1.6.0 / pypdf 6.16.2 / python-multipart 0.0.32 / python-dotenv 1.2.3
  → `pip-audit` now clean. Full pipeline re-verified on the new stack. Frontend
  `next` 14.2.33 → 14.2.35.
- **Rate limiter was prod-broken:** `request.client.host` behind Render's proxy
  is a constant → whole service shared one bucket. Now reads last `X-Forwarded-For`
  hop; `render.yaml` start cmd adds `--proxy-headers --forwarded-allow-ips='*'`.
  Verified per-IP isolation via XFF.
- **All 5 LLM-backed routes now `Depends(rate_limit)`** (was match-jobs only) —
  one shared per-IP bucket protects the Groq quota from direct-API abuse.
- **Body-size middleware:** any request > 6 MB → 413 before buffering.
- **parse-resume hardening:** `%PDF-` magic-byte check, 30-page cap, 60k-char
  text cap before the LLM.
- **URL-scheme guard (`lib/url.ts`):** job/contact URLs come from LLM output; a
  crafted résumé could prompt-inject a `javascript:`/`data:` link. `externalHref`
  allows only http(s); `mailtoHref` validates the address shape.
- **CORS tightened:** `allow_credentials=False`, methods `GET/POST/OPTIONS`,
  headers `Content-Type` only; `ALLOWED_ORIGIN` supports a comma list.

Known/accepted: postcss advisories persist (transitive, build-time only, no
runtime path for a static Next site; clearing them needs next@16 — not worth the
break). No auth by design (public tool); rate limiter is in-process (fine for one
Render instance, needs Redis if scaled out).

Still to do: **git commit (no commits yet)**, then Render + Vercel deploy.

## Phases completed

- [x] Phase 1 — Scaffold
- [x] Phase 2 — Backend API
- [x] Phase 3 — Frontend
- [~] Phase 4 — Polish & deploy config (theme done, search/LLM split done;
      deploy + git commit pending)

## Files created

Root: `CLAUDE.md`, `PROGRESS.md`, `PRD_ResumeRadar.txt` (copy of `PRD.txt`),
`render.yaml`, `.gitignore`, `README.md`

Backend (`backend/`): `main.py` (CORS + `/health` + routers), `requirements.txt`,
`.env`, `.env.example`, `routes/__init__.py`, `routes/parse.py`, `routes/match.py`,
`routes/contact.py`, `routes/email.py`, `models.py`, `ratelimit.py`,
`services/__init__.py`, `services/llm.py` (Groq client + the 4 LLM calls).
Deps installed into `backend/.venv`.

Frontend (`frontend/`): configs as before, plus:
`app/layout.tsx` (Inter, Nav), `app/globals.css`, `app/page.tsx` (3-step
upload/confirm/preferences flow), `app/analyze/page.tsx` (results, filters,
caching, empty/error/not-found states), `lib/api.ts` (axios layer, all 4
routes + health), `lib/storage.ts` (sessionStorage for inputs + job cache),
`components/`: `Button`, `Nav`, `UploadZone` (react-dropzone), `ProfileSummaryCard`,
`LoadingScreen`, `FilterBar`, `JobCard` (lazy-loads contact + email on expand),
`MatchScoreBadge`, `ContactCard`, `EmailPreview` (copy / regenerate).

**UI theme: vintage-paper / "The Office" (Dunder Mifflin).** Cream + manila +
Mifflin-blue palette, `Special Elite` (typewriter) for headings/labels + `Bitter`
(slab serif) for body — both via `next/font/google`. Soft paper shadows
(`shadow-paper/card/lift`), ruled-paper body background, rubber-stamp badges,
memo/personnel-file framing, paperclip + dashed-border motifs. All Tailwind
utilities (arbitrary values for textures); `tailwind.config.ts` holds the tokens.

## Verified

- `GET  http://localhost:8000/health` → `{"status":"ok"}`; `backend/main.py` imports clean
- Frontend `npm run build` → passes (5 static routes, no type/lint errors)
- `render.yaml` startCommand now binds `$PORT` (Render-provided), not hardcoded 8000

### End-to-end live smoke test (real GROQ_API_KEY, 2026-08-30)

- `POST /parse-resume` (Priya Sharma test PDF) → 200, clean structured profile
- `POST /match-jobs` (Bangalore/Remote, Full-time) → 200, 2 real listings w/ scores (~23s)
- `POST /find-contact` (GyanSys Inc.) → 200, found=true, Likely confidence (~41s)
- `POST /generate-email` → **blocked by Groq free-tier daily token cap (200k TPD)**,
  not a code bug. Code path is structurally identical to `/parse-resume` (both use
  `_structured`), so considered verified by equivalence. Retest after quota reset
  or on a paid Groq tier.

Added: `main.py` exception handlers for `groq.RateLimitError` → 429 (friendly
"AI service is busy" message) and `groq.APIStatusError` → 502; all 4 routes
now re-raise `APIStatusError` past their generic catch. Verified: `/generate-email`
under exhausted quota returns `429 {"detail":"The AI service is busy..."}`.

Run servers: `cd backend && .venv/bin/uvicorn main:app --reload` and
`cd frontend && npm run dev`.

## Phase 2 — what was built

New backend files: `models.py` (Pydantic schemas), `ratelimit.py` (in-memory
per-IP limiter, dependency), fleshed-out `routes/*.py`, `services/llm.py`.

**LLM provider: Groq, model `openai/gpt-oss-120b` via the `groq` SDK.**
(Owner switched from Claude after Phase 2 was first written; see Deviations.)

- `services/llm.py`:
  - `extract_profile` + `generate_email` — `response_format` json_schema (strict)
  - `match_jobs` + `find_contact` — Groq server-side `browser_search` tool
    (`tool_choice="required"`, `reasoning_effort="low"`), JSON parsed from text
    via `_json_from_text` (browser_search can't be combined with structured outputs)
- `POST /parse-resume`: 5 MB cap, PDF content-type check, pypdf text extract,
  <150-char guard → 422 (scanned/low-text), LLM → `ResumeProfile`.
- `POST /match-jobs`: `Depends(rate_limit)` (3 / IP / 60 min → 429), validates
  rows, skips malformed, 404 when none survive.
- `POST /find-contact`: returns `{found:false}` when no real contact.
- `POST /generate-email`: `{subject, body}`.

### Verified (no GROQ_API_KEY in this env — live LLM calls untested)

- `/health` → ok; `/match-jobs {}` → 422; `/parse-resume` no file → 422;
  `/find-contact` valid body → 502 (fake key, error path OK); `_json_from_text`
  handles fenced / prose-wrapped / bare JSON.
- **TODO for user:** put a real key in `backend/.env` as `GROQ_API_KEY=gsk_...`
  and smoke-test each route end to end.

## Deviations from PRD

- **LLM provider:** PRD/prompt specify Claude (`claude-sonnet-4-6`). Owner is
  using **Groq `openai/gpt-oss-120b`**, so `services/llm.py` uses the `groq` SDK.
  Job/contact web search uses Groq's `browser_search` built-in tool instead of
  Anthropic's `web_search`. `GROQ_API_KEY` replaces `ANTHROPIC_API_KEY`.
- **Backend venv:** host Python is PEP-668 externally-managed, so deps live in
  `backend/.venv` rather than a bare `pip install`.
- **Next.js version:** pinned `next@^14.2.33` (npm flags a Dec 2025 advisory for
  the 14.2.x line; 14.2.33 is the latest 14.2 patch available).
- Landing/results pages are placeholders until Phase 3.
- `match-jobs` / `find-contact` use Groq `browser_search` and parse JSON from the
  text response (browser_search + structured outputs can't be combined).
- Rate limiter is in-process (fine for single Render instance; needs Redis if
  scaled out).
