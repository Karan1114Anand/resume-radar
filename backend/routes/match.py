from fastapi import APIRouter, Depends, HTTPException
from groq import APIStatusError

from models import Job, MatchJobsRequest
from ratelimit import rate_limit
from services import llm, search

router = APIRouter()


def _job_queries(req: MatchJobsRequest) -> list[str]:
    profile = req.profile
    top_skills = ", ".join(profile.skills[:5])
    role = next((e.role for e in profile.experience if e.role), top_skills or "software")
    type_hint = {
        "Internship": "internship",
        "Full-time": "full time job",
        "Both": "job OR internship",
    }.get(req.job_type, "job")
    locations = req.locations or ["Remote"]

    primary_skill = top_skills.split(", ")[0] if top_skills else role

    queries: list[str] = []
    for loc in locations[:3]:
        queries.append(f"{role} {type_hint} {loc} hiring apply")
    queries.append(
        f"{primary_skill} {type_hint} {locations[0]} "
        "(site:boards.greenhouse.io OR site:jobs.lever.co OR site:linkedin.com/jobs/view OR site:wellfound.com)"
    )
    return queries


@router.post("/match-jobs", response_model=list[Job], dependencies=[Depends(rate_limit)])
async def match_jobs(req: MatchJobsRequest) -> list[Job]:
    results = search.search_many(_job_queries(req), per_query=8)
    if not results:
        raise HTTPException(
            status_code=404,
            detail="No job listings turned up for that search. Try broadening your locations or job type.",
        )

    try:
        raw = llm.rank_jobs(req.profile.model_dump(), req.locations, req.job_type, results)
    except APIStatusError:
        raise  # handled globally in main.py
    except Exception:  # noqa: BLE001
        raise HTTPException(status_code=502, detail="Job matching failed. Please try again.")

    jobs: list[Job] = []
    for item in raw:
        try:
            jobs.append(Job.model_validate(item))
        except Exception:  # noqa: BLE001 - skip malformed rows rather than 500
            continue
    if not jobs:
        raise HTTPException(
            status_code=404,
            detail="No matching jobs found. Try broadening your locations or job type.",
        )
    return jobs
