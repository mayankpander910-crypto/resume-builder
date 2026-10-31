# Resume Forge

A free, account-free resume builder: 64 structurally distinct templates, a real three-panel editor with drag-and-drop section ordering and undo/redo, an optional AI assistant that asks before it sends anything anywhere, a rule-based ATS review, and print-quality PDF export.

Everything in the core workflow runs in the browser. There is no database, no user table, and no copy of your resume on a server.

---

## Quick start

```bash
npm install          # also copies the pdf.js worker into public/
cp .env.example .env.local   # optional — the app works without any keys
npm run dev          # http://localhost:3000
```

Production:

```bash
npm run build
npm start
```

Other scripts:

| Script | What it does |
| --- | --- |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest suite (92 tests) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run lint` | `next lint` |

---

## What is in the box

### Editor (`/builder`)
- Three panels: content (personal details + sections), live canvas, design.
- Every section can be reordered by dragging in the outline **or** directly on the page; `dnd-kit` handles both, with keyboard support.
- Undo/redo (`⌘Z` / `⌘⇧Z`) with 900 ms coalescing so typing is one step, not one per keystroke.
- Autosave to `localStorage` (debounced), explicit save state in the toolbar.
- Design controls that are actually typographic: body/heading font, sizes, line height, section spacing, heading rule style and case, divider weight, bullet marker, accent colour, page size and margins, column layout.
- Page-size presets, page numbers, and a paginator that measures real block heights.
- Export: **Download PDF** (browser print of `/print`), plus JSON export/import of the document itself.

### Templates (`/templates`, `/templates/[id]`)
64 templates built from **16 layout archetypes** — classic chronological, modern single column, tinted sidebar, equal split, timeline, editorial, banner band, monogram, three-column index, academic, and so on. A template is a *layout recipe* (page geometry, type scale, heading rules, entry layout, column split, section order) applied to one shared renderer, so switching templates re-renders the same content and never rewrites it. That property is covered by tests.

Each template page shows a real rendered preview at short/medium/long content lengths, an ATS-safety score with the reasoning, a facts table, and a "Use this template" action that hydrates the editor with the chosen frame.

### AI assistant (`/ai-resume`, plus the editor's AI panel)
- Consent is per-request and explicit; the checkbox names the providers configured on the deployment.
- 5 supported providers, all official documented APIs: Gemini, Groq, OpenRouter, Cerebras, Hugging Face.
- Server-side keys only. `/api/ai/status` exposes which providers are configured — never key material.
- Multi-provider fallback: retries (2× with backoff), then the next provider in `AI_PROVIDER_ORDER`; a bad request aborts the chain instead of hammering four providers; failures set a 5-minute cooldown.
- Every response is validated against a Zod contract before the UI may touch it. Output is never auto-applied: you review it, then press *Apply*.
- The generator is instructed (and tested) not to invent employers, dates, degrees or metrics; anything it lacks is returned in a `missingInformation` list.
- With no keys configured, the assistant explains exactly what to set and the rest of the app keeps working.

### ATS review (`/ats-checker`)
18 rule-based checks on the document in your editor (19 with a job description; 11 on pasted text), scored and grouped: contact parseability, section presence and quality, bullet structure, action-verb openers, quantification, date consistency, duplicates, placebo/placeholder text, keyword coverage against a posting, and the parser-safety of the chosen template.

It is explicitly **not** an employer ATS score, and the UI says so on every run.

### Import (`/import`)
PDF / DOCX / TXT / MD up to 8 MB. Text extraction and parsing happen in the tab (pdf.js + a heading-first heuristic parser). Scanned PDFs are rejected rather than silently mangled. Detected sections are shown for approval before anything is applied, and unclassified blocks are surfaced as "unmapped" instead of being guessed at.

### Content
- `/guides` — 4 long-form guides (writing checklist, achievement bullets, format/ATS, career change).
- `/blog` — 4 posts on the product and engineering decisions behind the app.
- `/examples` — 9 worked examples (senior engineer, ML engineer, data analyst, product manager, UX designer, fresher engineer, marketing manager, finance analyst, HR business partner), each with the sample lines, the structural reasoning, and a "watch out".
- `/about`, `/contact`, `/privacy`, `/terms`.
- `sitemap.xml` + `robots.txt` generated from the same registries.

---

## Architecture

```
app/
  page.tsx                 landing page
  builder/                 the editor (client-heavy, hydrates from localStorage)
  print/                   print-only view used for PDF export
  templates/ examples/ guides/ blog/    content routes with generateStaticParams
  ai-resume/ ats-checker/ import/ about/ contact/ privacy/ terms/
  api/ai/{generate,improve,review,tailor,status}/route.ts
components/
  resume/                  the renderer: ResumeCanvas, parts, blocks, ResumeThumb
  editor/                  EditorShell, ContentPanel, DesignPanel, CanvasPanel, AiPanel, dialogs
  templates/ content/ ats/ ai/ import/ layout/ ui/
lib/
  resume/schema/           Zod contracts + factories (the document type is the contract)
  resume/renderer/         metrics, pagination, formatting, plain-text export
  resume/import/           extraction (pdf.js, JSZip/DOCX, FileReader) + parsing
  resume/validation/       storage/file validation with fatal vs warning issues
  templates/               16 archetypes, 64 templates, preview documents
  ai/                      provider catalogue, orchestrator, prompts, schemas, mapping
  ats/                     the 18-check analyser
  content/                 articles, examples, sample resume
store/resume-store.ts      Zustand store: document, history, autosave
styles/resume.css          print-accurate resume styles (scoped via CSS vars)
```

### Three decisions worth knowing

**One renderer, many templates.** `ResumeCanvas` renders a `ResumeDocument` at true page measurements (96 px per inch). A template contributes tokens and a recipe, not markup. This is why a template switch can be guaranteed lossless, and why preview, thumbnail, editor and print all agree.

**Print for PDF.** PDF export opens `/print`, which renders the same tree at the same measurements, and calls `window.print()`. You get a vector PDF with a real, selectable text layer, produced by the browser's own engine rather than a hand-rolled canvas export that parsers often cannot read.

**Local-first, network-optional.** The document lives in `localStorage` under `resumeforge.document.v1`. The only network calls the app makes are the AI endpoints. There are no cookies, no analytics and no third-party scripts.

---

## Environment variables

See `.env.example`. In short:

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | no | Canonical origin for metadata, sitemap, robots |
| `NEXT_PUBLIC_CONTACT_EMAIL` | no | Address shown on `/contact` (mailto only) |
| `GEMINI_API_KEY` / `GROQ_API_KEY` / `OPENROUTER_API_KEY` / `CEREBRAS_API_KEY` / `HUGGINGFACE_API_KEY` | no | Enable the AI assistant; one is enough |
| `*_MODEL` | no | Override the default model per provider |
| `AI_PROVIDER_ORDER` | no | Comma-separated fallback order |

Free-tier statements in the UI and docs are deliberately hedged: quotas change, so the app names the documented limit shape rather than promising a number.

---

## Privacy summary

- The resume is stored in this browser profile only; there is no server-side copy.
- Two `localStorage` keys exist: `resumeforge.document.v1` (the document) and `rf:import-text` (a transient hand-off between `/import` and the editor dialog, deleted on read).
- AI requests are sent only after per-request consent, contain only the fields shown in that form, and are forwarded to one configured provider.
- Server logs record one line per AI call: timestamp, route, ok/fail, provider, error code, latency, attempt count. **No resume text and no IP address.**
- Rate limiting is an in-memory, ten-minute sliding window keyed by a hash of the client IP; it is never persisted.
- Deleting your data: the editor's menu has *Delete local document*, which removes the storage key; clearing site data does the same.

Full text on `/privacy`.

---

## Testing

```bash
npm test
```

92 tests across 8 files:

| File | Covers |
| --- | --- |
| `templates.test.ts` | 64 unique templates, every archetype resolves, structural (not colour) distinctness, **template switching never mutates content**, filter behaviour |
| `renderer.test.ts` | Page metrics at 96 dpi, column order, type scale, colour helpers, paginator (no orphaned heads, continuation heads, page guard), formatting, plain-text export |
| `ats.test.ts` | Score ordering (full > empty), the 18/19/11 check counts, contact flags, template penalty, keyword coverage, no invented bullet issues |
| `import.test.ts` | Contact/summary/experience/education/skills parsing, stacked date lines, unmapped headings, section mapping, text sanitation |
| `ai.test.ts` | Zod contracts accept/reject the right shapes, defaults, array caps, loose JSON recovery, generated → sections mapping without invented facts |
| `schema.test.ts` | Document round-trip, invalid documents rejected, storage payload parsing (wrapped + bare), duplicate-id warnings |
| `store.test.ts` | Undo/redo, keystroke coalescing, template switch history, theme preservation, drag reordering, section add/duplicate/remove, sample loading |
| `content.test.ts` | 4 guides + 4 posts + 9 examples, unique slugs, real length, only known block kinds, examples point at real templates |

---

## Manual QA checklist

1. `/builder?new=1` on a fresh profile → blank document, "This page is empty" hint, paste a name → the page updates live.
2. `/templates` → filter by category, open a template, press *Use this template* → the editor opens with the new frame and the content intact.
3. Drag a section in the outline → the canvas reorders; `⌘Z` restores it.
4. Toggle a template with more columns → no content is lost, the sidebar picks up the right sections.
5. `/ats-checker` → run on the current document; run again with a job description → keyword coverage appears.
6. `/import` → drop a PDF or DOCX → the editor opens with the import dialog pre-filled; apply → sections appear.
7. Download PDF → the print dialog shows the same layout at the same margins.
8. `/ai-resume` with no keys → the disabled state explains what to set; with a key → generate, review, apply.
9. Resize to 390 px → the editor switches to a single-column tab layout, the marketing pages remain readable.

---

## Known limitations

- One browser profile only: no cloud sync, no accounts. Export the PDF (or the JSON document) if you need a portable copy.
- Import quality depends on the source file; two-column layouts and text boxes flatten differently in every generator. Budget a few minutes to correct dates and grouping.
- PDF output is generated by your browser's print engine, so expect small differences between Chrome, Safari and Firefox. Enable "background graphics" to keep accent bands.
- The ATS review is a heuristic written for this project. It does not reproduce any vendor's ranking.
- The AI assistant is only as good as the facts you give it, and it is never allowed to apply changes without review.

---

## Licence

Content and code in this repository are provided as-is for use and modification. Sample resumes, examples and testimonials are illustrative demo content and are labelled as such in the UI.
