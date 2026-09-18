from fastapi import APIRouter, Depends, HTTPException

from models import GeneratedEmail, GenerateEmailRequest
from groq import APIStatusError

import keys
from services import llm

router = APIRouter()


@router.post("/generate-email", response_model=GeneratedEmail)
async def generate_email(
    req: GenerateEmailRequest,
    creds: keys.Keys = Depends(keys.resolve),
) -> GeneratedEmail:
    try:
        data = llm.generate_email(
            creds.groq, req.profile.model_dump(), req.job.model_dump(), req.contact.model_dump()
        )
    except APIStatusError:
        raise  # handled globally in main.py
    except Exception:  # noqa: BLE001
        raise HTTPException(status_code=502, detail="Email generation failed. Please try again.")
    return GeneratedEmail.model_validate(data)
