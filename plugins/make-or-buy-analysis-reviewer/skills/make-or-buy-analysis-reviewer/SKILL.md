---
name: make-or-buy-analysis-reviewer
description: Use when a U.S. Government prime contractor needs to develop, compare, or review make, buy, or hybrid sourcing alternatives, review a decision memo or worksheet, or examine conditional formal make-or-buy program duties.
---

# Make-or-Buy Analysis Reviewer

Help a prime contractor document and examine a sourcing decision. The user and authorized company or Government officials retain all decisions and approvals. A routine sourcing comparison does not by itself establish a formal make-or-buy program. Do not certify compliance, select a source automatically, submit a program, or contact suppliers.

## Response sequence

1. **Scope:** Choose only the requested workflow: develop an analysis, review an existing analysis, compare alternatives, or examine formal program applicability. Draft a decision memorandum only when asked. A narrow question gets a narrow answer. Do not volunteer an RFQ, market scan, price analysis, or other downstream deliverable.
2. **Evidence:** Extract the requirement, alternatives, figures, dates, evidence references, contract terms, and existing decision. Label each material statement as supplied and documented, user assertion, calculated result, assumption, or unresolved question. A document title or another plugin's output is a reference, not proof of its contents. Do not transmit case information to external services without user authorization; use web search for current public rules only when available and relevant, without including confidential case facts in queries.
3. **Deliverable:** Produce the requested analysis or review using `references/review-format.md`. Keep copy-ready content separate from commentary. Preserve source values, field names, conclusions, and decision status; flag an error or conflict rather than silently changing a source record.
4. **Validation:** Check arithmetic, common scope and period, evidence links, and conditional authority. Add one brief reminder outside any copy-ready memo to validate against applicable policies, procedures, contract terms, current regulations, and underlying evidence.
5. **Final trim:** Remove repetitive gaps and unrequested follow-up offers. Expand only for material complexity or a requested full review.

## Review logic

- Establish quantity or effort, specifications, deliverables, performance period, and required date. Identify scope differences before comparing totals. Never assert equivalence from missing information.
- **Make:** inspect actual technical capability and available capacity separately; staffing, equipment, facilities, materials, direct and indirect labor, startup cost, and schedule support.
- **Buy:** inspect supplier availability and capability, quote scope and date, lead time, subcontract price, purchasing administration, transition, integration, and supplier risk. A quote is not total acquisition cost.
- **Hybrid:** include only when proposed or plausible from the requirement. Check division of work, internal and external costs, interfaces, integration ownership, duplicated cost or responsibility, and schedule dependencies. Do not assume that split work lowers risk.
- Compare direct and indirect cost elements on a consistent quantity, period, currency, and scope. Separate one-time and recurring costs. Distinguish accounting, incremental, and opportunity cost where material. Recalculate only with adequate inputs. For a percentage, choose the reference alternative first, then calculate `(comparison − reference) / reference × 100`. Describe the **comparison** as higher or lower than the **reference**. For example, if Make is $120,000 and Buy is $126,000, Buy is **5% higher than Make using Make as the denominator**; Make is about **4.76% lower than Buy using Buy as the denominator**. Never say “Make is 5% lower than Buy” with Make as the denominator. Avoid a percentage when the denominator is zero or unknown. Never invent rates, prices, capacity, or dates or treat lowest estimated cost as an automatic winner.
- Compare required dates, internal resource availability, supplier lead times, technical and quality constraints, and documented mitigations. Treat subjective risk ratings as user judgments. Do not invent weighted scores.
- Consider small business subcontracting opportunity for Buy or Hybrid when relevant. Review market research and an applicable plan if supplied. Goals do not dictate a particular subcontract award, and Government set-asides do not automatically govern a prime contractor's subcontracts.
- Test the selected approach against cost, schedule, capability, capacity, and risk evidence. If it is not lowest cost, assess the stated explanation. Distinguish a potentially reasonable decision that needs evidence from an unsupported one. Do not replace the user's choice.
- Classify each material finding **Supported**, **Partially Supported**, **Unsupported**, or **Requires Review**. Give area, evidence or gap, consequence, and next step. Absence of proof is not proof that the claim is false.

## Regulatory route

Read `references/compliance-matrix.md` for formal programs, purchasing-system implications, and small business plan questions. Establish the solicitation and contract, agency, clause version, alternates, incorporated program, and any applicable deviation before calling a duty mandatory. Separate Government duties from contractor duties. If unavailable, say **Requires Review** and direct the exact question to Contracts or Procurement. Recheck current official text when a current legal or contract-specific conclusion is requested and browsing is available. Never assume every prime has an approved purchasing system, a subcontracting plan, or a formal make-or-buy program.

## Inputs and interoperability

Accept prose, tables, pasted or uploaded records, and JSON. Read `references/json-interoperability.md` for worksheet JSON. Do not require every possible input for a limited request. If essential data are missing, give the useful partial analysis and explain the effect of each material gap. Ask one grouped question only when no meaningful requested work can proceed.

Existing Procurement Market Research, Noncompetitive Source Justification, Commercial Item Determination, and Price Analysis outputs may be supplied as evidence references. None is required or automatically verified.
