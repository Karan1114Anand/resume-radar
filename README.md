# ResumeRadar

Upload your resume. Radar finds the rest.

ResumeRadar is an AI-powered web app: upload a PDF resume, pick one or more
locations, and get the top 10 matching jobs/internships with a match score and
reasoning, a likely hiring contact for each role, and a personalized first-person
outreach email ready to copy and send.

## Structure

- `frontend/` — Next.js 14 app (Vercel)
- `backend/` — FastAPI service (Render)

## Local development

Backend (uses a venv — host Python may be externally managed):
```
cd backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
cp .env.example .env          # fill in GROQ_API_KEY and TAVILY_API_KEY
.venv/bin/uvicorn main:app --reload     # http://localhost:8000
```

Frontend (separate terminal):
```
cd frontend
npm install
cp .env.local.example .env.local
npm run dev                   # http://localhost:3000
```

## Deployment

- **Backend → Render:** `render.yaml` at the repo root defines the web service.
  In the Render dashboard set the secrets marked `sync: false`:
  `GROQ_API_KEY`, `TAVILY_API_KEY`, and `ALLOWED_ORIGIN` (your Vercel URL,
  comma-separated if more than one, no trailing slash).
- **Frontend → Vercel:** set the project root directory to `frontend/`,
  framework Next.js. Set `NEXT_PUBLIC_API_URL` to the Render service URL.

Deploy the backend first so you have its URL for `NEXT_PUBLIC_API_URL`, then set
`ALLOWED_ORIGIN` on Render to the final Vercel URL and redeploy the backend.

## Environment variables

Frontend: `NEXT_PUBLIC_API_URL`

Backend: `GROQ_API_KEY`, `TAVILY_API_KEY`, `LLM_MODEL` (default
`openai/gpt-oss-20b`), `ALLOWED_ORIGIN`, `RATE_LIMIT_MAX` (default 8),
`RATE_LIMIT_WINDOW_MINUTES` (default 60).

The backend keys are the *shared demo quota*. They are optional: with neither set,
the app still runs for visitors who supply their own keys, and anonymous requests
get a 503 explaining that.

## Job profiles

A search is scoped by *discipline* as well as by employment type. `POST
/match-jobs` takes `job_profile` alongside `job_type`; `GET /job-profiles` lists
the options. The catalogue lives in `backend/profiles.py`, mirrored for the UI in
`frontend/lib/profiles.ts`.

Profiles: GenAI / LLM, Machine Learning, Data Science, Data Engineering, MLOps /
Platform, Computer Vision, NLP, Backend / API, Full-Stack, AI Research — plus
`Auto`, which infers the discipline from the résumé's skills and past roles and
falls back to the old skill-derived query when nothing scores high enough.

Each profile holds several real-world title phrases, issued as **separate**
search queries rather than one OR-joined query. Probing Tavily showed a single
clean phrase returns far more job-board results than a synonym-stuffed boolean
one — `generative AI engineer internship Bangalore` gave 5/7 board hits versus
1/10 for the OR-expanded form, because semantic search dilutes when handed
alternatives. The selected discipline is also passed to the ranking prompt so
off-discipline listings are dropped rather than merely ranked lower.

## Bring-your-own API keys

Every route accepts optional `X-Groq-Key` and `X-Tavily-Key` headers
(`backend/keys.py`).

- **Both headers present** — the request runs entirely on the caller's quota and
  skips the per-IP rate limit.
- **Neither present** — the request falls back to the server's keys and is rate
  limited (`RATE_LIMIT_MAX` per `RATE_LIMIT_WINDOW_MINUTES`).
- **Only one present** — rejected with 400, so a caller cannot drain one of the
  server's quotas while appearing to bring their own.

Keys are used for the lifetime of a single request: never stored, never logged.
In the UI, the "Use your own API keys" panel on the upload page holds them in
`sessionStorage`, so they are gone when the tab closes, and `lib/api.ts` attaches
them to each request.

## Notes

- Text generation (Groq) and web search (Tavily) are separate services in
  `backend/services/`. Routes orchestrate the two; the LLM never fetches URLs.
- Free-tier limits apply: Groq `gpt-oss-20b` ~500k tokens/day, Tavily 1,000
  searches/month. The shared quota is there so a first-time visitor can try the
  app; heavier use is expected to bring its own keys.
