# Behind the Buy: The Competition Question

**Preference isn't proof.**

A short, narrated animation series about competition in government contractor purchasing. Each scenario starts with a purchase request that names a supplier, then follows the facts: the market is explored, the claims that came with the request are tested against evidence, and the sourcing picture changes as each fact lands. It shows why a preferred supplier isn't necessarily the only source, why one product can have many sellers, why three quotations aren't automatically competition, and why a justified source still needs its own support for the price. Every state and count on screen is calculated from the scenario, not drawn by hand.

It is an educational illustration, not a source justification, supplier selection, price reasonableness or procurement approval tool. It doesn't decide which rules apply, make regulatory exception or supplier responsibility determinations, or describe any company's procedures. All suppliers, products, facts and amounts are fictional. Actual requirements depend on the prime contract, applicable regulations and company procedures.

## Watch it

Open `index.html` in a current browser. It is one self-contained file that runs offline, with no server, account, fonts, analytics or network connection.

1. Choose one of the four scenarios. Each runs between one and two minutes and is narrated.
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
| The Preferred Supplier | `preferred-supplier` | The Requestor wants Supplier A and says nobody else can do it. Market research finds four sources that meet the requirement, so the claim is contradicted and competition remains possible. |
| One Manufacturer, Many Sources | `one-manufacturer` | Only one manufacturer makes the required model, and it doesn't sell direct. An authorization letter shows Supplier A is authorized, not that it's the only one: three authorized distributors can supply it. One product, several purchasing channels. |
| Three Quotes, Three Requirements | `three-quotes` | Five suppliers are asked to quote; four respond and three send quotations. Opened up, the quotations cover different quantities, support and validity. Only one covers the requirement as written, so the others need clarification before prices can be compared. |
| The Only Source, The Unsupported Price | `only-source` | Qualification records substantiate a process requirement, and research supports one qualified source. Then three decisions stay separate: the reasons for limiting competition and for choosing the supplier are supported, but the price rests on a quote and a discount, with no price analysis yet. Management review and conditional consent follow; neither establishes the price. |

## How the states work

The built-in sourcing engine is deterministic. A scenario's facts arrive in steps, and the engine evaluates the market after each one, so every running count comes from the same calculation.

- **Requirements:** mandatory requirements filter the market. A preference never does. An asserted restriction filters only once evidence substantiates it.
- **Suppliers:** each is a potential source until investigated, then meets the requirement, needs clarification, doesn't meet it (with the reason), or is restricted by an applicable condition such as a direct-sale restriction. An uninvestigated source is never counted as excluded.
- **Claims** made with the request start as assertions. Evidence can support them, contradict them, or call for further review when it's present but doesn't settle the claim (an authorization letter shows a supplier is authorized, not that it's the only one). "Nobody else can do it" is tested against the market itself.
- **Quotations:** suppliers asked to quote, responses, quotations received and comparable quotations are counted separately; one never stands in for another. "Comparable" stays unknown until every quotation has been checked.
- **Three decisions:** the competition approach, supplier selection and price reasonableness each have their own evidence. One path's support never carries over to another, and management review or consent changes none of them.
- **Results** are illustrative: competitive sourcing, brand-specific competition, a proposed sole source, or insufficient information. They're never an approval or a recommendation, and open questions stay open.

## Public references

The scenarios' regulatory statements were checked against the public Federal Acquisition Regulation (FAR) and Defense Federal Acquisition Regulation Supplement (DFARS), available at [acquisition.gov](https://www.acquisition.gov/). The FAR is being rewritten, so section numbers may change; these were current in November 2026.

| Topic | References |
| --- | --- |
| Selecting subcontractors on a competitive basis to the maximum practical extent, where the clause is included | FAR 52.244-5; FAR 44.204(c) (44.201-5 in the rewritten text) |
| Purchasing system criteria: competitive sourcing, evaluating competing vendors, management-level justification and adequate cost or price analysis for sole- or single-source awards, and documentation supporting the vendor selected and price paid | DFARS 252.244-7001(c) |
| Market research and the degree of price competition in a purchasing system review | FAR 44.303 |
| Consent to subcontract applies only to the subcontracts the clause covers; consent and purchasing system approval don't determine the acceptability of subcontract terms or price | FAR 52.244-2(c), (d) and (f); FAR 44.201-1 and 44.201-4 in the rewritten text |
| Consent considerations, including whether adequate price competition was obtained or its absence properly justified, and whether adequate cost or price analysis was performed | FAR 44.202-2(a) |
| Adequate price competition rests on offers that satisfy the same requirement | FAR 15.403-1(c)(1) |
| Price analysis techniques, including historical prices and comparison with published price lists and discount arrangements | FAR 15.404-1(b)(2) |
| The prime contractor's cost or price analysis of subcontract prices | FAR 15.404-3(b) (15.404-8 in the rewritten text) |

Sole source, single source, brand-specific competition and the other approaches shown are practical purchasing terms, not FAR classifications; contractor procedures and contracts may define them differently. FAR Part 6 justification and approval rules govern Government acquisitions, not a prime contractor's subcontracts, and the scenarios don't apply them. Management review is shown generically, with no approval levels or thresholds. The procurement file is a logical collection of records, and not every record shown is required in every purchase.

## Design and accessibility

- Uses a light color palette and type style shared with the rest of *Behind the Buy*.
- The preferred supplier keeps a dark outline and a **★ Preferred** tag throughout.
- Every state is shown with words, a symbol and a line or border style, never by color alone: **✓** meets the requirement, **!** needs clarification, **?** is a potential source not yet investigated, **✕** doesn't meet the requirement, **⊘** is restricted by an applicable condition, and **≠** marks a quotation term that differs from the requirement. Outcomes are never shown in green, so an illustrative result never looks approved.
- Buttons and cards work from the keyboard, with a visible focus outline.
- Designed for 16:9 landscape. On a phone it is readable in landscape.

## License

Behind the Buy: The Competition Question is published under the [PolyForm Noncommercial License 1.0.0](LICENSE).

## Limits

- Illustrative only. Not legal, accounting, regulatory or audit advice, and not a source justification, supplier responsibility determination, price reasonableness determination or approval.
- The scenarios are simplified. Real sourcing decisions can turn on facts, contract terms and procedures the scenarios leave out.
- All suppliers, products, identifiers, facts and amounts are fictional.

---

Built by Courtney · [More tools on GitHub](https://courtney-chapman.github.io/tools-public/)
