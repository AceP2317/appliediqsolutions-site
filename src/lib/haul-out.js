/* ============================================================================
   STORM HAUL-OUT PLAN — the engine.

   A named storm is coming and a yard has to get boats out of the water. Two
   things run out: the clock and the ground. This counts both, in the yard's own
   numbers, and says which boats do not make it.

   IT PREDICTS NOTHING ABOUT THE STORM. Not the track, not the surge, not the
   timing. The hours remaining is a figure the yard types in from whatever they
   are watching, and every answer here moves with it. A tool that forecast a
   storm would be the single most dangerous thing on this shelf.

   IT ALSO DOES NOT DECIDE. It counts lifts against a clock and footprints
   against a yard, in the order the yard put the boats in. Which boat goes first
   is a decision about contracts, relationships and judgement, and no arithmetic
   owns it. The page says so in those words.

   Lengths and beams are integer tenths of a foot. Area is whole square feet.
   Time is whole minutes.
   ============================================================================ */

export function computeHaulOut(input) {
  const { minutesLeft, cycleMinutes, lifts, yardSqFt, padFt, boats } = input;

  /* How many hulls can physically come out before the yard stops lifting. One
     machine doing one boat per cycle; two machines double it. Floor, never
     round — half a lift is a boat still in the water. */
  const cyclesPerLift = cycleMinutes > 0 ? Math.floor(minutesLeft / cycleMinutes) : 0;
  const liftCapacity = cyclesPerLift * lifts;

  /* Footprint is the hull plus the blocking and walking room around it, which
     is the number that actually fills a yard. A yard that plans on hull
     dimensions runs out of ground before it runs out of list. */
  const rows = boats.map((b) => {
    const w = (b.lengthFt + padFt * 10) / 10;
    const h = (b.beamFt + padFt * 10) / 10;
    return { ...b, footprint: Math.round(w * h) };
  });

  let usedLifts = 0;
  let usedSqFt = 0;
  const planned = rows.map((b) => {
    const timeOk = usedLifts < liftCapacity;
    const spaceOk = usedSqFt + b.footprint <= yardSqFt;
    if (timeOk && spaceOk) {
      usedLifts += 1;
      usedSqFt += b.footprint;
      return { ...b, hauled: true, reason: null, lift: usedLifts };
    }
    return {
      ...b,
      hauled: false,
      /* WHICH constraint stopped it, named separately, because they have
         different answers. Out of time means another machine or an earlier
         start; out of ground means somewhere else to put it. */
      reason: !timeOk && !spaceOk ? 'both' : (!timeOk ? 'time' : 'space'),
      lift: null,
    };
  });

  const hauled = planned.filter((b) => b.hauled);
  const staying = planned.filter((b) => !b.hauled);

  /* CEILING, and guarded. This divided without rounding, so three boats on two
     machines at 40 minutes reported 60 minutes needed while the plan underneath
     said one boat stays — two numbers in one render disagreeing, with the
     optimistic one as the headline. It also divided by zero when the machine
     count was zero, printing "Infinity hrs to do them all" beside a problem
     saying nothing comes out. */
  const minutesNeeded = lifts > 0
    ? Math.ceil(rows.length / lifts) * cycleMinutes
    : null;
  const sqFtNeeded = rows.reduce((a, b) => a + b.footprint, 0);

  const problems = [];
  if (cycleMinutes <= 0) problems.push('A lift cycle of no time at all means the plan below is meaningless. Put in how long one boat actually takes.');
  if (lifts <= 0) problems.push('No machines means nothing comes out. Put in how many you can actually run.');
  if (minutesLeft < 0) problems.push('The minutes left are negative, so nothing below means anything. Put in how long you actually have.');
  /* THE THREE REASONS ARE COUNTED SEPARATELY AND THEY SUM TO THE BOATS LEFT IN.
     An earlier version counted "ran out of clock" as time-or-both and "ran out
     of ground" as space-or-both, so a boat short of both was counted twice and
     six boats staying read as nine. A yard reading that at four in the morning
     would go looking for a boat that does not exist. */
  const onlyTime = staying.filter((b) => b.reason === 'time').length;
  const onlySpace = staying.filter((b) => b.reason === 'space').length;
  const bothOut = staying.filter((b) => b.reason === 'both').length;
  if (onlyTime > 0) problems.push(`${onlyTime} ${onlyTime === 1 ? 'boat has' : 'boats have'} ground to sit on but no clock left to lift ${onlyTime === 1 ? 'it' : 'them'}.`);
  if (onlySpace > 0) problems.push(`${onlySpace} ${onlySpace === 1 ? 'boat has' : 'boats have'} clock left but nowhere to be blocked.`);
  if (bothOut > 0) problems.push(`${bothOut} ${bothOut === 1 ? 'boat is' : 'boats are'} short of both the clock and the ground.`);

  return {
    planned, hauled, staying,
    liftCapacity, cyclesPerLift, usedLifts, usedSqFt,
    yardSqFt, sqFtNeeded, minutesLeft, minutesNeeded,
    /* The two headline shortfalls, in the units a yard argues in. */
    liftsShort: Math.max(0, rows.length - liftCapacity),
    sqFtShort: Math.max(0, sqFtNeeded - yardSqFt),
    problems,
  };
}
