import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/layout/toaster";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Resume Forge — Free AI resume builder",
    template: "%s · Resume Forge",
  },
  description:
    "Build a professional resume in minutes. 64 distinct templates, a real drag-and-drop editor, AI writing help and clean PDF export. No account required.",
  openGraph: {
    title: "Resume Forge — Free AI resume builder",
    description:
      "64 professionally designed templates, a drag-and-drop editor, AI writing assistance and ATS checks. Free, no signup.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#fbfaf7",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
