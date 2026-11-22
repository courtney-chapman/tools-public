# Government Shutdown Coordination Tracker

A browser-local coordination worksheet for a federal prime contractor's Contracts department. It keeps contract profiles reusable across shutdown events while preserving a separate assessment, Government direction history, impact summary, and action checklist for each event.

## Open it

Open `index.html` in a current desktop browser. The same folder can be hosted as a static GitHub Pages app; after the first network load, a service worker caches the app shell for offline use. The downloaded folder has no external runtime dependencies, but browser support for IndexedDB on `file://` pages varies; confirm that local saves work before entering important records. No account, backend, or paid API is required.

The app saves records and attachments automatically in IndexedDB in the current browser. It does not send contract data to the host or another service. The browser can still request the app's static files when hosted online. Clearing site data, changing browser profiles, or exceeding storage quotas can remove locally saved records. Export a full JSON backup regularly and keep it in an appropriate location. Large attachments increase the backup size. The app warns before files over 5 MB and reports storage failures; it does not impose a hard file-size cap.

Decide whether each contract record or attachment is appropriate for browser-local storage. This tool does not authorize classified information, CUI, or other regulated data.

## Main workflow

1. Choose or create a shutdown event. A new workspace starts with one editable event.
2. Add contracts with an optional program name, or import a contract CSV in **Reports & Data**. Existing contract profiles can be reused in later events.
3. On **Dashboard**, filter the contract matrix, inspect risk-level and overdue counts, and open a contract. Risk level is **None, Low, Medium, or High**; a new assessment remains **Not assessed** until someone selects a level.
4. In **Contracts**, use the sticky **Overview**, **Direction**, **Before**, **During**, and **Reopening** sections. Each phase shows only its actions; open an action row to change its status, edit details, or manage attachments. The **During** section also holds the expandable impact summary. Direction history is retained; explicitly mark an older entry current when appropriate.
5. In **Reports & Data**, print or save a portfolio or individual report as PDF, export Excel-compatible CSV, and download or restore a JSON backup.

CSV imports show validation results before applying changes. The contract template includes `ProgramName` and `RiskLevel` columns; older contract CSVs without `ProgramName` remain importable. `RiskLevel` accepts None, Low, Medium, or High. Existing contracts are skipped by default. The **Update** choice requires confirmation and updates profile fields and the selected event's risk level and performance status; it preserves notes, direction records, impacts, and actions. Action imports require the referenced contract to be included in the selected event. CSV templates are available in the app.

Attachments are local PDF, DOCX, XLSX, CSV, TXT, or image files. The app stores and returns them; it does not interpret their contents. A backup without attachments retains their metadata but cannot restore the file contents.

## Limits

This is a coordination record. User-entered Government communications are not verified contractual direction. Assess authority, funding, and performance obligations under the governing contract. The app makes no legal determination and does not communicate with the Government or departments. It does not replace HR, Finance, Program Management, Procurement, Subcontracts, or their source systems.

## Files

Keep `index.html`, `styles.css`, `tokens.css`, `core.js`, `app.js`, and `sw.js` together when using the offline folder. `sw.js` caches only the static app shell after a hosted first load. It never caches contract data.

Built by Courtney. Licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE).
