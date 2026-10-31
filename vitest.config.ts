import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  // @ts-expect-error — vite accepts the jsx override at runtime
  esbuild: { jsx: "automatic", jsxImportSource: "react" },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    environment: "node",
    globals: false,
  },
});
