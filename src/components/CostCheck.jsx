import { useState } from 'react';
import { track } from '../scripts/track.js';
import { money, num } from '../lib/format.js';
import { FLOOR_USD } from '../lib/pricing.js';
import { DEFAULTS, costCheck, paybackText, stockShareText } from '../lib/cost-check.js';

/* ============================================================================
   CostCheck — the free instant check. This is the lead offer.

   WHAT IT IS. Two numbers in, one number back, in under a minute, with the
   arithmetic printed underneath it. No signup, no email, no gate of any kind.

   WHY IT IS SHAPED LIKE THIS, and every constraint below came from evidence
   rather than taste:

     • TWO REQUIRED FIELDS. Demo-booking completion peaks around four to six
       fields and collapses past that, and field count is really a proxy for
       whether each field looks JUSTIFIED. Two is the fewest that can produce a
       number worth reading.

     • ADVANCED BEHIND ONE DISCLOSURE, never two. Nielsen's progressive-
       disclosure rule is explicit that three or more levels destroys usability.
       One toggle, and everything behind it has a working default so the visitor
       never has to open it.

     • NO GATE BEFORE THE RESULT. 71% of the best-performing interactive demos
       are ungated, and a mid-flow form beats a form at the door by about 10%.
       The commerce lives INSIDE the answer here — the result names the tool
       that would watch this number, which is the thing being sold.

     • THE OUTPUT TEACHES. Not a bare figure: a breakdown, a comparison, and the
       sum written out in words. That is a trust move and a teaching move at
       once, and it is what separates this from a lead-capture gimmick.

   THE HONESTY CONTRACT, and it is not negotiable. Every figure is the visitor's
   OWN INPUT run through arithmetic stated on the page. Nothing is modelled,
   predicted, benchmarked, or compared against an industry average this site
   cannot show the working for. The page says so in as many words. A number a
   business owner cannot reproduce on the back of an envelope is a number that
   will be quietly distrusted, and it would sit badly beside a site whose whole
   argument is that its claims are checkable.
   ============================================================================ */

const inputCls =
  'w-full rounded-lg border border-line bg-canvas px-3.5 py-3 text-lg text-ink placeholder:text-ink-faint transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30';

/* DEFAULTS, the arithmetic and the payback rule all moved to
   src/lib/cost-check.js on 2026-08-26, so the home share card can draw the
   check's real numbers instead of carrying a second implementation of them —
   which is the class that left that card selling a retired offer for weeks
   (L-196). The reasoning behind each default, and behind measuring payback
   against the hours alone, travels with them. */

export default function CostCheck() {
  const [spend, setSpend] = useState('');
  const [hours, setHours] = useState('');
  const [adv, setAdv] = useState(DEFAULTS);
  const [showAdv, setShowAdv] = useState(false);
  const [result, setResult] = useState(null);
  const [touched, setTouched] = useState(false);
  const [started, setStarted] = useState(false);

  /* Fire once, on first interaction — not on page load. A visitor who scrolls
     past has not started anything, and counting them would inflate the only
     number this whole page exists to move. */
  const markStarted = () => {
    if (started) return;
    setStarted(true);
    track('check_start', {});
  };

  const run = (e) => {
    e.preventDefault();
    setTouched(true);
    const monthlySpend = num(spend);
    const weeklyHours = num(hours);
    if (monthlySpend <= 0 && weeklyHours <= 0) return;

    /* Every line is one multiplication a visitor can redo by hand. That is the
       point — see the honesty contract in src/lib/cost-check.js. */
    const r = costCheck({
      monthlySpend, weeklyHours,
      hourly: num(adv.hourlyValue) || DEFAULTS.hourlyValue,
      risePct: num(adv.priceRise),
      stockouts: num(adv.stockoutsPerMonth),
      stockoutCost: num(adv.stockoutCost) || DEFAULTS.stockoutCost,
    });
    setResult(r);

    /* Only the rounded magnitude leaves the browser, never the inputs. A
       visitor's monthly spend is their business, and the allowlist in track.js
       would drop it anyway — this is the belt to that pair of braces. */
    track('check_complete', { value: Math.round(total / 500) * 500 });
  };

  const reset = () => { setResult(null); setTouched(false); };

  if (result) return <Result r={result} onReset={reset} />;

  const invalid = touched && num(spend) <= 0 && num(hours) <= 0;

  return (
    <form onSubmit={run} className="panel p-6 sm:p-8" noValidate>
      <p className="mono-label">The free check · no signup · about a minute</p>
      <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        What is the paperwork actually costing you?
      </h2>
      <p className="mt-3 leading-relaxed text-ink-muted">
        Two numbers. I will show you the arithmetic, so you can check it yourself.
      </p>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-ink">
            What do you spend on stock and supplies in a normal month?
          </span>
          <input
            inputMode="numeric"
            value={spend}
            onFocus={markStarted}
            onChange={(e) => setSpend(e.target.value)}
            placeholder="$8,000"
            className={`mt-2 ${inputCls}`}
            aria-describedby="spend-help"
          />
          <span id="spend-help" className="mt-1.5 block text-xs text-ink-faint">
            A rough number is fine. Nothing is sent anywhere.
          </span>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ink">
            Hours a week on ordering, chasing and checking?
          </span>
          <input
            inputMode="numeric"
            value={hours}
            onFocus={markStarted}
            onChange={(e) => setHours(e.target.value)}
            placeholder="6"
            className={`mt-2 ${inputCls}`}
            aria-describedby="hours-help"
          />
          <span id="hours-help" className="mt-1.5 block text-xs text-ink-faint">
            Yours, or whoever actually does it.
          </span>
        </label>
      </div>

      {invalid && (
        <p className="mt-4 text-sm text-down">Put a number in one of those two and I can work it out.</p>
      )}

      {/* ONE disclosure, never two. Everything inside has a working default, so
          a visitor who ignores it still gets a real answer. */}
      <div className="mt-6 border-t border-line pt-5">
        <button
          type="button"
          onClick={() => { markStarted(); setShowAdv((v) => !v); }}
          className="text-sm font-medium text-cyan-deep"
          aria-expanded={showAdv}
        >
          {showAdv ? '− Fewer details' : '+ Add a few details (optional)'}
        </button>

        {showAdv && (
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Small
              label="An hour of that person's time is worth"
              value={adv.hourlyValue}
              onChange={(v) => setAdv({ ...adv, hourlyValue: v })}
              hint="What it costs you, not what you charge."
            />
            <Small
              label="Supplier prices are up this year by"
              value={adv.priceRise}
              onChange={(v) => setAdv({ ...adv, priceRise: v })}
              hint="A percentage. Leave at 0 if you are not sure — I will not guess for you."
            />
            <Small
              label="Times a month you are out of something you need"
              value={adv.stockoutsPerMonth}
              onChange={(v) => setAdv({ ...adv, stockoutsPerMonth: v })}
              hint="Leave at 0 if it does not happen."
            />
            <Small
              label="What one of those costs you"
              value={adv.stockoutCost}
              onChange={(v) => setAdv({ ...adv, stockoutCost: v })}
              hint="A lost sale, a rush order, an hour standing still."
            />
          </div>
        )}
      </div>

      <button type="submit" className="btn btn-primary mt-7 w-full justify-center sm:w-auto">
        Show me the number →
      </button>

      <p className="mt-4 text-xs leading-relaxed text-ink-faint">
        Nothing you type here is sent, stored, or emailed to anyone. The whole thing runs in your
        browser, and every figure is your own number multiplied out — no averages, no estimates,
        no industry benchmarks.
      </p>
    </form>
  );
}

function Small({ label, value, onChange, hint }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <input
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-2 ${inputCls}`}
      />
      <span className="mt-1.5 block text-xs text-ink-faint">{hint}</span>
    </label>
  );
}

function Result({ r, onReset }) {
  const lines = [
    r.weeklyHours > 0 && {
      k: 'The hours',
      v: r.timeCost,
      how: `${r.weeklyHours} hours a week × 52 weeks = ${r.hoursYear.toLocaleString()} hours a year, × ${money(r.hourly)} an hour`,
    },
    r.risePct > 0 && {
      k: 'The price rises',
      v: r.riseCost,
      how: `${money(r.monthlySpend)} a month × 12 = ${money(r.monthlySpend * 12)} a year, × ${r.risePct}%`,
    },
    r.stockouts > 0 && {
      k: 'Running out',
      v: r.stockoutCostYear,
      how: `${r.stockouts} times a month × 12 = ${r.stockouts * 12} a year, × ${money(r.stockoutCost)} each`,
    },
  ].filter(Boolean);

  /* THE COMPARISON IS AGAINST THE HOURS, NOT THE TOTAL — and that choice is the
     most important line in this file.

     The total legitimately includes what a supplier price rise costs and what
     running out costs. Neither is money software recovers: a tool does not make
     a supplier charge less, and it does not abolish stockouts. Dividing the
     price by the total therefore measured the offer against money it was never
     going to touch — on the first real test, $48,000 of a $115,000 figure.

     "A division, not a promise" does not rescue that. The disclaimer is about
     precision; the fault was about WHICH TWO NUMBERS were divided. A reader who
     spots it loses the honesty contract, and that contract is the product.

     The hours are the one line software unambiguously gives back. Comparing
     against them alone is slower, smaller and less flattering, and it is the
     only version this page can defend if somebody checks it. */
  /* Against THE HOURS ALONE, never the total, and both halves of that are
     asserted by npm run verify:check. The rule and its reasoning live in
     src/lib/cost-check.js so the share card cannot compute it differently. */
  const paybackLine = paybackText(r);
  /* null when there is nothing to divide — no spend given, or no hours given. */
  const shareText = stockShareText(r);

  return (
    <div className="panel p-6 sm:p-8" role="status" aria-live="polite">
      <p className="mono-label">Your number</p>
      <p className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
        {money(r.total)}
        <span className="ml-2 align-middle text-lg font-normal text-ink-muted">a year</span>
      </p>
      {/* NOT "what the ordering paperwork is costing you". On a result carrying a
          supplier price rise, most of the figure is not paperwork at all — it is
          inflation, which no amount of paperwork caused and no tool undoes.
          Calling the whole total paperwork was a claim this page cannot defend,
          and the honesty contract two paragraphs down is worth nothing if the
          headline sentence quietly breaks it. */}
      <p className="mt-3 max-w-xl leading-relaxed text-ink-muted">
        That is what those add up to over a year, using only the numbers you just typed.
      </p>

      <div className="mt-7 space-y-4 border-t border-line pt-6">
        {lines.map((l) => (
          <div key={l.k}>
            <div className="flex items-baseline justify-between gap-4">
              <span className="font-medium text-ink">{l.k}</span>
              <span className="font-display text-lg font-semibold text-ink">{money(l.v)}</span>
            </div>
            {/* THE ARITHMETIC, PRINTED. A number a business owner cannot redo on
                the back of an envelope is a number they will quietly distrust —
                and on a site whose whole argument is that its claims are
                checkable, an unshowable figure would be the loudest thing on
                the page. */}
            <p className="mt-1 text-sm text-ink-faint">{l.how}</p>
          </div>
        ))}
      </div>

      {/* THE STOCK SPEND, FINALLY DOING SOMETHING — added 2026-08-26.

          It is the first and largest thing this page asks for, and until today
          it fed exactly one calculation whose multiplier defaults to zero. So on
          the path almost everybody takes, a visitor typed their biggest number
          and it appeared NOWHERE in the answer. Measured live: $14,000 a month
          and 9 hours a week returned $11,700, which is 9 × 52 × $25 and nothing
          else. That does not read as restraint, it reads as a toy.

          RENDERED OUTSIDE THE MONEY ROWS ON PURPOSE. Those three sum to the
          total; this one does not. Put it in that list and a reader adds it in,
          which would overstate the figure — on a page whose entire argument is
          that its arithmetic is checkable, a number that does not add up is the
          loudest thing on it. Hence its own block, its own border, and a
          sentence saying in words that it is not part of the total.

          It is one division of two numbers the visitor typed. No benchmark, no
          average, no model — see src/lib/cost-check.js for why it divides the
          HOURS and never the total. */}
      {shareText && (
        <div className="mt-6 rounded-lg border border-line bg-surface/60 p-4">
          <div className="flex items-baseline justify-between gap-4">
            <span className="font-medium text-ink">Against the stock itself</span>
            <span className="font-display text-lg font-semibold text-ink">{shareText}</span>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-faint">
            {money(r.timeCost)} of hand-steering ÷ {money(r.monthlySpend * 12)} of stock a year —
            that is what the ordering costs you for every dollar of stock you move.{' '}
            <span className="text-ink-muted">Not part of the total above: it is the same money, said as a proportion.</span>
          </p>
        </div>
      )}

      {/* WHAT EACH LINE ACTUALLY MEANS, said before any comparison is drawn. The
          first version of this page let a reader assume software recovers all of
          it. It does not, and saying so plainly costs nothing — the hours alone
          are usually enough, and a visitor who has just been told what a tool
          will NOT do believes the rest of the page more, not less. */}
      {(r.risePct > 0 || r.stockouts > 0) && (
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-ink-muted">
          {r.risePct > 0 && (
            <>
              A tool will not make your suppliers charge less
              {r.stockouts > 0 ? ', and it will not abolish running out' : ''} — that money is on
              the list because it is what the year is costing you, not because software recovers it.
              What it changes is how fast you see it coming.{' '}
            </>
          )}
          {r.risePct === 0 && r.stockouts > 0 && (
            <>
              A tool will not abolish running out — it changes how early you know it is about to
              happen.{' '}
            </>
          )}
          The hours are the part it actually gives back.
        </p>
      )}

      {paybackLine !== null && (
        <div className="mt-5 rounded-xl border border-accent/30 bg-surface p-5">
          <p className="leading-relaxed text-ink">
            A build starts at <span className="font-semibold">{money(FLOOR_USD)}</span>. Against{' '}
            <span className="font-semibold">the hours alone</span> — {money(r.timeCost)} a year —
            that is <span className="font-semibold">{paybackLine}</span>.
          </p>
          <p className="mt-2 text-sm text-ink-muted">
            Deliberately the hours and not the total: the other lines are real money, but they are
            not money software recovers, so measuring an offer against them would be flattering
            rather than honest. This is still a division and not a promise — {money(FLOOR_USD)} ÷{' '}
            {money(r.timeCost)} a year. What a build actually changes depends on what gets built,
            which is what the first conversation is for. It is free.
          </p>
          {/* THE COMMERCE LIVES INSIDE THE ANSWER, which the header of this file
              has claimed since it was written — and until 2026-08-25 it did not,
              because there was no tool to name. The Reorder List watches exactly
              the number above: what is on hand against how fast it goes and how
              long the next lot takes. Worded as a place to look rather than a
              second call to action, because the free conversation is still the
              ask and this must not compete with it. */}
          <p className="mt-3 text-sm text-ink-muted">
            The hours in that figure are usually somebody counting stock and working out what to
            reorder.{' '}
            <a href="/work/reorder-list/" className="text-accent-2 underline underline-offset-2">
              This is the tool that watches that
            </a>
            {' '}— drive it now on made-up numbers, or drop your own stock export straight into it.
          </p>
        </div>
      )}

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <a href="/contact/?intent=consult" className="btn btn-primary">
          Talk it through — free →
        </a>
        <button type="button" onClick={onReset} className="btn btn-secondary">
          Change the numbers
        </button>
      </div>

      <p className="mt-5 text-xs leading-relaxed text-ink-faint">
        Nothing here was sent anywhere. No model, no forecast, no benchmark — every figure above is
        one of your own numbers multiplied out, and the working is printed beside each one.
      </p>
    </div>
  );
}
