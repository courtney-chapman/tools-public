# Consent-to-Subcontract Package Builder

Prepare a working consent-to-subcontract package for Procurement review in a standalone browser app. It organizes contract facts, the buyer's applicability assessment, subcontract and pricing information, and references to supporting documents. It does not decide whether consent is required.

## Use

Open `index.html` in a current browser. No server, account, installation, or network connection is required. The app has five main steps:

1. **Prime Contract and Applicability:** Record the incorporated clause and contract facts, then document your assessment. Consent required, Consent not required, and Applicability requires review are separate choices. Answer the contract-specific questions independently.
2. **Proposed Subcontract:** Describe the proposed supplier, supplies or services, type, value, and timing.
3. **Supplier Selection:** Record the selection basis and reference existing support. Conditional fields appear for a noncompetitive selection.
4. **Pricing and Negotiations:** Record the analysis method, pricing summary, and supporting references. The app does not perform price or cost analysis.
5. **Consent Package:** Use bookmarkable **Readiness**, **Documents**, and **Output** views. Review gaps, set supporting-document statuses and references, and choose a letter, applicability record, or package checklist. A request letter is available only when the buyer's assessment is **Consent required**. The other outputs remain available for a preliminary review.

Copy an output or print/save it as a PDF. Draft outputs may include `[INSERT]` prompts. Turn off browser **Headers and footers** when saving a PDF so the local file path is not printed.

## Data and limits

Entries stay in the current tab's memory and are not saved automatically. Export JSON before refreshing or closing the tab if you need to resume later. JSON exports use schema version 1.2; valid version 1.0 and 1.1 drafts can be imported and upgraded. The app confirms replacement of a nonblank draft and clearing all entries.

The app does not upload or inspect supporting documents. It records statuses and file names or IDs supplied by the user. **Copy AI Prompt** places draft information on the clipboard only; decide whether an external service may receive that information before sharing it. Protect exported JSON and PDFs according to your organization's rules. The optional online page is a static copy of the app; the app itself does not send entries to a server.

Readiness labels describe structural gaps in the working package. They are not Government consent, a legal determination, a price-reasonableness finding, or approval of subcontract terms or costs. Confirm the clause and any alternates, deviations, or agency provisions actually incorporated into the prime contract. Procurement must review the facts and supporting records before operational use.

## Public references

- [FAR 52.244-2, Subcontracts](https://www.acquisition.gov/far/52.244-2)
- [FAR 44.000, scope of Part 44](https://www.acquisition.gov/far/44.000)
- [FAR Subpart 44.2, Consent to Subcontracts](https://www.acquisition.gov/far/subpart-44.2)
- [FAR 15.404-3, Subcontract pricing considerations](https://www.acquisition.gov/far/15.404-3)
- [DFARS 252.244-7001, Contractor Purchasing System Administration](https://www.acquisition.gov/dfars/252.244-7001-contractor-purchasing-system-administration.)

Current online text may differ from the contract's incorporated version. The download includes this guide, the PolyForm Noncommercial license, and the `index.html` browser app with local `tokens.css`.

Built by Courtney · Revision 9
