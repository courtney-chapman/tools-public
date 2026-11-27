# Behind the Buy: The True Cost of a Supplier

**The price is only the start.**

A short, narrated animation series about comparing supplier quotations in government contractor purchasing. Each scenario puts three quotations against the same requirement, then reveals what each one actually covers: scope left out, a cost nobody has priced, an exception to a required contract clause. Every total and rank on screen is calculated from the scenario, not drawn by hand.

It is an educational illustration, not a supplier selection, price reasonableness or procurement approval tool. Suppliers, prices and amounts are illustrative examples, not benchmarks. Actual requirements depend on the prime contract, the subcontract, applicable regulations and company procedures.

## Watch it

Open `index.html` in a current browser. It is one self-contained file that runs offline, with no server, account, fonts, analytics or network connection.

1. Choose one of the four scenarios. Each is a little over a minute long and narrated.
2. Use **Pause**, **Replay**, **Mute** or **All scenarios** below the animation. The space bar also pauses and resumes.

| Address option | What it does |
| --- | --- |
| `?s=<scenario id>` | Plays one scenario directly, for linking. |
| `?present` | Hides the buttons and footer for screen recording, and waits for one click so the picture and the voice start together. |
| `?t=<seconds>` | Freezes the animation at that moment, for checking a frame. |

Browsers only play sound after a click. Choosing a card counts as that click. If a scenario is opened directly from a link, a **Turn on sound** button appears instead. If the computer is set to reduce motion, the animation opens on its finished frame, and Replay plays it.

## The four scenarios

| Scenario | ID | What it shows |
| --- | --- | --- |
| The Lowest Price Illusion | `lowest-price-illusion` | Supplier A quotes lowest but leaves out delivery, network setup and docking kits. With those added, it has the highest evaluated cost, and the ranking flips. |
| The Incomplete Quote | `incomplete-quote` | The three quotations cover different scopes. Supplier A gives no price for installation, so its cost is unknown, not zero, and the three can't be ranked until it's clarified. |
| The Contractual Exception | `contractual-exception` | Supplier A still has the lowest evaluated cost, but takes exception to a clause the prime contract requires to flow down. Price can't offset that; it has to be resolved before the order is issued. |
| The Lowest Price Wins | `lowest-price-wins` | Supplier A's quotation covers the full requirement and accepts the terms. Here, the lowest price holds up, and the comparison shows why. |

## How the numbers work

Each scenario has one common requirement, the same for all three suppliers, and three quotations. For each requirement item a quotation is one of:

- **Included:** the quoted price already covers it.
- **Not quoted, with a supported cost:** the cost is added beside the quoted price. It's marked confirmed (from the supplier) or an estimate. A label can say why, such as "Optional" or "1 of 3 years."
- **Unknown:** no price yet. It's never treated as zero. That supplier shows a known subtotal marked incomplete.

The rules:
- The quoted price is never changed. **Evaluated cost** = quoted price + supported additions.
- Included items add nothing, so nothing is counted twice.
- Until every item is revealed and priced for every supplier, there is no evaluated ranking.
- **Contract terms** (warranty, payment terms, required clauses) are gates, kept apart from cost. An exception never adds a dollar amount, and a lower price never clears it. An exception to a term the buyer can't waive must be resolved; one to a waivable term goes to review. Neither is an automatic rejection or a legal conclusion.
- The lowest evaluated cost is never labeled the selected supplier.

## Public references

The scenarios' regulatory statements were checked against the public Federal Acquisition Regulation (FAR) and Defense Federal Acquisition Regulation Supplement (DFARS), available at [acquisition.gov](https://www.acquisition.gov/). The FAR is being rewritten, so section numbers may change; these were current in November 2026.

| Topic | References |
| --- | --- |
| Price analysis and its techniques, including comparison of the prices received; it is how a fair and reasonable price is determined, which a side-by-side comparison alone is not | FAR 15.404-1 |
| Offers must satisfy the same requirement for a price to be based on adequate price competition | FAR 15.403-1(c)(1) |
| Adjusting a price comparison for materially different terms and quantities | FAR 15.404-1(b)(2) |
| Subcontract pricing considerations for prime contractors | FAR 15.404-3 (15.404-8 in the rewritten text) |
| Competition in subcontracting | FAR 52.244-5 |
| Clauses that flow down to subcontracts for commercial products and services | FAR 44.402, 52.244-6; DFARS 252.244-7000 |
| Purchasing system review, and the requirement that orders contain the mandatory flowdown clauses | FAR 44.301; DFARS 252.244-7001(c) |

Supplier evaluation by a prime contractor is not a Government source selection; the scenarios don't apply FAR Part 15 source-selection procedures to it. Warranty and payment terms are contractual; the scenarios state them as assumptions, not rules.

## Design and accessibility

- Uses a light color palette and type style shared with the rest of *Behind the Buy*.
- Each supplier keeps one letter and color throughout. Every state is shown with words and shapes, never by color alone: solid cards are included, dashed outlines are not quoted, dotted outlines and a **?** are unknown.
- Buttons and cards work from the keyboard, with a visible focus outline.
- Designed for 16:9 landscape. On a phone it is readable in landscape.

## License

Behind the Buy: The True Cost of a Supplier is published under the [PolyForm Noncommercial License 1.0.0](LICENSE).

## Limits

- Illustrative only. Not legal, accounting, regulatory or audit advice, and not a price reasonableness determination, supplier responsibility determination or award.
- The comparisons are simplified. Real evaluations can weigh technical, schedule, past performance and other factors the scenarios leave out.
- All suppliers, requirements and amounts are fictional.

---

Built by Courtney · [More tools on GitHub](https://courtney-chapman.github.io/tools-public/)
