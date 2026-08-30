import { Briefcase, GraduationCap, Mail, Phone, Sparkles, User } from "lucide-react";
import type { ResumeProfile } from "@/lib/api";

interface Props {
  profile: ResumeProfile;
}

export function ProfileSummaryCard({ profile }: Props) {
  return (
    <div className="rounded-sm border border-ink/50 bg-cream shadow-paper">
      <div className="flex items-center gap-3 border-b border-ink/30 bg-parchment px-5 py-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-sm border border-ink/40 bg-cream text-corp">
          <User className="h-6 w-6" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.25em] text-faded">Personnel File</p>
          <p className="truncate font-typewriter text-lg text-ink">
            {profile.full_name || "Name not detected"}
          </p>
          <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-faded">
            {profile.email && (
              <span className="inline-flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" aria-hidden />
                {profile.email}
              </span>
            )}
            {profile.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" aria-hidden />
                {profile.phone}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <Section icon={<Sparkles className="h-4 w-4" aria-hidden />} title={`Skills (${profile.skills.length})`}>
          {profile.skills.length ? (
            <div className="flex flex-wrap gap-1.5">
              {profile.skills.slice(0, 24).map((skill) => (
                <span
                  key={skill}
                  className="rounded-sm border border-ink/30 bg-parchment px-2 py-0.5 text-xs text-ink"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <Empty>No skills detected</Empty>
          )}
        </Section>

        <Section icon={<Briefcase className="h-4 w-4" aria-hidden />} title={`Experience (${profile.experience.length})`}>
          {profile.experience.length ? (
            <ul className="space-y-2.5">
              {profile.experience.slice(0, 4).map((exp, i) => (
                <li key={i} className="border-l-2 border-corp/50 pl-3 text-sm">
                  <p className="font-typewriter text-ink">
                    {exp.role || "Role"}
                    {exp.company && <span className="text-faded"> · {exp.company}</span>}
                  </p>
                  {exp.duration && <p className="text-xs italic text-faded">{exp.duration}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <Empty>No work experience detected</Empty>
          )}
        </Section>

        <Section icon={<GraduationCap className="h-4 w-4" aria-hidden />} title={`Education (${profile.education.length})`}>
          {profile.education.length ? (
            <ul className="space-y-1.5">
              {profile.education.map((ed, i) => (
                <li key={i} className="border-l-2 border-corp/50 pl-3 text-sm">
                  <span className="font-typewriter text-ink">{ed.degree || "Degree"}</span>
                  {ed.institution && <span className="text-faded"> · {ed.institution}</span>}
                  {ed.year && <span className="text-faded"> ({ed.year})</span>}
                </li>
              ))}
            </ul>
          ) : (
            <Empty>No education detected</Empty>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 flex items-center gap-1.5 border-b border-dashed border-ink/30 pb-1 font-typewriter text-xs uppercase tracking-widest text-faded">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm italic text-faded">{children}</p>;
}
