# Behind the Buy: The Butterfly Effect

**One change. Every ripple.**

A short, narrated animation series about government contractor purchasing. Each scenario starts with a plan, introduces one change, and shows it rippling through the purchase: finished steps reopen, hidden suppliers appear, payment windows shrink, billing slips a cycle and cash is tied up longer. Every date and amount on screen is calculated from the scenario, not drawn by hand.

It is an educational illustration, not a procurement, accounting or forecasting tool. Durations, dates and amounts are illustrative examples, not benchmarks. Actual requirements depend on the prime contract, the subcontract, applicable regulations and company procedures.

## Watch it

Open `index.html` in a current browser. It is one self-contained file that runs offline, with no server, account, fonts, analytics or network connection.

1. Choose one of the four scenarios. Each is about a minute long and narrated.
2. Use **Pause**, **Replay**, **Mute** or **All scenarios** below the animation. The space bar also pauses and resumes.

| Address option | What it does |
| --- | --- |
| `?s=<scenario id>` | Plays one scenario directly, for linking. |
| `?present` | Hides the buttons and footer for screen recording, and waits for one click so the picture and the voice start together. |
| `?t=<seconds>` | Freezes the animation at that moment, for checking a frame. |

Browsers only play sound after a click. Choosing a card counts as that click. If a scenario is opened directly from a link, a **Turn on sound** button appears instead. If the computer is set to reduce motion, the animation opens on its finished frame, and Replay plays it.

## The four scenarios

| Scenario | ID | What changes | What it shows |
| --- | --- | --- | --- |
| The Moving Target | `moving-target` | The specification changes after proposals arrive. | Four finished steps reopen. Award and delivery slip 12 days, but schedule float absorbs it. Collection doesn't move. |
| The Hidden Supply Chain | `hidden-supply-chain` | The supplier is a reseller; its price and lead time come from an OEM. | Hidden steps appear. Delivery slips 20 days, more than the float, so the program moves 5 days. Collection moves 30. |
| The Net Terms Illusion | `net-terms-illusion` | The supplier's invoice waits four weeks for approval. | Net 30 from invoice receipt already meant 45 days from delivery, on time. The stalled approval makes payment 11 days late. |
| The Missed Billing Cycle | `missed-billing-cycle` | Posting is held for a missing charge number. | Posting misses the monthly billing cutoff by one day. The supplier is still paid on time, but collection moves 30 days and funding exposure runs 15 → 45 days. |

## How the numbers work

For each scenario, the animation calculates a **planned** schedule (without the change) and a **projected** one (with it):
- Steps wait only for the steps they depend on, so parallel work isn't added up.
- Circular dependencies are refused.
- Reopened steps are added as revisions; the original steps stay as history.
- Delayed steps simply take longer.
- **Float** is the gap between when the program needs the item and when it's accepted.
- **The payment clock** starts at the trigger the scenario's terms name, here invoice receipt. Internal approval and posting don't restart it. Payment is due at trigger + terms and is late if processing finishes after that.
- **Customer billing** happens on the next cycle cutoff after posting.
- **Cash position** is illustrative: the supplier payment is an outflow and the customer collection an inflow. Peak exposure and the days spent negative come from those two dates. It is not a company-wide or forecast measure.

A step's effect can be **rework** (steps reopen), **delays** (steps take longer, with optional hidden steps revealed), a **payment clock**, or a **cash position** view. Each animation beat waits for its narration.

## Public references

The billing and payment assumptions were checked against the public Federal Acquisition Regulation (FAR), available at [acquisition.gov](https://www.acquisition.gov/). The FAR is being rewritten, so section numbers may change; these were current in November 2026.

| Topic | References |
| --- | --- |
| Billing a recorded subcontract cost under a cost-reimbursement contract before paying the subcontractor, and its conditions | FAR 52.216-7(b)(1)(ii)(A) |
| Interim payments under cost-reimbursement contracts: billing frequency, payment timing and Prompt Payment Act interest | FAR 52.216-7(a) |
| Prompt payment for Government payments to contractors, for context | FAR Subpart 32.9; FAR 52.232-25 |

Subcontract payment terms, such as Net 30 from invoice receipt, are contractual. The scenarios state them as assumptions of the illustrated subcontract, not as rules.

## Design and accessibility

- Uses a light color palette and type style shared with *Behind the Buy*.
- Who acts, each step's state and every change are shown with words and shapes, never by color alone.
- Buttons and cards work from the keyboard, with a visible focus outline.
- Designed for 16:9 landscape. On a phone it is readable in landscape.

## License

Behind the Buy: The Butterfly Effect is published under the [PolyForm Noncommercial License 1.0.0](LICENSE).

## Limits

- Illustrative only. Not legal, accounting, regulatory or audit advice, and not a forecast.
- The sequences are simplified. Real purchases can overlap steps differently, and other people can do some of the actions shown.
- All scenarios, names, identifiers and amounts are fictional.

---

Built by Courtney · [More tools on GitHub](https://courtney-chapman.github.io/tools-public/)
