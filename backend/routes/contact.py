from fastapi import APIRouter, Depends, HTTPException
from groq import APIStatusError

import keys
from models import Contact, FindContactRequest
from services import llm, search

router = APIRouter()


def _contact_queries(company: str, job_title: str) -> list[str]:
    return [
        f'"{company}" recruiter OR "talent acquisition" linkedin',
        f'"{company}" hiring manager OR "people team" {job_title}',
    ]


@router.post("/find-contact", response_model=Contact)
async def find_contact(
    req: FindContactRequest,
    creds: keys.Keys = Depends(keys.resolve),
) -> Contact:
    results = search.search_many(
        creds.tavily, _contact_queries(req.company, req.job_title), per_query=8
    )
    if not results:
        return Contact(found=False)

    try:
        data = llm.extract_contact(creds.groq, req.company, req.job_title, results)
    except APIStatusError:
        raise  # handled globally in main.py
    except Exception:  # noqa: BLE001
        raise HTTPException(status_code=502, detail="Contact lookup failed. Please try again.")
    return Contact.model_validate(data)
