### A quantity on a bill of materials only means something next to its parent

This is the thing that catches everybody, and it is why the question "how many of these do we
actually need" is harder than it sounds.

A component sits under an assembly and carries a quantity of four. That four means four per one of
*that assembly*, not four per finished unit. If the assembly goes in twice, it is eight. If that
assembly sits under another one that goes in three times, it is twenty-four.

Read the number off the screen and you will be wrong by whatever the chain above it multiplies to.

### The true per-unit quantity is the tool's whole point

For any component, the tool walks every path from that component up to the finished good,
multiplies the quantity at each step, and adds the paths together.

The adding matters as much as the multiplying. The same fastener can appear in four places under one
finished product — different assemblies, different depths, different quantities — and the real
answer is the sum of all four, not the biggest or the first one found.

**It is kept separate by site.** The same part can carry different quantities at different plants,
because the products built there are not the same. Rolling those together would produce one number
that is correct nowhere.

### Where-used runs the tree backwards

Start from a component and ask which finished goods depend on it, and by which route.

That is the question asked whenever a supplier has a problem, a part goes obsolete, or a change is
proposed. The answer is rarely one product and it is almost never obvious, because the paths run
through assemblies nobody thinks about — including phantoms, which exist in the structure and never
exist as a physical thing.

### Search that hits any field, not just the part number

Material, level, procurement type, planner, quantity range. Field-qualified rather than one search
box guessing at intent.

The reason is practical. "Show me every purchased component below level three under this product"
is a real question somebody asks before a change goes in, and it cannot be expressed by typing a
part number.

### What this page is

A working demo, not something for sale.

It runs on **Northpoint Manufacturing**, an invented company with invented products, invented part
numbers and an invented structure. No real bill of materials is behind any of it.

It is here as evidence of the work behind the tools that *are* sold, which are much smaller and
built for one local business at a time.

### What it will not do

**It changes nothing.** Read-only, by design. A structure edit belongs in the system of record with
the change control that surrounds it.

**It does not price anything.** The tool gives you quantity per unit. Multiplying that by a cost is
a costing exercise in the system that owns the costs.

**It cannot tell you whether a structure is right.** It reports the structure as maintained. A part
that is in the wrong place will be reported accurately as being in the wrong place.

**It does not reach a live system.** The demo runs on a fixed export in your browser. A real
deployment reads an extract on whatever schedule you set.
