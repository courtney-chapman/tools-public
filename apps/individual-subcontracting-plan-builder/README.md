# Individual Subcontracting Plan Builder

A standalone browser app for preparing an individual small business subcontracting plan for review. It organizes contract and option-period values, projected subcontracting opportunities, goals, administration details, and assurances. It does not decide whether a plan is required, select contract clauses, verify supplier status, submit reports, or approve a plan.

## Use

Open `index.html` in a current browser. No account, installation, or network connection is required. The eight bookmarkable steps are Contract, Opportunities, Contract values, Goals, Administration, Assurances, Check, and Preview & export. Contract and Administration details open in focused dialogs.

Enter estimated contract values for the base and each option period. Enter projected large- and small-business subcontract dollars and socioeconomic goals for each period; category goals can overlap and are not added to the small-business total. Choose whether allocated indirect costs are included. Blank means unknown; enter zero only when the goal is actually zero. The app calculates both subcontract-dollar and contract-dollar percentages from the same entered goal dollars.

The preview offers a working plan with subcontract-dollar percentages and a submission plan with both percentage bases when the Contracting Officer requires the latter. It also offers two goals worksheets and a supplies/services worksheet. Draft output can contain `[INSERT]` prompts. The Check step flags missing entries, calculation errors, and matters for human review. A “Ready for review” label means only that these deterministic checks are clear. “Approval recorded by user” reflects an approval entered by the user; the app cannot verify it.

Use **Save progress (JSON)** to download your entries and **Open saved plan** to import them later. Nothing is saved automatically. Import validates the file and asks before replacing a populated plan. You can also copy the selected plan, print/save a PDF, export goals CSV, or copy an optional AI handoff. The AI action copies text only; it does not contact a provider. Review your organization's data-handling rules before sharing procurement information. For a PDF without browser-generated file paths and timestamps, disable **Headers and footers** in the print dialog.

## Rule basis and limits

The app's public reference points are [FAR 19.704](https://www.acquisition.gov/far/19.704) and [FAR 52.219-9](https://www.acquisition.gov/far/52.219-9), checked against FAC 2026-01 effective March 13, 2026, and [DFARS 252.219-7003](https://www.acquisition.gov/dfars/252.219-7003-small-business-subcontracting-plan-dod-contracts.), checked against DFARS Change May 7, 2026. FAR 52.219-9(d)(1) calls for contract-dollar percentages **in addition to** subcontract-dollar percentages when the Contracting Officer requires them. DFARS Basic, Alternate I, and Alternate II differ. The solicitation and adopted clause text govern an actual plan; users must confirm applicability and current versions.

The app does not establish the truth of entered estimates, the adequacy of goal methods, or compliance with contract-specific or agency-specific requirements. It does not perform post-award ISR/SSR reporting. Review all generated commitments and calculations before using the output.

## Data and privacy

Entries stay in browser memory until you download JSON, CSV, or a PDF. The app makes no automatic network requests. Downloaded files can contain procurement information; handle them in an authorized environment. The offline ZIP contains only `index.html`, this guide, and the MIT license.

Built by [Courtney](https://github.com/courtney-chapman/tools-public).
