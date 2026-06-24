/* ============================================================================
   DCF ENGINE  —  faithful reproduction of the Rosenbaum ValueCo DCF model.
   Validated against the official "Completed" workbook to the cent:
       Enterprise Value      $6,008.7m
       Implied Equity Value  $4,758.7m
       Fully Diluted Shares    80.05m
       Implied Share Price    $59.45
       Implied Perp. Growth     2.61%
   All figures in $ millions unless noted. Base operating scenario, mid-year convention.
   ========================================================================== */

const DCF_CONST = {
  histYears: [2016, 2017, 2018, 2019],   // 2019 = current/LTM year
  projYears: [2020, 2021, 2022, 2023, 2024],
  histSales: { 2016: 2600, 2017: 2900, 2018: 3200, 2019: 3450 },
  midYear: true,
  // Net working capital drivers (base scenario, held constant) — from Assumptions Page 2
  nwc: { dso: 47.608695652173914, dih: 105.79710144927536, prepaidPct: 0.050724637681159424,
         dpo: 37.910628019323674, accruedPct: 0.07971014492753623, otherCLPct: 0.028985507246376812 },
  basicShares: 79.72605363984674,
  options: [ { shares: 1.0, strike: 45 }, { shares: 0.5, strike: 50 } ],
  prefStock: 0, nci: 0,
  ltmEbitda: 700,   // for the implied EV/EBITDA cross-check (O41)
};

/* The 14 cells the learner fills in, with the official answer + tolerance. */
const DCF_ANSWERS = {
  g2020: 0.075, g2021: 0.06, g2022: 0.05, g2023: 0.04, g2024: 0.03,
  cogsPct: 0.60, sgaPct: 0.18985507246376812, daPct: 0.06, capexPct: 0.045,
  taxRate: 0.25, wacc: 0.11, exitMult: 7.5, debt: 1500, cash: 250,
};

function nwcLevel(sales, p) {
  const cogs = sales * (typeof p._cogsPct === 'number' ? p._cogsPct : 0.60);
  const ca = sales / 365 * p.dso + cogs / 365 * p.dih + sales * p.prepaidPct;
  const cl = cogs / 365 * p.dpo + sales * p.accruedPct + sales * p.otherCLPct;
  return ca - cl;
}

/* Treasury Stock Method — fully diluted shares given an implied share price. */
function fullyDilutedShares(price) {
  let net = 0;
  for (const o of DCF_CONST.options) {
    if (price > o.strike) {                       // only in-the-money options exercise
      const proceeds = o.shares * o.strike;
      net += o.shares - proceeds / price;          // shares issued less shares repurchased
    }
  }
  return DCF_CONST.basicShares + net;
}

/* Core computation. `inp` carries the learner's (or correct) input values. */
function computeDCF(inp) {
  const C = DCF_CONST;
  const growth = [inp.g2020, inp.g2021, inp.g2022, inp.g2023, inp.g2024];
  const cogsPct = inp.cogsPct, sgaPct = inp.sgaPct, daPct = inp.daPct, capexPct = inp.capexPct;
  const tax = inp.taxRate, wacc = inp.wacc, exitMult = inp.exitMult;

  const nwcParams = Object.assign({ _cogsPct: cogsPct }, C.nwc);

  // ---- Project the income statement & free cash flow -----------------------
  const sales = { 2019: C.histSales[2019] };
  const rows = [];
  let prevSales = C.histSales[2019];
  C.projYears.forEach((y, i) => {
    const S = prevSales * (1 + growth[i]);
    sales[y] = S;
    const cogs = S * cogsPct, gp = S - cogs, sga = S * sgaPct, ebitda = gp - sga;
    const da = S * daPct, ebit = ebitda - da, taxes = ebit * tax, ebiat = ebit - taxes;
    const capex = S * capexPct;
    const dNWC = -(nwcLevel(S, nwcParams) - nwcLevel(prevSales, nwcParams)); // less: increase in NWC
    const fcf = ebiat + da - capex + dNWC;
    rows.push({ year: y, sales: S, cogs, gp, sga, ebitda, da, ebit, taxes, ebiat, capex, dNWC, fcf });
    prevSales = S;
  });

  // ---- Discount the projection-period FCF ----------------------------------
  rows.forEach((r, i) => {
    r.period = C.midYear ? (i + 0.5) : (i + 1);
    r.factor = 1 / Math.pow(1 + wacc, r.period);
    r.pv = r.fcf * r.factor;
  });
  const cumPV = rows.reduce((s, r) => s + r.pv, 0);

  // ---- Terminal value (Exit Multiple Method) -------------------------------
  const terminalEbitda = rows[rows.length - 1].ebitda;
  const tv = terminalEbitda * exitMult;
  const tvPeriod = C.projYears[C.projYears.length - 1] - C.histYears[C.histYears.length - 1]; // = 5
  const tvFactor = 1 / Math.pow(1 + wacc, tvPeriod);
  const pvTV = tv * tvFactor;

  // ---- Enterprise value, equity bridge, share price ------------------------
  const ev = cumPV + pvTV;
  const equity = ev - inp.debt - C.prefStock - C.nci + inp.cash;

  // share price via treasury-stock method (price depends on diluted count -> iterate)
  let price = equity / C.basicShares, shares = C.basicShares;
  for (let k = 0; k < 60; k++) {
    shares = fullyDilutedShares(price);
    const p2 = equity / shares;
    if (Math.abs(p2 - price) < 1e-9) { price = p2; break; }
    price = p2;
  }

  // ---- Cross-checks --------------------------------------------------------
  const tvPctEV = pvTV / ev;
  const lastFCF = rows[rows.length - 1].fcf;
  // implied perpetuity growth rate (mid-year form, matches O37)
  const impliedPGR = ((tv * wacc) - lastFCF * Math.pow(1 + wacc, 0.5)) /
                     (tv + lastFCF * Math.pow(1 + wacc, 0.5));
  const impliedEVEBITDA = ev / C.ltmEbitda;

  return {
    sales, rows, cumPV, terminalEbitda, tv, tvFactor, tvPeriod, pvTV,
    ev, equity, sharePrice: price, fullyDiluted: shares,
    tvPctEV, impliedPGR, impliedEVEBITDA, wacc, exitMult,
  };
}

/* Convenience: the fully-correct result (used for "Reveal answer" + free-mode grading). */
function correctDCF() { return computeDCF(DCF_ANSWERS); }

if (typeof module !== 'undefined') module.exports = { computeDCF, correctDCF, DCF_ANSWERS, DCF_CONST };
