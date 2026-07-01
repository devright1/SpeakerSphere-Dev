---
name: PDF.js worker file must exist at the exact versioned path referenced in code
description: Document previews use pdfjs-dist client-side; if the workerSrc path doesn't exist under client/public, Vite serves the SPA fallback HTML instead, silently breaking every PDF thumbnail.
---

`ContentPreview` (speaker-profile.tsx) renders PDF thumbnails client-side with `pdfjs-dist`,
setting `pdfjsLib.GlobalWorkerOptions.workerSrc` to a version-pinned filename like
`/pdf.worker.v4.10.38.min.mjs`, expected to live in `client/public/` (Vite's `root` is
`client/`, so only `client/public/` is served as static root — a top-level `/public/` dir
outside `client/` is NOT served by the dev server).

If that exact file is missing from `client/public/`, the request 200s with Vite's SPA
fallback `index.html` (`text/html`), and the browser throws "Failed to load module script:
Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of
'text/html'" — every PDF preview silently falls back to a plain file icon with no visible
error in the UI.

**Why:** a versioned worker filename was introduced (matching the installed `pdfjs-dist`
version) but the actual file was only ever placed in a top-level `/public/` (not served)
and `client/public/` still had an older/mismatched `pdf.worker.min.mjs`.

**How to apply:** whenever `pdfjs-dist` is upgraded or a worker path is referenced, verify
the file exists at that exact path under `client/public/` and that its md5 matches
`node_modules/pdfjs-dist/build/pdf.worker.min.mjs` (non-legacy build, since the code does
`await import('pdfjs-dist')`, not `pdfjs-dist/legacy`).
