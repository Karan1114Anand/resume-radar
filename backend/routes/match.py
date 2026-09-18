from fastapi import APIRouter, Depends, HTTPException
from groq import APIStatusError

import keys
import profiles
from models import Job, MatchJobsRequest
from services import llm, search

router = APIRouter()


def _job_queries(req: MatchJobsRequest) -> list[str]:
    resume = req.profile
    top_skills = ", ".join(resume.skills[:5])
    type_hint = {
        "Internship": "internship",
        "Full-time": "full time job",
        "Both": "job OR internship",
    }.get(req.job_type, "job")
    locations = req.locations or ["Remote"]

    # An explicit discipline wins; "Auto" infers one from the resume; failing
    # both, fall back to the candidate's own past role / top skill.
    chosen = profiles.get(req.job_profile) or profiles.infer(
        resume.skills, [e.role for e in resume.experience if e.role]
    )

    queries: list[str] = []
    if chosen:
        # One clean title phrase per query. Probing Tavily showed that combining
        # synonyms with OR *reduces* real job-board hits (semantic search
        # dilutes), so each title is searched on its own instead.
        for title in chosen.titles[:2]:
            for loc in locations[:2]:
                queries.append(f"{title} {type_hint} {loc} hiring apply")
        queries.append(
            f"{chosen.titles[0]} {type_hint} {locations[0]} "
            "(site:boards.greenhouse.io OR site:jobs.lever.co OR site:linkedin.com/jobs/view OR site:wellfound.com)"
        )
    else:
        role = next((e.role for e in resume.experience if e.role), top_skills or "software")
        primary_skill = top_skills.split(", ")[0] if top_skills else role
        for loc in locations[:3]:
            queries.append(f"{role} {type_hint} {loc} hiring apply")
        queries.append(
            f"{primary_skill} {type_hint} {locations[0]} "
            "(site:boards.greenhouse.io OR site:jobs.lever.co OR site:linkedin.com/jobs/view OR site:wellfound.com)"
        )

    # Cap the fan-out: each query is one Tavily call against a 1,000/month quota.
    return queries[:5]


@router.get("/job-profiles")
async def job_profiles() -> list[dict]:
    """The selectable disciplines, so the UI has one source of truth."""
    return [{"id": profiles.AUTO, "label": "Auto-detect from résumé"}] + [
        {"id": p.id, "label": p.label} for p in profiles.PROFILES
    ]


@router.post("/match-jobs", response_model=list[Job])
async def match_jobs(
    req: MatchJobsRequest,
    creds: keys.Keys = Depends(keys.resolve),
) -> list[Job]:
    chosen = profiles.get(req.job_profile) or profiles.infer(
        req.profile.skills, [e.role for e in req.profile.experience if e.role]
    )
    results = search.search_many(creds.tavily, _job_queries(req), per_query=8)
    if not results:
        raise HTTPException(
            status_code=404,
            detail="No job listings turned up for that search. Try broadening your locations or job type.",
        )

    try:
        raw = llm.rank_jobs(
            creds.groq,
            req.profile.model_dump(),
            req.locations,
            req.job_type,
            results,
            job_profile=chosen.label if chosen else "",
        )
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
