"use client";

import { useState } from "react";
import { Check, Copy, Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";

const TOPICS = [
  { value: "bug", label: "Something is broken" },
  { value: "template", label: "Template request or feedback" },
  { value: "accuracy", label: "A factual error in a guide" },
  { value: "privacy", label: "Privacy question" },
  { value: "other", label: "Something else" },
];

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@resumeforge.dev";
const MAX = 4000;

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", topic: "bug", message: "", page: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [prepared, setPrepared] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const set = (key: keyof typeof form) => (value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };

  const submit = () => {
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = "Add a name so the reply can be addressed.";
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(form.email.trim())) next.email = "That email address does not look complete.";
    if (form.message.trim().length < 20) next.message = "A little more detail helps — at least a sentence.";
    if (form.message.length > MAX) next.message = `Please keep it under ${MAX} characters.`;
    setErrors(next);
    if (Object.keys(next).length) return;

    const topic = TOPICS.find((item) => item.value === form.topic)?.label ?? form.topic;
    const subject = `[Resume Forge] ${topic}`;
    const body = [
      `From: ${form.name} <${form.email}>`,
      form.page ? `Page: ${form.page}` : null,
      "",
      form.message.trim(),
      "",
      "—",
      "Sent from the Resume Forge contact page. No resume content was attached.",
    ]
      .filter(Boolean)
      .join("\n");

    setPrepared(body);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const copy = async () => {
    if (!prepared) return;
    try {
      await navigator.clipboard.writeText(`To: ${CONTACT_EMAIL}\n\n${prepared}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="rounded-[9px] border border-line bg-surface p-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Your name</Label>
          <Input value={form.name} onChange={(event) => set("name")(event.target.value)} placeholder="Aarav Mehta" aria-invalid={Boolean(errors.name)} />
          {errors.name ? <p className="text-[11px] text-danger">{errors.name}</p> : null}
        </div>
        <div className="space-y-1">
          <Label>Email for the reply</Label>
          <Input value={form.email} onChange={(event) => set("email")(event.target.value)} placeholder="you@mail.com" aria-invalid={Boolean(errors.email)} />
          {errors.email ? <p className="text-[11px] text-danger">{errors.email}</p> : null}
        </div>
        <div className="space-y-1">
          <Label>Topic</Label>
          <Select value={form.topic} onValueChange={set("topic")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TOPICS.map((topic) => (
                <SelectItem key={topic.value} value={topic.value}>{topic.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Page or template (optional)</Label>
          <Input value={form.page} onChange={(event) => set("page")(event.target.value)} placeholder="/templates/nordic-ledger" />
        </div>
      </div>

      <div className="mt-2 space-y-1">
        <div className="flex items-baseline justify-between">
          <Label>Message</Label>
          <span className={cn("text-[10.5px]", form.message.length > MAX ? "text-danger" : "text-subtle")}>
            {form.message.length}/{MAX}
          </span>
        </div>
        <Textarea
          value={form.message}
          onChange={(event) => set("message")(event.target.value)}
          placeholder="What happened, what you expected, and which browser you were using."
          style={{ minHeight: 150 }}
          aria-invalid={Boolean(errors.message)}
        />
        {errors.message ? <p className="text-[11px] text-danger">{errors.message}</p> : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button variant="primary" size="md" onClick={submit}>
          <Send className="size-3.5" /> Compose email
        </Button>
        <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center gap-1 rounded-[6px] border border-line-strong px-3 py-2 text-[13px] font-medium text-ink hover:bg-surface-2">
          <Mail className="size-3.5" /> {CONTACT_EMAIL}
        </a>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-subtle">
        This form has no backend. It composes a message in your own mail client, so nothing is transmitted until you press send there —
        and this project never receives your address unless you send it.
      </p>

      {prepared ? (
        <div className="mt-3 rounded-[6px] border border-line bg-surface-2 p-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-[11.5px] font-medium text-ink">
              <Check className="size-3.5 text-ok" /> Message ready
            </p>
            <Button variant="ghost" size="sm" onClick={copy}>
              {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
              {copied ? "Copied" : "Copy text"}
            </Button>
          </div>
          <pre className="mt-1.5 max-h-40 overflow-auto whitespace-pre-wrap text-[11px] leading-relaxed text-subtle">{prepared}</pre>
          <p className="mt-1.5 text-[10.5px] text-subtle">
            If your mail client did not open, copy this text and send it to {CONTACT_EMAIL} directly.
          </p>
        </div>
      ) : null}
    </div>
  );
}
