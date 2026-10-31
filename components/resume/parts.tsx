import type { ReactNode } from "react";
import type { Basics, ResumeSection, ThemeConfig } from "@/types/resume";
import { formatRange, initials, joinNonEmpty, normalizeUrl, proficiencyDots } from "@/lib/resume/renderer/format";
import { headingFontVariant, headingTransform } from "@/components/resume/theme-vars";
import { useStaticLinks } from "@/components/resume/static-links";

/* --------------------------------------------------------------------- icons */

const iconProps = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export const MailIcon = () => (
  <svg {...iconProps} aria-hidden><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 6.5 8.5 6 8.5-6" /></svg>
);
export const PhoneIcon = () => (
  <svg {...iconProps} aria-hidden><path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5Z" /></svg>
);
export const PinIcon = () => (
  <svg {...iconProps} aria-hidden><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" /><circle cx="12" cy="10" r="2.6" /></svg>
);
export const LinkIcon = () => (
  <svg {...iconProps} aria-hidden><path d="M10.5 13.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1 1" /><path d="M13.5 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1-1" /></svg>
);
export const GithubIcon = () => (
  <svg {...iconProps} aria-hidden><path d="M9 19c-4 1.2-4-2.2-5.5-2.8M15 21v-3.4a2.9 2.9 0 0 0-.8-2.3c2.7-.3 4.8-1.4 4.8-5.4a4.2 4.2 0 0 0-1.2-2.9 3.9 3.9 0 0 0-.1-2.9s-1.2-.3-3.9 1.5a10 10 0 0 0-5.2 0C5.9 3.8 4.7 4.1 4.7 4.1a3.9 3.9 0 0 0-.1 2.9A4.2 4.2 0 0 0 3.4 9.9c0 4 2.1 5.1 4.8 5.4a2.9 2.9 0 0 0-.8 2.3V21" /></svg>
);
export const LinkedinIcon = () => (
  <svg {...iconProps} aria-hidden><rect x="3" y="3" width="18" height="18" rx="2.5" /><path d="M7.5 10.5V17M7.5 7.6v.1M11.5 17v-3.6a2.2 2.2 0 0 1 4.4 0V17M11.5 10.6V17" /></svg>
);

/* A resume link that degrades to inert text when rendered inside a preview card. */
const ResumeLink = ({ href, children, ...rest }: { href: string; children: ReactNode } & React.HTMLAttributes<HTMLElement>) =>
  useStaticLinks() ? (
    <span className="rp-link" {...rest}>
      {children}
    </span>
  ) : (
    <a className="rp-link" href={href} {...rest}>
      {children}
    </a>
  );

/* -------------------------------------------------------------------- header */


const ContactItem = ({ icon, children, href }: { icon: ReactNode; children: ReactNode; href?: string }) => (
  <span className="rp-contact-item">
    {icon}
    {href ? (
      <ResumeLink href={href} style={{ borderBottom: "none" }}>
        {children}
      </ResumeLink>
    ) : (
      <span>{children}</span>
    )}
  </span>
);

export interface HeaderProps {
  basics: Basics;
  theme: ThemeConfig;
  headerLayout: "stacked" | "split" | "band" | "monogram" | "compact";
  showMonogram: boolean;
  inBand?: boolean;
}

export const ResumeHeader = ({ basics, theme, headerLayout, showMonogram, inBand }: HeaderProps) => {
  const layout = inBand ? "band" : theme.headerAlign === "center" && headerLayout === "stacked" ? "center" : headerLayout;
  const contacts: ReactNode[] = [];

  if (basics.email) contacts.push(<ContactItem key="email" icon={theme.showIcons ? <MailIcon /> : null} href={`mailto:${basics.email}`}>{basics.email}</ContactItem>);
  if (basics.phone) contacts.push(<ContactItem key="phone" icon={theme.showIcons ? <PhoneIcon /> : null}>{basics.phone}</ContactItem>);
  if (basics.location) contacts.push(<ContactItem key="loc" icon={theme.showIcons ? <PinIcon /> : null}>{basics.location}</ContactItem>);
  if (basics.website) contacts.push(<ContactItem key="web" icon={theme.showIcons ? <LinkIcon /> : null} href={normalizeUrl(basics.website)}>{basics.website.replace(/^https?:\/\//, "")}</ContactItem>);
  if (basics.linkedin) contacts.push(<ContactItem key="li" icon={theme.showIcons ? <LinkedinIcon /> : null} href={normalizeUrl(basics.linkedin)}>{basics.linkedin.replace(/^https?:\/\//, "")}</ContactItem>);
  if (basics.github) contacts.push(<ContactItem key="gh" icon={theme.showIcons ? <GithubIcon /> : null} href={normalizeUrl(basics.github)}>{basics.github.replace(/^https?:\/\//, "")}</ContactItem>);
  for (const link of basics.links) {
    if (!link.label && !link.url) continue;
    contacts.push(<ContactItem key={link.id} icon={theme.showIcons ? <LinkIcon /> : null} href={normalizeUrl(link.url)}>{link.label || link.url}</ContactItem>);
  }

  const name = basics.fullName || "Your Name";
  const showPhoto = basics.photoVisible && Boolean(basics.photo);

  return (
    <header
      className={[
        "rp-head",
        `rp-head--${layout}`,
        inBand ? "has-band" : "",
        layout === "center" ? "rp-head--center" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="rp-head-main">
        {showPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="rp-photo" src={basics.photo} alt="" />
        ) : showMonogram ? (
          <div className="rp-mono-tile" aria-hidden>
            {initials(name)}
          </div>
        ) : null}
        <div style={{ minWidth: 0 }}>
          <h1 className="rp-name">{name}</h1>
          {basics.headline ? <p className="rp-headline">{basics.headline}</p> : null}
          {layout === "center" || layout === "stacked" ? <div className="rp-contact">{contacts}</div> : null}
        </div>
      </div>
      {layout === "center" || layout === "stacked" ? null : <div className="rp-contact">{contacts}</div>}
    </header>
  );
};

/* ------------------------------------------------------------------ headings */

export const SectionTitle = ({ title }: { title: string }) => <div className="rp-sec-title">{title}</div>;

/* ------------------------------------------------------------------- bullets */

export const Bullets = ({ items, theme }: { items: string[]; theme: ThemeConfig }) => {
  const clean = items.filter((b) => b.trim().length > 0);
  if (clean.length === 0) return null;
  return (
    <ul className={`rp-bullets rp-bullets--${theme.bulletStyle}`}>
      {clean.map((bullet, index) => (
        <li key={index}>{bullet}</li>
      ))}
    </ul>
  );
};

const TechLine = ({ items, theme }: { items: string[]; theme: ThemeConfig }) =>
  items.length ? (
    <div className="rp-tech">
      <span className="rp-tech-label">Stack:</span> {items.join(" · ")}
    </div>
  ) : null;

const EntryTop = ({ title, date }: { title: string; date: string }) => (
  <div className="rp-entry-top">
    <div className="rp-entry-title">{title}</div>
    {date ? <div className="rp-entry-date">{date}</div> : null}
  </div>
);

/* ------------------------------------------------------------------- entries */

type ExperienceSection = Extract<ResumeSection, { kind: "experience" | "volunteer" }>;
type EducationSection = Extract<ResumeSection, { kind: "education" }>;
type ProjectSection = Extract<ResumeSection, { kind: "projects" }>;
type CertSection = Extract<ResumeSection, { kind: "certifications" }>;
type AchievementSection = Extract<ResumeSection, { kind: "achievements" }>;
type PublicationSection = Extract<ResumeSection, { kind: "publications" }>;
type CustomSection = Extract<ResumeSection, { kind: "custom" }>;
type ReferenceSection = Extract<ResumeSection, { kind: "references" }>;

export const ExperienceEntry = ({ item, theme }: { item: ExperienceSection["data"]["items"][number]; theme: ThemeConfig }) => (
  <div className="rp-entry">
    <EntryTop title={item.role || item.company || "Role"} date={formatRange(item.startDate, item.endDate, item.current)} />
    {item.company || item.location ? (
      <div className="rp-entry-sub">
        {item.company ? <span className="rp-strong">{item.company}</span> : null}
        {item.company && item.location ? <span className="rp-inline-sep">·</span> : null}
        {item.location ? <span>{item.location}</span> : null}
      </div>
    ) : null}
    {item.description ? <p className="rp-desc">{item.description}</p> : null}
    <Bullets items={item.bullets} theme={theme} />
    <TechLine items={item.tech} theme={theme} />
  </div>
);

export const EducationEntry = ({ item, theme }: { item: EducationSection["data"]["items"][number]; theme: ThemeConfig }) => (
  <div className="rp-entry">
    <EntryTop title={item.degree || item.institution || "Degree"} date={formatRange(item.startDate, item.endDate)} />
    {item.institution || item.location || item.score ? (
      <div className="rp-entry-sub">
        {item.institution ? <span className="rp-strong">{item.institution}</span> : null}
        {item.location ? <><span className="rp-inline-sep">·</span><span>{item.location}</span></> : null}
        {item.score ? <><span className="rp-inline-sep">·</span><span>{item.score}</span></> : null}
      </div>
    ) : null}
    <Bullets items={item.details} theme={theme} />
  </div>
);

export const ProjectEntry = ({ item, theme }: { item: ProjectSection["data"]["items"][number]; theme: ThemeConfig }) => (
  <div className="rp-entry">
    <div className="rp-entry-top">
      <div className="rp-entry-title">
        {item.name || "Project"}
        {item.role ? <span className="rp-muted" style={{ fontWeight: 400 }}> — {item.role}</span> : null}
      </div>
      {item.url ? (
        <div className="rp-entry-date">
          <ResumeLink href={normalizeUrl(item.url)}>{item.url.replace(/^https?:\/\//, "")}</ResumeLink>
        </div>
      ) : (
        <div className="rp-entry-date">{formatRange(item.startDate, item.endDate)}</div>
      )}
    </div>
    {item.description ? <p className="rp-desc">{item.description}</p> : null}
    <Bullets items={item.bullets} theme={theme} />
    <TechLine items={item.tech} theme={theme} />
  </div>
);

export const CertificationEntry = ({ item }: { item: CertSection["data"]["items"][number] }) => (
  <div className="rp-entry">
    <EntryTop title={item.name || "Certification"} date={item.date} />
    {item.issuer ? <div className="rp-entry-sub">{item.issuer}</div> : null}
  </div>
);

export const AchievementEntry = ({ item }: { item: AchievementSection["data"]["items"][number] }) => (
  <div className="rp-entry">
    <EntryTop title={item.title || "Achievement"} date={item.date} />
    {item.issuer ? <div className="rp-entry-sub">{item.issuer}</div> : null}
    {item.description ? <p className="rp-desc">{item.description}</p> : null}
  </div>
);

export const PublicationEntry = ({ item }: { item: PublicationSection["data"]["items"][number] }) => (
  <div className="rp-pub">
    <div>
      {item.authors ? <span>{item.authors}. </span> : null}
      <span style={{ fontStyle: "italic" }}>{item.title || "Publication"}</span>
      {item.venue ? <span>. {item.venue}</span> : null}
      {item.date ? <span>, {item.date}</span> : null}
      {item.url ? (
        <>
          {". "}
          <ResumeLink href={normalizeUrl(item.url)}>{item.url.replace(/^https?:\/\//, "")}</ResumeLink>
        </>
      ) : null}
    </div>
  </div>
);

export const ReferenceEntry = ({ item }: { item: ReferenceSection["data"]["items"][number] }) => (
  <div className="rp-entry">
    <EntryTop title={item.name || "Reference"} date="" />
    <div className="rp-entry-sub">{[item.role, item.contact].filter(Boolean).join(" · ")}</div>
  </div>
);

export const CustomEntry = ({ item, theme }: { item: CustomSection["data"]["items"][number]; theme: ThemeConfig }) => (
  <div className="rp-entry">
    <EntryTop title={item.heading || "Item"} date={item.date} />
    {item.subheading ? <div className="rp-entry-sub">{item.subheading}</div> : null}
    <Bullets items={item.bullets} theme={theme} />
  </div>
);

/* ------------------------------------------------------------- inline blocks */

export const SkillsBlock = ({ section }: { section: Extract<ResumeSection, { kind: "skills" }> }) => {
  const groups = section.data.groups.filter((g) => g.items.length > 0);
  if (groups.length === 0) return null;
  if (section.data.display === "chips") {
    return (
      <div className="rp-chips">
        {groups.flatMap((group) =>
          group.items.map((item, i) => (
            <span className="rp-chip" key={`${group.id}-${i}`}>
              {item}
            </span>
          )),
        )}
      </div>
    );
  }
  if (section.data.display === "bars") {
    return (
      <div className="rp-skill-cols">
        {groups.map((group) => (
          <div key={group.id} style={{ gridColumn: "span 1" }}>
            <div className="rp-skill-name">{group.name}</div>
            {group.items.map((item, i) => (
              <div className="rp-skill-row" key={i}>
                <span>{item}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }
  return (
    <div>
      {groups.map((group) => (
        <div className="rp-skill-group" key={group.id}>
          {section.data.display === "list" ? <div className="rp-skill-name">{group.name}</div> : null}
          <div className={section.data.display === "list" ? "rp-skill-list" : "rp-skill-list"}>
            {section.data.display === "inline" && group.name ? (
              <span className="rp-skill-name" style={{ marginRight: 6 }}>
                {group.name}:
              </span>
            ) : null}
            {group.items.map((item, i) => (
              <span className="rp-skill-item" key={i}>
                {item}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export const LanguagesBlock = ({ section }: { section: Extract<ResumeSection, { kind: "languages" }> }) => {
  const items = section.data.items.filter((i) => i.name.trim());
  if (!items.length) return null;
  if (section.data.display === "dots") {
    return (
      <div>
        {items.map((item) => (
          <div className="rp-lang-row" key={item.id}>
            <span>{item.name}</span>
            <span className="rp-dots" aria-label={item.proficiency}>
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} className={`rp-dot${n <= proficiencyDots(item.proficiency) ? " is-on" : ""}`} />
              ))}
            </span>
          </div>
        ))}
      </div>
    );
  }
  if (section.data.display === "inline") {
    return (
      <div className="rp-skill-list">
        {items.map((item) => (
          <span className="rp-skill-item" key={item.id}>
            {joinNonEmpty([item.name, item.proficiency], " — ")}
          </span>
        ))}
      </div>
    );
  }
  return (
    <div>
      {items.map((item) => (
        <div className="rp-lang-row" key={item.id}>
          <span>{item.name}</span>
          <span className="rp-muted">{item.proficiency}</span>
        </div>
      ))}
    </div>
  );
};

export const InterestsBlock = ({ section }: { section: Extract<ResumeSection, { kind: "interests" }> }) => {
  const items = section.data.items.filter((i) => i.trim());
  if (!items.length) return null;
  return (
    <div className="rp-skill-list">
      {items.map((item, i) => (
        <span className="rp-skill-item" key={i}>
          {item}
        </span>
      ))}
    </div>
  );
};

export const SummaryBlock = ({ section }: { section: Extract<ResumeSection, { kind: "summary" }> }) => (
  <p className="rp-summary">{section.data.text}</p>
);

/* --------------------------------------------------------------- dispatcher */

export type SectionBody = { node: ReactNode; splitPerItem: boolean };

/**
 * Returns the body of a section. When `splitPerItem` is true, the caller renders
 * one block per item so long sections can break across pages.
 */
export const sectionBody = (section: ResumeSection, theme: ThemeConfig): SectionBody => {
  switch (section.kind) {
    case "summary":
      return { node: <SummaryBlock section={section} />, splitPerItem: false };
    case "skills":
      return { node: <SkillsBlock section={section} />, splitPerItem: false };
    case "languages":
      return { node: <LanguagesBlock section={section} />, splitPerItem: false };
    case "interests":
      return { node: <InterestsBlock section={section} />, splitPerItem: false };
    default:
      return { node: null, splitPerItem: true };
  }
};

export const sectionItems = (section: ResumeSection, theme: ThemeConfig): ReactNode[] => {
  switch (section.kind) {
    case "experience":
    case "volunteer":
      return section.data.items.map((item) => <ExperienceEntry key={item.id} item={item} theme={theme} />);
    case "education":
      return section.data.items.map((item) => <EducationEntry key={item.id} item={item} theme={theme} />);
    case "projects":
      return section.data.items.map((item) => <ProjectEntry key={item.id} item={item} theme={theme} />);
    case "certifications":
      return section.data.items.map((item) => <CertificationEntry key={item.id} item={item} />);
    case "achievements":
      return section.data.items.map((item) => <AchievementEntry key={item.id} item={item} />);
    case "publications":
      return section.data.items.map((item) => <PublicationEntry key={item.id} item={item} />);
    case "references":
      return section.data.items.map((item) => <ReferenceEntry key={item.id} item={item} />);
    case "custom":
      return section.data.items.map((item) => <CustomEntry key={item.id} item={item} theme={theme} />);
    default:
      return [];
  }
};

export const sectionItemKeys = (section: ResumeSection): string[] => {
  switch (section.kind) {
    case "experience":
    case "volunteer":
    case "education":
    case "projects":
    case "certifications":
    case "achievements":
    case "publications":
    case "references":
    case "custom":
      return section.data.items.map((item) => item.id);
    default:
      return [];
  }
};

/* Re-exported for consumers that need the heading transform utilities. */
export { headingTransform, headingFontVariant };
