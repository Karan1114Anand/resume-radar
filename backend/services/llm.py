"""Text generation only. All web search lives in ``services/search.py``.

Provider: Groq — model from ``LLM_MODEL`` (``openai/gpt-oss-20b``) via the Groq
SDK. Every call here
is text-in / structured-JSON-out; none of them touch the network for search.
The job/contact functions take pre-fetched search results as input and only
rank / extract from them.
"""

from __future__ import annotations

import json
import os
import re
from typing import Any

from groq import Groq

from services.search import SearchResult, as_context

MODEL = os.getenv("LLM_MODEL", "openai/gpt-oss-20b")

_client: Groq | None = None


def client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=os.environ["GROQ_API_KEY"])
    return _client


def _content(response: Any) -> str:
    return (response.choices[0].message.content or "").strip()


def _json_from_text(raw: str) -> Any:
    """Parse JSON from a model response, tolerating ```json fences / stray prose."""
    text = raw.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else text
        if text.endswith("```"):
            text = text[:-3]
        text = text.removeprefix("json").strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        for opener, closer in (("[", "]"), ("{", "}")):
            start, end = text.find(opener), text.rfind(closer)
            if start != -1 and end > start:
                return json.loads(text[start : end + 1])
        raise


def _structured(system: str, user: str, name: str, schema: dict, max_tokens: int) -> Any:
    response = client().chat.completions.create(
        model=MODEL,
        max_completion_tokens=max_tokens,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        response_format={
            "type": "json_schema",
            "json_schema": {"name": name, "strict": True, "schema": schema},
        },
    )
    return _json_from_text(_content(response))


# --------------------------------------------------------------------------- #
# Route 1 — resume parsing
# --------------------------------------------------------------------------- #

_PROFILE_SCHEMA = {
    "type": "object",
    "properties": {
        "full_name": {"type": "string"},
        "email": {"type": "string"},
        "phone": {"type": "string"},
        "skills": {"type": "array", "items": {"type": "string"}},
        "experience": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "company": {"type": "string"},
                    "role": {"type": "string"},
                    "duration": {"type": "string"},
                    "description": {"type": "string"},
                },
                "required": ["company", "role", "duration", "description"],
                "additionalProperties": False,
            },
        },
        "education": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "institution": {"type": "string"},
                    "degree": {"type": "string"},
                    "year": {"type": "string"},
                },
                "required": ["institution", "degree", "year"],
                "additionalProperties": False,
            },
        },
        "projects": {"type": "array", "items": {"type": "string"}},
    },
    "required": [
        "full_name",
        "email",
        "phone",
        "skills",
        "experience",
        "education",
        "projects",
    ],
    "additionalProperties": False,
}

_PARSE_SYSTEM = (
    "Extract from this resume: full_name, email, phone, skills (array), "
    "experience (array of {company, role, duration, description}), education "
    "(array of {institution, degree, year}), projects (array). Return only "
    "valid JSON, no markdown. Use an empty string or empty array when a field "
    "is not present."
)


def extract_profile(resume_text: str) -> dict:
    return _structured(_PARSE_SYSTEM, resume_text, "resume_profile", _PROFILE_SCHEMA, 4000)


# --------------------------------------------------------------------------- #
# Route 2 — job matching (ranks pre-fetched search results)
# --------------------------------------------------------------------------- #

_JOBS_SCHEMA = {
    "type": "object",
    "properties": {
        "jobs": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "company": {"type": "string"},
                    "location": {"type": "string"},
                    "work_mode": {"type": "string", "enum": ["remote", "hybrid", "on-site", ""]},
                    "match_score": {"type": "integer"},
                    "match_reason": {"type": "string"},
                    "posted_date": {"type": "string"},
                    "url": {"type": "string"},
                },
                "required": [
                    "title",
                    "company",
                    "location",
                    "work_mode",
                    "match_score",
                    "match_reason",
                    "posted_date",
                    "url",
                ],
                "additionalProperties": False,
            },
        }
    },
    "required": ["jobs"],
    "additionalProperties": False,
}


def rank_jobs(
    profile: dict,
    locations: list[str],
    job_type: str,
    results: list[SearchResult],
) -> list[dict]:
    """Turn raw web-search hits into scored, structured job matches."""
    system = (
        "You are a job-matching engine. You are given real web-search results for "
        "job listings plus a candidate profile. Select and rank the best matches.\n"
        "Rules: use ONLY listings present in the search results — never invent a "
        "company, title, or URL. Copy each url verbatim from the results. Score "
        "0-100 by skill / seniority / location overlap. match_reason is 2-3 "
        "sentences written in the SECOND PERSON, addressed to the candidate as "
        "'you' / 'your' (e.g. 'Your FastAPI and Redis work maps directly to this "
        "backend role.'). Never refer to the candidate in the third person or by "
        "name, and do not overstate their experience. If a field is unknown, use "
        "an empty string; use 0 only if you genuinely cannot estimate a score. "
        "Return up to 10 jobs, best first. If nothing in the results is a real job "
        "listing, return an empty jobs array."
    )
    user = (
        f"Candidate profile (JSON):\n{json.dumps(profile, indent=2)}\n\n"
        f"Preferred locations: {', '.join(locations) or 'Any'}\n"
        f"Job type: {job_type}\n\n"
        f"Search results:\n{as_context(results)}"
    )
    data = _structured(system, user, "job_matches", _JOBS_SCHEMA, 3500)
    jobs = data.get("jobs", []) if isinstance(data, dict) else []
    return jobs[:10]


# --------------------------------------------------------------------------- #
# Route 3 — hiring contact discovery (extracts from pre-fetched search results)
# --------------------------------------------------------------------------- #

_CONTACT_SCHEMA = {
    "type": "object",
    "properties": {
        "found": {"type": "boolean"},
        "name": {"type": "string"},
        "title": {"type": "string"},
        "linkedin_url": {"type": "string"},
        "email": {"type": "string"},
        "confidence": {"type": "string", "enum": ["Verified", "Likely", "Estimated", ""]},
    },
    "required": ["found", "name", "title", "linkedin_url", "email", "confidence"],
    "additionalProperties": False,
}


def extract_contact(company: str, job_title: str, results: list[SearchResult]) -> dict:
    """Pull one hiring contact out of web-search results, or report none found."""
    system = (
        "You extract a single hiring contact from real web-search results. Prefer "
        "a recruiter / talent-acquisition / HR person; fall back to a hiring "
        "manager or team lead. NEVER fabricate a name, email, or LinkedIn URL — "
        "every value must be traceable to the search results. Copy any linkedin_url "
        "verbatim. If the results contain no real, specific person for this "
        'company, return {"found": false} with empty strings for the other fields. '
        "confidence: Verified if a source explicitly ties them to hiring for this "
        "company, Likely if strongly implied, Estimated if a guess."
    )
    user = (
        f"Company: {company}\nRole: {job_title}\n\n"
        f"Search results:\n{as_context(results)}"
    )
    data = _structured(system, user, "hiring_contact", _CONTACT_SCHEMA, 1200)
    if not isinstance(data, dict) or not data.get("found") or not data.get("name"):
        return {"found": False}
    return data


# --------------------------------------------------------------------------- #
# Route 4 — outreach email generation (first person, from the job seeker)
# --------------------------------------------------------------------------- #

_EMAIL_SCHEMA = {
    "type": "object",
    "properties": {"subject": {"type": "string"}, "body": {"type": "string"}},
    "required": ["subject", "body"],
    "additionalProperties": False,
}

_EMAIL_RULES = (
    "Write the email ENTIRELY IN THE FIRST PERSON, as the job seeker speaking "
    "('I', 'my', 'me'). Never describe the job seeker in the third person. Only "
    "state facts present in the profile — never inflate years of experience, "
    "titles, or numbers.\n"
    "DO NOT write the job seeker's name anywhere — not in the subject, not in "
    "the intro, not in a sign-off. DO NOT write any closing line or signature "
    "block (no 'Best,', no 'Regards,', no name, no contact details). End the "
    "body immediately after the call to action — a signature is added afterward.\n"
    "Include: a tailored subject line (no personal names in it); a one-line "
    "intro; 1-2 specific skills of mine tied to this role; a short, low-pressure "
    "call to action. Under 160 words. Warm and direct, not generic or fawning."
)


def _greeting(contact: dict) -> str:
    return (
        f"A hiring contact was found: {contact.get('name')}. Greet them by first name."
        if contact.get("found") and contact.get("name")
        else "No named contact — open the body with 'Hi there,'."
    )


_CLOSING_RE = re.compile(
    r"\n+\s*(?:best(?:\s+regards)?|kind\s+regards|warm\s+regards|regards|sincerely|"
    r"thanks(?:\s+again)?|thank\s+you|cheers|yours(?:\s+sincerely|\s+truly)?)"
    r"\s*[,.]?\s*\n.*\Z",
    re.IGNORECASE | re.DOTALL,
)


def _strip_model_signoff(body: str, profile: dict) -> str:
    """Remove any closing / name / contact block the model wrote despite the rules.

    The small model sometimes ignores the instruction and, worse, "corrects" an
    unusual name ('Advitha' -> 'Adithya'). We always re-append the signature
    ourselves from the profile, so anything the model tacked on must go first.
    """
    body = _CLOSING_RE.sub("", body.rstrip()).rstrip()

    email = (profile.get("email") or "").strip().lower()
    phone_digits = re.sub(r"\D", "", profile.get("phone") or "")
    name = (profile.get("full_name") or "").strip()
    name_parts = {p.lower() for p in name.split() if len(p) > 1}

    lines = body.split("\n")
    while lines:
        tail = lines[-1].strip()
        low = tail.lower()
        tail_digits = re.sub(r"\D", "", tail)
        is_signoff_debris = (
            not tail
            or (email and email in low)
            or (phone_digits and len(phone_digits) >= 7 and phone_digits in tail_digits)
            or (
                bool(name_parts)
                and len(tail.split()) <= 4
                and not tail.endswith((".", "?", "!", ":"))
                and (low == name.lower() or bool(name_parts & set(re.findall(r"[a-z]+", low))))
            )
        )
        if is_signoff_debris:
            lines.pop()
        else:
            break
    return "\n".join(lines).rstrip()


def _append_signature(body: str, profile: dict) -> str:
    parts = [
        (profile.get("full_name") or "").strip(),
        (profile.get("email") or "").strip(),
        (profile.get("phone") or "").strip(),
    ]
    parts = [p for p in parts if p]
    if not parts:
        return body.rstrip()
    return body.rstrip() + "\n\nBest regards,\n" + "\n".join(parts)


def _clean_subject(subject: str, profile: dict, job: dict) -> str:
    name = (profile.get("full_name") or "").strip()
    s = subject.strip()
    if name:
        s = re.sub(re.escape(name), "", s, flags=re.IGNORECASE)
        for part in name.split():
            if len(part) > 2:
                s = re.sub(rf"\b{re.escape(part)}\b", "", s, flags=re.IGNORECASE)
    # drop a dangling "... from/by <Capitalised Name>" the model may have appended
    s = re.sub(r"\s*(?:from|by|[-–—|])\s+[A-Z][a-z.]+(?:\s+[A-Z][a-z.]+){0,2}\s*$", "", s)
    s = re.sub(r"\s*[–—\-|:]\s*$", "", s.strip())
    s = re.sub(r"^\s*[–—\-|:]\s*", "", s)
    s = re.sub(r"\s{2,}", " ", s).strip()
    # cleaned to nothing, or a lone word (often a mangled name) — synthesise a safe one
    if len(s) < 6 or " " not in s:
        title = (job.get("title") or "").strip() or "your team"
        company = (job.get("company") or "").strip()
        return f"Interested in the {title} role" + (f" at {company}" if company else "")
    return s


def _finalize_email(email: dict, profile: dict, job: dict | None = None) -> dict:
    body = _strip_model_signoff(email.get("body") or "", profile)
    return {
        "subject": _clean_subject(email.get("subject") or "", profile, job or {}),
        "body": _append_signature(body, profile),
    }


def generate_email(profile: dict, job: dict, contact: dict) -> dict:
    user = (
        "Write a cold outreach email FROM THE JOB SEEKER about this role.\n\n"
        f"Job seeker profile:\n{json.dumps(profile, indent=2)}\n\n"
        f"Target role:\n{json.dumps(job, indent=2)}\n\n"
        f"{_greeting(contact)}\n\n{_EMAIL_RULES}"
    )
    email = _structured(
        "You write concise first-person cold outreach emails for job seekers.",
        user,
        "outreach_email",
        _EMAIL_SCHEMA,
        1400,
    )
    return _finalize_email(email, profile, job)


# --------------------------------------------------------------------------- #
# Combined — one call: pick a hiring contact AND write the email
# --------------------------------------------------------------------------- #

_OUTREACH_SCHEMA = {
    "type": "object",
    "properties": {
        "contact": _CONTACT_SCHEMA,
        "email": _EMAIL_SCHEMA,
    },
    "required": ["contact", "email"],
    "additionalProperties": False,
}


def draft_outreach(profile: dict, job: dict, results: list[SearchResult]) -> dict:
    """One LLM call: extract a hiring contact from search results + write the email.

    Replaces a separate ``extract_contact`` + ``generate_email`` round-trip so a
    user only spends one model call per role they actually want to reach out to.
    """
    system = (
        "You help a job seeker reach out about a role. Do TWO things, return both.\n"
        "1) contact: from the web-search results, extract ONE real hiring contact "
        "at the company (recruiter / talent-acquisition preferred, then hiring "
        "manager / team lead). NEVER invent a name, email, or LinkedIn URL — every "
        "value must be traceable to the results; copy linkedin_url verbatim. If no "
        'real, specific person is present, set {"found": false} with empty strings. '
        "confidence: Verified if a source explicitly ties them to hiring here, "
        "Likely if strongly implied, Estimated if a guess.\n"
        "2) email: a cold outreach email FROM THE JOB SEEKER. " + _EMAIL_RULES + " "
        "If a contact was found, greet them by first name; otherwise 'Hi there,'."
    )
    user = (
        f"Job seeker profile (JSON):\n{json.dumps(profile, indent=2)}\n\n"
        f"Target role (JSON):\n{json.dumps(job, indent=2)}\n\n"
        f"Web-search results for a contact:\n{as_context(results)}"
    )
    data = _structured(system, user, "outreach_draft", _OUTREACH_SCHEMA, 2600)
    contact = data.get("contact", {}) if isinstance(data, dict) else {}
    if not contact.get("found") or not contact.get("name"):
        contact = {"found": False, "name": "", "title": "", "linkedin_url": "", "email": "", "confidence": ""}
    email = _finalize_email(data.get("email", {}) if isinstance(data, dict) else {}, profile, job)
    return {"contact": contact, "email": email}
