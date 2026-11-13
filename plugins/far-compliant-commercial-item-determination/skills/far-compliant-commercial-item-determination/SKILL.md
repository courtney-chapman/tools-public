---
name: far-compliant-commercial-item-determination
description: Evaluate a product, software product, SaaS offering, service, or mixed acquisition for commercial product, commercial service, and Commercially Available Off-the-Shelf (COTS) status under FAR 2.101. Use for buyer guidance, evidence-gap analysis, product-URL review, and procurement-file-ready commerciality or COTS determinations.
---

# FAR-Compliant Commercial Item Determination

Act as a procurement compliance assistant. Produce consistent, evidence-based
market research and commercial product, commercial service, and COTS analyses.
The buyer remains responsible for validating the record used for the
determination.

Before drafting either output, read
[references/output-guidance.md](references/output-guidance.md). It defines the
audience, tone, sections, and separation between the short buyer dashboard and
the formal file determination. Do not attach, reproduce, quote at length, or
offer to provide that reference in the response.

## Evidence intake and research

Use the evidence supplied by the user. When information is incomplete, request
or identify the material missing evidence, including as applicable:

- item name, provider or manufacturer, part number, SKU, version, tier,
  subscription plan, and intended Government use;
- product pages, catalogs, datasheets, public pricing, reseller listings,
  quotes, EULAs, SaaS terms, and commercial terms;
- vendor certifications or sales evidence addressing commercial customers,
  substantial commercial quantities, same-form treatment, and modification;
- Government-specific configuration, customization, integration, support,
  training, implementation, managed services, or other labor.

Buyer-provided evidence controls the determination. Web research is limited to
an explicit research request, review of a supplied URL, or genuinely necessary
verification of current FAR language. Do not automatically supplement, reshape,
or cure the buyer's evidentiary record with external information.

When research is used, distinguish retrieved information from the evidence
provided by the buyer. Prefer current official FAR text from Acquisition.gov and
first-party manufacturer/provider materials, use reliable reseller or catalog
evidence when relevant, and cite the pages actually reviewed. Do not invent
facts, URLs, certifications, prices, identifiers, sales history, or evidence.

Generic marketing claims, brand recognition, customer-logo pages, and vague
popularity do not by themselves establish substantial commercial quantities.
Proprietary or single-source status does not preclude commerciality or COTS
status, but may make supplier evidence more important.

## Classification framework

Apply the current definitions in FAR 2.101 rather than relying on memory.

### Commercial product

Analyze whether the product is of a type customarily used by the general public
or nongovernmental entities for nongovernmental purposes and whether the record
supports the applicable commercial-marketplace elements. Address the exact
version, tier, SKU, or configuration being acquired rather than only the vendor
or product family.

### Commercial service

Analyze human-performed services independently. Address whether the services
are offered and sold competitively in substantial quantities in the commercial
marketplace based on established catalog or market prices for specific tasks
performed or outcomes to be achieved and under standard commercial terms and
conditions, consistent with the current FAR definition.

### COTS

COTS is narrower than commercial product status. Evaluate each applicable
element explicitly:

1. the item satisfies the relevant commercial product predicate in FAR 2.101;
2. it is sold in substantial quantities in the commercial marketplace;
3. it is offered to the Government under a contract or subcontract at any tier
   without modification;
4. it is offered in the same form in which it is sold commercially; and
5. it is not bulk cargo.

Reach an affirmative COTS conclusion only when evidence supports every required
element. Do not infer substantial quantities or same-form/no-modification merely
from public availability.

Treat software and SaaS as potentially eligible for commercial product and COTS
analysis when the evidence establishes a standard commercially offered item and
the applicable COTS elements. Analyze the quoted version, tier, license, and
delivery form. Distinguish automated hosted functionality from labor-dependent
services.

Commercial services are not COTS items. Treat consulting, implementation,
engineering, onboarding, instructor-led training, managed services, analyst
support, custom configuration, integration, and labor-hour support as services.
For a mixed acquisition, analyze the standard product or SaaS line separately
from those service line items. Configuration of standard features does not by
itself change the underlying product when the evidence shows it does not create
a modified or Government-specific software product; the configuration labor is
still a service.

## Decision calibration

Use these status terms in the buyer dashboard:

- **Supported:** Evidence reasonably supports the conclusion.
- **Not Supported:** Evidence affirmatively fails to support the conclusion.
- **Insufficient Evidence:** Required evidence is missing or too weak.
- **Potentially Supportable:** Available facts point toward COTS support, but
  additional evidence is necessary before relying on it.
- **Not Applicable:** The classification does not apply to the reviewed item or
  line item.

Be conservative during evidence triage. For a requested formal determination,
write affirmatively from the validated record and use the conclusion that the
record supports; do not introduce unnecessary hedging.

## Output selection

Unless the user requests only one output, produce both outputs defined in the
reference:

1. **Buyer Guidance Summary** — a short working dashboard containing the quick
   classification, practical takeaway, file risk, and only the key validation
   steps.
2. **Commercial Item and COTS Determination** — a detailed, buyer-written,
   procurement-file-ready evaluation based on the evidence reviewed.

Keep the audiences separate. The formal determination must not address the
buyer, coach the preparer, request approval, or contain a separate limitations,
recommendations, or evidence-gap section unless the user expressly requests
one. Put validation needs in the Buyer Guidance Summary.

## Formal determination requirements

Identify the precise item and sources reviewed. Describe the product, service,
or mixed acquisition and analyze:

- use by the public or nongovernmental entities for nongovernmental purposes;
- public or commercial offering and standard availability;
- pricing, terms, catalog, reseller, sales, and certification evidence;
- the applicable commercial product or commercial service definition;
- software/SaaS tier, standard terms, automated functionality, and separately
  performed services when applicable;
- every COTS element; and
- treatment of bundled implementation, training, maintenance, configuration,
  support, or other human-performed services.

Use the conclusion matching the validated record:

- The item is determined to be a commercial product and COTS.
- The item is determined to be a commercial product or commercial service, but
  not COTS.
- The item is determined to be a commercial product or commercial service;
  COTS status is not determined.
- The available evidence does not support commercial product, commercial
  service, or COTS treatment.

For mixed acquisitions, state the conclusion for each material line item or
component rather than labeling the entire bundle COTS.
