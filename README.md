# Gemproject ERP (Static Web App)

A static, GitHub Pages-ready ERP interface that mirrors the Excel workflows for inventory, invoicing, memos, production tracking, cashbook, and reporting. Data is stored locally in the browser with IndexedDB, and Excel import/export is supported.

## Features
- Inventory / Sell Records table with filters, selection, and summary totals.
- Invoice form with auto totals, printable view, and PDF export.
- Memo In/Out tracking with stage transitions and lock state on closed memos.
- Production tracking with stage yield, reject, and wastage totals.
- Cashbook / ledger with running balance and posting lock.
- Reporting dashboard and workbook export.
- IndexedDB persistence via Dexie with audit log.

## Tech Stack
- Vite + React + TypeScript
- Tailwind CSS
- Dexie (IndexedDB)
- SheetJS (XLSX)
- jsPDF

## Getting Started
```bash
npm install
npm run dev
```

Open http://localhost:5173 to view the app.

## Build
```bash
npm run build
```

## Import Workbook
1. Click **Import Workbook** on the Inventory or Settings page.
2. Select the provided `Copy of Working Copy.xlsx` file.
3. Review the import summary and verify totals match the Excel workbook.

## Export Workbook
Use **Export Workbook (XLSX)** from the Reporting or Settings page to download a multi-sheet export.

## GitHub Pages Deployment
This project is configured for GitHub Pages using GitHub Actions.

1. Push the repo to GitHub.
2. Update the repository settings to enable GitHub Pages for the `gh-pages` branch.
3. The workflow in `.github/workflows/deploy.yml` will build and deploy automatically on `main`.

## Notes
- The app is fully static and runs entirely in the browser.
- Routing uses relative base paths so it works on `https://username.github.io/<repo>`.
