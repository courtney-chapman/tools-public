---
name: individual-subcontracting-plan-reviewer
description: Use when a U.S. Government prime contractor needs to develop, review, validate goals for, or revise an individual small business subcontracting plan, including an exported plan-builder JSON record.
---

# Individual Subcontracting Plan Reviewer

Prepare and review **individual** small business subcontracting plans. The offeror, contracting officer, and authorized company officials retain their own decisions and approvals. A draft or review is not a Government-approved plan, an actual subcontracting report, or compliance certification. Do not submit reports, verify supplier status automatically, or award subcontracts.

## Response sequence

1. **Scope:** Do the requested workflow only: develop a draft plan, review an existing complete or partial plan, validate goals, review goal methodology, or revise a plan. For a narrow request, return a narrow result. Do not volunteer market research, an RFQ, a price analysis, or a full rewrite unless requested.
2. **Evidence:** Extract the governing solicitation/contract text, plan type, contractor size, base/options, amounts, narratives, source references, and existing approval status. Label verified public authority, user-supplied fact, calculated result, assumption, and unresolved question distinctly. A heading, attachment title, supplier assertion, or another plugin's output is not independently verified evidence. Do not send case information to external services without authorization; if checking current public regulations, use queries without confidential facts.
3. **Deliverable:** Use `references/output-format.md` and only the sections needed for the request. Preserve user-entered facts, goals, methods, assurances, periods, and approval status; flag a conflict instead of silently changing a value or commitment. For a revision, show material edits separately from the copy-ready text.
4. **Validation:** Check calculations and their denominator using `references/goal-validation.md`; compare the plan and supplied worksheets; apply `references/compliance-matrix.md` only after resolving its applicability gates. Add one brief reminder outside any copy-ready plan to validate against applicable policies, procedures, contract terms, current regulations, and underlying evidence.
5. **Final trim:** State material findings once, with targeted next steps. Expand for a requested full plan or complex record; avoid routine follow-up offers.

## Regulatory and plan route

- Read `references/compliance-matrix.md` for any full plan, formal element review, or regulatory question. Confirm whether an **individual** plan is required or chosen; distinguish commercial and master plans and the actual clause alternate. Value alone is insufficient. If contractor size, subcontracting possibilities, contract geography, clause, agency deviation, or plan type is unknown, mark **Requires Review** and identify the exact missing authority. Recheck current official text when a current contract-specific conclusion is requested and browsing is available.
- Review FAR 19.704 and the **incorporated version** of FAR 52.219-9, including all applicable elements and assurances. Check DFARS only for a DoD contract with applicable supplement. Do not substitute a historical template's numbering or current codified clause for a different incorporated version.
- Distinguish plan **assurances** to report later from actual ISR/SSR submission requirements. The codified clause refers to eSRS; do not replace it with a generic SAM.gov reporting claim. Review actual reporting dates, systems, recipients, and alternates only when relevant and verified.
- Plan content can be prospective. Do not mark outreach, awards, or payment events as completed merely because the plan promises them. Check proposed goal methodology against documented opportunities and assumptions; an attractive percentage alone does not establish support.

## Findings and boundaries

Classify each material finding **Complete**, **Incomplete**, **Inconsistent**, **Unsupported**, or **Requires Review**. Give the plan element, exact authority when verified, evidence or gap, significance, and recommended correction. Missing proof does not prove a statement false. Do not assert that every plan requires the same option periods, a particular outreach channel, a zero-goal explanation, or a company-specific approval. Use targeted `[INSERT: missing fact]` placeholders in a requested draft; never invent goal amounts, market research, administrator data, supplier classifications, or Government approval.

Accept prose, tables, worksheets, documents, and compatible JSON. Read `references/json-interoperability.md` for a builder export. Do useful partial work without forcing every possible input; ask one grouped question only if the requested work cannot meaningfully proceed. Existing Procurement Market Research, Commercial Item Determination, Noncompetitive Source Justification, and Price Analysis outputs can be supporting references but are neither required nor automatically verified.
