/* ============================================================================
   WORKBOOK NOTES  —  authored, line-by-line teaching annotations for the real
   Rosenbaum DCF workbook. Each sheet has: an overview, a "how it links" note,
   ordered sections, per-cell what/how/why notes, repeating-pattern group notes,
   and footnotes. The workbook renderer (js/workbook.js) reads this.
   ========================================================================== */

const WORKBOOK_NOTES = {

  /* ===================== WACC ===================== */
  WACC: {
    overview:
      `The <strong>WACC tab</strong> produces a single number — ValueCo's <strong>weighted average cost of
       capital, 11.0%</strong> — which becomes the discount rate on the DCF tab. WACC is the blended return
       that debt and equity investors require, weighted by how much of each the company uses. The tab does
       this in two halves: the left block (<em>column D</em>) assembles the cost of debt and the cost of
       equity and weights them; the right blocks derive the <strong>beta</strong> that feeds the cost of
       equity by studying comparable companies, and finish with a sensitivity table.`,
    flow:
      `<strong>Where it goes:</strong> the result in <code>D26</code> (11.0%) is typed into the DCF tab's
       <code>E26</code> ("WACC"), where it discounts every projected free cash flow and the terminal value.
       <strong>Where it comes from:</strong> this tab is self-contained — it needs no other sheet. Its only
       external "inputs" are market data (comparable-company betas, the risk-free rate, the risk premium).`,

    sections: [
      { title: "① Target capital structure", intro:
        "How ValueCo will be financed going forward — the weights that multiply the two costs of capital. "
        + "Note these are <em>target</em> (long-run) weights at market value, not today's accounting balances.",
        cells: ["D8", "D9"] },

      { title: "② Cost of debt", intro:
        "What lenders charge, after tax. Interest is tax-deductible, so the real cost of debt to the company "
        + "is the rate times (1 − tax rate) — this is the famous “tax shield.”",
        cells: ["D13", "D14", "D15"] },

      { title: "③ Cost of equity — the CAPM build-up", intro:
        "What shareholders require. Built with the Capital Asset Pricing Model: start at the risk-free rate, "
        + "add beta × the equity risk premium, then a small-company size premium.",
        cells: ["D19", "D20", "D21", "D22", "D23"] },

      { title: "④ The WACC", intro:
        "Weight the two costs by the capital structure and add them. This is the payoff of the whole tab.",
        cells: ["D26"] },

      { title: "⑤ Comparable-companies beta (unlever → relever)", intro:
        "Beta can't be observed for a private/target business directly, so bankers borrow it from public peers. "
        + "Each peer's <em>levered</em> beta is stripped of its financing (“unlevered”) to isolate "
        + "business risk, the peers are averaged, and the result is “relevered” to ValueCo's own "
        + "capital structure — giving the 1.43 used above.",
        groups: ["F8:L16", "F18:L22"] },

      { title: "⑥ WACC sensitivity (a two-variable data table)", intro:
        "Because small changes in WACC move valuation a lot, bankers show how WACC responds to its biggest "
        + "drivers — here the debt weight and the pre-tax cost of debt — using an Excel <em>Data Table</em>.",
        groups: ["F24:L31"] },
    ],

    notes: {
      "D8": { label: "Debt-to-total capitalization",
        what: "The share of the company funded by debt, at <strong>30%</strong>.",
        why: "This is an <em>input</em> — the chosen long-run target mix. Together with equity it sets the weights in WACC. Higher leverage lowers WACC (debt is cheaper) but raises financial risk." },
      "D9": { label: "Equity-to-total capitalization",
        what: "The remaining <strong>70%</strong>, funded by equity.",
        why: "A formula, <code>=1-D8</code> — debt and equity weights must sum to 100%. Linking it to D8 means changing one updates the other automatically." },

      "D13": { label: "Pre-tax cost of debt",
        what: "The interest rate ValueCo pays lenders, <strong>6.5%</strong>.",
        why: "An input, estimated from the company's existing debt and credit profile (yield on comparable bonds/loans)." },
      "D14": { label: "Tax rate",
        what: "The marginal tax rate, <strong>25%</strong>.",
        why: "Input. It matters here because interest is tax-deductible, so the government effectively subsidises part of the borrowing cost." },
      "D15": { label: "After-tax cost of debt",
        what: "<strong>4.9%</strong> — the true economic cost of debt.",
        why: "Formula <code>=D13*(1-D14)</code>: <span data-tex=\"k_d^{\\text{AT}} = k_d(1-t) = 6.5\\%\\times(1-25\\%) = 4.875\\%\"></span>. This <em>after-tax</em> figure (not the 6.5%) is what goes into WACC — that's the tax shield in action." },

      "D19": { label: "Risk-free rate",
        what: "<strong>2.5%</strong> — the return on a “riskless” asset.",
        why: "Input. Conventionally the yield on a long-dated (e.g. 20-year) government bond. It's the floor every investor expects before taking any risk." },
      "D20": { label: "Market (equity) risk premium",
        what: "<strong>7.0%</strong> — the extra return investors demand for holding stocks over the risk-free asset.",
        why: "Input, taken from market studies. Multiplied by beta, it scales risk into a required return." },
      "D21": { label: "Levered beta (used in CAPM)",
        what: "<strong>1.43</strong> — ValueCo's sensitivity to overall market moves.",
        why: "Hardcoded to the <em>relevered</em> beta computed at <code>L22</code> (same 1.43). Beta > 1 means the stock is more volatile than the market, so equity holders demand more." },
      "D22": { label: "Size premium",
        what: "<strong>1.1%</strong> — an extra return for being a smaller company.",
        why: "Input. Empirically smaller companies are riskier, so a premium (from valuation yearbooks) is added on top of CAPM." },
      "D23": { label: "Cost of equity",
        what: "<strong>13.6%</strong> — the return shareholders require.",
        why: "Formula <code>=D19+(D21*D20)+D22</code>: <span data-tex=\"k_e = r_f + \\beta\\cdot\\text{ERP} + \\text{size} = 2.5\\% + 1.43\\times 7.0\\% + 1.1\\% = 13.6\\%\"></span>. This is the CAPM build-up." },

      "D26": { label: "WACC — the discount rate",
        what: "<strong>11.0%</strong> — the blended cost of capital.",
        why: "Formula <code>=(D8*D15)+(D9*D23)</code>: <span data-tex=\"\\text{WACC}=\\tfrac{D}{V}\\,k_d(1-t)+\\tfrac{E}{V}\\,k_e = 30\\%\\times 4.9\\% + 70\\%\\times 13.6\\% \\approx 11.0\\%\"></span>. This single number flows to the DCF tab and discounts all future cash flows." },
    },

    groups: {
      "F8:L16": { title: "Comparable companies — unlevering beta",
        html:
          `Each row is a public peer. Reading across the columns:
           <ul>
             <li><strong>Predicted levered beta</strong> (col G, e.g. BuyerCo 1.35) — an <em>input</em>, the peer's observed beta. It reflects both business risk <em>and</em> that peer's leverage.</li>
             <li><strong>Market value of debt / equity</strong> (cols H, I) — inputs, the peer's capital structure.</li>
             <li><strong>Debt/Equity</strong> (col J) — a formula, <code>=H/I</code>.</li>
             <li><strong>Marginal tax rate</strong> (col K, 25%) — input.</li>
             <li><strong>Unlevered beta</strong> (col L) — the key formula
                 <span data-tex=\"\\beta_u = \\dfrac{\\beta_L}{1+\\frac{D}{E}(1-t)}\" data-display></span>
                 This strips out the peer's financing so only
                 <em>business</em> risk remains, making peers comparable.</li>
           </ul>
           <strong>Mean / Median</strong> (rows 15–16) average the peers. The mean unlevered beta (≈ 1.08, cell <code>L15</code>) is what we carry forward to relever for ValueCo.` },

      "F18:L22": { title: "ValueCo relevered beta",
        html:
          `Now re-introduce <em>ValueCo's</em> own leverage onto the peer-average business risk:
           <ul>
             <li><strong>Mean unlevered beta</strong> <code>I22 =L15</code> ≈ 1.08.</li>
             <li><strong>Target D/E</strong> <code>J22 =D8/D9</code> = 30%/70%.</li>
             <li><strong>Target marginal tax</strong> <code>K22 =D14</code> = 25%.</li>
             <li><strong>Relevered beta</strong> <code>L22</code>:
                 <span data-tex=\"\\beta_L = \\beta_u\\left[1+\\tfrac{D}{E}(1-t)\\right] = 1.43\" data-display></span></li>
           </ul>
           This 1.43 is exactly the levered beta hardcoded into the CAPM at <code>D21</code>. Unlever-then-relever
           is the standard way to give a target a defensible beta from market peers.` },

      "F24:L31": { title: "WACC sensitivity — a two-variable data table",
        html:
          `Excel <strong>Data Tables</strong> recompute one output across a grid of two inputs:
           <ul>
             <li><strong>Corner</strong> <code>G26 =D26</code> — the live WACC the table is built around.</li>
             <li><strong>Columns</strong> (<code>H26:L26</code>) step the <em>pre-tax cost of debt</em> around its 6.5% centre (cell <code>J26</code>, an input).</li>
             <li><strong>Rows</strong> (<code>G27:G31</code>) step the <em>debt-to-total-capitalization</em> around its 30% centre (cell <code>G29</code>, an input).</li>
             <li><strong>Interior</strong> (<code>H27:L31</code>) — the recomputed WACC for every combination. These are <em>outputs</em>, generated by Excel; you never type them.</li>
           </ul>
           The takeaway: more leverage and cheaper debt both pull WACC down — and since WACC discounts every
           cash flow, even a 0.5% move meaningfully changes the valuation. That's why a DCF is shown as a range.` },
    },

    footnotes: [
      "(1) Risk-free rate: interpolated yield on the 20-year U.S. Treasury (Treasury.gov).",
      "(2) Market risk premium: from the Duff & Phelps / SBBI Valuation Yearbook.",
      "(3) Size premium: blend of Duff & Phelps market-capitalization deciles 4 and 5.",
    ],
  },

  /* ===================== AS1 ===================== */
  AS1: {
    overview:
      `<strong>AS1</strong> is the model's <strong>operating-scenario engine</strong> for the income
       statement and cash flow. It holds five complete cases — <em>Base, Upside, Management, Downside 1,
       Downside 2</em> — for each driver (sales growth, COGS %, SG&amp;A %, D&amp;A %, capex %). A single
       switch on the DCF tab (cell <code>D4</code>) chooses which case runs, and an Excel
       <code>CHOOSE()</code> formula serves the matching row of assumptions into the DCF projection.`,
    flow:
      `<strong>Reads:</strong> the scenario selector <code>DCF!$D$4</code> (1–5) inside every
       <code>CHOOSE</code> formula, and the year headers from the DCF tab. <strong>Writes:</strong> the
       selected percentages (the “active” row F7:L7, F14:L14, …) which the DCF tab pulls into its own
       assumptions block (<code>DCF!J59:N63</code>) to drive projected sales, COGS, SG&amp;A, D&amp;A and capex.`,
    sections: [
      { title: "Projection period & year headers", intro: "The seven projection columns and the years they map to.", groups: ["B2:O4"] },
      { title: "Sales growth (% YoY) — five scenarios", intro: "Growth is the model's biggest lever. The active case feeds projected sales on the DCF tab.", groups: ["B6:O12"] },
      { title: "Cost of goods sold (% of sales)", intro: "Sets gross margin. 60% in the base case → 40% gross margin.", groups: ["B14:O19"] },
      { title: "SG&A (% of sales)", intro: "Operating overhead. Gross profit − SG&A = EBITDA.", groups: ["B21:O26"] },
      { title: "Depreciation & amortisation (% of sales)", intro: "Non-cash charge: subtracted to get EBIT, then added back in free cash flow.", groups: ["B28:O33"] },
      { title: "Capital expenditures (% of sales)", intro: "Real cash reinvested in the business — a use of free cash flow.", groups: ["B35:O41"] },
    ],
    notes: {},
    groups: {
      "B2:O4": { title: "Projection period & year headers",
        html: `<ul><li><strong>Row 3</strong> (<code>F3:L3</code>) numbers the seven projection years 1–7.</li>
          <li><strong>Row 4</strong> (<code>F4:L4</code>) are <em>links</em> — <code>=DCF!J6</code>, <code>=DCF!K6</code>, … — so the years here always match the DCF tab automatically.</li></ul>` },
      "B6:O12": { title: "Sales growth — the CHOOSE scenario switch",
        html: `<ul>
          <li><strong>Active row</strong> <code>F7:L7</code>: <code>=CHOOSE(DCF!$D$4, F8, F9, F10, F11, F12)</code> — returns the growth of whichever case is selected. With <code>DCF!D4 = 1</code> (Base) it returns row 8.</li>
          <li><strong>Rows 8–12</strong> are the five cases (column E numbers them 1–5), each an <em>input</em>: Base glides 7.5%→6%→5%→4%→3%; Upside/Management are higher, Downside lower.</li>
          <li>The selected growth drives DCF sales: <span data-tex="\\text{Sales}_t = \\text{Sales}_{t-1}\\times(1+g_t)" data-display></span></li></ul>` },
      "B14:O19": { title: "COGS % of sales (five scenarios)",
        html: `<ul><li>Active row <code>F14:L14</code> = <code>CHOOSE(DCF!$D$4, …)</code> picks one of rows 15–19.</li>
          <li>Applied on the DCF tab as <span data-tex="\\text{COGS} = \\text{Sales}\\times \\text{COGS\\%}" data-display></span> and gross profit = Sales − COGS.</li></ul>` },
      "B21:O26": { title: "SG&A % of sales (five scenarios)",
        html: `<ul><li>Active row <code>F21:L21</code> via <code>CHOOSE</code>; rows 22–26 are the cases (base ≈ 19%).</li>
          <li><span data-tex="\\text{EBITDA} = \\text{Gross profit} - \\text{SG\\&A}" data-display></span></li></ul>` },
      "B28:O33": { title: "D&A % of sales (five scenarios)",
        html: `<ul><li>Active row <code>F28:L28</code> via <code>CHOOSE</code>; rows 29–33 the cases (base 6%).</li>
          <li>D&A is subtracted to compute EBIT (so tax is right), then <em>added back</em> in free cash flow because it is non-cash.</li></ul>` },
      "B35:O41": { title: "Capital expenditures % of sales (five scenarios)",
        html: `<ul><li><code>B35</code> begins the <em>Cash Flow Statement Assumptions</em>. Active row <code>F36:L36</code> via <code>CHOOSE</code>; rows 37–41 the cases (base 4.5%).</li>
          <li>On the DCF tab: <span data-tex="\\text{Capex} = \\text{Sales}\\times \\text{Capex\\%}" data-display></span> — a cash outflow in the FCF build.</li></ul>` },
    },
    footnotes: ["Switch the case by changing cell D4 on the DCF tab (1 = Base, 2 = Upside, 3 = Management, 4 = Downside 1, 5 = Downside 2). Every CHOOSE here re-points automatically."],
  },

  /* ===================== AS2 ===================== */
  AS2: {
    overview:
      `<strong>AS2</strong> is the operating-scenario engine for the <strong>balance sheet</strong> — the
       working-capital drivers. Same five-case <code>CHOOSE</code> mechanism as AS1, but here the drivers are
       efficiency ratios: <em>days sales outstanding (DSO), days inventory held (DIH), days payable
       outstanding (DPO)</em>, and prepaid/accrued/other items as a % of sales. These feed the NWC tab.`,
    flow:
      `<strong>Reads</strong> <code>DCF!$D$4</code> (scenario) and the DCF year headers.
       <strong>Writes</strong> the selected ratios into the NWC tab (e.g. <code>NWC!G29</code> pulls DSO from
       <code>AS2!F7</code>), which turns them into receivables, inventory and payables balances.`,
    sections: [
      { title: "Projection period & year headers", intro: "Seven projection years, linked from the DCF tab.", groups: ["B2:O4"] },
      { title: "Days Sales Outstanding — DSO (five scenarios)", intro: "How long customers take to pay. Drives accounts receivable.", groups: ["B6:O12"] },
      { title: "Days Inventory Held — DIH (five scenarios)", intro: "How long stock sits before sale. Drives inventory.", groups: ["B14:O19"] },
      { title: "Prepaid & other current assets (% of sales)", intro: "Smaller operating assets scaled to sales.", groups: ["B21:O26"] },
      { title: "Days Payable Outstanding — DPO (five scenarios)", intro: "How long the company takes to pay suppliers. Drives accounts payable.", groups: ["B28:O34"] },
      { title: "Accrued liabilities (% of sales)", intro: "Wages, taxes and other accruals scaled to sales.", groups: ["B36:O41"] },
      { title: "Other current liabilities (% of sales)", intro: "Remaining short-term operating liabilities.", groups: ["B43:O48"] },
    ],
    notes: {},
    groups: {
      "B2:O4": { title: "Projection period & year headers", html: `Identical to AS1: row 3 numbers the years 1–7; row 4 (<code>F4:L4</code>) links the actual years from the DCF tab.` },
      "B6:O12": { title: "Days Sales Outstanding (DSO)",
        html: `<ul><li>Active row <code>F7:L7</code> via <code>CHOOSE(DCF!$D$4, …)</code>; rows 8–12 are the five cases (base ≈ 47.6 days).</li>
          <li>On the NWC tab DSO becomes receivables: <span data-tex="\\text{Accounts receivable} = \\dfrac{\\text{Sales}}{365}\\times \\text{DSO}" data-display></span></li>
          <li>Higher DSO ties up more cash in receivables — a drag on free cash flow.</li></ul>` },
      "B14:O19": { title: "Days Inventory Held (DIH)",
        html: `<ul><li>Active row <code>F14:L14</code> via <code>CHOOSE</code>; rows 15–19 the cases (base ≈ 105.8 days).</li>
          <li>Drives inventory: <span data-tex="\\text{Inventory} = \\dfrac{\\text{COGS}}{365}\\times \\text{DIH}" data-display></span> (uses COGS, not sales, because inventory is carried at cost).</li></ul>` },
      "B21:O26": { title: "Prepaid & other current assets (% of sales)",
        html: `<ul><li>Active row <code>F21:L21</code> via <code>CHOOSE</code>; rows 22–26 the cases (base ≈ 5.1%).</li>
          <li><span data-tex="\\text{Prepaid \\& other CA} = \\text{Sales}\\times \\%" data-display></span></li></ul>` },
      "B28:O34": { title: "Days Payable Outstanding (DPO)",
        html: `<ul><li><code>B28</code> begins <em>Current Liabilities</em>. Active row <code>F29:L29</code> via <code>CHOOSE</code>; rows 30–34 the cases (base ≈ 37.9 days).</li>
          <li>Drives payables: <span data-tex="\\text{Accounts payable} = \\dfrac{\\text{COGS}}{365}\\times \\text{DPO}" data-display></span></li>
          <li>Higher DPO is good for cash — the company holds onto cash longer before paying suppliers.</li></ul>` },
      "B36:O41": { title: "Accrued liabilities (% of sales)",
        html: `<ul><li>Active row <code>F36:L36</code> via <code>CHOOSE</code>; rows 37–41 the cases (base ≈ 8.0%).</li>
          <li><span data-tex="\\text{Accrued liabilities} = \\text{Sales}\\times \\%" data-display></span></li></ul>` },
      "B43:O48": { title: "Other current liabilities (% of sales)",
        html: `<ul><li>Active row <code>F43:L43</code> via <code>CHOOSE</code>; rows 44–48 the cases (base ≈ 2.9%).</li></ul>` },
    },
    footnotes: ["These ratios flow to the NWC tab, which converts them into balances, computes net working capital, and passes the year-on-year change to the DCF free-cash-flow build."],
  },

  /* ===================== NWC ===================== */
  NWC: {
    overview:
      `The <strong>NWC tab</strong> projects <strong>net working capital</strong> — the cash tied up in
       running the business (receivables + inventory + prepaids, less payables + accruals + other). What the
       DCF actually needs is the <em>year-on-year change</em>: when NWC grows, cash is consumed, so an
       <em>increase</em> in NWC is subtracted from free cash flow.`,
    flow:
      `<strong>Reads:</strong> sales & COGS and the years from the DCF tab; the projection-year efficiency
       ratios (DSO, DIH, DPO, %s) from the <strong>AS2</strong> tab. <strong>Writes:</strong> the
       “(Increase)/Decrease in NWC” line (row 25) into the DCF free-cash-flow build (<code>DCF!J23:N23</code>),
       and the “% sales” line into the DCF assumptions.`,
    sections: [
      { title: "Top of the schedule — sales, COGS, years", intro: "All linked from the DCF tab so the schedule stays in sync.", groups: ["B1:K8"] },
      { title: "Current assets", intro: "Receivables, inventory and prepaids — built from the AS2 efficiency ratios.", groups: ["B10:K14"] },
      { title: "Current liabilities", intro: "Payables, accruals and other — the operating funding the business gets for free.", groups: ["B16:K20"] },
      { title: "Net working capital & the change that hits the DCF", intro: "The output the whole tab exists to produce.", groups: ["B22:K25"] },
      { title: "Assumptions (historical actuals → projection drivers)", intro: "Historical ratios are computed from the balances; projection ratios are pulled from AS2.", groups: ["B27:K36"] },
    ],
    notes: {},
    groups: {
      "B1:K8": { title: "Sales, COGS & years — linked from the DCF tab",
        html: `<ul><li>Row 6 years, row 7 <strong>Sales</strong> and row 8 <strong>COGS</strong> are all <em>links</em> (<code>=+DCF!E7</code>, …). Working capital scales off these, so they must match the income statement exactly.</li></ul>` },
      "B10:K14": { title: "Current assets",
        html: `<ul>
          <li><strong>Accounts receivable</strong> — projection <span data-tex="\\text{AR}=\\dfrac{\\text{Sales}}{365}\\times \\text{DSO}" data-display></span></li>
          <li><strong>Inventories</strong> — <span data-tex="\\text{Inv}=\\dfrac{\\text{COGS}}{365}\\times \\text{DIH}" data-display></span></li>
          <li><strong>Prepaid &amp; other</strong> — Sales × prepaid %.</li>
          <li><strong>Historical</strong> columns (2016–2018) are <em>hardcoded balances</em> (inputs); projection columns are formulas. <strong>Total current assets</strong> sums the three.</li></ul>` },
      "B16:K20": { title: "Current liabilities",
        html: `<ul>
          <li><strong>Accounts payable</strong> — <span data-tex="\\text{AP}=\\dfrac{\\text{COGS}}{365}\\times \\text{DPO}" data-display></span></li>
          <li><strong>Accrued</strong> and <strong>other</strong> — Sales × their %.</li>
          <li>Historical columns are hardcoded; <strong>Total current liabilities</strong> sums them. These are essentially interest-free financing from suppliers and employees.</li></ul>` },
      "B22:K25": { title: "Net working capital → the DCF",
        html: `<ul>
          <li><strong>Net working capital</strong>: <span data-tex="\\text{NWC} = \\text{Total CA} - \\text{Total CL}" data-display></span></li>
          <li><strong>% sales</strong> expresses NWC relative to revenue (a sanity check).</li>
          <li><strong>(Increase)/Decrease in NWC</strong> (row 25) = prior-year NWC − current-year NWC. A growing business needs <em>more</em> working capital, so this is usually negative — and the DCF subtracts that increase: free cash flow includes <span data-tex="-\\,\\Delta\\text{NWC}" data-display></span>. This row links into <code>DCF!J23:N23</code>.</li></ul>` },
      "B27:K36": { title: "Assumptions — actuals in, drivers out",
        html: `<ul>
          <li>For the <strong>historical</strong> years the ratios are reverse-engineered from the balances, e.g. <span data-tex="\\text{DSO}=\\dfrac{\\text{AR}}{\\text{Sales}}\\times 365" data-display></span></li>
          <li>For the <strong>projection</strong> years they are pulled from the <strong>AS2</strong> tab (<code>=AS2!F7</code>, …), so changing a scenario flows straight through to working capital.</li></ul>` },
    },
    footnotes: ["The single most important output is row 25 — the change in NWC — because that is the only line on this tab the DCF free-cash-flow build consumes."],
  },

  /* ===================== DCF ===================== */
  DCF: {
    overview:
      `The <strong>DCF tab</strong> is the output sheet — where everything comes together. It projects the
       income statement, derives <strong>unlevered free cash flow</strong>, discounts it (and a terminal
       value) at the WACC to an <strong>enterprise value</strong>, then bridges to equity value and an
       <strong>implied share price</strong>. It also carries the sensitivity tables and the share-count math.`,
    flow:
      `<strong>Reads:</strong> growth/margin/capex assumptions from <strong>AS1</strong> (rows 59–63), the
       change in working capital from <strong>NWC</strong> (row 23), and the discount rate from the
       <strong>WACC</strong> tab (typed into <code>E26</code>). <strong>Drives:</strong> nothing downstream —
       this is the final answer (EV ≈ $6,008.7m, share price ≈ $59.45).`,
    sections: [
      { title: "Title, years & model switches", intro: "The header sets the time line and two cells control the whole model.", cells: ["D4", "D5"], groups: ["B1:O6"] },
      { title: "Income statement: Sales → EBIAT", intro: "Each line is an assumption applied to projected sales; the historical columns are inputs, the projection columns are formulas.",
        groups: ["B7:O8", "B9:O11", "B12:O14", "B15:O17", "B18:O19"] },
      { title: "Unlevered free cash flow & discounting", intro: "Turn after-tax profit into cash, then bring each year back to today.", cells: ["E26"], groups: ["B21:O29"] },
      { title: "Terminal value, enterprise value & the equity bridge", intro: "Value everything beyond the forecast, sum the present values, and walk down to a share price.",
        cells: ["E37", "J34", "J37", "O41", "E43", "J43"], groups: ["B32:O43"] },
      { title: "Assumption drivers (linked in)", intro: "Where the DCF pulls its assumptions from the other tabs.", groups: ["B58:O65"] },
      { title: "Sensitivity analysis (two-variable data tables)", intro: "Because a DCF is only as good as its assumptions, the output is shown as a range.", groups: ["B46:O53", "B70:O102"] },
      { title: "Implied share price — treasury stock method", intro: "Convert equity value into a per-share figure, accounting for dilutive options.", groups: ["B107:O132"] },
    ],
    notes: {
      "D4": { label: "Operating scenario selector",
        what: "An <strong>input</strong>, 1–5, choosing which case from AS1/AS2 the model runs (1 = Base).",
        why: "Every <code>CHOOSE</code> on the assumption tabs reads this one cell, so changing it re-runs the entire model under a different scenario." },
      "D5": { label: "Mid-year convention",
        what: "A <strong>Y/N</strong> switch. “Y” assumes cash arrives mid-year.",
        why: "When Y, discount periods become 0.5, 1.5, 2.5… instead of 1, 2, 3 — cash comes sooner, lifting present value slightly. It's the market-standard assumption." },
      "E26": { label: "WACC (discount rate)",
        what: "<strong>11.0%</strong> — typed in from the WACC tab's result (<code>D26</code>).",
        why: "Discounts every projected free cash flow and the terminal value. The single most powerful assumption in the model." },
      "E37": { label: "Exit (terminal) multiple",
        what: "<strong>7.5×</strong> — applied to terminal-year EBITDA.",
        why: "Exit Multiple Method: <span data-tex=\"\\text{Terminal Value} = \\text{EBITDA}_{\\text{terminal}}\\times 7.5\"></span>. Anchored to where comparable companies trade." },
      "J34": { label: "Less: total debt",
        what: "<strong>−$1,500m</strong> — an input from the balance sheet.",
        why: "Enterprise value belongs to all investors; subtracting net debt walks down to equity value." },
      "J37": { label: "Plus: cash & equivalents",
        what: "<strong>+$250m</strong> — an input.",
        why: "Cash isn't needed to operate, so it's added back when bridging from enterprise to equity value." },
      "O41": { label: "LTM EBITDA",
        what: "<strong>$700m</strong> — last-twelve-months EBITDA, an input.",
        why: "Used only for the cross-check <span data-tex=\"\\text{EV}/\\text{LTM EBITDA}\"></span> — does the DCF imply a sane multiple versus the market?" },
      "E43": { label: "Enterprise value — the headline output",
        what: "<strong>$6,008.7m</strong>.",
        why: "Formula <code>=E40+E33</code>: <span data-tex=\"\\text{EV} = \\underbrace{\\$4{,}135.8}_{\\text{PV of terminal value}} + \\underbrace{\\$1{,}872.9}_{\\text{PV of FCF}}\"></span>. The terminal value is ~69% of the total — typical, and why the exit multiple and WACC matter so much." },
      "J43": { label: "Implied share price",
        what: "<strong>$59.45</strong> per share.",
        why: "Formula <code>=J39/J41</code>: <span data-tex=\"\\text{Share price} = \\dfrac{\\text{Equity value}}{\\text{Diluted shares}} = \\dfrac{4{,}758.7}{80.05}\"></span>." },
    },
    groups: {
      "B1:O6": { title: "Header — the model's time line",
        html: `<ul>
          <li><strong>Title block</strong> (B1–B3): company, “Discounted Cash Flow Analysis”, and units ($ in millions). <code>O3</code> shows the active scenario name (a <code>CHOOSE</code> reading <code>D4</code>).</li>
          <li><strong>Row 6 — the years.</strong> Columns E–G are the <em>historical</em> period (2016–2018), I is the current year (2019), and J–N are the five <em>projection</em> years (2020–2024). Most are formulas (<code>=I6+1</code>, …) anchored to the one hardcoded year in <code>I6</code>.</li>
          <li>The <strong>CAGR</strong> columns (H, O) measure compound annual growth across the historical and projection windows.</li></ul>` },
      "B7:O8": { title: "Sales & growth",
        html: `<ul><li><strong>Historical sales</strong> (2016–2019, cols E–I) are <em>inputs</em>; <strong>projection</strong> sales are <span data-tex="\\text{Sales}_t=\\text{Sales}_{t-1}(1+g_t)" data-display></span> where each <span data-tex="g_t"></span> comes from AS1.</li>
          <li>The <strong>% growth</strong> and the <strong>CAGR</strong> columns (H, O) are formulas that describe the trajectory.</li></ul>` },
      "B9:O11": { title: "COGS → Gross profit",
        html: `<ul><li><span data-tex="\\text{Gross profit} = \\text{Sales} - \\text{COGS}" data-display></span> where COGS = Sales × the AS1 COGS%.</li><li>The <strong>% margin</strong> row tracks gross margin (40% in the base case).</li></ul>` },
      "B12:O14": { title: "SG&A → EBITDA",
        html: `<ul><li><span data-tex="\\text{EBITDA} = \\text{Gross profit} - \\text{SG\\&A}" data-display></span> (the current-year SG&A, <code>I12</code>, is a hardcoded $655m; projections use the AS1 %).</li><li>EBITDA is the profitability the terminal value is built on.</li></ul>` },
      "B15:O17": { title: "D&A → EBIT",
        html: `<ul><li><span data-tex="\\text{EBIT} = \\text{EBITDA} - \\text{D\\&A}" data-display></span></li><li>Historical D&A (E15, F15) are inputs; G15 and the projection are formulas. D&A is subtracted here so tax is computed correctly, then added back as cash later.</li></ul>` },
      "B18:O19": { title: "Taxes → EBIAT",
        html: `<ul><li><span data-tex="\\text{EBIAT} = \\text{EBIT}\\times(1-t)" data-display></span> with t = 25%.</li><li>We tax <em>EBIT</em>, not pre-tax income — unlevered FCF ignores interest, so the interest tax shield is left to the WACC.</li></ul>` },
      "B21:O29": { title: "Unlevered free cash flow & discounting",
        html: `<ul>
          <li><strong>Unlevered FCF</strong> (row 25): <span data-tex="\\text{FCF}=\\text{EBIAT}+\\text{D\\&A}-\\text{Capex}-\\Delta\\text{NWC}" data-display></span> — D&A added back (non-cash), capex and the change in working capital (from the NWC tab) subtracted.</li>
          <li><strong>WACC</strong> (<code>E26</code>) is the discount rate. <strong>Discount period</strong> uses the mid-year convention (0.5, 1.5, …).</li>
          <li><strong>Discount factor</strong> <span data-tex="=\\dfrac{1}{(1+\\text{WACC})^{n}}"></span> and <strong>PV of FCF</strong> = FCF × factor.</li></ul>` },
      "B32:O43": { title: "Terminal value, enterprise value & equity bridge",
        html: `<ul>
          <li><strong>Terminal value</strong> = terminal-year EBITDA × exit multiple (7.5×), discounted at the year-5 factor; it is ~69% of enterprise value here.</li>
          <li><strong>Enterprise value</strong> <code>E43</code> = cumulative PV of FCF + PV of terminal value = <strong>$6,008.7m</strong>.</li>
          <li><strong>Equity bridge:</strong> <span data-tex="\\text{Equity} = \\text{EV} - \\text{Debt} - \\text{Pref} - \\text{NCI} + \\text{Cash}" data-display></span> = $4,758.7m, then ÷ diluted shares → <strong>$59.45</strong>.</li>
          <li>The right-hand block also backs out the <strong>implied perpetuity growth rate</strong> (≈ 2.6%) as a cross-check on the exit multiple.</li></ul>` },
      "B58:O65": { title: "Assumption drivers — where the DCF pulls from",
        html: `<ul>
          <li>Rows 59–63 (sales growth, COGS %, SG&A %, D&A %, capex %) <em>link</em> to the active scenario on <strong>AS1</strong> (<code>=AS1!F7</code>, …) for the projection years; the historical columns recompute the ratios from actuals.</li>
          <li>Row 64 is the <strong>tax rate</strong> (E64:I64 are inputs at 25%).</li>
          <li>Row 65 pulls <strong>working capital % of sales</strong> from the <strong>NWC</strong> tab.</li></ul>` },
      "B46:O53": { title: "Sensitivity table 1 — EV & implied growth",
        html: `A two-variable <strong>Data Table</strong>: enterprise value (and the implied perpetuity growth rate) recomputed across a grid of <strong>WACC</strong> (rows) × <strong>exit multiple</strong> (columns). The interior cells are Excel outputs — never typed.` },
      "B70:O102": { title: "Sensitivity page — EV, equity, growth, EV/EBITDA",
        html: `A second sensitivity page with four data tables: enterprise value, implied equity value, implied perpetuity growth rate, and implied EV/LTM-EBITDA — each flexing WACC against the exit multiple. This is how a DCF becomes a <em>range</em> rather than a single number.` },
      "B107:O132": { title: "Implied share price — treasury stock method (TSM)",
        html: `<ul>
          <li>Repeats the EV → equity bridge, then converts to a per-share price.</li>
          <li><strong>Options/warrants</strong> (rows 118–123): in-the-money tranches are assumed exercised; the cash raised buys back shares at the implied price (TSM), giving <em>net</em> new shares.</li>
          <li><span data-tex="\\text{Diluted shares} = \\text{Basic} + \\text{net new from options}" data-display></span> = 80.05m (basic 79.7m, <code>F125</code>).</li>
          <li><strong>Implied share price</strong> <code>F132</code> = equity value ÷ diluted shares = <strong>$59.45</strong>.</li></ul>` },
    },
    footnotes: ["This sheet is circular by design: the implied share price sets the option dilution, which sets the diluted share count, which sets the share price. Excel resolves it with iterative calculation enabled."],
  },
};

if (typeof module !== 'undefined') module.exports = { WORKBOOK_NOTES };
