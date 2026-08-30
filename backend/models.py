"""Shared Pydantic request/response models."""

from __future__ import annotations

from pydantic import BaseModel, Field


class ExperienceItem(BaseModel):
    company: str = ""
    role: str = ""
    duration: str = ""
    description: str = ""


class EducationItem(BaseModel):
    institution: str = ""
    degree: str = ""
    year: str = ""


class ResumeProfile(BaseModel):
    full_name: str = ""
    email: str = ""
    phone: str = ""
    skills: list[str] = Field(default_factory=list)
    experience: list[ExperienceItem] = Field(default_factory=list)
    education: list[EducationItem] = Field(default_factory=list)
    projects: list[str] = Field(default_factory=list)


class MatchJobsRequest(BaseModel):
    profile: ResumeProfile
    locations: list[str] = Field(default_factory=list)
    job_type: str = "Both"


class Job(BaseModel):
    title: str = ""
    company: str = ""
    location: str = ""
    work_mode: str = ""
    match_score: int = 0
    match_reason: str = ""
    posted_date: str = ""
    url: str = ""


class FindContactRequest(BaseModel):
    company: str
    job_title: str


class Contact(BaseModel):
    found: bool = False
    name: str | None = None
    title: str | None = None
    linkedin_url: str | None = None
    email: str | None = None
    confidence: str | None = None


class GenerateEmailRequest(BaseModel):
    profile: ResumeProfile
    job: Job
    contact: Contact


class GeneratedEmail(BaseModel):
    subject: str
    body: str


class DraftOutreachRequest(BaseModel):
    profile: ResumeProfile
    job: Job


class OutreachDraft(BaseModel):
    contact: Contact
    email: GeneratedEmail
