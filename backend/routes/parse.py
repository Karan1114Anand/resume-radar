import io

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pypdf import PdfReader

from models import ResumeProfile
from groq import APIStatusError

from ratelimit import rate_limit
from services import llm

router = APIRouter()

MAX_BYTES = 5 * 1024 * 1024  # PRD 6.1: PDFs up to 5 MB
MAX_PAGES = 30  # a résumé is a handful of pages; caps parser CPU on crafted PDFs
MAX_TEXT_CHARS = 60_000  # trim before sending to the LLM (token cost / prompt abuse)
MIN_TEXT_CHARS = 150  # below this we treat the PDF as unparseable (scanned image)


@router.post("/parse-resume", response_model=ResumeProfile, dependencies=[Depends(rate_limit)])
async def parse_resume(file: UploadFile = File(...)) -> ResumeProfile:
    if (file.content_type or "").lower() not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(status_code=400, detail="Please upload a PDF file.")
    if file.size is not None and file.size > MAX_BYTES:
        raise HTTPException(status_code=413, detail="PDF exceeds the 5 MB limit.")

    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="PDF exceeds the 5 MB limit.")
    if not data:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if data[:5] != b"%PDF-":
        raise HTTPException(status_code=400, detail="That file is not a valid PDF.")

    try:
        reader = PdfReader(io.BytesIO(data))
        if len(reader.pages) > MAX_PAGES:
            raise HTTPException(
                status_code=422,
                detail=f"That PDF has more than {MAX_PAGES} pages — please upload a résumé.",
            )
        text = "\n".join(page.extract_text() or "" for page in reader.pages).strip()[:MAX_TEXT_CHARS]
    except HTTPException:
        raise
    except Exception:  # noqa: BLE001 - any parse failure -> re-upload
        raise HTTPException(
            status_code=422,
            detail="Could not read that PDF. Please upload a text-based (non-scanned) resume.",
        )

    if len(text) < MIN_TEXT_CHARS:
        raise HTTPException(
            status_code=422,
            detail="This PDF has too little selectable text (it may be a scan). "
            "Please upload a text-based resume.",
        )

    try:
        profile = llm.extract_profile(text)
    except APIStatusError:
        raise  # handled globally in main.py
    except Exception:  # noqa: BLE001
        raise HTTPException(status_code=502, detail="Resume analysis failed. Please try again.")

    return ResumeProfile.model_validate(profile)
