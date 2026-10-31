"use client";

import { LayoutTemplate, RotateCcw, Type, Columns3, FileText } from "lucide-react";
import { useResumeStore } from "@/store/resume-store";
import { getTemplate } from "@/lib/templates/registry";
import { FONT_LABELS, PAGE_SPECS } from "@/lib/resume/renderer/metrics";
import { archetypeOf } from "@/lib/templates/archetypes";
import { Slider, Tabs, TabsContent, TabsList, TabsTrigger, Separator } from "@/components/ui/misc";
import { Switch } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { HeadingCase, HeadingStyle, ThemeConfig } from "@/types/resume";
import { cn } from "@/lib/utils/cn";

const ACCENTS = ["#0d6b5f", "#1f3a5f", "#1e3a8a", "#4f46e5", "#7a2e2e", "#a2543a", "#8a6a1f", "#16697a", "#111827", "#5b3a64"];

function Control({ label, value, children }: { label: string; value?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[10.5px] font-medium uppercase tracking-[0.09em] text-subtle">{label}</span>
        {value ? <span className="text-[10.5px] tabular-nums text-subtle">{value}</span> : null}
      </div>
      {children}
    </div>
  );
}

function ColorControl({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <Control label={label} value={value.toUpperCase()}>
      <div className="flex items-center gap-2">
        <label className="relative size-7 shrink-0 cursor-pointer overflow-hidden rounded-[4px] border border-line">
          <span className="absolute inset-0" style={{ background: value }} />
          <input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label={label} />
        </label>
        <div className="flex flex-wrap gap-1">
          {ACCENTS.slice(0, 6).map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onChange(color)}
              className={cn("size-4 rounded-full border", value.toLowerCase() === color ? "border-ink" : "border-transparent")}
              style={{ background: color }}
              aria-label={`Use ${color}`}
            />
          ))}
        </div>
      </div>
    </Control>
  );
}

export function DesignPanel({ onChangeTemplate }: { onChangeTemplate: () => void }) {
  const doc = useResumeStore((state) => state.doc);
  const updateTheme = useResumeStore((state) => state.updateTheme);
  const updatePage = useResumeStore((state) => state.updatePage);
  const updateLayout = useResumeStore((state) => state.updateLayout);
  const toggleSection = useResumeStore((state) => state.toggleSection);
  const applyTemplate = useResumeStore((state) => state.applyTemplate);

  const template = getTemplate(doc.meta.templateId);
  const archetype = archetypeOf(template.archetype);
  const theme = doc.theme;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line px-3.5 py-2.5">
        <button
          type="button"
          onClick={onChangeTemplate}
          className="group flex w-full items-center justify-between gap-2 rounded-[5px] border border-line bg-surface px-2 py-1.5 text-left transition-colors hover:border-accent"
        >
          <span className="min-w-0">
            <span className="block text-[10.5px] uppercase tracking-[0.09em] text-subtle">Template</span>
            <span className="block truncate text-[12.5px] font-medium text-ink">{template.name}</span>
          </span>
          <LayoutTemplate className="size-3.5 shrink-0 text-subtle group-hover:text-accent" />
        </button>
      </div>

      <Tabs defaultValue="type" className="flex min-h-0 flex-1 flex-col">
        <div className="px-3 pt-2.5">
          <TabsList className="w-full">
            <TabsTrigger value="type" className="flex-1 justify-center">
              <Type className="size-3" /> Type
            </TabsTrigger>
            <TabsTrigger value="layout" className="flex-1 justify-center">
              <Columns3 className="size-3" /> Layout
            </TabsTrigger>
            <TabsTrigger value="page" className="flex-1 justify-center">
              <FileText className="size-3" /> Page
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="editor-panel min-h-0 flex-1 overflow-y-auto px-3.5 py-3">
          <TabsContent value="type" className="mt-0 space-y-3.5">
            <Control label="Body font">
              <Select value={theme.fontFamily} onValueChange={(value) => updateTheme({ fontFamily: value as ThemeConfig["fontFamily"] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FONT_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Control>
            <Control label="Heading font">
              <Select value={theme.headingFontFamily} onValueChange={(value) => updateTheme({ headingFontFamily: value as ThemeConfig["fontFamily"] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FONT_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Control>

            <Control label="Body size" value={`${Math.round(theme.fontScale * 100)}%`}>
              <Slider value={theme.fontScale} min={0.82} max={1.18} step={0.01} onValueChange={(value) => updateTheme({ fontScale: Number(value.toFixed(2)) })} label="Body size" />
            </Control>
            <Control label="Heading size" value={`${theme.headingSize.toFixed(1)}pt`}>
              <Slider value={theme.headingSize} min={8} max={15} step={0.5} onValueChange={(value) => updateTheme({ headingSize: value })} label="Heading size" />
            </Control>
            <Control label="Name size" value={`${Math.round(theme.nameSize)}pt`}>
              <Slider value={theme.nameSize} min={16} max={40} step={1} onValueChange={(value) => updateTheme({ nameSize: value })} label="Name size" />
            </Control>
            <Control label="Line height" value={theme.lineHeight.toFixed(2)}>
              <Slider value={theme.lineHeight} min={1.15} max={1.9} step={0.01} onValueChange={(value) => updateTheme({ lineHeight: Number(value.toFixed(2)) })} label="Line height" />
            </Control>
            <Control label="Section spacing" value={`${Math.round(theme.sectionSpacing)}pt`}>
              <Slider value={theme.sectionSpacing} min={6} max={26} step={1} onValueChange={(value) => updateTheme({ sectionSpacing: value })} label="Section spacing" />
            </Control>

            <Separator className="my-1" />

            <Control label="Heading style">
              <Select value={theme.headingStyle} onValueChange={(value) => updateTheme({ headingStyle: value as HeadingStyle })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plain">Plain</SelectItem>
                  <SelectItem value="rule">Ruled</SelectItem>
                  <SelectItem value="bar">Accent bar</SelectItem>
                  <SelectItem value="boxed">Boxed</SelectItem>
                  <SelectItem value="stacked">Underline accent</SelectItem>
                  <SelectItem value="sidebar">Sidebar</SelectItem>
                </SelectContent>
              </Select>
            </Control>
            <Control label="Heading case">
              <Select value={theme.headingCase} onValueChange={(value) => updateTheme({ headingCase: value as HeadingCase })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upper">UPPERCASE</SelectItem>
                  <SelectItem value="title">Title Case</SelectItem>
                  <SelectItem value="small-caps">small caps</SelectItem>
                  <SelectItem value="none">As written</SelectItem>
                </SelectContent>
              </Select>
            </Control>
            <Control label="Bullet marker">
              <Select value={theme.bulletStyle} onValueChange={(value) => updateTheme({ bulletStyle: value as ThemeConfig["bulletStyle"] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disc">• round</SelectItem>
                  <SelectItem value="dash">– dash</SelectItem>
                  <SelectItem value="square">▪ square</SelectItem>
                  <SelectItem value="none">no marker</SelectItem>
                </SelectContent>
              </Select>
            </Control>
            <Control label="Divider weight">
              <Select value={theme.divider} onValueChange={(value) => updateTheme({ divider: value as ThemeConfig["divider"] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="thin">Hairline</SelectItem>
                  <SelectItem value="double">Double</SelectItem>
                  <SelectItem value="dotted">Dotted</SelectItem>
                  <SelectItem value="accent">Accent</SelectItem>
                </SelectContent>
              </Select>
            </Control>

            <Separator className="my-1" />
            <ColorControl label="Accent" value={theme.accentColor} onChange={(value) => updateTheme({ accentColor: value })} />
            <ColorControl label="Body text" value={theme.textColor} onChange={(value) => updateTheme({ textColor: value })} />
            {archetype.bandHeader || archetype.tintSidebar ? (
              <ColorControl label={archetype.tintSidebar ? "Sidebar tone" : "Band colour"} value={theme.bandColor} onChange={(value) => updateTheme({ bandColor: value })} />
            ) : null}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11.5px] text-ink-2">Contact icons</span>
              <Switch checked={theme.showIcons} onCheckedChange={(value) => updateTheme({ showIcons: value })} label="Contact icons" />
            </div>
          </TabsContent>

          <TabsContent value="layout" className="mt-0 space-y-3.5">
            <Control label="Columns" value={`${doc.layout.columns}`}>
              <div className="grid grid-cols-3 gap-1">
                {[1, 2, 3].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => updateLayout({ columns: count as 1 | 2 | 3 })}
                    className={cn(
                      "flex h-12 flex-col items-center justify-center gap-1 rounded-[5px] border text-[11px] transition-colors",
                      doc.layout.columns === count ? "border-accent bg-accent-soft text-accent-ink" : "border-line text-subtle hover:border-line-strong",
                    )}
                  >
                    <span className="flex h-4 gap-[2px]">
                      <span className="w-1 rounded-[1px] bg-current opacity-70" style={{ width: count === 1 ? 16 : count === 2 ? 10 : 6 }} />
                      {count > 1 ? <span className="w-1 rounded-[1px] bg-current opacity-40" style={{ width: count === 2 ? 6 : 5 }} /> : null}
                      {count === 3 ? <span className="w-1 rounded-[1px] bg-current opacity-40" style={{ width: 5 }} /> : null}
                    </span>
                    {count}
                  </button>
                ))}
              </div>
            </Control>

            {doc.layout.columns > 1 ? (
              <>
                <Control label="Sidebar width" value={`${Math.round(doc.layout.sidebarWidth)}%`}>
                  <Slider value={doc.layout.sidebarWidth} min={22} max={46} step={1} onValueChange={(value) => updateLayout({ sidebarWidth: value })} label="Sidebar width" />
                </Control>
                <Control label="Sidebar side">
                  <div className="grid grid-cols-2 gap-1">
                    {(["left", "right"] as const).map((side) => (
                      <button
                        key={side}
                        type="button"
                        onClick={() => updateLayout({ sidebarPosition: side })}
                        className={cn(
                          "h-8 rounded-[5px] border text-[11.5px] capitalize transition-colors",
                          doc.layout.sidebarPosition === side ? "border-accent bg-accent-soft text-accent-ink" : "border-line text-subtle hover:border-line-strong",
                        )}
                      >
                        {side}
                      </button>
                    ))}
                  </div>
                </Control>
              </>
            ) : null}

            <Control label="Masthead">
              <Select value={doc.layout.headerLayout} onValueChange={(value) => updateLayout({ headerLayout: value as typeof doc.layout.headerLayout })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stacked">Stacked</SelectItem>
                  <SelectItem value="split">Name left, contact right</SelectItem>
                  <SelectItem value="band">Full-width band</SelectItem>
                  <SelectItem value="monogram">Monogram tile</SelectItem>
                  <SelectItem value="compact">Compact line</SelectItem>
                </SelectContent>
              </Select>
            </Control>
            <Control label="Masthead alignment">
              <div className="grid grid-cols-2 gap-1">
                {(["left", "center"] as const).map((align) => (
                  <button
                    key={align}
                    type="button"
                    onClick={() => updateTheme({ headerAlign: align })}
                    className={cn(
                      "h-8 rounded-[5px] border text-[11.5px] capitalize transition-colors",
                      theme.headerAlign === align ? "border-accent bg-accent-soft text-accent-ink" : "border-line text-subtle hover:border-line-strong",
                    )}
                  >
                    {align}
                  </button>
                ))}
              </div>
            </Control>

            <Separator className="my-1" />
            <Control label="Section visibility">
              <div className="space-y-1">
                {doc.sections.map((section) => (
                  <label key={section.id} className="flex cursor-pointer items-center justify-between gap-2 rounded-[4px] px-1 py-1 hover:bg-surface-2">
                    <span className="truncate text-[11.5px] text-ink-2">{section.title}</span>
                    <input
                      type="checkbox"
                      checked={section.visible}
                      onChange={() => toggleSection(section.id)}
                      className="size-3.5 rounded-[3px] accent-[var(--color-accent)]"
                    />
                  </label>
                ))}
              </div>
            </Control>
          </TabsContent>

          <TabsContent value="page" className="mt-0 space-y-3.5">
            <Control label="Page size" value={PAGE_SPECS[doc.page.size].detail}>
              <div className="grid grid-cols-2 gap-1">
                {(["a4", "letter"] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => updatePage({ size })}
                    className={cn(
                      "h-8 rounded-[5px] border text-[11.5px] transition-colors",
                      doc.page.size === size ? "border-accent bg-accent-soft text-accent-ink" : "border-line text-subtle hover:border-line-strong",
                    )}
                  >
                    {PAGE_SPECS[size].label}
                  </button>
                ))}
              </div>
            </Control>
            {(["marginTop", "marginRight", "marginBottom", "marginLeft"] as const).map((key) => (
              <Control key={key} label={key.replace("margin", "Margin ").replace("Top", "top").replace("Right", "right").replace("Bottom", "bottom").replace("Left", "left")} value={`${Math.round(doc.page[key])} mm`}>
                <Slider value={doc.page[key]} min={6} max={32} step={1} onValueChange={(value) => updatePage({ [key]: value } as never)} label={key} />
              </Control>
            ))}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11.5px] text-ink-2">Page numbers</span>
              <Switch checked={doc.page.showPageNumbers} onCheckedChange={(value) => updatePage({ showPageNumbers: value })} label="Page numbers" />
            </div>
            <div className="flex gap-1.5 pt-1">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => updatePage({ marginTop: 16, marginRight: 16, marginBottom: 16, marginLeft: 16 })}>
                <RotateCcw className="size-3" /> Reset margins
              </Button>
              <Button size="sm" variant="outline" className="flex-1" onClick={() => applyTemplate(doc.meta.templateId, { keepTheme: false })} title="Restore this template's original styling">
                Reset style
              </Button>
            </div>
            <p className="text-[10.5px] leading-relaxed text-subtle">
              A4 and US Letter are supported. Page numbers appear only on documents longer than one page.
            </p>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
