import type { ReactNode } from "react";
import type { Basics, ResumeSection, ThemeConfig } from "@/types/resume";
import {
  formatRange,
  initials,
  joinNonEmpty,
  normalizeUrl,
  proficiencyDots,
} from "@/lib/resume/renderer/format";
import { headingFontVariant, headingTransform } from "@/components/resume/theme-vars";
import { useStaticLinks } from "@/components/resume/static-links";
import { InlineEditable, useInlineEditor } from "@/components/editor/InlineEditable";

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const MailIcon = () => (
  <svg {...iconProps} aria-hidden>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3.5 6.5 8.5 6 8.5-6" />
  </svg>
);

export const PhoneIcon = () => (
  <svg {...iconProps} aria-hidden>
    <path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5Z" />
  </svg>
);

export const PinIcon = () => (
  <svg {...iconProps} aria-hidden>
    <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.6" />
  </svg>
);

export const LinkIcon = () => (
  <svg {...iconProps} aria-hidden>
    <path d="M10.5 13.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1 1" />
    <path d="M13.5 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1-1" />
  </svg>
);

export const GithubIcon = () => (
  <svg {...iconProps} aria-hidden>
    <path d="M9 19c-4 1.2-4-2.2-5.5-2.8M15 21v-3.4a2.9 2.9 0 0 0-.8-2.3c2.7-.3 4.8-1.4 4.8-5.4a4.2 4.2 0 0 0-1.2-2.9 3.9 3.9 0 0 0-.1-2.9s-1.2-.3-3.9 1.5a10 10 0 0 0-5.2 0C5.9 3.8 4.7 4.1 4.7 4.1a3.9 3.9 0 0 0-.1 2.9A4.2 4.2 0 0 0 3.4 9.9c0 4 2.1 5.1 4.8 5.4a2.9 2.9 0 0 0-.8 2.3V21" />
  </svg>
);

export const LinkedinIcon = () => (
  <svg {...iconProps} aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="2.5" />
    <path d="M7.5 10.5V17M7.5 7.6v.1M11.5 17v-3.6a2.2 2.2 0 0 1 4.4 0V17M11.5 10.6V17" />
  </svg>
);

const ResumeLink = ({
  href,
  children,
  ...rest
}: { href: string; children: ReactNode } & React.HTMLAttributes<HTMLElement>) => {
  const editor = useInlineEditor();
  const staticLinks = useStaticLinks();

  return editor || staticLinks ? (
    <span className="rp-link" {...rest}>
      {children}
    </span>
  ) : (
    <a className="rp-link" href={href} {...rest}>
      {children}
    </a>
  );
};

const ContactItem = ({
  icon,
  children,
  href,
}: {
  icon: ReactNode;
  children: ReactNode;
  href?: string;
}) => {
  const editor = useInlineEditor();

  return (
    <span className="rp-contact-item">
      {icon}
      {href ? (
        editor ? (
          <span>{children}</span>
        ) : (
          <ResumeLink href={href} style={{ borderBottom: "none" }}>
            {children}
          </ResumeLink>
        )
      ) : (
        <span>{children}</span>
      )}
    </span>
  );
};

export interface HeaderProps {
  basics: Basics;
  theme: ThemeConfig;
  headerLayout: "stacked" | "split" | "band" | "monogram" | "compact";
  showMonogram: boolean;
  inBand?: boolean;
}

export const ResumeHeader = ({
  basics,
  theme,
  headerLayout,
  showMonogram,
  inBand,
}: HeaderProps) => {
  const editor = useInlineEditor();
  const layout = inBand
    ? "band"
    : theme.headerAlign === "center" && headerLayout === "stacked"
      ? "center"
      : headerLayout;

  const contacts: ReactNode[] = [];

  if (basics.email) {
    contacts.push(
      <ContactItem
        key="email"
        icon={theme.showIcons ? <MailIcon /> : null}
        href={`mailto:${basics.email}`}
      >
        <InlineEditable
          value={basics.email}
          ariaLabel="Email"
          onChange={(value) => editor?.updateBasics({ email: value })}
        />
      </ContactItem>,
    );
  }

  if (basics.phone) {
    contacts.push(
      <ContactItem
        key="phone"
        icon={theme.showIcons ? <PhoneIcon /> : null}
      >
        <InlineEditable
          value={basics.phone}
          ariaLabel="Phone"
          onChange={(value) => editor?.updateBasics({ phone: value })}
        />
      </ContactItem>,
    );
  }

  if (basics.location) {
    contacts.push(
      <ContactItem
        key="loc"
        icon={theme.showIcons ? <PinIcon /> : null}
      >
        <InlineEditable
          value={basics.location}
          ariaLabel="Location"
          onChange={(value) => editor?.updateBasics({ location: value })}
        />
      </ContactItem>,
    );
  }

  if (basics.website) {
    contacts.push(
      <ContactItem
        key="web"
        icon={theme.showIcons ? <LinkIcon /> : null}
        href={normalizeUrl(basics.website)}
      >
        <InlineEditable
          value={basics.website.replace(/^https?:\/\//, "")}
          ariaLabel="Website"
          onChange={(value) => editor?.updateBasics({ website: value })}
        />
      </ContactItem>,
    );
  }

  if (basics.linkedin) {
    contacts.push(
      <ContactItem
        key="li"
        icon={theme.showIcons ? <LinkedinIcon /> : null}
        href={normalizeUrl(basics.linkedin)}
      >
        <InlineEditable
          value={basics.linkedin.replace(/^https?:\/\//, "")}
          ariaLabel="LinkedIn"
          onChange={(value) => editor?.updateBasics({ linkedin: value })}
        />
      </ContactItem>,
    );
  }

  if (basics.github) {
    contacts.push(
      <ContactItem
        key="gh"
        icon={theme.showIcons ? <GithubIcon /> : null}
        href={normalizeUrl(basics.github)}
      >
        <InlineEditable
          value={basics.github.replace(/^https?:\/\//, "")}
          ariaLabel="GitHub"
          onChange={(value) => editor?.updateBasics({ github: value })}
        />
      </ContactItem>,
    );
  }

  for (const link of basics.links) {
    if (!link.label && !link.url) continue;

    contacts.push(
      <ContactItem
        key={link.id}
        icon={theme.showIcons ? <LinkIcon /> : null}
        href={normalizeUrl(link.url)}
      >
        <InlineEditable
          value={link.label || link.url}
          ariaLabel={`${link.label || "Resume"} link`}
          onChange={(value) => {
            const label = link.label ? "label" : "url";
            editor?.updateBasics({ links: basics.links.map((item) =>
              item.id === link.id ? { ...item, [label]: value } : item
            ) });
          }}
        />
      </ContactItem>,
    );
  }

  const name = basics.fullName || "Your Name";
  const showPhoto = basics.photoVisible && Boolean(basics.photo);
  const isStacked = layout === "center" || layout === "stacked";

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
          <img className="rp-photo" src={basics.photo} alt="" />
        ) : showMonogram ? (
          <div className="rp-mono-tile" aria-hidden>
            {initials(name)}
          </div>
        ) : null}

        <div style={{ minWidth: 0 }}>
          <h1 className="rp-name">
            <InlineEditable
              value={basics.fullName}
              placeholder="Your Name"
              ariaLabel="Full name"
              onChange={(value) => editor?.updateBasics({ fullName: value })}
            />
          </h1>
          {basics.headline ? (
            <p className="rp-headline">
              <InlineEditable
                value={basics.headline}
                ariaLabel="Professional headline"
                onChange={(value) => editor?.updateBasics({ headline: value })}
              />
            </p>
          ) : null}
          {isStacked ? <div className="rp-contact">{contacts}</div> : null}
        </div>
      </div>

      {!isStacked ? <div className="rp-contact">{contacts}</div> : null}
    </header>
  );
};

export const SectionTitle = ({
  title,
  sectionId,
}: {
  title: string;
  sectionId?: string;
}) => {
  const editor = useInlineEditor();

  return (
    <div className="rp-sec-title">
      <InlineEditable
        value={title}
        sectionId={sectionId}
        ariaLabel="Section heading"
        onChange={(value) => {
          if (!sectionId) return;
          editor?.updateSection(sectionId, (section) => {
            section.title = value;
          });
        }}
      />
    </div>
  );
};

export const Bullets = ({
  items,
  theme,
  sectionId,
  onChange,
}: {
  items: string[];
  theme: ThemeConfig;
  sectionId?: string;
  onChange?: (index: number, value: string) => void;
}) => {
  const clean = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.trim().length > 0);

  if (clean.length === 0) return null;

  return (
    <ul className={`rp-bullets rp-bullets--${theme.bulletStyle}`}>
      {clean.map(({ item: bullet, index }) => (
        <li key={index}>
          <InlineEditable
            value={bullet}
            multiline
            sectionId={sectionId}
            ariaLabel={`Bullet point ${index + 1}`}
            onChange={(value) => onChange?.(index, value)}
            as="div"
          />
        </li>
      ))}
    </ul>
  );
};

const TechLine = ({
  items,
  sectionId,
  onChange,
}: {
  items: string[];
  sectionId: string;
  onChange: (index: number, value: string) => void;
}) =>
  items.length ? (
    <div className="rp-tech">
      <span className="rp-tech-label">Stack:</span>{" "}
      {items.map((item, index) => (
        <span key={index}>
          {index > 0 ? " · " : ""}
          <InlineEditable
            value={item}
            sectionId={sectionId}
            ariaLabel={`Technology ${index + 1}`}
            onChange={(value) => onChange(index, value)}
          />
        </span>
      ))}
    </div>
  ) : null;

const EntryTop = ({
  title,
  date,
  sectionId,
  onTitleChange,
  onDateChange,
}: {
  title: string;
  date: string;
  sectionId: string;
  onTitleChange: (value: string) => void;
  onDateChange?: (value: string) => void;
}) => (
  <div className="rp-entry-top">
    <div className="rp-entry-title">
      <InlineEditable
        value={title}
        sectionId={sectionId}
        ariaLabel="Entry title"
        onChange={onTitleChange}
      />
    </div>
    {date ? (
      <div className="rp-entry-date">
        {onDateChange ? (
          <InlineEditable
            value={date}
            sectionId={sectionId}
            ariaLabel="Entry date"
            onChange={onDateChange}
          />
        ) : date}
      </div>
    ) : null}
  </div>
);

type ExperienceSection = Extract<
  ResumeSection,
  { kind: "experience" | "volunteer" }
>;
type EducationSection = Extract<ResumeSection, { kind: "education" }>;
type ProjectSection = Extract<ResumeSection, { kind: "projects" }>;
type CertSection = Extract<ResumeSection, { kind: "certifications" }>;
type AchievementSection = Extract<ResumeSection, { kind: "achievements" }>;
type PublicationSection = Extract<ResumeSection, { kind: "publications" }>;
type CustomSection = Extract<ResumeSection, { kind: "custom" }>;
type ReferenceSection = Extract<ResumeSection, { kind: "references" }>;

const SectionField = ({
  sectionId,
  value,
  update,
  multiline = false,
  ariaLabel,
  as,
}: {
  sectionId: string;
  value: string;
  update: (section: ResumeSection, value: string) => void;
  multiline?: boolean;
  ariaLabel?: string;
  as?: "span" | "div";
}) => {
  const editor = useInlineEditor();

  return (
    <InlineEditable
      value={value}
      sectionId={sectionId}
      multiline={multiline}
      ariaLabel={ariaLabel}
      as={as}
      onChange={(next) =>
        editor?.updateSection(sectionId, (section) => update(section, next))
      }
    />
  );
};

const useSectionUpdate = (sectionId: string) => {
  const editor = useInlineEditor();

  return (
    mutate: (section: ResumeSection, value: string) => void,
    value: string,
  ) => editor?.updateSection(sectionId, (section) => mutate(section, value));
};

const parseDateRange = (value: string) => {
  const [startDate = "", endDate = ""] = value.split(/\s+–\s+/, 2);

  return {
    startDate,
    endDate: endDate.toLowerCase() === "present" ? "" : endDate,
    current: endDate.toLowerCase() === "present",
  };
};

export const ExperienceEntry = ({
  item,
  theme,
  sectionId,
}: {
  item: ExperienceSection["data"]["items"][number];
  theme: ThemeConfig;
  sectionId: string;
}) => {
  const update = useSectionUpdate(sectionId);

  return (
  <div className="rp-entry">
    <EntryTop
      title={item.role}
      date={formatRange(item.startDate, item.endDate, item.current)}
      sectionId={sectionId}
      onTitleChange={(value) =>
        update((section, next) => {
          if (section.kind !== "experience" && section.kind !== "volunteer") return;
          const target = section.data.items.find((entry) => entry.id === item.id);
          if (target) target.role = next;
        }, value)
      }
      onDateChange={(value) =>
        update((section, next) => {
          if (section.kind !== "experience" && section.kind !== "volunteer") return;
          const target = section.data.items.find((entry) => entry.id === item.id);
          if (target) Object.assign(target, parseDateRange(next));
        }, value)
      }
    />

    {item.company || item.location ? (
      <div className="rp-entry-sub">
        {item.company ? (
          <span className="rp-strong">
            <SectionField
              sectionId={sectionId}
              value={item.company}
              ariaLabel="Company"
              update={(section, value) => {
                if (section.kind !== "experience" && section.kind !== "volunteer") return;
                const target = section.data.items.find((entry) => entry.id === item.id);
                if (target) target.company = value;
              }}
            />
          </span>
        ) : null}
        {item.company && item.location ? (
          <span className="rp-inline-sep">·</span>
        ) : null}
        {item.location ? (
          <SectionField
            sectionId={sectionId}
            value={item.location}
            ariaLabel="Work location"
            update={(section, value) => {
              if (section.kind !== "experience" && section.kind !== "volunteer") return;
              const target = section.data.items.find((entry) => entry.id === item.id);
              if (target) target.location = value;
            }}
          />
        ) : null}
      </div>
    ) : null}

    {item.description ? (
      <div className="rp-desc">
        <SectionField
          sectionId={sectionId}
          value={item.description}
          multiline
          as="div"
          ariaLabel="Experience description"
          update={(section, value) => {
            if (section.kind !== "experience" && section.kind !== "volunteer") return;
            const target = section.data.items.find((entry) => entry.id === item.id);
            if (target) target.description = value;
          }}
        />
      </div>
    ) : null}
    <Bullets
      items={item.bullets}
      theme={theme}
      sectionId={sectionId}
      onChange={(index, value) =>
        update((section, next) => {
          if (section.kind !== "experience" && section.kind !== "volunteer") return;
          const target = section.data.items.find((entry) => entry.id === item.id);
          if (target) target.bullets[index] = next;
        }, value)
      }
    />
    <TechLine
      items={item.tech}
      sectionId={sectionId}
      onChange={(index, value) =>
        update((section, next) => {
          if (section.kind !== "experience" && section.kind !== "volunteer") return;
          const target = section.data.items.find((entry) => entry.id === item.id);
          if (target) target.tech[index] = next;
        }, value)
      }
    />
  </div>
  );
};

export const EducationEntry = ({
  item,
  theme,
  sectionId,
}: {
  item: EducationSection["data"]["items"][number];
  theme: ThemeConfig;
  sectionId: string;
}) => {
  const update = useSectionUpdate(sectionId);

  return (
  <div className="rp-entry">
    <EntryTop
      title={item.degree}
      date={formatRange(item.startDate, item.endDate)}
      sectionId={sectionId}
      onTitleChange={(value) =>
        update((section, next) => {
          if (section.kind !== "education") return;
          const target = section.data.items.find((entry) => entry.id === item.id);
          if (target) target.degree = next;
        }, value)
      }
      onDateChange={(value) =>
        update((section, next) => {
          if (section.kind !== "education") return;
          const target = section.data.items.find((entry) => entry.id === item.id);
          if (target) Object.assign(target, parseDateRange(next));
        }, value)
      }
    />

    {item.institution || item.location || item.score ? (
      <div className="rp-entry-sub">
        {item.institution ? (
          <span className="rp-strong">
            <SectionField
              sectionId={sectionId}
              value={item.institution}
              ariaLabel="Institution"
              update={(section, value) => {
                if (section.kind !== "education") return;
                const target = section.data.items.find((entry) => entry.id === item.id);
                if (target) target.institution = value;
              }}
            />
          </span>
        ) : null}
        {item.location ? (
          <>
            {item.institution ? (
              <span className="rp-inline-sep">·</span>
            ) : null}
            <SectionField
              sectionId={sectionId}
              value={item.location}
              ariaLabel="Education location"
              update={(section, value) => {
                if (section.kind !== "education") return;
                const target = section.data.items.find((entry) => entry.id === item.id);
                if (target) target.location = value;
              }}
            />
          </>
        ) : null}
        {item.score ? (
          <>
            {(item.institution || item.location) ? (
              <span className="rp-inline-sep">·</span>
            ) : null}
            <SectionField
              sectionId={sectionId}
              value={item.score}
              ariaLabel="Education score"
              update={(section, value) => {
                if (section.kind !== "education") return;
                const target = section.data.items.find((entry) => entry.id === item.id);
                if (target) target.score = value;
              }}
            />
          </>
        ) : null}
      </div>
    ) : null}

    <Bullets
      items={item.details}
      theme={theme}
      sectionId={sectionId}
      onChange={(index, value) =>
        update((section, next) => {
          if (section.kind !== "education") return;
          const target = section.data.items.find((entry) => entry.id === item.id);
          if (target) target.details[index] = next;
        }, value)
      }
    />
  </div>
  );
};

export const ProjectEntry = ({
  item,
  theme,
  sectionId,
}: {
  item: ProjectSection["data"]["items"][number];
  theme: ThemeConfig;
  sectionId: string;
}) => {
  const update = useSectionUpdate(sectionId);

  return (
  <div className="rp-entry">
    <div className="rp-entry-top">
      <div className="rp-entry-title">
        <SectionField
          sectionId={sectionId}
          value={item.name}
          ariaLabel="Project name"
          update={(section, value) => {
            if (section.kind !== "projects") return;
            const target = section.data.items.find((entry) => entry.id === item.id);
            if (target) target.name = value;
          }}
        />
        {item.role ? (
          <span className="rp-muted" style={{ fontWeight: 400 }}>
            {" — "}
            <SectionField
              sectionId={sectionId}
              value={item.role}
              ariaLabel="Project role"
              update={(section, value) => {
                if (section.kind !== "projects") return;
                const target = section.data.items.find((entry) => entry.id === item.id);
                if (target) target.role = value;
              }}
            />
          </span>
        ) : null}
      </div>

      {item.url ? (
        <div className="rp-entry-date">
          <ResumeLink href={normalizeUrl(item.url)}>
            <SectionField
              sectionId={sectionId}
              value={item.url.replace(/^https?:\/\//, "")}
              ariaLabel="Project URL"
              update={(section, value) => {
                if (section.kind !== "projects") return;
                const target = section.data.items.find((entry) => entry.id === item.id);
                if (target) target.url = value;
              }}
            />
          </ResumeLink>
        </div>
      ) : (
        <div className="rp-entry-date">
          <InlineEditable
            value={formatRange(item.startDate, item.endDate)}
            sectionId={sectionId}
            ariaLabel="Project date"
            onChange={(value) =>
              update((section, next) => {
                if (section.kind !== "projects") return;
                const target = section.data.items.find((entry) => entry.id === item.id);
                if (target) Object.assign(target, parseDateRange(next));
              }, value)
            }
          />
        </div>
      )}
    </div>

    {item.description ? (
      <div className="rp-desc">
        <SectionField
          sectionId={sectionId}
          value={item.description}
          multiline
          as="div"
          ariaLabel="Project description"
          update={(section, value) => {
            if (section.kind !== "projects") return;
            const target = section.data.items.find((entry) => entry.id === item.id);
            if (target) target.description = value;
          }}
        />
      </div>
    ) : null}
    <Bullets
      items={item.bullets}
      theme={theme}
      sectionId={sectionId}
      onChange={(index, value) =>
        update((section, next) => {
          if (section.kind !== "projects") return;
          const target = section.data.items.find((entry) => entry.id === item.id);
          if (target) target.bullets[index] = next;
        }, value)
      }
    />
    <TechLine
      items={item.tech}
      sectionId={sectionId}
      onChange={(index, value) =>
        update((section, next) => {
          if (section.kind !== "projects") return;
          const target = section.data.items.find((entry) => entry.id === item.id);
          if (target) target.tech[index] = next;
        }, value)
      }
    />
  </div>
  );
};

export const CertificationEntry = ({
  item,
  sectionId,
}: {
  item: CertSection["data"]["items"][number];
  sectionId: string;
}) => {
  const update = useSectionUpdate(sectionId);

  return (
  <div className="rp-entry">
    <EntryTop
      title={item.name}
      date={item.date}
      sectionId={sectionId}
      onTitleChange={(value) =>
        update((section, next) => {
          if (section.kind !== "certifications") return;
          const target = section.data.items.find((entry) => entry.id === item.id);
          if (target) target.name = next;
        }, value)
      }
      onDateChange={(value) =>
        update((section, next) => {
          if (section.kind !== "certifications") return;
          const target = section.data.items.find((entry) => entry.id === item.id);
          if (target) target.date = next;
        }, value)
      }
    />
    {item.issuer ? (
      <SectionField
        sectionId={sectionId}
        value={item.issuer}
        ariaLabel="Certification issuer"
        update={(section, value) => {
          if (section.kind !== "certifications") return;
          const target = section.data.items.find((entry) => entry.id === item.id);
          if (target) target.issuer = value;
        }}
      />
    ) : null}
  </div>
  );
};

export const AchievementEntry = ({
  item,
  sectionId,
}: {
  item: AchievementSection["data"]["items"][number];
  sectionId: string;
}) => {
  const update = useSectionUpdate(sectionId);

  return (
  <div className="rp-entry">
    <EntryTop
      title={item.title}
      date={item.date}
      sectionId={sectionId}
      onTitleChange={(value) =>
        update((section, next) => {
          if (section.kind !== "achievements") return;
          const target = section.data.items.find((entry) => entry.id === item.id);
          if (target) target.title = next;
        }, value)
      }
      onDateChange={(value) =>
        update((section, next) => {
          if (section.kind !== "achievements") return;
          const target = section.data.items.find((entry) => entry.id === item.id);
          if (target) target.date = next;
        }, value)
      }
    />
    {item.issuer ? (
      <SectionField
        sectionId={sectionId}
        value={item.issuer}
        ariaLabel="Achievement issuer"
        update={(section, value) => {
          if (section.kind !== "achievements") return;
          const target = section.data.items.find((entry) => entry.id === item.id);
          if (target) target.issuer = value;
        }}
      />
    ) : null}
    {item.description ? (
      <div className="rp-desc">
        <SectionField
          sectionId={sectionId}
          value={item.description}
          multiline
          as="div"
          ariaLabel="Achievement description"
          update={(section, value) => {
            if (section.kind !== "achievements") return;
            const target = section.data.items.find((entry) => entry.id === item.id);
            if (target) target.description = value;
          }}
        />
      </div>
    ) : null}
  </div>
  );
};

export const PublicationEntry = ({
  item,
  sectionId,
}: {
  item: PublicationSection["data"]["items"][number];
  sectionId: string;
}) => {
  const update = useSectionUpdate(sectionId);

  return (
  <div className="rp-pub">
    <div>
      {item.authors ? (
        <>
          <SectionField
            sectionId={sectionId}
            value={item.authors}
            ariaLabel="Publication authors"
            update={(section, value) => {
              if (section.kind !== "publications") return;
              const target = section.data.items.find((entry) => entry.id === item.id);
              if (target) target.authors = value;
            }}
          />
          .{" "}
        </>
      ) : null}
      <span style={{ fontStyle: "italic" }}>
        <SectionField
          sectionId={sectionId}
          value={item.title}
          ariaLabel="Publication title"
          update={(section, value) => {
            if (section.kind !== "publications") return;
            const target = section.data.items.find((entry) => entry.id === item.id);
            if (target) target.title = value;
          }}
        />
      </span>
      {item.venue ? (
        <>
          .{" "}
          <SectionField
            sectionId={sectionId}
            value={item.venue}
            ariaLabel="Publication venue"
            update={(section, value) => {
              if (section.kind !== "publications") return;
              const target = section.data.items.find((entry) => entry.id === item.id);
              if (target) target.venue = value;
            }}
          />
        </>
      ) : null}
      {item.date ? (
        <>
          ,{" "}
          <InlineEditable
            value={item.date}
            sectionId={sectionId}
            ariaLabel="Publication date"
            onChange={(value) =>
              update((section, next) => {
                if (section.kind !== "publications") return;
                const target = section.data.items.find((entry) => entry.id === item.id);
                if (target) target.date = next;
              }, value)
            }
          />
        </>
      ) : null}
      {item.url ? (
        <>
          {". "}
          <ResumeLink href={normalizeUrl(item.url)}>
            <SectionField
              sectionId={sectionId}
              value={item.url.replace(/^https?:\/\//, "")}
              ariaLabel="Publication URL"
              update={(section, value) => {
                if (section.kind !== "publications") return;
                const target = section.data.items.find((entry) => entry.id === item.id);
                if (target) target.url = value;
              }}
            />
          </ResumeLink>
        </>
      ) : null}
    </div>
  </div>
  );
};

export const ReferenceEntry = ({
  item,
  sectionId,
}: {
  item: ReferenceSection["data"]["items"][number];
  sectionId: string;
}) => {
  const update = useSectionUpdate(sectionId);

  return (
  <div className="rp-entry">
    <EntryTop
      title={item.name}
      date=""
      sectionId={sectionId}
      onTitleChange={(value) =>
        update((section, next) => {
          if (section.kind !== "references") return;
          const target = section.data.items.find((entry) => entry.id === item.id);
          if (target) target.name = next;
        }, value)
      }
    />
    <div className="rp-entry-sub">
      <SectionField
        sectionId={sectionId}
        value={item.role}
        ariaLabel="Reference role"
        update={(section, value) => {
          if (section.kind !== "references") return;
          const target = section.data.items.find((entry) => entry.id === item.id);
          if (target) target.role = value;
        }}
      />
      {" · "}
      <SectionField
        sectionId={sectionId}
        value={item.contact}
        ariaLabel="Reference contact"
        update={(section, value) => {
          if (section.kind !== "references") return;
          const target = section.data.items.find((entry) => entry.id === item.id);
          if (target) target.contact = value;
        }}
      />
    </div>
  </div>
  );
};

export const CustomEntry = ({
  item,
  theme,
  sectionId,
}: {
  item: CustomSection["data"]["items"][number];
  theme: ThemeConfig;
  sectionId: string;
}) => {
  const update = useSectionUpdate(sectionId);

  return (
  <div className="rp-entry">
    <EntryTop
      title={item.heading}
      date={item.date}
      sectionId={sectionId}
      onTitleChange={(value) =>
        update((section, next) => {
          if (section.kind !== "custom") return;
          const target = section.data.items.find((entry) => entry.id === item.id);
          if (target) target.heading = next;
        }, value)
      }
      onDateChange={(value) =>
        update((section, next) => {
          if (section.kind !== "custom") return;
          const target = section.data.items.find((entry) => entry.id === item.id);
          if (target) target.date = next;
        }, value)
      }
    />
    {item.subheading ? (
      <div className="rp-entry-sub">
        <SectionField
          sectionId={sectionId}
          value={item.subheading}
          ariaLabel="Custom section subheading"
          update={(section, value) => {
            if (section.kind !== "custom") return;
            const target = section.data.items.find((entry) => entry.id === item.id);
            if (target) target.subheading = value;
          }}
        />
      </div>
    ) : null}
    <Bullets
      items={item.bullets}
      theme={theme}
      sectionId={sectionId}
      onChange={(index, value) =>
        update((section, next) => {
          if (section.kind !== "custom") return;
          const target = section.data.items.find((entry) => entry.id === item.id);
          if (target) target.bullets[index] = next;
        }, value)
      }
    />
  </div>
  );
};

export const SkillsBlock = ({
  section,
}: {
  section: Extract<ResumeSection, { kind: "skills" }>;
}) => {
  const groups = section.data.groups.filter((group) => group.items.length > 0);

  if (groups.length === 0) return null;

  if (section.data.display === "chips") {
    return (
      <div className="rp-chips">
        {groups.flatMap((group) =>
          group.items.map((item, index) => (
            <span className="rp-chip" key={`${group.id}-${index}`}>
                <SectionField
                  sectionId={section.id}
                  value={item}
                  ariaLabel={`Skill ${index + 1}`}
                  update={(target, value) => {
                    if (target.kind !== "skills") return;
                    const targetGroup = target.data.groups.find((entry) => entry.id === group.id);
                    if (targetGroup) targetGroup.items[index] = value;
                  }}
                />
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
            <div className="rp-skill-name">
              <SectionField
                sectionId={section.id}
                value={group.name}
                ariaLabel="Skill group"
                update={(target, value) => {
                  if (target.kind !== "skills") return;
                  const targetGroup = target.data.groups.find((entry) => entry.id === group.id);
                  if (targetGroup) targetGroup.name = value;
                }}
              />
            </div>
            {group.items.map((item, index) => (
              <div className="rp-skill-row" key={index}>
                <SectionField
                  sectionId={section.id}
                  value={item}
                  ariaLabel={`Skill ${index + 1}`}
                  update={(target, value) => {
                    if (target.kind !== "skills") return;
                    const targetGroup = target.data.groups.find((entry) => entry.id === group.id);
                    if (targetGroup) targetGroup.items[index] = value;
                  }}
                />
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
          {section.data.display === "list" ? (
            <div className="rp-skill-name">
              <SectionField
                sectionId={section.id}
                value={group.name}
                ariaLabel="Skill group"
                update={(target, value) => {
                  if (target.kind !== "skills") return;
                  const targetGroup = target.data.groups.find((entry) => entry.id === group.id);
                  if (targetGroup) targetGroup.name = value;
                }}
              />
            </div>
          ) : null}

          <div className="rp-skill-list">
            {section.data.display === "inline" && group.name ? (
              <span className="rp-skill-name" style={{ marginRight: 6 }}>
                <SectionField
                  sectionId={section.id}
                  value={group.name}
                  ariaLabel="Skill group"
                  update={(target, value) => {
                    if (target.kind !== "skills") return;
                    const targetGroup = target.data.groups.find((entry) => entry.id === group.id);
                    if (targetGroup) targetGroup.name = value;
                  }}
                />:
              </span>
            ) : null}

            {group.items.map((item, index) => (
              <span className="rp-skill-item" key={index}>
                <SectionField
                  sectionId={section.id}
                  value={item}
                  ariaLabel={`Skill ${index + 1}`}
                  update={(target, value) => {
                    if (target.kind !== "skills") return;
                    const targetGroup = target.data.groups.find((entry) => entry.id === group.id);
                    if (targetGroup) targetGroup.items[index] = value;
                  }}
                />
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export const LanguagesBlock = ({
  section,
}: {
  section: Extract<ResumeSection, { kind: "languages" }>;
}) => {
  const items = section.data.items.filter((item) => item.name.trim());

  if (!items.length) return null;

  if (section.data.display === "dots") {
    return (
      <div>
        {items.map((item) => (
          <div className="rp-lang-row" key={item.id}>
        <SectionField
          sectionId={section.id}
          value={item.name}
          ariaLabel="Language"
          update={(target, value) => {
            if (target.kind !== "languages") return;
            const entry = target.data.items.find((candidate) => candidate.id === item.id);
            if (entry) entry.name = value;
          }}
        />
            <span className="rp-dots" aria-label={item.proficiency}>
              {[1, 2, 3, 4, 5].map((number) => (
                <span
                  key={number}
                  className={`rp-dot${
                    number <= proficiencyDots(item.proficiency) ? " is-on" : ""
                  }`}
                />
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
            <SectionField
              sectionId={section.id}
              value={item.name}
              ariaLabel="Language"
              update={(target, value) => {
                if (target.kind !== "languages") return;
                const entry = target.data.items.find((candidate) => candidate.id === item.id);
                if (entry) entry.name = value;
              }}
            />
            {item.proficiency ? ` — ${item.proficiency}` : ""}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div>
      {items.map((item) => (
        <div className="rp-lang-row" key={item.id}>
        <SectionField
          sectionId={section.id}
          value={item.name}
          ariaLabel="Language"
          update={(target, value) => {
            if (target.kind !== "languages") return;
            const entry = target.data.items.find((candidate) => candidate.id === item.id);
            if (entry) entry.name = value;
          }}
        />
        <span className="rp-muted">
          <SectionField
            sectionId={section.id}
            value={item.proficiency}
            ariaLabel="Language proficiency"
            update={(target, value) => {
              if (target.kind !== "languages") return;
              const entry = target.data.items.find((candidate) => candidate.id === item.id);
              if (entry) entry.proficiency = value;
            }}
          />
        </span>
        </div>
      ))}
    </div>
  );
};

export const InterestsBlock = ({
  section,
}: {
  section: Extract<ResumeSection, { kind: "interests" }>;
}) => {
  const items = section.data.items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.trim());

  if (!items.length) return null;

  return (
    <div className="rp-skill-list">
      {items.map(({ item, index }) => (
        <span className="rp-skill-item" key={index}>
          <SectionField
            sectionId={section.id}
            value={item}
            ariaLabel={`Interest ${index + 1}`}
            update={(target, value) => {
              if (target.kind !== "interests") return;
              target.data.items[index] = value;
            }}
          />
        </span>
      ))}
    </div>
  );
};

export const SummaryBlock = ({
  section,
}: {
  section: Extract<ResumeSection, { kind: "summary" }>;
}) => (
  <div className="rp-summary">
    <SectionField
      sectionId={section.id}
      value={section.data.text}
      multiline
      as="div"
      ariaLabel="Professional summary"
      update={(target, value) => {
        if (target.kind === "summary") target.data.text = value;
      }}
    />
  </div>
);

export type SectionBody = {
  node: ReactNode;
  splitPerItem: boolean;
};

export const sectionBody = (
  section: ResumeSection,
  theme: ThemeConfig,
): SectionBody => {
  switch (section.kind) {
    case "summary":
      return {
        node: <SummaryBlock section={section} />,
        splitPerItem: false,
      };
    case "skills":
      return {
        node: <SkillsBlock section={section} />,
        splitPerItem: false,
      };
    case "languages":
      return {
        node: <LanguagesBlock section={section} />,
        splitPerItem: false,
      };
    case "interests":
      return {
        node: <InterestsBlock section={section} />,
        splitPerItem: false,
      };
    default:
      return {
        node: null,
        splitPerItem: true,
      };
  }
};

export const sectionItems = (
  section: ResumeSection,
  theme: ThemeConfig,
): ReactNode[] => {
  switch (section.kind) {
    case "experience":
    case "volunteer":
      return section.data.items.map((item) => (
        <ExperienceEntry key={item.id} item={item} theme={theme} sectionId={section.id} />
      ));
    case "education":
      return section.data.items.map((item) => (
        <EducationEntry key={item.id} item={item} theme={theme} sectionId={section.id} />
      ));
    case "projects":
      return section.data.items.map((item) => (
        <ProjectEntry key={item.id} item={item} theme={theme} sectionId={section.id} />
      ));
    case "certifications":
      return section.data.items.map((item) => (
        <CertificationEntry key={item.id} item={item} sectionId={section.id} />
      ));
    case "achievements":
      return section.data.items.map((item) => (
        <AchievementEntry key={item.id} item={item} sectionId={section.id} />
      ));
    case "publications":
      return section.data.items.map((item) => (
        <PublicationEntry key={item.id} item={item} sectionId={section.id} />
      ));
    case "references":
      return section.data.items.map((item) => (
        <ReferenceEntry key={item.id} item={item} sectionId={section.id} />
      ));
    case "custom":
      return section.data.items.map((item) => (
        <CustomEntry key={item.id} item={item} theme={theme} sectionId={section.id} />
      ));
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

export { headingTransform, headingFontVariant };