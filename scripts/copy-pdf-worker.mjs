/**
 * Copies the pdf.js worker into /public so the importer can run PDF text
 * extraction entirely in the browser (no document ever leaves the device).
 */
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const candidates = [
  "node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
  "node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs",
];

const target = resolve("public/pdf.worker.min.mjs");
mkdirSync(dirname(target), { recursive: true });

const source = candidates.map((p) => resolve(p)).find((p) => existsSync(p));
if (!source) {
  console.warn("[pdf-worker] pdfjs-dist worker not found — PDF import will fall back to paste-as-text.");
  process.exit(0);
}
copyFileSync(source, target);
console.log(`[pdf-worker] copied -> public/pdf.worker.min.mjs`);
