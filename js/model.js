/* ============================================================================
   DCF MODEL DEFINITION
   Declarative spec of the spreadsheet the learner builds: every row, which
   cells are inputs, the official answer, formatting, and the built-in tutor's
   per-cell coaching ("what to type & why"). The grid + tutor read from here.
   ========================================================================== */

const FMT = {
  dollar:  v => (v < 0 ? '(' + Math.abs(v).toFixed(1) + ')' : v.toFixed(1)),
  dollar0: v => (v < 0 ? '($' + Math.abs(v).toFixed(0) + ')' : '$' + v.toFixed(0)),
  pct:     v => (v * 100).toFixed(1) + '%',
  pct2:    v => (v * 100).toFixed(2) + '%',
  mult:    v => v.toFixed(1) + 'x',
  factor:  v => v.toFixed(3),
  num1:    v => v.toFixed(1),
  shares:  v => v.toFixed(2),
};

/* Input-cell catalogue. `id` matches DCF_ANSWERS keys. `as` controls parsing:
   'pct' lets the learner type 7.5 (meaning 7.5%) and stores 0.075. */
const INPUTS = {
  g2020:    { as: 'pct', fmt: 'pct',  answer: 0.075,  step: 'II' },
  g2021:    { as: 'pct', fmt: 'pct',  answer: 0.06,   step: 'II' },
  g2022:    { as: 'pct', fmt: 'pct',  answer: 0.05,   step: 'II' },
  g2023:    { as: 'pct', fmt: 'pct',  answer: 0.04,   step: 'II' },
  g2024:    { as: 'pct', fmt: 'pct',  answer: 0.03,   step: 'II' },
  cogsPct:  { as: 'pct', fmt: 'pct',  answer: 0.60,   step: 'II' },
  sgaPct:   { as: 'pct', fmt: 'pct',  answer: 0.18985507246376812, step: 'II', tol: 0.0006 },
  daPct:    { as: 'pct', fmt: 'pct',  answer: 0.06,   step: 'II' },
  capexPct: { as: 'pct', fmt: 'pct',  answer: 0.045,  step: 'II' },
  taxRate:  { as: 'pct', fmt: 'pct',  answer: 0.25,   step: 'II' },
  wacc:     { as: 'pct', fmt: 'pct2', answer: 0.11,   step: 'III' },
  exitMult: { as: 'num', fmt: 'mult', answer: 7.5,    step: 'IV' },
  debt:     { as: 'num', fmt: 'num1', answer: 1500,   step: 'V' },
  cash:     { as: 'num', fmt: 'num1', answer: 250,    step: 'V' },
};

/* Ordered list that the guided walkthrough follows. */
const GUIDED_ORDER = [
  'g2020','g2021','g2022','g2023','g2024',
  'cogsPct','sgaPct','daPct','capexPct','taxRate',
  'wacc','exitMult','debt','cash'
];

/* Per-cell coaching shown by the AI tutor / coach bubble. */
const HINTS = {
  g2020: { title: 'Sales growth — Year 1 (2020E)', step: 'Step II · Project Free Cash Flow',
    type: 'Type  7.5',
    why: 'The projection starts from 2019 sales of $3,450m. Management/base-case guidance has the company growing <strong>7.5%</strong> in the first year, decelerating toward a steady state. Growth is the single biggest driver of the whole model — every downstream line scales off sales.' },
  g2021: { title: 'Sales growth — Year 2 (2021E)', step: 'Step II · Project Free Cash Flow', type: 'Type  6',
    why: 'Growth steps down to <strong>6%</strong>. Bankers taper growth toward a sustainable long-run rate so the terminal year reflects a normalised "steady state," not a cyclical peak.' },
  g2022: { title: 'Sales growth — Year 3 (2022E)', step: 'Step II · Project Free Cash Flow', type: 'Type  5',
    why: 'Down to <strong>5%</strong>. A smooth glide-path of growth assumptions is more defensible than a flat line and matches how mature companies converge to GDP-like growth.' },
  g2023: { title: 'Sales growth — Year 4 (2023E)', step: 'Step II · Project Free Cash Flow', type: 'Type  4',
    why: '<strong>4%</strong>. Notice we are approaching the long-run rate; the terminal value will be built off the final year, so its growth must be sustainable forever.' },
  g2024: { title: 'Sales growth — Year 5 (2024E)', step: 'Step II · Project Free Cash Flow', type: 'Type  3',
    why: '<strong>3%</strong> — the terminal-year, steady-state rate. This is the last explicit forecast year; the Exit Multiple Method captures everything beyond it.' },
  cogsPct: { title: 'COGS as % of sales', step: 'Step II · Project Free Cash Flow', type: 'Type  60',
    why: 'Cost of goods sold runs at <strong>60%</strong> of sales, giving a 40% gross margin — held flat across the projection per the operating scenario. Margins are the second-biggest FCF driver after growth.' },
  sgaPct: { title: 'SG&A as % of sales', step: 'Step II · Project Free Cash Flow', type: 'Type  18.99',
    why: 'Selling, general & administrative expense is ~<strong>19.0%</strong> of sales (2019 actual: $655m / $3,450m). Gross profit minus SG&A gives <strong>EBITDA</strong> — the headline profitability metric the terminal value is built on.' },
  daPct: { title: 'D&A as % of sales', step: 'Step II · Project Free Cash Flow', type: 'Type  6',
    why: 'Depreciation & amortisation ≈ <strong>6%</strong> of sales. D&A is subtracted to get EBIT (so taxes are correct), then <strong>added back</strong> in the FCF build because it is a non-cash charge.' },
  capexPct: { title: 'Capital expenditures as % of sales', step: 'Step II · Project Free Cash Flow', type: 'Type  4.5',
    why: 'Capex ≈ <strong>4.5%</strong> of sales — the real cash the business reinvests in plant & equipment. Unlevered FCF = EBIAT + D&A − Capex − Increase in NWC.' },
  taxRate: { title: 'Marginal tax rate', step: 'Step II · Project Free Cash Flow', type: 'Type  25',
    why: 'A <strong>25%</strong> marginal rate is applied to EBIT to get EBIAT (earnings before interest, after tax). We tax EBIT — <em>not</em> EBT — because unlevered FCF ignores the tax shield from interest (that belongs in the WACC).' },
  wacc: { title: 'Weighted Average Cost of Capital', step: 'Step III · Calculate WACC', type: 'Type  11',
    why: 'WACC = <strong>11.0%</strong> is the blended required return on debt and equity, computed on the WACC tab (after-tax cost of debt 4.9% × 30% + cost of equity 13.6% × 70%). It is the discount rate applied to every future cash flow.' },
  exitMult: { title: 'Exit (terminal) EV/EBITDA multiple', step: 'Step IV · Determine Terminal Value', type: 'Type  7.5',
    why: 'The Exit Multiple Method values the business beyond 2024 at <strong>7.5×</strong> terminal-year EBITDA — anchored to where comparable companies trade. Terminal value usually drives the majority of total DCF value, so this assumption matters enormously.' },
  debt: { title: 'Total debt', step: 'Step V · Determine Valuation', type: 'Type  1500',
    why: 'Enterprise value belongs to all capital providers. To bridge to <strong>equity value</strong> we subtract net debt: less <strong>$1,500m</strong> total debt, plus cash. (Equity = EV − Debt − Preferred − Minority + Cash.)' },
  cash: { title: 'Cash & cash equivalents', step: 'Step V · Determine Valuation', type: 'Type  250',
    why: 'Add back <strong>$250m</strong> of cash — it is not needed to run operations and effectively reduces the price an acquirer pays. EV − $1,500m debt + $250m cash = implied equity value, then ÷ diluted shares = share price.' },
};

/* Column years for the projection model (the part the learner builds). */
const PROJ_YEARS = DCF_CONST.projYears;    // [2020, 2021, 2022, 2023, 2024]
const BASE_YEAR  = 2019;                   // current-year anchor (sales $3,450m given)
