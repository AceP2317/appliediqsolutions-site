### An open production order keeps buying material for work that will never happen

This is the part that surprises people who have not worked a planning floor.

A production order does not just sit there waiting. While it stays open it keeps telling MRP that it
needs the raw materials it was built to consume. That is dependent demand, and MRP treats it as
real.

So the components get ordered. They arrive. They get put away. And the order they were bought for is
six weeks past due and is never going to run.

Nobody made a purchasing mistake. The system did exactly what it was told by an order nobody
remembered to close, and the result is raw-material stock nobody chose to hold.

### Age alone does not rank them

Every past-due order is late. That tells you nothing about which one to deal with first.

The tool weights each by how much it is asking for and how long it has been asking. A large order a
month late is doing more damage than a small one late since spring, and a small order that has been
open for a year is a different kind of problem again.

The weighting gives each stale order a score, and the score is what sorts the list.

### Each one comes out with exactly one action

Not a flag. Not a severity. One of five things to do:

**Unfirm it** — a firmed planned order holding a date somebody set by hand and then forgot.

**Close it** — dead, and the demand it carries is entirely false.

**Verify a partial** — something ran, something did not, and the remainder is a question for the
floor rather than the planner.

**Reschedule it** — the work is still real and the date is a fiction. Give it an honest one.

**Leave it** — genuinely fine, and saying so out loud stops it being re-examined every month.

A worklist where every line has one verb is a worklist somebody finishes.

### The where-used view shows what each order is actually over-buying

Knowing an order is stale is half of it. The other half is which purchased components it is
inflating.

The tool reads the bill of materials backwards from the stale order, so each line names the bought
parts sitting in a rack because of it. That is what turns "close some old orders" into a number
somebody in finance recognizes.

### A snapshot diff separates the living from the dead

Some past-due orders are still confirming activity — material moving, operations closing. Those are
late but alive.

Comparing two snapshots tells them apart from the ones where nothing has happened for months. The
dead ones are the ones inflating stock, and they are the ones worth the attention.

### What this page is

A working demo, not something on the price list.

It runs on **Northpoint Manufacturing**, an invented company with invented part numbers and invented
order history. No real production data is behind any of it.

It sits in the gallery as evidence of what this practice can build. The tools actually sold are much
smaller and built for one local business at a time.

### What it will not do

**It closes nothing.** Every action is a recommendation for a person. An automated close on a
misread partial would destroy a real record.

**It sets no staleness threshold for you.** How late is too late depends on your production cycle,
and nothing in this data knows it.

**It does not value your inventory.** It names the components an order is over-ordering. Attaching
money to that is your own costing, done in your own system.

**It reads a snapshot, never a live system.** The demo runs entirely in your browser on fixed data.
