/* ============================================================================
   COMPS PRACTICE MODEL — the cells the learner fills in for Step V valuation,
   their answers, and the built-in tutor's per-cell coaching.
   ========================================================================== */

const CFMT = {
  dollar0: v => (v < 0 ? '($' + Math.abs(v).toFixed(0) + ')' : '$' + v.toFixed(0)),
  dollar1: v => v.toFixed(1),
  mult: v => v.toFixed(1) + 'x',
  num: v => v.toLocaleString(),
};

const CINPUTS = {
  ltmEbitda: { as: 'num', fmt: 'num',  answer: 700,  step: 'metric' },
  ltmEbit:   { as: 'num', fmt: 'num',  answer: 500,  step: 'metric' },
  ltmSales:  { as: 'num', fmt: 'num',  answer: 3385, step: 'metric' },
  debt:      { as: 'num', fmt: 'num',  answer: 1500, step: 'bridge' },
  cash:      { as: 'num', fmt: 'num',  answer: 183,  step: 'bridge' },
  mEbitda:   { as: 'num', fmt: 'mult', answer: 7.3,  step: 'multiple' },
  mEbit:     { as: 'num', fmt: 'mult', answer: 9.9,  step: 'multiple' },
  mSales:    { as: 'num', fmt: 'mult', answer: 1.1,  step: 'multiple' },
  mLow:      { as: 'num', fmt: 'mult', answer: 6.0,  step: 'range' },
  mHigh:     { as: 'num', fmt: 'mult', answer: 9.0,  step: 'range' },
};

const CGUIDED_ORDER = ['ltmEbitda', 'ltmEbit', 'ltmSales', 'debt', 'cash',
  'mEbitda', 'mEbit', 'mSales', 'mLow', 'mHigh'];

function ctol(id) {
  const m = CINPUTS[id];
  if (m.fmt === 'mult') return 0.05;
  return 1.0;            // $m metrics
}

const CHINTS = {
  ltmEbitda: { title: "ValueCo LTM EBITDA", step: "The target's metrics", type: "Type  700",
    why: "Comps value the target off its own operating metrics. ValueCo's last-twelve-months <strong>EBITDA is $700m</strong> — the denominator the EV/EBITDA multiple will be applied to. EBITDA is the most-used base because it's capital-structure-neutral." },
  ltmEbit: { title: "ValueCo LTM EBIT", step: "The target's metrics", type: "Type  500",
    why: "<strong>EBIT $500m</strong> (EBITDA minus D&A). EV/EBIT is a useful cross-check because it captures differences in capital intensity that EBITDA ignores." },
  ltmSales: { title: "ValueCo LTM Sales", step: "The target's metrics", type: "Type  3385",
    why: "<strong>Sales $3,385m</strong>. EV/Sales matters most for companies with thin or negative profits; for a profitable industrial like ValueCo it's a secondary check." },
  debt: { title: "Total debt", step: "Enterprise → equity bridge", type: "Type  1500",
    why: "Multiples give <em>enterprise</em> value. To get to equity value we subtract net debt. ValueCo carries <strong>$1,500m</strong> of total debt." },
  cash: { title: "Cash & equivalents", step: "Enterprise → equity bridge", type: "Type  183",
    why: "Cash offsets debt. Net debt = $1,500m − <strong>$183m</strong> = $1,317m, which we subtract from implied EV to reach implied equity value." },
  mEbitda: { title: "Comp median EV/EBITDA", step: "Choose the benchmark multiples", type: "Type  7.3",
    why: "From the Output tab, the comparable companies trade at a <strong>median 7.3× LTM EV/EBITDA</strong>. Applying it: implied EV = 7.3 × $700m ≈ $5.1bn. This is the headline comps valuation." },
  mEbit: { title: "Comp median EV/EBIT", step: "Choose the benchmark multiples", type: "Type  9.9",
    why: "The comps' <strong>median EV/EBIT is 9.9×</strong>. Implied EV = 9.9 × $500m ≈ $4.95bn — a sanity check on the EBITDA-based figure." },
  mSales: { title: "Comp median EV/Sales", step: "Choose the benchmark multiples", type: "Type  1.1",
    why: "<strong>Median EV/Sales 1.1×</strong> → 1.1 × $3,385m ≈ $3.7bn. Sales multiples ignore profitability, so this typically reads lower and gets less weight." },
  mLow: { title: "EV/EBITDA — low end", step: "Build a valuation range", type: "Type  6.0",
    why: "A DCF or comps output is a <em>range</em>, not a point. The lowest comp EV/EBITDA is ~<strong>6.0×</strong> → $4.2bn EV — the bottom of ValueCo's implied range." },
  mHigh: { title: "EV/EBITDA — high end", step: "Build a valuation range", type: "Type  9.0",
    why: "The highest comp EV/EBITDA is ~<strong>9.0×</strong> → $6.3bn EV. So comps imply roughly <strong>$4.2bn–$6.3bn</strong>; note the DCF's $6.0bn sits near the top — consistent, but a reminder the DCF leans optimistic." },
};
