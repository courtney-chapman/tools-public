# CDRLs and Contracts Deliverables

Built by Courtney. This offline browser app tracks contract deadlines, CDRLs, subcontractor inputs, regulatory review prompts, and submission evidence. It organizes records for a contracts professional; it does not decide whether a clause applies, establish contract-specific due dates, submit to a Government system, or approve a deliverable.

## Open and use

Extract the ZIP and open `index.html` in a current desktop browser. Keep `app.js`, `styles.css`, `tokens.css`, `sw.js`, and `manifest.webmanifest` beside it. The app needs no account, server, external font, analytics, or network connection for its core workflow. Optional source links need a connection. The online preview uses the same static files.

1. Add one primary contract. Add linked levels only when needed, such as a schedule agreement, vehicle, or task order. A parent contract filter includes its linked levels.
2. Add a deadline or CDRL, or import a mapped CSV. Monthly schedules create separate dated occurrences, each with its own status and submission history.
3. Review a requirements-library prompt against the incorporated contract terms and current instructions. Confirm applicability and the first due date before generating dates. Marking a prompt Not Applicable hides its linked schedule from active views while retaining history.
4. Add subcontractors and their input deliverables. Link an input to a prime deliverable when there is a dependency.
5. Update an occurrence's due date and internal milestones. Record submission confirmation and evidence references in Submissions, then record the response there. A revision request returns that occurrence to open work.
6. Use the dashboard, register, calendar, and reports to review open and past-due work. Export CSV or print a report. Export a JSON backup regularly.

Records stay in this browser's IndexedDB. Storage availability for local `file:` URLs varies by browser; use the online preview or a local static server if your browser blocks local-file storage. The HTTPS online preview caches its app shell after the first load. A cache is not a backup. **Import / Export → Export JSON backup** saves a copy; restore replaces the current browser workspace after confirmation. CSV and JSON imports are read locally, and exported files remain wherever your browser saves them. The app does not upload contract data or supporting documents.

The included [deadline CSV example](examples/deadlines.csv) is fictional. Contract CSV imports accept one primary contract and linked records of any depth. Put a parent row before its child when importing both in one file. CSV export prefixes cells that resemble spreadsheet formulas.

## Use limits and sources

The [Acquisition.gov Smart Matrix](https://www.acquisition.gov/smart-matrix) is a clause-discovery aid, not proof that a clause is incorporated into a particular contract. Confirm the actual contract, clauses, deviations, plans, reporting instructions, and due dates before using a library prompt. The built-in regulatory entries are examples for review, not a complete or continuously updated compliance library.

The app does not support DD Form 1423 import, PDF-assisted extraction, Excel import/export, saved CSV mappings, bulk editing, custom recurrence intervals and exceptions, or regulatory library update review. Without an end date, the generated schedule covers two years from the first due date; an explicit end date can extend it, with a maximum of 1,000 occurrences per generation. Monthly dates keep their original day anchor and use the last day in shorter months. Business-day rules apply to internal lead-time milestones only when selected. Review every generated date against the governing contract direction.

Check whether information is appropriate for browser storage. This app is **not authorized for classified information or CUI**. Exported JSON, CSV, and PDFs should be protected according to your organization's requirements. When printing to PDF, turn off browser headers and footers if a local file path should not appear.

The download contains this guide, fictional CSV data, the browser app, and a PolyForm Noncommercial license.
