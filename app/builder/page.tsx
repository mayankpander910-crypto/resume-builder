import type { Metadata } from "next";
import { EditorShell } from "@/components/editor/EditorShell";

export const metadata: Metadata = {
  title: "Resume editor",
  description: "Edit your resume live: drag sections, switch templates, tune typography and export a clean PDF.",
};

export default function BuilderPage() {
  return <EditorShell />;
}
