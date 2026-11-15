# Physical Inventory Count Sheet Generator

A standalone, offline browser demonstration for preparing Government Property physical inventory count sheets and basic reconciliation reports. It works with serialized equipment and quantity-managed material. It is not a property management system, inventory certification, compliance determination, or loss-reporting tool.

## Use

Open index.html in a current browser. There is no installation, account, server, API, or internet connection. The four bookmarks across the page are **1 Set up**, **2 Add records**, **3 Count sheets**, and **4 Results**. Each step has a URL bookmark, such as index.html#step-3.

1. Enter a fictional inventory reference, date, site, area, and counter.
2. Add property records manually or import a CSV. Download the blank import template or 100-row synthetic example from the page. Map source columns before import. The earlier Property Record Template Generator snapshot CSV is recognized where field names match, including Balance on Hand as Quantity on Hand; review the suggested mapping before accepting it.
3. Select the records to count. Sort by location, asset identifier, or description; filter and select a subset. The subset is only a working scope. Open a standard or blind print view and use the browser's Print or Save as PDF command. Blind print documents contain no recorded quantities or variances.
4. Enter observed quantities and optional observed location, asset identifier, serial number, condition, and notes. Blank means not counted; zero means counted with none observed. Add unexpected property separately. Download results and discrepancy CSVs or print the working summary.

The import requires a unique Record ID, description, nonnegative Quantity on Hand, and Unit of Measure. Asset Identifier may be blank for quantity-managed material. Duplicate Record IDs after the first, invalid quantities, and other invalid rows are skipped. The preview gives row reasons before acceptance, and the skipped-row list can be downloaded. Duplicate asset identifiers and blank locations are warnings. A partial import is labelled in later summaries. Importing again replaces working records and observations only after confirmation. Manual records can be added afterward.

Fractions are accepted for quantities, but the user must determine whether a fraction suits the unit of measure. Observed quantities must be nonnegative decimals. The app calculates variance as observed minus recorded, without a monetary value or a loss determination. Investigate shortages promptly and follow applicable loss and inventory-results reporting procedures. Unexpected items need review under record-establishment procedures. The tool does not identify sensitive property, complete final-inventory or closeout requirements, update source property records, reconcile across systems, or send reports to anyone.

All working data stays in browser memory. Reloading or closing the page loses it; use the exports before leaving. Reset clears the current session. Imported data is displayed as text, and spreadsheet formula-like values are escaped in CSV exports.

## Sources and limits

The app shows **Revision 1**. Public references and versions checked on 2026-11-15 are in [docs/sources.md](docs/sources.md). [docs/limitations.md](docs/limitations.md) explains the limits. The browser tool does not check for later source changes or determine whether a clause, deviation, contract procedure, or Property Administrator approval applies.

The source is plain HTML, CSS, and JavaScript with no runtime dependencies. The ZIP contains the app, user guidance, public source references, and synthetic examples.

Demonstration only. No promise of ongoing updates or support.

Built by Courtney · [More tools on GitHub](https://github.com/courtney-chapman).
