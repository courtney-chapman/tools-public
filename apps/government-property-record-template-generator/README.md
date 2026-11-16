# Government Property Record Template Generator

A standalone, offline browser demonstration that generates two related CSV templates: a Government Property **snapshot** and a **transaction history**. It provides a field preview, optional fields, column ordering, synthetic examples, a limited local CSV review, and a printable field dictionary. It is **not** a property-management system, compliance audit, or contract-clause determination.

## Use

Open `index.html` in a current browser. No installation, server, account, API key, or internet connection is needed. Use the four bookmarks across the top: **1 Choose**, **2 Customize**, **3 Download**, and **4 Check CSV**. Only the selected step is shown. Each step has its own URL bookmark (for example, `index.html#step-3`). Open the field groups and field dictionary only when needed. Use **Print field dictionary** for the currently selected fields. Opening public source links is optional and requires internet access.

In step 3, expand **Which property identifier is which?** for a plain-language reference to local asset IDs, manufacturer serial and part numbers, NSNs, UIIs, and manufacturer CAGE codes. It explains the corresponding template columns and conditional use without changing either CSV template.

The two example CSVs share `Record ID` (`GP-0001`). A snapshot row describes the current item and balance; transaction rows illustrate a receipt and issue with posting references. The app does not update balances, reconcile files, store entered data, or manage source documents. Blank CSVs have only headers. Example values and identifiers are synthetic.

Changing the template type or regulatory source set restores that choice's default columns; **Restore defaults** does the same without changing the choices. Audit-guidance fields start unchecked. Removing a regulatory or conditional column displays a warning. An empty file configuration disables its downloads.

## Review an existing CSV

Choose a property snapshot CSV and, optionally, a transaction-history CSV in **Review your CSV files**, then click **Check selected CSV files**. The local check expects this tool's headers and reports missing expected columns, selected blank values, and date/number formatting issues. It uses the FAR/DFARS source set selected above. It does not compare the two files, update records, or decide whether records are compliant. It does not verify contract-specific terms, conditional item facts, accuracy, or supporting documents. The tool reads files in the current browser session only; **Clear files and results** removes them from the page.

The check accepts up to 2 MB and 10,000 data rows per file. It displays up to 80 issues at a time without showing uploaded values. Use smaller files to review additional rows.

## Source scope

The tool shows **Revision 2**. Its public references, versions, and verification date are documented in [docs/sources.md](docs/sources.md), with limitations in [docs/limitations.md](docs/limitations.md). These documents are included in the offline package. The tool does not check for later changes. Verify contract clauses, deviations, additional requirements, and Property Administrator approvals before using a generated template for actual records.

## Technical note

Source files are plain HTML, CSS, and JavaScript with no third-party runtime dependencies or build step. The JavaScript contains the public-facing field catalog and template-generation rules needed to run offline. Anyone who receives the application can inspect those files.

## Status

Demonstration only. No promise of ongoing updates or support.

Built by Courtney · [More tools on GitHub](https://github.com/courtney-chapman).

The app uses the shared navy and blue color theme and follows your system dark mode setting. Printed documents remain on white paper.
