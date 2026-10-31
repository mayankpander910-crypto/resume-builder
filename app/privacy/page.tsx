import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell, PageHeader } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What Resume Forge stores, where it stores it, what leaves your browser and when — including the exact localStorage keys and AI provider behaviour.",
};

const UPDATED = "31 October 2026";

export default function PrivacyPage() {
  return (
    <SiteShell>
      <PageHeader
        eyebrow="Privacy"
        title="Your resume never leaves this browser unless you ask it to"
        description="This policy describes what the app actually does. It is deliberately specific: storage keys, request bodies and log fields are named so you can verify them in the source or in your browser's dev tools."
      >
        <div className="flex flex-wrap gap-1.5">
          <Badge tone="accent">No accounts</Badge>
          <Badge>No analytics</Badge>
          <Badge>No cookies</Badge>
          <Badge>Last updated {UPDATED}</Badge>
        </div>
      </PageHeader>

      <article className="container-page prose-page max-w-[72ch] py-10">
        <div className="rounded-[8px] border border-line bg-surface p-4 not-prose">
          <p className="text-[12.5px] font-semibold text-ink">The short version</p>
          <ul className="mt-1.5 space-y-1">
            {[
              "Your resume is stored in this browser's localStorage under resumeforge.document.v1. It is not uploaded.",
              "There is no sign-up, no cookie, no analytics script and no advertising pixel.",
              "AI requests happen only after you tick consent, and only send the text shown in that request.",
              "The server logs one line per AI call with no resume content. Rate-limit counters live in memory and expire.",
            ].map((line) => (
              <li key={line} className="text-[12px] leading-relaxed text-subtle">
                • {line}
              </li>
            ))}
          </ul>
        </div>

        <h2>1. What is stored, and where</h2>
        <p>
          The editor keeps one record in your browser&apos;s <strong>localStorage</strong> under the key{" "}
          <code>resumeforge.document.v1</code>. It contains the resume document: your name and contact details, section text, the selected
          template id, and design settings (fonts, spacing, accent colour, page size). It also records a timestamp of the last save.
        </p>
        <p>
          A second, short-lived key — <code>rf:import-text</code> — holds text extracted from a file you chose on the import page, so the
          editor&apos;s import dialog can open pre-filled. It is deleted as soon as the dialog reads it.
        </p>
        <p>
          Both keys belong to this origin in this browser profile. We cannot read them, back them up or restore them. Clearing site data,
          using a private window, or switching device or browser means starting from an empty document. Use the export option in the editor
          if you want a portable copy.
        </p>

        <h2>2. What is not collected</h2>
        <p>
          There is no account system, no email capture, no newsletter, no analytics product, no session recording, no A/B testing framework,
          and no third-party script on these pages. The only cookie-like storage is the localStorage described above; no cookies are set by
          the app.
        </p>

        <h2>3. When content leaves your browser</h2>
        <p>
          Two features talk to a server, and both are opt-in per request:
        </p>
        <ul>
          <li>
            <strong>AI assistant.</strong> On the AI resume page and inside the editor, a request is only sent after you tick the consent
            box for that action. The request body contains the fields shown in the form (contact basics, target role, your facts or pasted
            text, or the specific bullet/summary being improved) plus <code>consent: true</code>. It is sent to{" "}
            <code>/api/ai/*</code> on this deployment, which forwards it to one configured provider.
          </li>
          <li>
            <strong>Provider status probe.</strong> <code>/api/ai/status</code> returns which providers are configured on the server so the
            interface can show or hide the assistant. It sends no resume content and returns no key material — only provider ids, model
            names, an order and a note.
          </li>
        </ul>
        <p>
          Everything else runs locally: template rendering, pagination, PDF export (your browser&apos;s print engine), the ATS review, text
          extraction from PDF and DOCX, and every template preview on the marketing pages.
        </p>

        <h2>4. Which AI providers may process your text</h2>
        <p>
          The deployment decides, through server-side environment variables. The supported providers are Google AI Studio (Gemini), Groq,
          OpenRouter, Cerebras and Hugging Face Inference. The status response lists which are configured; the consent text names them before
          you submit. Each provider processes the text under its own terms and retention policy — review that provider&apos;s policy if the
          content is sensitive. Requests are processed to return a response and are not used by this project to train anything.
        </p>
        <p>
          If no provider is configured, the assistant is disabled and says so. The rest of the app keeps working.
        </p>

        <h2>5. Server logs</h2>
        <p>
          Each AI call writes one structured line containing: a timestamp, the route name, success or failure, the provider id, an error code,
          the latency and the number of provider attempts. <strong>No resume text, no contact details and no IP address are written to that
          line.</strong> Rate limiting uses an in-memory counter keyed by a hash of the client IP with a ten-minute window; counters are held in
          process memory, are never persisted, and disappear when the process restarts.
        </p>

        <h2>6. Children and sensitive data</h2>
        <p>
          The app is intended for job seekers of working age. Resumes often contain personal data; keep it to what the role requires. If you
          would rather not send any of it to a model, leave the consent box unticked — nothing is transmitted and the assistant stays unused.
        </p>

        <h2>7. Your controls</h2>
        <ul>
          <li>
            <strong>Delete everything:</strong> the editor&apos;s menu has a “Delete local document” action, which removes{" "}
            <code>resumeforge.document.v1</code>. Clearing site data for this origin has the same effect.
          </li>
          <li>
            <strong>Export:</strong> download a PDF, or a JSON copy of the document that can be re-imported later.
          </li>
          <li>
            <strong>Refuse AI:</strong> never tick the consent box, or self-host without provider keys.
          </li>
        </ul>

        <h2>8. Changes</h2>
        <p>
          If a future version adds a feature that changes any of the above — for example optional cloud storage — this page will describe it
          before the feature ships, and the change will be opt-in.
        </p>

        <h2>9. Contact</h2>
        <p>
          Privacy questions go to the address on the <Link href="/contact">contact page</Link>. Please do not include your full resume in an
          email.
        </p>

        <p className="!mt-8 rounded-[8px] border border-line bg-surface p-3 text-[12px] !leading-relaxed text-subtle">
          This page describes the behaviour of this deployment of Resume Forge. If you are using a copy hosted by someone else, that operator
          controls the server environment and any provider keys, and is responsible for the deployment&apos;s own handling of requests.
        </p>
      </article>
    </SiteShell>
  );
}
