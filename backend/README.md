---
title: ResumeRadar API
emoji: 📡
colorFrom: blue
colorTo: gray
sdk: gradio
sdk_version: 5.9.1
app_file: app.py
python_version: "3.12"
pinned: false
---

# ResumeRadar API

FastAPI backend for ResumeRadar — resume parsing, job matching, hiring-contact
lookup and outreach-email drafting. Text generation runs on Groq; web search on
Tavily. See the project repository for full documentation.

The Space runs the **Gradio SDK** (this account has no Docker SDK access):
`app.py` mounts a small status page onto the FastAPI app in `main.py` and serves
it with uvicorn on port 7860. All real endpoints are the FastAPI routes below.

## Required secrets / variables

| Name | Kind | Value |
| --- | --- | --- |
| `GROQ_API_KEY` | secret | your Groq API key (`gsk_...`) |
| `TAVILY_API_KEY` | secret | your Tavily API key (`tvly-...`) |
| `ALLOWED_ORIGIN` | variable | the frontend origin, e.g. `https://resume-radar.vercel.app` (comma-separated for more than one; no trailing slash) |
| `LLM_MODEL` | variable | `openai/gpt-oss-20b` |
| `RATE_LIMIT_MAX` | variable | `8` |
| `RATE_LIMIT_WINDOW_MINUTES` | variable | `60` |

Health check: `GET /health` → `{"status":"ok"}`
