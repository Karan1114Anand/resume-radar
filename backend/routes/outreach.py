from fastapi import APIRouter, Depends, HTTPException
from groq import APIStatusError

import keys
from models import DraftOutreachRequest, OutreachDraft
from services import llm, search

router = APIRouter()


def _contact_queries(company: str, job_title: str) -> list[str]:
    return [
        f'"{company}" recruiter OR "talent acquisition" linkedin',
        f'"{company}" hiring manager OR "people team" {job_title}',
    ]


@router.post("/draft-outreach", response_model=OutreachDraft)
async def draft_outreach(
    req: DraftOutreachRequest,
    creds: keys.Keys = Depends(keys.resolve),
) -> OutreachDraft:
    """Contact lookup + outreach email in a single LLM call.

    The frontend uses this instead of hitting /find-contact and /generate-email
    separately, so a user spends one model call per role they act on rather than
    two per role they merely open.
    """
    results = search.search_many(
        creds.tavily, _contact_queries(req.job.company, req.job.title), per_query=8
    )
    try:
        data = llm.draft_outreach(
            creds.groq, req.profile.model_dump(), req.job.model_dump(), results
        )
    except APIStatusError:
        raise  # handled globally in main.py
    except Exception:  # noqa: BLE001
        raise HTTPException(status_code=502, detail="Could not draft your outreach. Please try again.")
    return OutreachDraft.model_validate(data)
