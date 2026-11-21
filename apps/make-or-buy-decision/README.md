# Make-or-Buy Decision Worksheet

Document a proposed Make, Buy, or Hybrid approach and an internal Procurement review in a standalone browser app. The worksheet organizes user-entered estimates, schedule, capability, risks, contract questions, and supporting references. It does not select an approach or determine regulatory applicability.

## Use

Open `index.html` in a current desktop browser. No server, account, installation, or network connection is required. The seven bookmarkable steps are:

1. **Requirement:** Describe the need and required date.
2. **Make:** Record the internal option, capacity, schedule, and estimate.
3. **Buy:** Record the external option, supplier information, schedule, and estimate.
4. **Compare and risk:** Review the cost and schedule summary, confirm the comparison basis, and record risk and optional Hybrid details.
5. **Program decision:** Record the proposed approach and rationale.
6. **Procurement review:** Check contract restrictions, formal make-or-buy program applicability, and supporting references; record an internal review disposition.
7. **Worksheet:** Review open items, copy the worksheet, or print/save it as a PDF.

The app keeps blank amounts distinct from zero. Itemized estimates replace the single total only when that mode is selected. A partial itemization has no comparable total. A cost difference appears only after the user confirms comparable quantity, period, and scope; recurring costs also need a stated comparison period. A lower estimate does not become an automatic sourcing recommendation.

Incomplete drafts can still be copied, printed, and exported for preliminary review. When printing to PDF, turn off browser **Headers and footers** so a local file path is not printed.

## Data and limits

Entries remain in the current tab's memory and are not saved automatically. Export JSON before refreshing or closing the tab if you need to resume later. The app exports schema version 1.1, accepts its version 1.0 drafts, and maps a limited set of fields from compatible procurement records. Review mapped fields against the source. Import confirms replacement of the current draft.

The app records evidence identifiers but does not open or inspect supporting files. **Copy AI prompt** places draft information on the clipboard only; confirm that sharing with an external service is authorized before sending it. Protect exported JSON and PDFs according to your organization's rules. The optional online page is a static copy of the app; the app itself does not send entries to a server.

The worksheet is a working record for Program and Procurement. Its status pills and open-item counts describe recorded information, not Government approval, a legal determination, price reasonableness, or compliance certification. Confirm the solicitation, incorporated contract clauses, deviations, and applicable plan requirements before operational use. Formal make-or-buy program applicability is a contract-specific question.

## Public references

- [FAR 15.407-2, Make-or-buy programs](https://www.acquisition.gov/far/15.407-2)
- [FAR 52.215-9, Changes or Additions to Make-or-Buy Program](https://www.acquisition.gov/far/52.215-9)
- [FAR 52.219-9, Small Business Subcontracting Plan](https://www.acquisition.gov/far/52.219-9)
- [DFARS 252.244-7001, Contractor Purchasing System Administration](https://www.acquisition.gov/dfars/252.244-7001-contractor-purchasing-system-administration.)

Current online text may differ from the contract's incorporated version. The download includes this guide, the MIT license, and the `index.html` browser app with local `tokens.css`.

Built by Courtney · Revision 6
