# Short demonstration walkthrough

1. Open `index.html` from a local extracted copy while offline. Read the contract-applicability notice and use the four numbered bookmarks across the top.
2. In **1 Choose**, select **Equipment Record** and **FAR baseline + applicable DFARS**. The footer identifies Revision 2; its public source details are in `docs/sources.md`.
3. In **2 Customize**, expand **Property snapshot columns** and **Transaction history columns**. Turn on `Posting Entry Date` to see its **Audit guidance** classification. Move it up once; turn it off again.
4. In **3 Download**, preview and download each **blank** and **example** CSV. The example snapshot has `Record ID` `GP-0001`; both example history rows use the same key. Expand or print the dictionary to see how the files relate.
5. In **4 Check CSV**, select the two synthetic files in `examples/` and run the check. See the zero-issue result, which explicitly says it is not a compliance verdict. Then try a CSV with a missing header or blank property name to see a review prompt. Clear the selected files and results.
6. Return to **2 Customize**, uncheck `Transaction Posting Reference` to see the potential-omission warning, then click **Restore defaults**. In **1 Choose**, select **Material Record** to see a different example with the same FAR categories.

No actual contract or property data is needed for this walkthrough.
