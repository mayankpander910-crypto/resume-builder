
"use client";

import { create } from "zustand";
import type {
  Basics,
  CanvasPosition,
  LayoutConfig,
  PageSettings,
  PositioningMode,
  ResumeDocument,
  ResumeSection,
  SectionKind,
  ThemeConfig,
} from "@/types/resume";
import {
  createEmptyResume,
  createId,
  createSection,
  defaultLayout,
  defaultPage,
  defaultTheme,
} from "@/lib/resume/schema/factory";
import {
  applyTemplateToSections,
  getTemplate,
  templatePageSettings,
} from "@/lib/templates/registry";
import {
  sampleBasics,
  sampleSections,
} from "@/lib/content/sample-resume";

const STORAGE_KEY = "resumeforge.document.v1";
const HISTORY_LIMIT = 60;
const COALESCE_MS = 900;

export type SaveStatus =
  | "idle"
  | "dirty"
  | "saving"
  | "saved"
  | "error"
  | "local-only";

interface StoreState {
  doc: ResumeDocument;
  past: ResumeDocument[];
  future: ResumeDocument[];
  status: SaveStatus;
  savedAt: string | null;
  hydrated: boolean;
  lastHistoryKey: string | null;
  lastHistoryAt: number;
}

interface StoreActions {
  /** Replace the whole document. */
  setDoc: (
    doc: ResumeDocument,
    options?: { history?: boolean; status?: SaveStatus }
  ) => void;

  update: (
    recipe: (draft: ResumeDocument) => void,
    options?: { historyKey?: string; history?: boolean }
  ) => void;

  updateBasics: (patch: Partial<Basics>) => void;

  updateSection: <T extends ResumeSection>(
    id: string,
    updater: (section: T) => void,
    options?: { historyKey?: string }
  ) => void;

  updateTheme: (patch: Partial<ThemeConfig>) => void;
  updatePage: (patch: Partial<PageSettings>) => void;
  updateLayout: (patch: Partial<LayoutConfig>) => void;

  addSection: (
    kind: SectionKind,
    column?: 0 | 1 | 2,
    title?: string
  ) => string;

  removeSection: (id: string) => void;
  duplicateSection: (id: string) => void;
  toggleSection: (id: string) => void;

  moveSection: (
    activeId: string,
    overId: string | null,
    targetColumn?: 0 | 1 | 2
  ) => void;

  setSectionColumn: (id: string, column: 0 | 1 | 2) => void;
  renameSection: (id: string, title: string) => void;

  /** Set or clear a section's explicit canvas position. */
  setSectionPosition: (
    id: string,
    position: CanvasPosition | undefined
  ) => void;

  /** Move a section using millimetre coordinates. */
  moveCanvasSection: (
    id: string,
    x: number,
    y: number,
    page?: number
  ) => void;

  initializeCanvasPositions: (
    positions: { id: string; position: CanvasPosition }[]
  ) => void;

  /** Resize a positioned section using millimetre dimensions. */
  resizeCanvasSection: (
    id: string,
    width: number,
    height?: number
  ) => void;

  /** Change the stacking order of a positioned section. */
  setSectionZIndex: (id: string, zIndex: number) => void;

  /** Lock or unlock a section on the canvas. */
  setSectionLocked: (id: string, locked: boolean) => void;

  /** Switch between the existing flow layout and free positioning. */
  setPositioningMode: (mode: PositioningMode) => void;

  applyTemplate: (
    templateId: string,
    options?: { keepTheme?: boolean }
  ) => void;

  setPageSize: (size: PageSettings["size"]) => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  hydrate: () => void;
  persist: () => void;
  clearStored: () => void;

  loadSample: () => void;
  resetToBlank: () => void;
  setDocumentName: (name: string) => void;
}

export type ResumeStore = StoreState & StoreActions;

const nowIso = () => new Date().toISOString();

const clone = <T,>(value: T): T => {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
};

const touch = (doc: ResumeDocument): ResumeDocument => ({
  ...doc,
  meta: {
    ...doc.meta,
    updatedAt: nowIso(),
  },
});

const documentWithTemplate = (
  doc: ResumeDocument,
  templateId: string,
  keepTheme = false
): ResumeDocument => {
  const template = getTemplate(templateId);
  const page = templatePageSettings(template);

  return {
    ...doc,
    meta: {
      ...doc.meta,
      templateId: template.id,
      updatedAt: nowIso(),
    },
    sections: applyTemplateToSections(doc, template),
    theme: keepTheme ? doc.theme : { ...template.theme },
    page: {
      ...page,
      showPageNumbers: doc.page.showPageNumbers,
    },
    layout: {
      ...template.layout,
      positioningMode: "flow",
    },
  };
};

const initialDoc = (): ResumeDocument => {
  const blank = createEmptyResume("My resume");
  return documentWithTemplate(blank, "meridian");
};

/** Validate coordinates before storing them. */
const sanitizePosition = (
  position: CanvasPosition
): CanvasPosition => ({
  page: Math.max(0, Math.min(99, Math.floor(position.page))),
  x: Math.max(-500, Math.min(1000, position.x)),
  y: Math.max(-500, Math.min(2000, position.y)),
  ...(position.width !== undefined
    ? {
        width: Math.max(1, Math.min(1000, position.width)),
      }
    : {}),
  ...(position.height !== undefined
    ? {
        height: Math.max(1, Math.min(2000, position.height)),
      }
    : {}),
  ...(position.zIndex !== undefined
    ? {
        zIndex: Math.max(-1000, Math.min(1000, Math.floor(position.zIndex))),
      }
    : {}),
  ...(position.locked !== undefined
    ? { locked: position.locked }
    : {}),
});

export const useResumeStore = create<ResumeStore>((set, get) => ({
  doc: initialDoc(),
  past: [],
  future: [],
  status: "idle",
  savedAt: null,
  hydrated: false,
  lastHistoryKey: null,
  lastHistoryAt: 0,

  /* ------------------------------------------------------------- document */

  setDoc: (doc, options) => {
    const state = get();
    const history = options?.history ?? true;

    set({
      doc,
      past: history
        ? [...state.past, state.doc].slice(-HISTORY_LIMIT)
        : state.past,
      future: history ? [] : state.future,
      status: options?.status ?? "dirty",
      lastHistoryKey: null,
    });
  },

  update: (recipe, options) => {
    const state = get();
    const draft = clone(state.doc);

    recipe(draft);

    const nextDoc = touch(draft);
    const historyKey = options?.historyKey;

    const coalesce =
      historyKey != null &&
      state.lastHistoryKey === historyKey &&
      Date.now() - state.lastHistoryAt < COALESCE_MS;

    const pushHistory = options?.history !== false && !coalesce;

    set({
      doc: nextDoc,
      past: pushHistory
        ? [...state.past, state.doc].slice(-HISTORY_LIMIT)
        : state.past,
      future: pushHistory ? [] : state.future,
      status: "dirty",
      lastHistoryKey: historyKey ?? null,
      lastHistoryAt: Date.now(),
    });
  },

  /* --------------------------------------------------------------- basics */

  updateBasics: (patch) => {
    get().update(
      (draft) => {
        Object.assign(draft.basics, patch);
      },
      {
        historyKey: `basics:${Object.keys(patch).join(",")}`,
      }
    );
  },

  /* -------------------------------------------------------------- sections */

  updateSection: (id, updater, options) => {
    get().update(
      (draft) => {
        const section = draft.sections.find((s) => s.id === id);

        if (section) {
          updater(section as never);
        }
      },
      {
        historyKey: options?.historyKey ?? `section:${id}`,
      }
    );
  },

  addSection: (kind, column = 0, title) => {
    const section = createSection(kind, column, title);

    get().update((draft) => {
      draft.sections.push(section);
    });

    return section.id;
  },

  removeSection: (id) => {
    get().update((draft) => {
      draft.sections = draft.sections.filter(
        (section) => section.id !== id
      );
    });
  },

  duplicateSection: (id) => {
    get().update((draft) => {
      const index = draft.sections.findIndex(
        (section) => section.id === id
      );

      if (index < 0) return;

      const original = draft.sections[index];
      const copy = clone(original) as ResumeSection;

      copy.id = createId(original.kind);
      copy.title = `${original.title} (copy)`;

      // Give positioned duplicates a small offset so they do not
      // completely overlap the original section.
      if (copy.position) {
        copy.position = {
          ...copy.position,
          x: copy.position.x + 5,
          y: copy.position.y + 5,
          zIndex: (copy.position.zIndex ?? 0) + 1,
          locked: false,
        };
      }

      if ("items" in copy.data && Array.isArray(copy.data.items)) {
        const items = copy.data.items as unknown as {
          id?: string;
        }[];

        copy.data.items = items.map((item) =>
          typeof item === "object" && item !== null
            ? { ...item, id: createId("item") }
            : item
        ) as never;
      }

      if ("groups" in copy.data && Array.isArray(copy.data.groups)) {
        copy.data.groups = copy.data.groups.map((group) => ({
          ...group,
          id: createId("grp"),
        }));
      }

      draft.sections.splice(index + 1, 0, copy);
    });
  },

  toggleSection: (id) => {
    get().update((draft) => {
      const section = draft.sections.find((s) => s.id === id);

      if (section) {
        section.visible = !section.visible;
      }
    });
  },

  moveSection: (activeId, overId, targetColumn) => {
    get().update((draft) => {
      const from = draft.sections.findIndex(
        (section) => section.id === activeId
      );

      if (from < 0) return;

      const [moved] = draft.sections.splice(from, 1);

      if (targetColumn !== undefined) {
        moved.column = targetColumn;
      }

      if (overId) {
        const to = draft.sections.findIndex(
          (section) => section.id === overId
        );

        if (to >= 0) {
          draft.sections.splice(to, 0, moved);
          return;
        }
      }

      // No over target: append to the end of the destination column.
      const column = moved.column;
      let insertAt = draft.sections.length;

      for (let i = draft.sections.length - 1; i >= 0; i -= 1) {
        if (draft.sections[i].column === column) {
          insertAt = i + 1;
          break;
        }
      }

      draft.sections.splice(insertAt, 0, moved);
    });
  },

  setSectionColumn: (id, column) => {
    get().update((draft) => {
      const section = draft.sections.find((s) => s.id === id);

      if (section) {
        section.column = column;
      }
    });
  },

  renameSection: (id, title) => {
    get().updateSection(
      id,
      (section) => {
        (section as ResumeSection).title = title;
      },
      {
        historyKey: `rename:${id}`,
      }
    );
  },

  /* ---------------------------------------------------------- canvas actions */

  setSectionPosition: (id, position) => {
    get().update(
      (draft) => {
        const section = draft.sections.find((s) => s.id === id);

        if (!section) return;

        if (position === undefined) {
          delete section.position;
          return;
        }

        section.position = sanitizePosition(position);
      },
      {
        historyKey: `position:${id}`,
      }
    );
  },

  moveCanvasSection: (id, x, y, page) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;

    get().update(
      (draft) => {
        const section = draft.sections.find((s) => s.id === id);

        if (!section || section.position?.locked) return;

        const currentPosition = section.position ?? {
          page: 0,
          x: 0,
          y: 0,
        };

        section.position = sanitizePosition({
          ...currentPosition,
          x,
          y,
          page: page ?? currentPosition.page,
        });
      },
      {
        historyKey: `canvas-move:${id}`,
      }
    );
  },

  initializeCanvasPositions: (positions) => {
    if (positions.length === 0) return;

    get().update(
      (draft) => {
        for (const { id, position } of positions) {
          const section = draft.sections.find((item) => item.id === id);

          if (section && section.position === undefined) {
            section.position = sanitizePosition(position);
          }
        }
      },
      { history: false }
    );
  },

  resizeCanvasSection: (id, width, height) => {
    if (!Number.isFinite(width)) return;
    if (height !== undefined && !Number.isFinite(height)) return;

    get().update(
      (draft) => {
        const section = draft.sections.find((s) => s.id === id);

        if (!section || section.position?.locked) return;

        const currentPosition = section.position ?? {
          page: 0,
          x: 0,
          y: 0,
        };

        section.position = sanitizePosition({
          ...currentPosition,
          width,
          ...(height !== undefined ? { height } : {}),
        });
      },
      {
        historyKey: `canvas-resize:${id}`,
      }
    );
  },

  setSectionZIndex: (id, zIndex) => {
    if (!Number.isFinite(zIndex)) return;

    get().update((draft) => {
      const section = draft.sections.find((s) => s.id === id);

      if (!section) return;

      const currentPosition = section.position ?? {
        page: 0,
        x: 0,
        y: 0,
      };

      section.position = sanitizePosition({
        ...currentPosition,
        zIndex,
      });
    });
  },

  setSectionLocked: (id, locked) => {
    get().update((draft) => {
      const section = draft.sections.find((s) => s.id === id);

      if (!section) return;

      const currentPosition = section.position ?? {
        page: 0,
        x: 0,
        y: 0,
      };

      section.position = sanitizePosition({
        ...currentPosition,
        locked,
      });
    });
  },

  setPositioningMode: (mode) => {
    get().update(
      (draft) => {
        draft.layout.positioningMode = mode;
      },
      {
        historyKey: "positioning-mode",
      }
    );
  },

  /* ------------------------------------------------------------- appearance */

  updateTheme: (patch) => {
    get().update(
      (draft) => {
        Object.assign(draft.theme, patch);
      },
      {
        historyKey: `theme:${Object.keys(patch).join(",")}`,
      }
    );
  },

  updatePage: (patch) => {
    get().update((draft) => {
      Object.assign(draft.page, patch);
    });
  },

  updateLayout: (patch) => {
    get().update((draft) => {
      Object.assign(draft.layout, patch);
    });
  },

  applyTemplate: (templateId, options) => {
    const keepTheme = options?.keepTheme ?? false;

    get().update((draft) => {
      const next = documentWithTemplate(
        draft,
        templateId,
        keepTheme
      );

      draft.meta = next.meta;
      draft.sections = next.sections;
      draft.theme = next.theme;
      draft.page = next.page;
      draft.layout = next.layout;
    });
  },

  setPageSize: (size) => {
    get().update((draft) => {
      draft.page.size = size;
    });
  },

  /* ---------------------------------------------------------- undo and redo */

  undo: () => {
    const { past, doc, future } = get();

    if (past.length === 0) return;

    const previous = past[past.length - 1];

    set({
      doc: previous,
      past: past.slice(0, -1),
      future: [doc, ...future].slice(0, HISTORY_LIMIT),
      status: "dirty",
      lastHistoryKey: null,
      lastHistoryAt: 0,
    });
  },

  redo: () => {
    const { past, doc, future } = get();

    if (future.length === 0) return;

    const [next, ...rest] = future;

    set({
      doc: next,
      past: [...past, doc].slice(-HISTORY_LIMIT),
      future: rest,
      status: "dirty",
      lastHistoryKey: null,
      lastHistoryAt: 0,
    });
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  /* -------------------------------------------------------------- persistence */

  hydrate: () => {
    if (get().hydrated) return;
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);

      if (raw) {
        const parsed = JSON.parse(raw) as {
          doc?: ResumeDocument;
          savedAt?: string;
        };

        if (parsed?.doc?.meta?.id) {
          const storedDoc = parsed.doc;

          // Older documents may not contain the positioning settings.
          // Keep their existing flow-based behaviour.
          storedDoc.layout = {
            ...storedDoc.layout,
            positioningMode:
              storedDoc.layout.positioningMode ?? "flow",
          };

          set({
            doc: storedDoc,
            savedAt: parsed.savedAt ?? null,
            status: "saved",
            hydrated: true,
            past: [],
            future: [],
            lastHistoryKey: null,
            lastHistoryAt: 0,
          });

          return;
        }
      }
    } catch {
      // Broken cache: fall back to a fresh document.
    }

    set({
      hydrated: true,
    });
  },

  persist: () => {
    if (typeof window === "undefined") return;

    const { doc } = get();

    try {
      set({
        status: "saving",
      });

      const savedAt = nowIso();

      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          doc,
          savedAt,
        })
      );

      set({
        status: "saved",
        savedAt,
      });
    } catch {
      set({
        status: "error",
      });
    }
  },

  clearStored: () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }

    set({
      savedAt: null,
      status: "idle",
    });
  },

  /* --------------------------------------------------------------- sample data */

  loadSample: () => {
    const templateId = get().doc.meta.templateId;

    const sample: ResumeDocument = {
      meta: {
        ...get().doc.meta,
        id: createId("resume"),
        name: "Sample resume",
        updatedAt: nowIso(),
      },

      basics: {
        ...sampleBasics,
        links: [...sampleBasics.links],
      },

      sections: sampleSections("medium"),
      theme: get().doc.theme,
      page: get().doc.page,
      layout: {
        ...get().doc.layout,
        positioningMode: "flow",
      },
    };

    get().setDoc(
      documentWithTemplate(sample, templateId)
    );
  },

  resetToBlank: () => {
    const blank = createEmptyResume("My resume");
    const theme = defaultTheme();
    const page = defaultPage();
    const layout = defaultLayout();

    get().setDoc(
      {
        ...blank,
        theme,
        page,
        layout: {
          ...layout,
          positioningMode: "flow",
        },
      },
      {
        history: false,
      }
    );
  },

  setDocumentName: (name) => {
    get().update(
      (draft) => {
        draft.meta.name = name;
      },
      {
        historyKey: "doc-name",
      }
    );
  },
}));

/* ------------------------------------------------------------- selectors */

export const selectDoc = (state: ResumeStore) => state.doc;

export const selectSections = (state: ResumeStore) =>
  state.doc.sections;

export const selectTemplate = (state: ResumeStore) =>
  getTemplate(state.doc.meta.templateId);

export const sectionsInColumn = (
  doc: ResumeDocument,
  column: 0 | 1 | 2
): ResumeSection[] =>
  doc.sections.filter((section) => section.column === column);

export const selectPositioningMode = (
  state: ResumeStore
): PositioningMode =>
  state.doc.layout.positioningMode ?? "flow";

export const sectionsWithCanvasPosition = (
  doc: ResumeDocument
): ResumeSection[] =>
  doc.sections.filter((section) => section.position !== undefined);
