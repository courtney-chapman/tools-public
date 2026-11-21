# Supplier Performance Evaluation

Record a supplier performance evaluation and corrective-action follow-up in a standalone offline browser app. The evaluator selects each category rating and the overall judgment. The app organizes evidence references and open documentation items; it does not calculate ratings, assign fault, approve the supplier, or submit a Government performance report.

## Use

Open `index.html` in a current desktop browser, or use the static online page. The app has seven steps:

1. **Supplier:** Identify the supplier, subcontract or purchase order, and applicable performance requirements.
2. **Period:** Record the evaluation type, dates, and evaluator.
3. **Performance:** Rate applicable categories, record supporting narratives and references, and optionally enter measured or estimated metrics and delivery dates. The rating guide describes this app's evaluator scale; it is separate from Government CPARS ratings.
4. **Issues:** Add an issue from the compact list, then use its dialog to record the finding, corrective action, supplier response, verification, and closure. A disputed finding remains flagged for review even if an action is closed.
5. **Summary:** Select the overall rating, document the assessment, and review missing information, evidence, and other open items.
6. **Review:** Record optional, separate feedback from Procurement, Program, Quality, or another internal reviewer. This does not approve the evaluation or change its ratings.
7. **Sheet:** Copy or print the evaluation sheet. An incomplete sheet remains available for preliminary review and lists its open items.

**Save draft JSON** is available on every step. Save before refreshing or closing the tab: entries are held only in that tab's memory. The app confirms before replacing a draft on import. Schema 1.0 drafts are migrated to 1.1; schema 1.1 drafts load directly; JSON files have a 20 MB limit. Supporting documents are referenced by name or ID; the app does not upload or inspect them.

The optional **Copy AI prompt** action copies draft data to the clipboard; it does not send anything to a service. Share contract and supplier information externally only when authorized. Turn off browser **Headers and footers** when printing to PDF so a local file path is not printed. Protect exported JSON and PDFs according to your organization's requirements.

## Use limits and public references

This is an internal documentation aid. Confirm the actual contract terms, evidence, and evaluator judgment before operational use. The app does not make a responsibility or award-eligibility determination, perform a CPSR, issue a notice, or submit CPARS information. The following public provisions provide context; applicability depends on the contract and the responsible party:

- [FAR 44.303, extent of purchasing-system review](https://www.acquisition.gov/far/44.303)
- [DFARS 252.244-7001, Contractor Purchasing System Administration](https://www.acquisition.gov/dfars/252.244-7001-contractor-purchasing-system-administration.)
- [FAR 46.105, contractor quality responsibilities](https://www.acquisition.gov/far/46.105)
- [FAR Subpart 42.15, Government contractor-performance information](https://www.acquisition.gov/far/subpart-42.15)

Current online text may differ from the contract's incorporated version. The download includes this guide, the MIT license, and the `index.html` with local `tokens.css` app. The online page is static; the app itself sends no entries to a server.

Built by Courtney · Revision 9
