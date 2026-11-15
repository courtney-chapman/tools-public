# Tools and Plugins

Codex plugins for specialized professional workflows. This repository is the current catalog and source for the plugin packages.

[My Portfolio](https://github.com/courtney-chapman/portfolio-public) shows the projects and demonstrations behind related tools. [Visual portfolio](https://courtneypetersonchapman.notion.site/) presents the same work in Notion.

Review each plugin and its supporting references before using it for a real matter.

## Get a plugin

- **Codex desktop or CLI:** Add this repository as a marketplace with `codex plugin marketplace add courtney-chapman/tools-public`, then browse and install the plugin you want.
- **ChatGPT web with ZIP upload access:** Download one plugin ZIP from [Releases](https://github.com/courtney-chapman/tools-public/releases), then use the plugin upload option in your account. Upload availability depends on your plan and permissions.

Each ZIP contains one plugin and the repository license. The plugin folders below remain the source for future releases.

## Standalone browser app

### DD Form 1149 Generator

Prepare a DD1149-style shipping document and continuation sheets locally in your browser. Download the `dd1149-generator.zip` asset from [Releases](https://github.com/courtney-chapman/tools-public/releases), unzip it, and open `index.html`. No installation or account is required. The [app guide](apps/dd1149-generator/README.md) explains the data format and use limits. This app is not a Codex plugin and is not part of the marketplace catalog.

## Plugins

### Procurement Market Research

Supports federal-prime-contractor market research for commercial products and
services, including supplier discovery, public pricing, procurement evidence,
and vendor diligence.

- [Plugin instructions](plugins/procurement-market-research/skills/procurement-market-research/SKILL.md)

### Government Property LTDD Relief Letter Generator

Generates and validates audit-defensive Government Property LTDD relief
packages while preserving the distinction between verified facts, interview
statements, assumptions, and missing evidence.

- [Plugin instructions](plugins/government-property-ltdd-relief-letter-generator/skills/government-property-ltdd-relief-letter-generator/SKILL.md)

### Software/SaaS Negotiation Strategy

Guides federal procurement professionals through internal discovery, vendor
questions, negotiation strategy, and optional practice for SaaS acquisitions
under the Simplified Acquisition Threshold.

- [Plugin instructions](plugins/software-saas-negotiation-strategy/skills/software-saas-negotiation-strategy/SKILL.md)

### FAR-Compliant Commercial Item Determination

Evaluates products, software, SaaS, services, and mixed acquisitions for
commercial product, commercial service, and COTS treatment under FAR 2.101 and
produces buyer guidance or procurement-file-ready determinations.

- [Plugin instructions](plugins/far-compliant-commercial-item-determination/skills/far-compliant-commercial-item-determination/SKILL.md)

### FAR-Compliant Non-Competitive Source Justification

Helps federal-prime-contractor Program Managers draft post-market-research
sole-source and noncompetitive justifications, including alternate-supplier
disqualification language and targeted fields for missing supporting details.

- [Plugin instructions](plugins/far-compliant-non-competitive-source-justification/skills/far-compliant-non-competitive-source-justification/SKILL.md)

### FAR-Compliant Price Analysis for Goods

Drafts procurement-file-ready price analysis justifications for government-funded
FFP goods, COTS, commercial products, software, materials, and routine buys using
the buyer's supplied rules and evidence for competition, market pricing, and best value.

- [Plugin instructions](plugins/far-compliant-price-analysis-for-goods/skills/far-compliant-price-analysis-for-goods/SKILL.md)

### FAR-Compliant Price Analysis for Subcontracts (Lite)

Drafts BID SUMMARY & PRICE ANALYSIS write-ups for government-prime subcontract
awards, option periods, and modifications. Reconciles proposed totals and
analyzes supported labor rates, indirect rates, fee, escalation, and historical
comparisons without inventing undisclosed cost elements.

- [Plugin instructions](plugins/far-compliant-price-analysis-for-subcontracts-lite/skills/far-compliant-price-analysis-for-subcontracts-lite/SKILL.md)

### Commercial and Indirect Price Analysis (Lite)

Drafts concise price analyses for a company's Commercial and Indirect purchases,
including services, SaaS, software, consulting, equipment, and routine supplier
buys. Uses the buyer's policy and price evidence; no federal acquisition
requirements are assumed.

- [Plugin instructions](plugins/indirect-and-commercial-price-analysis-for-services-lite/skills/indirect-and-commercial-price-analysis-for-services-lite/SKILL.md)

## Repository layout

- `plugins/` contains the public Codex plugin packages.
- `apps/dd1149-generator/` contains the standalone browser app.
- `.agents/plugins/marketplace.json` publishes the repository's plugin catalog.
- `support/` contains repository validation guidance.

## Repository guide

- See [repository support](support/README.md) for development and validation.

Nothing committed here may depend on private content, secrets, or paid APIs.
New examples should be synthetic or sanitized, and credentials, secrets,
private case material, and personal information must never be committed.
Private review evidence does not belong in this repository.

## Release and licensing

Security concerns should follow the [security policy](SECURITY.md).

Original repository content is licensed under [CC BY-NC 4.0](LICENSE), **except**
`apps/dd1149-generator/`, which is licensed under its own [MIT license](apps/dd1149-generator/LICENSE).
Third-party material remains subject to its own terms.
