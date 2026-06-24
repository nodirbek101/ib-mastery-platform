/* ============================================================================
   COMPARABLE COMPANIES ENGINE  —  Step V "Determine Valuation"
   Applies the comparable companies' trading multiples to ValueCo's own metrics
   to derive an implied valuation range, then bridges enterprise → equity value.

   ValueCo (the target) LTM metrics come straight from the Rosenbaum comps file
   (VLCO tab): LTM Sales 3,385 · LTM EBITDA 700 · LTM EBIT 500 · Debt 1,500 · Cash 183.
   The benchmark multiples are the comps' OVERALL figures from the Output tab:
       EV/EBITDA  mean 7.33x · median 7.35x · low 5.97x · high 9.00x
       EV/EBIT    median 9.89x      EV/Sales median 1.13x      P/E median 13.1x
   All figures $ in millions. The implied EV/EBITDA valuation (~$5.1bn) sits just
   below the DCF's $6.0bn — exactly the cross-check comps are meant to provide.
   ========================================================================== */

/* The student-entered cells (rounded, as presented in the case brief). */
const COMPS_ANSWERS = {
  ltmEbitda: 700, ltmEbit: 500, ltmSales: 3385,   // ValueCo metrics (given)
  debt: 1500, cash: 183,                            // net-debt bridge (given)
  mEbitda: 7.3, mEbit: 9.9, mSales: 1.1,            // chosen median multiples
  mLow: 6.0, mHigh: 9.0,                             // EV/EBITDA range (low / high)
};

const DCF_EV_REFERENCE = 6008.7;   // for the cross-check callout

function computeComps(inp) {
  const netDebt = inp.debt - inp.cash;

  // Implied enterprise value from each metric × its multiple
  const evEbitda = inp.mEbitda * inp.ltmEbitda;
  const evEbit   = inp.mEbit   * inp.ltmEbit;
  const evSales  = inp.mSales  * inp.ltmSales;

  // Headline (EV/EBITDA is the primary multiple for an industrial like ValueCo)
  const impliedEV = evEbitda;
  const impliedEquity = impliedEV - netDebt;

  // Valuation range from the low/high EV/EBITDA multiples
  const evLow  = inp.mLow  * inp.ltmEbitda;
  const evHigh = inp.mHigh * inp.ltmEbitda;
  const equityLow  = evLow  - netDebt;
  const equityHigh = evHigh - netDebt;

  return {
    netDebt, evEbitda, evEbit, evSales,
    impliedEV, impliedEquity,
    evLow, evHigh, equityLow, equityHigh,
    dcfEV: DCF_EV_REFERENCE,
    dcfVsComps: DCF_EV_REFERENCE - impliedEV,   // how far the DCF sits above the comps mid-point
  };
}

function correctComps() { return computeComps(COMPS_ANSWERS); }

if (typeof module !== 'undefined') module.exports = { computeComps, correctComps, COMPS_ANSWERS };
