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

## Notes

- Text generation (Groq) and web search (Tavily) are separate services in
  `backend/services/`. Routes orchestrate the two; the LLM never fetches URLs.
- Free-tier limits apply: Groq `gpt-oss-20b` ~500k tokens/day, Tavily 1,000
  searches/month. For real public traffic a paid Groq plan is required.
