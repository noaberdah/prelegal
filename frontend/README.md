# Prelegal frontend — Mutual NDA Creator

Next.js 16 (App Router) + TypeScript + Tailwind v4 prototype for [PL-3](https://noaberdah.atlassian.net/browse/PL-3).

A user fills out the cover-page fields of a Common Paper Mutual NDA on the left, watches the populated agreement render on the right, and downloads a PDF locally.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How it works

- `src/lib/nda.ts` — typed form data, defaults, and the Standard Terms content as structured segments (so HTML preview and PDF stay in sync).
- `src/components/NDAForm.tsx` — the form (purpose, dates, terms, jurisdiction, party details).
- `src/components/NDAPreview.tsx` — live HTML preview.
- `src/components/NDAPdfDocument.tsx` — `@react-pdf/renderer` document for the PDF download.
- `src/components/DownloadButton.tsx` — generates a PDF blob client-side and triggers download.
- `src/app/page.tsx` — top-level page that owns form state and lays out form + preview.

The PDF library is loaded via dynamic import only when the user clicks **Download PDF**, so it does not block the initial page load.

## Source content

The Mutual NDA text is derived from the Common Paper Mutual NDA v1.0 templates in `../templates/`, used under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
