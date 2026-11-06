"use client";

import {
  createContext,
  createElement,
  useContext,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import type { Basics, ResumeSection } from "@/types/resume";

export interface InlineEditorContextValue {
  selectedSectionId: string | null;
  selectSection: (sectionId: string) => void;
  updateBasics: <K extends keyof Basics>(patch: Pick<Basics, K>) => void;
  updateSection: (
    sectionId: string,
    updater: (section: ResumeSection) => void,
  ) => void;
}

const InlineEditorContext =
  createContext<InlineEditorContextValue | null>(null);

export const InlineEditorProvider = ({
  value,
  children,
}: {
  value: InlineEditorContextValue;
  children: ReactNode;
}) => (
  <InlineEditorContext.Provider value={value}>
    {children}
  </InlineEditorContext.Provider>
);

export const useInlineEditor = () => useContext(InlineEditorContext);

interface InlineEditableProps {
  value: string;
  onChange: (value: string) => void;
  sectionId?: string;
  placeholder?: string;
  multiline?: boolean;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
  as?: "span" | "div";
}

export function InlineEditable({
  value,
  onChange,
  sectionId,
  placeholder = "Double-click to edit",
  multiline = false,
  disabled = false,
  className = "",
  style,
  ariaLabel = "Editable resume text",
  as = "span",
}: InlineEditableProps) {
  const editor = useInlineEditor();
  const initialValueRef = useRef(value);
  const [editing, setEditing] = useState(false);

  const startEditing = () => {
    if (disabled || !editor) return;
    initialValueRef.current = value;
    setEditing(true);
  };

  const cancel = () => {
    onChange(initialValueRef.current);
    setEditing(false);
  };

  const finish = () => setEditing(false);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      cancel();
    } else if (
      event.key === "Enter" &&
      ((!multiline && !event.shiftKey) ||
        (multiline && (event.ctrlKey || event.metaKey)))
    ) {
      event.preventDefault();
      finish();
      event.currentTarget.blur();
    }
  };

  if (!editor || disabled) {
    return createElement(as, { className, style }, value);
  }

  if (editing) {
    const shared = {
      "aria-label": ariaLabel,
      "data-inline-editable": "true",
      autoFocus: true,
      className: `rf-inline-input ${className}`,
      onBlur: finish,
      onChange: (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      ) => onChange(event.currentTarget.value),
      onKeyDown: handleKeyDown,
      placeholder,
      value,
      style: {
        ...style,
        width: multiline ? "100%" : "max-content",
        minWidth: multiline ? "100%" : "3ch",
        maxWidth: "100%",
        whiteSpace: multiline ? "pre-wrap" : "nowrap",
      } satisfies CSSProperties,
    };

    return (
      <>
        {multiline
          ? createElement("textarea", {
              ...shared,
              rows: Math.max(2, value.split("\n").length),
            })
          : createElement("input", { ...shared, type: "text" })}
        <span className="rf-inline-print">{value}</span>
      </>
    );
  }

  return createElement(
    as,
    {
      className: `rf-inline-display ${className}`,
      style,
      "data-inline-editable": "true",
      role: "textbox",
      "aria-label": ariaLabel,
      "aria-multiline": multiline,
      tabIndex: 0,
      onClick: () => {
        if (sectionId) editor.selectSection(sectionId);
      },
      onDoubleClick: startEditing,
      onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
        if (event.key === "Enter" || event.key === "F2") {
          event.preventDefault();
          startEditing();
        }
      },
      title: placeholder,
    },
    value || placeholder,
  );
}
