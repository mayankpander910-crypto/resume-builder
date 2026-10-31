"use client";

import { useEffect, useRef, useState } from "react";
import type { ResumeDocument } from "@/types/resume";
import type { ResumeTemplate } from "@/types/template";
import { getPageMetrics } from "@/lib/resume/renderer/metrics";
import { ResumeCanvas } from "@/components/resume/ResumeCanvas";
import { cn } from "@/lib/utils/cn";
import { StaticLinksProvider } from "@/components/resume/static-links";

/**
 * A single-page snapshot of a resume, scaled to fit a card. Rendering is
 * deferred until the card scrolls into view so a 64-card gallery stays cheap.
 */
export function ResumeThumb({
  doc,
  template,
  width = 260,
  className,
  eager = false,
  fade = true,
}: {
  doc: ResumeDocument;
  template: ResumeTemplate;
  width?: number;
  className?: string;
  eager?: boolean;
  fade?: boolean;
}) {
  const metrics = getPageMetrics(doc.page, doc.layout);
  const scale = width / metrics.width;
  const height = metrics.height * scale;
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(eager);

  useEffect(() => {
    if (visible || !ref.current) return;
    const node = ref.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div
      ref={ref}
      className={cn("relative overflow-hidden rounded-[2px] border border-line bg-white", className)}
      style={{ width, height }}
      aria-hidden
    >
      {visible ? (
        <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: metrics.width }}>
          <StaticLinksProvider value>
            <ResumeCanvas doc={doc} template={template} mode="flow" />
          </StaticLinksProvider>
        </div>
      ) : (
        <div className="h-full w-full animate-pulse bg-surface-2" />
      )}
      {fade ? (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0"
          style={{ height: height * 0.16, background: "linear-gradient(to bottom, rgba(255,255,255,0), #ffffff)" }}
        />
      ) : null}
    </div>
  );
}
