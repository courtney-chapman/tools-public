# Commercial Product, Service, and COTS Determination

A standalone browser app for buyers to organize evidence and document their own commercial product, commercial service, and commercially available off-the-shelf (COTS) conclusions. The app offers answer-based working suggestions and identifies missing information. It does not decide whether a purchase is commercial, verify evidence, or approve a transaction.

## Use

Open `index.html` in a current browser. The app runs offline without an account, installation, server, or network connection. Its three bookmarkable steps are:

1. **Form:** Describe the purchase; select the definition source; add source records and, for web pages, screenshots; then answer questions for each product, software offering, or performed service. The four form sections can be collapsed. The app shows a working suggestion beside the buyer's own conclusion. The **Get AI Help** action copies an optional handoff for a compatible tool; it does not contact that tool.
2. **Check:** Review missing information, evidence gaps, and matters requiring buyer or Procurement review. The checks use entered answers and references. They cannot establish the truth or sufficiency of a source.
3. **Preview / Export:** Review the seven-section determination, choose **Draft** or **Final**, copy the text, or print/save a PDF. Draft may contain `[INSERT]` prompts. Final is enabled when the form's deterministic checks are clear; it remains the buyer's conclusion, not a Government determination or company approval.

**Save / open draft** downloads or imports JSON. **Clear all** asks before deleting current entries. Disable browser **Headers and footers** in the print dialog if you do not want the browser to add a local file path or print timestamp.

## Rule basis and limits

The built-in questionnaires address [codified FAR 2.101](https://www.acquisition.gov/far/2.101) (FAC 2026-01, effective March 13, 2026) and the [FAR Overhaul Part 2 model definitions](https://www.acquisition.gov/far-overhaul/far-part-deviation-guide/far-overhaul-part-2). The model text is a choice only when an applicable agency class deviation adopts it. The buyer must identify the governing contract, agency, deviation, and version. A buyer may enter a different rule and write its own criteria and findings; the app does not evaluate that rule's legal requirements. Confirm source currency and applicability before use.

The buyer selects one primary commercial definition for each item or service, answers Yes, No, or Not sure, and writes an analysis. COTS is a narrower product classification and does not apply to a performed service. The working suggestion may be No or incomplete while evidence is still being gathered; it does not select or override the buyer's conclusion. Printed output includes buyer analysis and entered facts, not the working suggestions. Supporting evidence appears in section 6 and the determination in section 7.

The app does not inspect attached screenshots, verify sales quantities or source credibility, make price or cost findings, determine contract clauses, or apply company policy. Users remain responsible for the final procurement record and any required review or approval.

## Data and privacy

Entries and screenshots remain in memory while the page is open. Nothing is saved or sent automatically. Exported JSON and PDFs may contain procurement information; handle them in an authorized environment. The optional AI handoff copies text for the user to decide whether to share; it omits screenshot image bytes.

JSON exports use schema version 1.1 and imports also accept version 1.0. Import validates the structure and asks before replacing a populated form. Online source URLs require a screenshot for Final. Up to three PNG, JPEG, or WebP screenshots under 3 MB each may be attached per source; they are included in JSON and in the printed appendix. The offline ZIP includes this guide, the MIT license, and the `index.html` with local `tokens.css`.

Built by [Courtney](https://github.com/courtney-chapman/tools-public).
