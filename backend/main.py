import os

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from groq import APIStatusError, RateLimitError

load_dotenv()

app = FastAPI(title="ResumeRadar API")

# Hard ceiling on any request body. /parse-resume also enforces its own 5 MB PDF
# limit; this stops an oversized upload or a huge JSON profile from being buffered
# into memory before the route ever runs.
_MAX_BODY_BYTES = 6 * 1024 * 1024


@app.middleware("http")
async def _limit_body_size(request: Request, call_next):
    cl = request.headers.get("content-length")
    if cl is not None:
        try:
            if int(cl) > _MAX_BODY_BYTES:
                return JSONResponse(status_code=413, content={"detail": "Request body too large."})
        except ValueError:
            return JSONResponse(status_code=400, content={"detail": "Invalid Content-Length."})
    return await call_next(request)


@app.exception_handler(RateLimitError)
async def _groq_rate_limited(request: Request, exc: RateLimitError) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={"detail": "The AI service is busy right now. Please try again in a few minutes."},
    )


@app.exception_handler(APIStatusError)
async def _groq_api_error(request: Request, exc: APIStatusError) -> JSONResponse:
    return JSONResponse(
        status_code=502,
        content={"detail": "The AI service returned an error. Please try again."},
    )


ALLOWED_ORIGIN = os.getenv("ALLOWED_ORIGIN", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in ALLOWED_ORIGIN.split(",") if o.strip()],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


from routes import parse, match, contact, email, outreach

app.include_router(parse.router)
app.include_router(match.router)
app.include_router(contact.router)
app.include_router(email.router)
app.include_router(outreach.router)
