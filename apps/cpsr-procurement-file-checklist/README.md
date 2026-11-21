# Procurement File Readiness Checklist

Organize an internal procurement file review in a standalone browser app. Record purchasing facts, contract and procedure answers, reviewer findings and optional file identifiers. The app does not open supporting files or decide CPSR compliance, Government consent, purchasing-system approval, supplier responsibility, commerciality, or price reasonableness.

## Use

Open `index.html` in a current browser. The app needs no account, installation, server, or network connection.

1. **Details:** Enter the procurement identifiers and facts you know.
2. **Controls:** Answer questions using the actual prime contract and applicable procedures. Leave uncertain answers as Unknown.
3. **Checklist:** Work through Contract & regulatory, Company procedures, and Agency-specific parts. Examine each actual record and select Not reviewed, Meets requirement, Needs correction, Missing, or Not Applicable. Add a finding where useful; a file name or ID is optional in row details. Search, page, collapse groups, or use **Needs attention** to find gaps. Download the CSV templates to load company or agency requirements in bulk; each custom part accepts up to 100 items.
4. **Report:** Review open items, optionally record a separate internal reviewer pass, then copy, print, or save a report. **Print compact** shows counts and up to five key findings or questions; **Print detailed** adds the full record. Turn off browser **Headers and footers** when saving a PDF so the local file path is not printed.

Use **Save draft JSON** in the top navigation at any step. To resume, use **Import JSON** on Report. The full session format is schema 1.7; valid 1.0–1.6 sessions are upgraded on import. Older Available rows become Not reviewed because presence alone is not an adequacy finding; their file identifiers are preserved. Older Price analysis rows become Price reasonableness review, with applicability recalculated. Older drafts gain the award-stage checks without moving company or agency rows. Entries stay in the current tab's memory and are not saved or transmitted automatically. Closing or refreshing without a JSON export loses unsaved work. The app reads only CSV or JSON files you select. Protect exported files and printed reports according to your organization's requirements. Confirm authorization before sharing a copied AI prompt with an external service.

Price reasonableness review stays Required in this purchasing workflow. FAR 15.404-3(b)(1) calls for appropriate cost or price analysis of proposed subcontract prices; this does not always mean a separate price-analysis document. A No answer to Price analysis method used does not make the overall pricing review N/A, and No for both price and cost methods raises a question. The Award documentation group also checks DPAS rated-order handling, FFATA first-tier reporting handoff, award-time exclusions/debarment, and the anti-lobbying declaration and flowdown. These depend on the actual order, incorporated clauses, thresholds, tiers, and exceptions. FFATA submission is generally due after award; the row captures the award data and handoff, then later submission when due. FAR 52.203-12(g) requires the supplier declaration and clause flowdown for triggered subcontracts; an SF-LLL disclosure is forwarded only when one is submitted. The progress count rises when the reviewer marks an applicable record Meets requirement; a file identifier does not affect it. The app does not inspect records or decide compliance. A Missing or Needs correction result is a gap; Not reviewed and unresolved applicability remain open review questions. The Applies badge is calculated from Details and Controls. Status colors accompany words: neutral for Not reviewed, amber for open questions, red for Missing or Needs correction, and green for a reviewer-selected Meets requirement. The built-in rows are not a complete clause inventory; add separately verified company and agency or contract-specific requirements in Parts 2 and 3. User-loaded requirements are not validated as governing authority. Check the incorporated clause, deviations, agency provisions, company procedure, and current rules for the specific purchase before operational use.

## Public references

- [FAR 3.808, Anti-lobbying clause threshold](https://www.acquisition.gov/far/3.808)
- [FAR 52.203-12, Anti-lobbying subcontract declaration and flowdown](https://www.acquisition.gov/far/52.203-12)
- [FAR 52.203-11, Certification and disclosure](https://www.acquisition.gov/far/52.203-11)
- [FAR 52.204-10, First-tier subcontract reporting](https://www.acquisition.gov/far/52.204-10)
- [FAR 52.209-6, Exclusions and debarment](https://www.acquisition.gov/far/52.209-6)
- [FAR 9.405-2, Restrictions on subcontracting](https://www.acquisition.gov/far/9.405-2)
- [FAR 52.211-15, DPAS rated orders](https://www.acquisition.gov/far/52.211-15)
- [15 CFR 700.12, 700.15, and 700.17, DPAS](https://www.ecfr.gov/current/title-15/part-700)
- [FAR 52.244-2, Subcontracts](https://www.acquisition.gov/far/52.244-2)
- [FAR 44.303, Extent of review](https://www.acquisition.gov/far/44.303)
- [FAR 15.404-3, Subcontract pricing considerations](https://www.acquisition.gov/far/15.404-3)
- [DFARS 252.244-7001, Contractor Purchasing System Administration](https://www.acquisition.gov/dfars/252.244-7001-contractor-purchasing-system-administration.)

The contract's incorporated text may differ from the online text. The download includes this guide, a PolyForm Noncommercial license, and the browser app with local `tokens.css`.

Built by Courtney · Revision 17
