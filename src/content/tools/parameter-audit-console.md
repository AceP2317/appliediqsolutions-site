### MRP plans exactly as well as the settings nobody has looked at since go-live

Safety stock. Lot size. Rounding value. Lot-sizing procedure. Planning time fence.

Five fields per material per plant, across thousands of records. Each one was set by somebody, once,
often during an implementation, sometimes by copying a similar part.

Then the part changed. It moved from an overseas supplier to one two hours away, or the volume
tripled, or demand went from steady to lumpy. The settings did not move with it, because nothing
tells them to.

Nothing errors. MRP keeps planning, confidently, using a shape that stopped matching reality years
ago.

### The audit is against how the part is actually sourced, not against a fixed rule

Every material gets graded against a target derived from three things about it.

**Its sourcing tier.** A part coming from overseas needs a different buffer to one collected from a
supplier down the road. Same field, different right answer.

**Its value class.** Where it sits in the ABC split changes how much it is worth holding.

**Its demand variability.** Steady demand and lumpy demand want different lot-sizing procedures, and
running the steady rule on a lumpy part is a quiet, permanent cost.

Cross those three and you get a target for each setting. The finding is the distance from it.

### Findings are weighted by where the part sits in the structure

A wrong setting on a part used in one product is a small problem. The same wrong setting on a
component feeding thirty finished goods stops a plant.

The tool reads the bill of materials to weight each finding by how much depends on it, so criticality
comes from the structure rather than from anybody's opinion.

### It also folds in the health checks nobody schedules

Dead stock nothing has moved. Blocked stock still counted as available. Parts phasing in that nothing
has ordered yet, and parts phasing out that something still plans.

These are not parameter faults, but they are found in the same pass on the same data and they belong
on the same worklist.

### Every finding carries a dollar exposure, so the list sorts by money

Thousands of findings is a report nobody reads. The same findings ordered by what they are costing
is a week of work with a clear top.

That figure comes from your own values and your own quantities. It is arithmetic on the numbers in
front of it.

### What this page is

A working demo, not something on the price list.

It runs on **Northpoint Manufacturing**, an invented company with invented material master records
and invented values. No real parameter data is behind any of it.

It is in the gallery as evidence of the caliber behind the tools that *are* sold. Those are small,
narrow, and built for one local business.

### What it will not do

**It changes no setting.** Every finding is a recommendation. A parameter written back automatically
would move stock levels across a plant with nobody having agreed to it.

**It does not invent the targets.** The sourcing-tier and value-class targets are a policy your
business sets. The demo ships one so the tool has something to grade against; a real deployment
starts by agreeing yours, and that conversation is most of the value.

**It compares you to no outside data.** Everything it grades comes from your own records.

**A dollar exposure is an estimate of what a setting is holding, never a saving.** Fixing it does not
release that money; it stops it growing. Treating exposure as a saving is the fastest way to lose
trust in the whole list.
