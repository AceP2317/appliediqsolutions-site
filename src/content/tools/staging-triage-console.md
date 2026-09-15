### A count can foot to the right total and be wrong underneath

Two bins are miscounted. One is over by forty, the other is under by forty. The grand total is
perfect.

Reconciliation passes. The variance report is clean. Nothing anywhere flags it, and both bins stay
wrong until somebody goes looking for stock that the system says is in the wrong place.

This is the failure a total-only count is structurally unable to see, and it is common precisely
because it looks like success.

### The check happens at the bin, never at the total

The tool reconciles each location against itself rather than rolling everything up first.

That is the whole design decision. Once you sum, offsetting errors are gone forever — there is no
later step that can recover them, because the information was destroyed by the addition.

### Three things it looks for

**Quantities that cannot be real.** A negative on hand. A count that exceeds what the location can
physically hold. These are not variances to investigate, they are data faults, and treating them as
variances sends somebody to look at a shelf for no reason.

**Errors that cancel.** Two or more bins whose variances net close to zero across the same material.
Individually each looks like an ordinary miscount; together they look like nothing at all, which is
why they survive.

**Stock staged line-side and never counted back.** Material pulled to the line, not consumed, and
not returned to a counted location. Physically present, systemically missing, and it turns up as a
shortage on something else entirely.

### Every exception goes to a person

Accept it, reject it, or defer it. Three buttons and a reason.

Nothing is adjusted automatically. An inventory correction made by a tool on a misread count is
worse than the miscount, because the miscount leaves evidence and the correction erases it.

### What this page is

A working demo, not something on the price list.

It runs on **Northpoint Manufacturing**, an invented company with invented bins, invented materials
and invented count data. No real inventory is behind any of it.

It is in the gallery as evidence of the caliber behind the tools that *are* sold. Those are much
smaller, built for one local business, and they do one job each.

### What it will not do

**It adjusts nothing.** Every finding is handed to a reviewer. The tool has no write path and a real
deployment would not be given one without a signed-off approval step in front of it.

**It sets no tolerance.** How much variance is acceptable in a bin is a decision about your business
and your material value, and nothing here will pick a number for you.

**It cannot tell a miscount from a theft.** It reports that two records disagree. Which one is wrong,
and why, is a question for the floor.

**It does not know what was consumed.** Line-side stock that was genuinely used and not booked looks
identical to line-side stock sitting untouched. The tool surfaces both and says so rather than
choosing.

**Nothing leaves the page.** The demo reads a fixed snapshot in your browser.
