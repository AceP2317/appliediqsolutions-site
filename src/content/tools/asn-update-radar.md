### A hundred inbound updates land and three of them change what you can do

Advance ship notices arrive all day. New arrival dates, vessel changes, container re-routes, customs
holds, carrier swaps.

Read end to end they take a morning. Read properly they contain a handful of things that alter this
week's plan, and the rest is the supply chain talking to itself.

The problem is not that the updates are wrong. It is that they arrive with no ranking, so the
shipment that just slipped past your build date reads exactly like the one that moved by a day
inside its own buffer.

### One shipment can carry several dates, and they disagree

This is the part that makes the tool worth building rather than filtering by hand.

A single open shipment accumulates dates from different places: what the supplier promised, what the
carrier now says, what the vessel schedule implies, what customs has done to it. They rarely agree,
and the newest is not automatically the truest.

The tool picks the firmest one — the date with the most behind it — and works from that. Every
downstream decision rests on that choice, so the rule for making it is the tool's core rather than a
detail.

### Then each shipment gets one action

**Verify the receipt** — it says it landed, and the system should show it.

**Chase logistics** — the date moved and somebody needs to be asked why.

**Reschedule** — the new date is real, and the plan behind it has to move.

**Drop it** — no longer relevant, and it should stop appearing tomorrow.

Four verbs. A receiving desk works the list top to bottom instead of re-reading an inbox.

### Moves that hit many lines come first

A delayed vessel is not one update. It is every line on that vessel, arriving separately, looking
like fifty unrelated problems.

The tool groups them and puts the root event at the top. One decision then covers fifty lines, which
is the difference between an hour of work and a morning of it.

### What this page is

A working demo, not something for sale.

It runs on **Northpoint Manufacturing**, an invented company with invented shipments, invented
vessels and an invented inbound port. No real carrier data is behind any of it.

It is in the gallery as evidence of the work behind the smaller tools that *are* sold — those are
built for one local business and do one narrow job.

### What it will not do

**It does not guess an arrival date.** It chooses between dates the shipment already carries and
shows you which one it took and why. It never produces a date that was not in the data.

**It sets no lateness threshold.** How much slip matters depends on your buffer and your build
schedule.

**It does not talk to a carrier.** No tracking calls, no lookups, nothing leaving the page. The demo
runs on a fixed snapshot in your browser.

**It cannot tell you whether a promise will hold.** It reports what the shipment says today. A
supplier who has moved a date three times will probably move it again, and that judgment is yours
rather than the tool's.
