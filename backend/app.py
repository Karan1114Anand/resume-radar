"""Hugging Face Spaces entrypoint (Gradio SDK).

This account can't use the Docker SDK, only Static or Gradio. The backend is a
FastAPI app, so we run it under the Gradio Space: HF executes `python app.py`,
which mounts a tiny Gradio status page onto the real FastAPI app and serves the
whole thing with uvicorn on port 7860.

All the actual API routes live in `main.py` — this file only wires it up for HF.
Locally you should still run `uvicorn main:app --reload`.
"""

import os

import gradio as gr
import uvicorn

from main import app as api

with gr.Blocks(title="ResumeRadar API") as status:
    gr.Markdown(
        "# ResumeRadar API\n"
        "FastAPI backend is running. This page is just a health indicator for "
        "the Hugging Face Space.\n\n"
        "- `GET /health` → `{\"status\":\"ok\"}`\n"
        "- API docs: `/docs`\n"
    )

app = gr.mount_gradio_app(api, status, path="/status")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        proxy_headers=True,
        forwarded_allow_ips="*",
    )
