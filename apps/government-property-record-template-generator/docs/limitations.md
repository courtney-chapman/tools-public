# Scope and limitations

This is a **public demonstration**, not a Government Property management system or legal/compliance determination. A generated CSV is a starting format, not evidence of compliance.

- The user determines whether FAR 52.245-1 and DFARS 252.245-7005 apply to the actual contract. The app cannot interpret contracts, deviations, Property Administrator approvals, or extra contract-required data.
- The property snapshot represents current information. The transaction-history template gives a separate place for event references and dates. Neither export creates a complete, current, auditable history by itself; users must establish and maintain their actual records and supporting documents.
- `Record ID` is a demonstration key, not a clause-required identifier. It links the synthetic rows but is not validated or reconciled. Removing it breaks that demonstration link.
- Conditional fields may legitimately be blank for a particular item or event. DFARS NSN alternatives are alternatives, and a serial number is required by the cited clause only for a serially managed item without a UII. The supply condition code is only required for reporting reparable items.
- Audit-guidance fields are optional and unchecked by default. They are not presented as universal regulatory requirements.
- The optional CSV check reads user-selected files locally in the current browser session. It does not store, transmit, reconcile, or update records. It has no database, server, account, analytics, external dependency, or automatic source update.
- The CSV check only flags expected-header gaps, selected blanks, and date/number format issues. An absence of flags does **not** establish compliance. The check cannot verify applicability, item-specific conditions, property existence, source documents, auditability, or accuracy. It expects this tool's column names; other record layouts may be valid.
- The app does not cover special reporting workflows, GFP Module submissions, retention schedules, inventory assessments, or plant-clearance actions.

Public sources and the verification date are listed in [sources.md](sources.md). Recheck applicable contract terms and source versions before using the templates for actual property records.
