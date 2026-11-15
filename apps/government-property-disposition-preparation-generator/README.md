# Government Property Disposition Preparation Checklist Generator

A standalone, offline browser demonstration for organizing property information before the applicable Government Property disposition process. It creates a working property listing CSV, printable preparation checklist, and printable summary. It is not a plant clearance system or disposition decision engine.

## Use

Extract the ZIP and open `index.html` in a current browser. Four bookmark buttons show one step at a time. Direct links such as `index.html#step-3` open the chosen step. Entries stay in memory while you move between steps and disappear on reload or close.

1. **Preparation:** Enter a working reference, general reason property is being considered, and any known contract or coordination information. Leave a field blank or choose Unknown when the answer has not been established.
2. **Property:** Add and edit items manually, or choose a CSV, map its columns, review valid and skipped rows, and confirm import. Download a blank import template or fictional example if helpful. Sort and group the working list by contract or location.
3. **Checklist:** Identify supporting documentation, write unresolved questions, and mark each preparation item Complete, Incomplete, Not Applicable, or Requires Review. Items start unmarked. Optional public assessment prompts are hidden until selected.
4. **Review & export:** Review preparation exceptions and questions. Download a property listing CSV, preview the checklist or summary, and use **Print or save as PDF** for the selected preview.

The import limit is 2 MB and 10,000 data rows. Description, Quantity, and Unit of Measure columns must be mapped. Rows missing those values, having an invalid quantity, duplicate populated Record ID, or a mismatched column count are shown as skipped. Confirming import adds valid rows to the current working list; it does not modify the source file. Manual entries may remain incomplete so blanks can be reviewed as preparation exceptions. Possible duplicate Asset Identifiers are warnings. The listing CSV identifies blank fields and protects spreadsheet software from formula-like cells.

**Load fictional sample** fills the workspace with invented data. **Clear all** asks before discarding entries. No account, server, storage, analytics, or network connection is used by the application. The only external link is the optional GitHub credit; the app does not open it automatically. Files you download or print are outside the app.

The app shows **Revision 1**. [Public sources and versions](docs/sources.md) were checked on 2026-11-15 and do not update automatically. [Limitations](docs/limitations.md) explains the authority and data boundaries.

This standalone demonstration helps organize information and supporting documentation for Government Property disposition preparation. It does not determine disposition authority, provide Government disposition instructions, authorize disposal, or establish regulatory compliance. Users must follow applicable contracts, regulations, procedures, and Government direction. The application is provided as-is without guaranteed updates or ongoing support.

Built by Courtney · [More tools on GitHub](https://github.com/courtney-chapman).
