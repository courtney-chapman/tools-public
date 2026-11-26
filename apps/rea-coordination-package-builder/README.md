# REA Coordination & Package Builder

An offline browser workspace for federal prime contractor Contracts personnel. It coordinates potential equitable adjustment events, factual basis and notices, departmental impacts, costs, schedules, supporting references, working packages, internal reviews, submissions, and resolutions. It does not determine entitlement or send communications.

## Open and use

Extract the ZIP and open `index.html`. Keep `index.html`, `tokens.css`, `styles.css`, `core.js`, and `app.js` together. Browser support for IndexedDB on local files varies; create a test record, reload, and confirm it persists before entering work. Use **Reports & data → Download full JSON backup** regularly. Browser storage is not encrypted or access controlled.

1. Use the text tabs across the top: **Portfolio**, four workflow phases, and **Reports**. Portfolio has separate subtabs for **Overview**, **Status mix**, **Work queue**, **Financials**, and **Event inventory**. Charts and amounts use current local records. Create an event in Overview or Event inventory. Several events can share a contract number.
2. Record the original and changed requirements, authority, clause version, chronology, and questions under **Establish the basis**.
3. Record each contractual notice separately in **Notices & timing**. Enter a clause, trigger and period, then confirm the date. Business day calculations omit weekends only; review holidays and contract terms manually.
4. Track departmental assessments, cost elements and rates, schedule impacts, and evidence IDs. Add department, event, or cost category options under **Reports → Settings & sources**. Editing an assessment preserves its prior version. The cost page shows the net proposal and a compact breakdown; expand the detail for incurred, estimated, and credit amounts. Baseline and revised cost rows are reference rows; incremental rows, credits, and avoided costs form the proposed adjustment. Use matching period labels for cost rows and indirect rates; unassigned periods are flagged. Overlapping rates and reconciliation differences are review indicators, not compliance findings.
5. Draft the executive summary and requested relief first. The factual-basis, change, and impact sections can draw from the source records; expand **Edit source-based sections** when you need to revise their wording. Choose which sections to include, record certification assessment and internal reviews, then record each actual submission revision. Each recorded submission preserves its metadata and a structured package snapshot. Record Government requests, positions, and settlement actions.
6. Preview a package, saved snapshot, or report, then use the browser Print command for PDF. Export CSV for tabular reports. JSON backup restores the full workspace.

**Load fictional sample** adds an intentionally labeled technical specification example. **Remove fictional sample records** deletes only its tracked event IDs.

Record editors show first-pass fields before a **More details** disclosure. The additional fields remain available for contract-specific needs and existing values are preserved. Use the event screen's **Archive** action rather than an intake checkbox.

## Limits and data handling

This local app has no account, server, cloud storage, external font, analytics, AI service, or data transmission. Regulatory links are optional and require a network only when opened. It stores document references, not uploaded documents. Do not enter classified information. Confirm organizational authorization before entering CUI, export-controlled, procurement-sensitive, proprietary financial, or technical information. A browser profile, site data cleanup, or storage failure can remove local records.

Use the incorporated clauses and versions to assess authority, notice, entitlement, certification, recoverable costs, submission, and release language. Involve Legal or other reviewers as needed under your process. An approval entered here is a coordination record, not an electronic signature. An REA is not automatically a Contract Disputes Act claim. The app does not monitor deadlines while closed.

## Files

- `index.html`, `tokens.css`, `styles.css`, `core.js`, `app.js`: offline application.
- `REGULATORY_REFERENCES.md`: public sources and applicability limits.
- `LICENSE`: PolyForm Noncommercial License 1.0.0.

Built by Courtney. Licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE). [More tools on GitHub](https://courtney-chapman.github.io/tools-public/).
