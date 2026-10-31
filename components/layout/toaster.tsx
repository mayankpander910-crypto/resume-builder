"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: "#fff",
          border: "1px solid #e4e1d9",
          borderRadius: "8px",
          color: "#15171b",
          fontSize: "13px",
          boxShadow: "0 12px 32px -12px rgba(21,23,27,0.22)",
        },
      }}
    />
  );
}
