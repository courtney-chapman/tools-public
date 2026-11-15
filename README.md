<img src="docs/readme/readme_header.png" alt="Tools and Plugins: offline browser apps and Codex plugins for government property and procurement work." width="100%">

[My Portfolio](https://github.com/courtney-chapman/portfolio-public) shows the projects and demonstrations behind related tools. [Visual portfolio](https://courtneypetersonchapman.notion.site/) presents the same work in Notion.

**Project status:** These tools are independent demonstrations provided as-is, not managed services. They are not guaranteed to reflect subsequent regulatory changes. Users are responsible for verifying applicable requirements, source currency and outputs before operational use.

**Start here:** [Browser apps](#standalone-browser-apps) · [Plugins](#plugins) · [Releases](https://github.com/courtney-chapman/tools-public/releases)

## Get a plugin

- **Codex desktop or CLI:** Add this repository as a marketplace with `codex plugin marketplace add courtney-chapman/tools-public`, then browse and install the plugin you want.
- **ChatGPT web with ZIP upload access:** Download one plugin ZIP from [Releases](https://github.com/courtney-chapman/tools-public/releases), then use the plugin upload option in your account. Upload availability depends on your plan and permissions.

Each ZIP contains one plugin and the repository license. The plugin folders below remain the source for future releases.

## Standalone browser apps

<img src="docs/readme/readme_open_app.png" alt="Open a browser app: download the ZIP from Releases, unzip it, and open index.html in a desktop browser. No install, no account, works offline." width="100%">

These offline browser apps are separate from the Codex plugins.

| Icon | App, description, and links |
| --- | --- |
| <img src="docs/readme/icons/dd1149-generator.png" width="56" alt=""> | **DD Form 1149 Generator**<br>Prepare a DD1149-style shipping document and continuation sheets locally in your browser.<br>[Download](https://github.com/courtney-chapman/tools-public/releases/tag/dd1149-generator-v1.0.1) · [Guide](apps/dd1149-generator/README.md) |
| <img src="docs/readme/icons/government-property-record-template-generator.png" width="56" alt=""> | **Government Property Record Template Generator**<br>Create related property snapshot and transaction-history CSV templates, explore synthetic examples, and review selected CSV files locally.<br>[Download](https://github.com/courtney-chapman/tools-public/releases/tag/government-property-record-template-generator-v1.0.0) · [Guide](apps/government-property-record-template-generator/README.md) · [Sources](apps/government-property-record-template-generator/docs/sources.md) |
| <img src="docs/readme/icons/physical-inventory-count-sheet-generator.png" width="56" alt=""> | **Physical Inventory Count Sheet Generator**<br>Prepare standard or blind count sheets from a working property list, enter observations, and export results and discrepancies.<br>[Download](https://github.com/courtney-chapman/tools-public/releases/tag/physical-inventory-count-sheet-generator-v1.0.0) · [Guide](apps/physical-inventory-count-sheet-generator/README.md) · [Sources](apps/physical-inventory-count-sheet-generator/docs/sources.md) |
| <img src="docs/readme/icons/property-custody-receipt-generator.png" width="56" alt=""> | **Government Property Custody Receipt Generator**<br>Prepare printable property issuance receipts, property return receipts, and custody acknowledgments with multiple item lines.<br>[Download](https://github.com/courtney-chapman/tools-public/releases/tag/property-custody-receipt-generator-v1.0.0) · [Guide](apps/property-custody-receipt-generator/README.md) · [Sources](apps/property-custody-receipt-generator/docs/sources.md) |

## Plugins

### Procurement

| Icon | Plugin, description, and links |
| --- | --- |
| <img src="docs/readme/icons/procurement-market-research.png" width="56" alt=""> | **Procurement Market Research**<br>Supports federal-prime-contractor market research for commercial products and services, including supplier discovery, public pricing, procurement evidence, and vendor diligence.<br>[Instructions](plugins/procurement-market-research/skills/procurement-market-research/SKILL.md) |
| <img src="docs/readme/icons/far-compliant-commercial-item-determination.png" width="56" alt=""> | **FAR-Compliant Commercial Item Determination**<br>Evaluates products, software, SaaS, services, and mixed acquisitions for commercial product, commercial service, and COTS treatment under FAR 2.101 and produces buyer guidance or procurement-file-ready determinations.<br>[Instructions](plugins/far-compliant-commercial-item-determination/skills/far-compliant-commercial-item-determination/SKILL.md) |
| <img src="docs/readme/icons/far-compliant-non-competitive-source-justification.png" width="56" alt=""> | **FAR-Compliant Non-Competitive Source Justification**<br>Helps federal-prime-contractor Program Managers draft post-market-research sole-source and noncompetitive justifications, including alternate-supplier disqualification language and targeted fields for missing supporting details.<br>[Instructions](plugins/far-compliant-non-competitive-source-justification/skills/far-compliant-non-competitive-source-justification/SKILL.md) |
| <img src="docs/readme/icons/far-compliant-price-analysis-for-goods.png" width="56" alt=""> | **FAR-Compliant Price Analysis for Goods**<br>Drafts procurement-file-ready price analysis justifications for government-funded FFP goods, COTS, commercial products, software, materials, and routine buys using the buyer's supplied rules and evidence for competition, market pricing, and best value.<br>[Instructions](plugins/far-compliant-price-analysis-for-goods/skills/far-compliant-price-analysis-for-goods/SKILL.md) |
| <img src="docs/readme/icons/far-compliant-price-analysis-for-subcontracts-lite.png" width="56" alt=""> | **FAR-Compliant Price Analysis for Subcontracts (Lite)**<br>Drafts BID SUMMARY & PRICE ANALYSIS write-ups for new subcontract awards, option exercises, and modifications.<br>[Instructions](plugins/far-compliant-price-analysis-for-subcontracts-lite/skills/far-compliant-price-analysis-for-subcontracts-lite/SKILL.md) |
| <img src="docs/readme/icons/indirect-and-commercial-price-analysis-for-services-lite.png" width="56" alt=""> | **Commercial and Indirect Price Analysis (Lite)**<br>Drafts concise price analyses for a company's Commercial and Indirect purchases, including services, SaaS, software, consulting, equipment, and routine supplier buys.<br>[Instructions](plugins/indirect-and-commercial-price-analysis-for-services-lite/skills/indirect-and-commercial-price-analysis-for-services-lite/SKILL.md) |
| <img src="docs/readme/icons/software-saas-negotiation-strategy.png" width="56" alt=""> | **Software/SaaS Negotiation Strategy**<br>Guides federal procurement professionals through internal discovery, vendor questions, negotiation strategy, and optional practice for SaaS acquisitions under the Simplified Acquisition Threshold.<br>[Instructions](plugins/software-saas-negotiation-strategy/skills/software-saas-negotiation-strategy/SKILL.md) |

### Government property

| Icon | Plugin, description, and links |
| --- | --- |
| <img src="docs/readme/icons/government-property-ltdd-relief-letter-generator.png" width="56" alt=""> | **Government Property LTDD Relief Letter Generator**<br>Generates and validates audit-defensive Government Property LTDD relief packages while preserving the distinction between verified facts, interview statements, assumptions, and missing evidence.<br>[Instructions](plugins/government-property-ltdd-relief-letter-generator/skills/government-property-ltdd-relief-letter-generator/SKILL.md) |

## Licensing and security

Security concerns should follow the [security policy](SECURITY.md).

Original repository content is licensed under [CC BY-NC 4.0](LICENSE). The standalone browser apps have separate MIT licenses in their [app folders](apps/). Third-party material remains subject to its own terms.
