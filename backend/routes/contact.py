from fastapi import APIRouter, Depends, HTTPException
from groq import APIStatusError

from models import Contact, FindContactRequest
from ratelimit import rate_limit
from services import llm, search

router = APIRouter()


def _contact_queries(company: str, job_title: str) -> list[str]:
    return [
        f'"{company}" recruiter OR "talent acquisition" linkedin',
        f'"{company}" hiring manager OR "people team" {job_title}',
    ]


@router.post("/find-contact", response_model=Contact, dependencies=[Depends(rate_limit)])
async def find_contact(req: FindContactRequest) -> Contact:
    results = search.search_many(_contact_queries(req.company, req.job_title), per_query=8)
    if not results:
        return Contact(found=False)

    try:
        data = llm.extract_contact(req.company, req.job_title, results)
    except APIStatusError:
        raise  # handled globally in main.py
    except Exception:  # noqa: BLE001
        raise HTTPException(status_code=502, detail="Contact lookup failed. Please try again.")
    return Contact.model_validate(data)
