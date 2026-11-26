# CPARS Coordination Tracker

An offline browser workspace for Contracts personnel to inventory contracts and orders, confirm evaluation periods, record Government outreach, coordinate department inputs, prepare contractor comments, track finalization, and export working reports. The app does not connect to CPARS or decide regulatory applicability.

## Open and use

For a single file, download `cpars-coordination-tracker.html` from the release and open it in a desktop browser. For the ZIP, extract it and open `index.html`; keep the five application files together. Browser support for IndexedDB on local files varies. Create a test record, reload, and confirm it persists before entering work. Download JSON backups regularly.

1. Add a contract or order. Confirm applicability and choose contract or order reporting level. Then review the suggested annual and final evaluation periods. You can add an interim evaluation manually.
2. Record Government outreach, follow-up dates, department assignments, subfactors, and internal reviews. Enter actual CPARS notification and verify its comment deadline in the official system.
3. Review factor narratives and ratings, prepare comments, and submit only through official CPARS. Record submission, finalization, and improvement actions.
4. Use Reports & data to print or save one of ten reports, export filtered CSV, download a full JSON backup, or restore a backup after confirmation.

All records remain in browser-local storage. The app has no account, server, analytics, external font, or data upload. External links open only when clicked. Local storage is not encrypted or access controlled by the app. Follow organizational handling rules for Source Selection Information and other protected information; do not enter classified content.

The app uses FAR 42.1502(a) and 42.1503(d), (f), and CPARS Guidance §4.8 to label suggested dates. Expected availability and internal response targets are planning assumptions. Verify agency requirements, actual notifications, and the official CPARS display. See [regulatory references](REGULATORY_REFERENCES.md).

## Files

- `index.html`, `tokens.css`, `styles.css`, `core.js`, `app.js`: offline application.
- `REGULATORY_REFERENCES.md`: official sources and limits.
- `LICENSE`: PolyForm Noncommercial License 1.0.0.

Built by Courtney. Licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE). [More tools on GitHub](https://courtney-chapman.github.io/tools-public/).
