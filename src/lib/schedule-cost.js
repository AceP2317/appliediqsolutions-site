/* ============================================================================
   SCHEDULE COST CHECK — the engine.

   What you have written on next week's schedule, costed at your own wage rates,
   against the sales you expect and the labour share you have decided you want.

   THREE THINGS THIS DELIBERATELY DOES NOT DO, and each is a line somebody would
   expect a tool like this to cross.

   It does not forecast sales. The expected figure is the owner's estimate, it
   starts blank, and the page says out loud that every answer below moves with
   it. A tool that guessed next week's takings from last week's would be selling
   a prediction dressed as arithmetic.

   It does not carry a labour-target benchmark. What share of sales your payroll
   should be is a decision about your own business, and a number lifted from an
   industry survey is somebody else's decision wearing yours.

   It does not compute anybody's take-home. Tips, taxes, overtime rules and tip
   credit are all real and all specific, and a figure this tool cannot show the
   working for is a figure it will not print.

   Money is integer cents. Hours are integer hundredths, so a seven-and-a-half
   hour shift is 750 and a hundred shifts do not drift.
   ============================================================================ */

export function computeSchedule(input) {
  const { expectedSales, targetPercent, shifts } = input;

  const rows = shifts.map((s) => ({
    ...s,
    /* hours are hundredths, rate is cents per hour, so the product is
       cents x 100 and has to come back down. Rounded once, at the end. */
    cost: Math.round((s.hours * s.rate) / 100),
  }));

  const totalHours = rows.reduce((a, r) => a + r.hours, 0);
  const totalCost = rows.reduce((a, r) => a + r.cost, 0);

  const roles = [...new Set(rows.map((r) => r.role))].sort();
  const byRole = roles.map((role) => {
    const of = rows.filter((r) => r.role === role);
    return {
      role,
      hours: of.reduce((a, r) => a + r.hours, 0),
      cost: of.reduce((a, r) => a + r.cost, 0),
      people: new Set(of.map((r) => r.name)).size,
    };
  });

  /* NULL, never zero, when there is nothing to divide by. A rendered 0% would
     tell an owner their payroll costs nothing. */
  const laborPercent =
    expectedSales != null && expectedSales > 0 && rows.length > 0
      ? (totalCost / expectedSales) * 100
      : null;

  const vsTarget =
    targetPercent != null && laborPercent != null ? laborPercent - targetPercent : null;

  /* What the schedule COULD cost and still hit the owner's own target, and the
     gap in plain money. Both derive from their two numbers and nothing else. */
  const budget =
    targetPercent != null && expectedSales != null && expectedSales > 0
      ? Math.round((expectedSales * targetPercent) / 100)
      : null;
  const overBy = budget != null ? totalCost - budget : null;

  const problems = [];
  if (expectedSales != null && expectedSales < 0) {
    problems.push('The sales you expect are a negative number, so every figure below blanks out. Put in what you actually expect to take.');
  }
  /* A SCHEDULE WITH NOBODY ON IT printed "0.0% of sales, under budget by
     $2,800". The null guard covered a zero denominator and not a zero numerator,
     and this file's own comment says a rendered 0% would tell an owner their
     payroll costs nothing. */
  if (rows.length === 0) {
    problems.push('There is nobody on the schedule, so the share below is zero because nothing is scheduled — not because the week is cheap.');
  }
  for (const r of rows.filter((x) => x.rate < 0 || x.hours < 0)) {
    problems.push(`${r.name} has a negative ${r.rate < 0 ? 'wage' : 'number of hours'} on them, which cannot be right.`);
  }
  if (expectedSales == null || expectedSales === 0) {
    problems.push(
      'No expected sales entered, so the share cannot be worked out. This is your estimate — the tool will not guess it for you.',
    );
  }
  for (const r of rows.filter((x) => x.rate === 0 && x.hours > 0)) {
    problems.push(
      `${r.name} is scheduled for ${(r.hours / 100).toFixed(2).replace(/\.00$/, '')} hours at no wage, so those hours cost nothing here. The total below is lower than the truth until that is filled in.`,
    );
  }
  for (const r of rows.filter((x) => x.hours === 0)) {
    problems.push(`${r.name} is on the schedule for no hours at all.`);
  }

  return {
    rows, byRole, totalHours, totalCost,
    expectedSales, targetPercent, laborPercent, vsTarget, budget, overBy,
    problems,
  };
}
