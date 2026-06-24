/* ============================================================================
   COMPARABLE COMPANIES — workbook notes (every line explained, with LaTeX).
   Consumed by the shared workbook renderer (js/workbook.js) on comps.html.
   Tabs: List · Spread (one company) · Bench (benchmarking) · Output (summary).
   ========================================================================== */

const WORKBOOK_NOTES = {

  /* ========================= LIST ========================= */
  List: {
    overview:
      `The <strong>List</strong> tab is the comps <strong>universe</strong> — the slate of public companies
       judged similar enough to ValueCo to price it. Each row carries the essentials: business description,
       equity value, enterprise value, and last-twelve-months (LTM) sales and EBITDA. ValueCo (the target)
       sits at the top for reference.`,
    flow:
      `<strong>Pulls from:</strong> each company's own Input/Spread page (<code>=VLCO!…</code>,
       <code>=JDG!…</code>) so the list stays in sync as you spread each name. <strong>Feeds:</strong> nothing
       computational — it's the roster that the Benchmarking and Output tabs then analyse.`,
    sections: [
      { title: "Header", intro: "The columns you'll compare across the universe.", groups: ["B1:H4"] },
      { title: "The comparable universe", intro: "ValueCo plus its peers, sorted by size. Selecting a good set of comparables is Step I of the whole analysis — get this wrong and everything downstream is off.", groups: ["B5:H20"] },
    ],
    notes: {},
    groups: {
      "B1:H4": { title: "Column headers",
        html: `Each company is described by <strong>Equity Value</strong> (market cap), <strong>Enterprise Value</strong>, and <strong>LTM Sales</strong> and <strong>LTM EBITDA</strong> — the size and profitability that determine whether it's truly comparable.` },
      "B5:H20": { title: "Selecting comparable companies (Step I)",
        html: `<ul>
          <li><strong>Row 5 is the target</strong> (ValueCo), linked from its own page; the rest are peers.</li>
          <li>Good comparables share <em>business</em> (sector, products, end-markets) and <em>financial</em> profile (size, growth, margins). Here they're all specialty/commodity chemical makers.</li>
          <li>Some rows are <em>links</em> to a fully-spread page (e.g. <code>=JDG!$E$24</code>); others hold summary figures. Equity value, EV, sales and EBITDA let you screen the set before doing detailed work.</li></ul>` },
    },
    footnotes: ["A typical screen starts broad (sector peers, competitors named in filings, companies the equity research analysts group together) then narrows to the closest 5–15 names."],
  },

  /* ========================= SPREAD (one company) ========================= */
  Spread: {
    overview:
      `The <strong>Input Page</strong> is where you “spread” one company — the central craft of comps. You key
       in its reported financials, <strong>adjust</strong> them for non-recurring items, <strong>calendarise</strong>
       to a last-twelve-months (LTM) figure, compute its <strong>enterprise value</strong>, and finally divide to
       get its <strong>trading multiples</strong>. Every company in the universe gets one of these (this is
       Gasparro Corp., ticker JDG).`,
    flow:
      `<strong>Self-contained:</strong> everything is computed from the raw inputs on this page.
       <strong>Feeds:</strong> the company's multiples and statistics flow to the Benchmarking and Output tabs
       (e.g. <code>Output!B14 =+JDG!$E$7</code>).`,
    sections: [
      { title: "Identity & business", intro: "Who the company is.", groups: ["A1:T5"] },
      { title: "General information", intro: "Ratings, beta and tax rate used later.", groups: ["A6:E15"] },
      { title: "Market data → Enterprise value", intro: "Turn the share price into equity value, then bridge to enterprise value.", cells: ["E24", "E30"], groups: ["A16:E30"] },
      { title: "Trading multiples", intro: "The output of the whole page — how the market prices this company.", cells: ["B37", "B41"], groups: ["A32:E44"] },
      { title: "Returns, credit & growth", intro: "Quality and risk statistics used to benchmark.", groups: ["A46:E68"] },
      { title: "Reported income statement (with LTM)", intro: "Three fiscal years plus the stub maths that build a last-twelve-months column.", groups: ["G6:N25"] },
      { title: "Adjusted income statement", intro: "Strip out one-off items so the multiples reflect ongoing performance.", groups: ["G27:O51"] },
      { title: "Cash flow & D&A", intro: "Feeds free cash flow and EBITDA.", groups: ["G53:O62"] },
      { title: "Footnotes (non-recurring items)", intro: "The audit trail behind each adjustment.", groups: ["G64:O68"] },
      { title: "Balance sheet", intro: "Supplies cash and debt for the EV bridge, and the balance check.", groups: ["P6:T33"] },
      { title: "Fully diluted shares & dilutive securities", intro: "Options and convertibles that increase the share count.", groups: ["P36:T62"] },
    ],
    notes: {
      "E24": { label: "Equity value (market capitalization)",
        what: "Share price × fully diluted shares.",
        why: "<span data-tex=\"\\text{Equity Value} = \\text{Price}\\times\\text{Diluted Shares}\"></span> — the market value of all equity. The starting point for enterprise value." },
      "E30": { label: "Enterprise value",
        what: "The value of the whole business, capital-structure-neutral.",
        why: "<span data-tex=\"\\text{EV} = \\text{Equity} + \\text{Debt} + \\text{Preferred} + \\text{NCI} - \\text{Cash}\"></span>. EV is used with EBITDA/EBIT/Sales (which belong to all investors); equity value is used with net income / EPS." },
      "B37": { label: "EV / EBITDA (LTM)",
        what: "The headline multiple — enterprise value per dollar of LTM EBITDA.",
        why: "<span data-tex=\"\\text{EV}/\\text{EBITDA} = \\dfrac{\\text{Enterprise Value}}{\\text{LTM EBITDA}}\"></span>. Capital-structure- and D&A-neutral, so it's the most comparable multiple across peers." },
      "B41": { label: "P / E (LTM)",
        what: "Share price per dollar of earnings.",
        why: "<span data-tex=\"\\text{P/E} = \\dfrac{\\text{Share Price}}{\\text{Diluted EPS}}\"></span>. An <em>equity</em> multiple — it already reflects leverage and tax, so it differs across differently-financed peers." },
    },
    groups: {
      "A1:T5": { title: "Identity & business description",
        html: `Company name, ticker and exchange, plus a one-line description of what it does. The header (<code>A1</code>) auto-builds the title from the name/ticker. Matching the <em>business</em> is the first test of comparability.` },
      "A6:E15": { title: "General information",
        html: `<ul><li>Fiscal year-end, credit ratings (Moody's / S&P), <strong>predicted beta</strong>, and <strong>marginal tax rate</strong>.</li>
          <li>Beta feeds risk comparisons; the tax rate is used to tax-effect adjustments later. These are inputs gathered from filings and data providers.</li></ul>` },
      "A16:E30": { title: "Market data → equity value → enterprise value",
        html: `<ul>
          <li><strong>Current price</strong>, 52-week high/low and dividend are market inputs.</li>
          <li><strong>Equity value</strong> = price × fully diluted shares: <span data-tex="\\text{Equity} = \\text{Price}\\times\\text{Diluted Shares}" data-display></span></li>
          <li><strong>Enterprise value</strong> bridges from equity by adding net debt and minority/preferred and removing cash: <span data-tex="\\text{EV} = \\text{Equity} + \\text{Debt} + \\text{Preferred} + \\text{NCI} - \\text{Cash}" data-display></span></li></ul>` },
      "A32:E44": { title: "Trading multiples — the payoff",
        html: `<ul>
          <li>Column B is the <strong>LTM</strong> multiple; columns C–E are forward multiples on next-fiscal-year (NFY) consensus estimates.</li>
          <li><strong>EV multiples</strong> use enterprise value over Sales, EBITDA, EBIT (whole-firm metrics).</li>
          <li><strong>P/E</strong> and <strong>FCF yield</strong> are equity multiples (price over per-share metrics).</li>
          <li>EV/EBITDA <span data-tex="=\\dfrac{\\text{EV}}{\\text{EBITDA}}"></span> is the workhorse; P/E <span data-tex="=\\dfrac{\\text{Price}}{\\text{EPS}}"></span>.</li></ul>` },
      "A46:E68": { title: "Returns, credit statistics & growth",
        html: `<ul>
          <li><strong>Return ratios</strong> — ROIC, ROE, ROA — measure quality.</li>
          <li><strong>Credit stats</strong> — Debt/EBITDA, EBITDA/interest, etc. — measure leverage and risk.</li>
          <li><strong>Growth rates</strong> — historical and estimated sales/EBITDA/EPS CAGRs. Faster-growing, higher-quality peers justify higher multiples; these stats explain <em>why</em> multiples differ.</li></ul>` },
      "G6:N25": { title: "Reported income statement & the LTM calculation",
        html: `<ul>
          <li>Three reported fiscal years (cols I–K) plus a <strong>prior stub</strong> and <strong>current stub</strong> (cols L–M).</li>
          <li>The <strong>LTM</strong> column (N) calendarises to the latest twelve months: <span data-tex="\\text{LTM} = \\text{Current FY} + \\text{Current Stub} - \\text{Prior Stub}" data-display></span></li>
          <li>This walks Sales → COGS → Gross profit → SG&A → EBIT → interest → pre-tax → taxes → net income → EPS, just like the company's filings.</li></ul>` },
      "G27:O51": { title: "Adjusted income statement (clean earnings)",
        html: `<ul>
          <li>Reported figures are <strong>adjusted for non-recurring items</strong> (restructuring, asset sales, inventory write-downs — see the footnotes) so multiples reflect <em>ongoing</em> performance.</li>
          <li><strong>Adjusted EBITDA</strong> = adjusted EBIT + D&A: <span data-tex="\\text{Adj. EBITDA} = \\text{Adj. EBIT} + \\text{D\\&A}" data-display></span></li>
          <li>Adjusted net income and adjusted diluted EPS feed the P/E. Non-operating adjustments are tax-effected at the marginal rate.</li></ul>` },
      "G53:O62": { title: "Cash flow data & D&A",
        html: `Cash from operations less capital expenditures gives <strong>free cash flow</strong> (<span data-tex="\\text{FCF}=\\text{CFO}-\\text{Capex}"></span>), which drives the FCF-yield multiple. Depreciation & amortisation is pulled in to build EBITDA.` },
      "G64:O68": { title: "Footnotes — the adjustment audit trail",
        html: `Each non-recurring adjustment is documented with its source (10-K/10-Q page). This discipline is what makes the “adjusted” numbers defensible — a banker must be able to justify every add-back.` },
      "P6:T33": { title: "Balance sheet",
        html: `<ul>
          <li>Prior- and current-period balances. Supplies <strong>cash</strong> and <strong>total debt</strong> for the EV bridge and the leverage ratios.</li>
          <li>The <strong>balance check</strong> (row 33) confirms assets = liabilities + equity — a basic integrity test.</li></ul>` },
      "P36:T62": { title: "Fully diluted shares & dilutive securities",
        html: `<ul>
          <li><strong>Fully diluted shares</strong> = basic + net new shares from in-the-money options (treasury-stock method) + shares from convertibles.</li>
          <li>The <strong>options/warrants</strong> and <strong>convertibles</strong> blocks compute that dilution. Diluted shares feed equity value and EPS — and therefore every per-share multiple.</li></ul>` },
    },
    footnotes: ["Spreading is repeated for every company in the universe. The discipline — adjust for one-offs, calendarise to LTM, use consistent definitions — is what makes multiples comparable across names."],
  },

  /* ========================= BENCH (benchmarking) ========================= */
  Bench: {
    overview:
      `<strong>Benchmarking</strong> is Step IV — laying the spread companies side by side to decide <em>which</em>
       are the best comparables and <em>where</em> the target should fall. This page gathers the quality and risk
       statistics: returns (ROIC/ROE/ROA), dividend yield, leverage ratios, coverage ratios, and credit ratings.`,
    flow:
      `<strong>Pulls from:</strong> each company's Spread page (<code>=+VLCO!…</code>, <code>=+JDG!…</code>) and
       the Output tab's tier labels. <strong>Used to:</strong> judge comparability and pick the multiple range
       to apply to the target.`,
    sections: [
      { title: "Header & target row", intro: "The statistics tracked, with ValueCo pinned at the top.", groups: ["A1:U11"] },
      { title: "Companies by tier, with mean/median", intro: "Peers grouped into tiers; each tier (and the overall set) is summarised by mean and median.", groups: ["A13:U50"] },
      { title: "Sources & notes", intro: "Provenance of the data.", groups: ["A52:U53"] },
    ],
    notes: {},
    groups: {
      "A1:U11": { title: "What's being benchmarked",
        html: `<ul>
          <li><strong>Return on investment:</strong> ROIC, ROE, ROA, dividend yield — how profitably each company uses capital.</li>
          <li><strong>Leverage:</strong> Debt/Total-cap, Debt/EBITDA, Net-debt/EBITDA.</li>
          <li><strong>Coverage:</strong> EBITDA/Interest, (EBITDA−Capex)/Interest, EBIT/Interest — ability to service debt.</li>
          <li><strong>Credit ratings</strong> (Moody's, S&P). ValueCo (row 11) is shown first so you can see where the target sits versus peers.</li></ul>` },
      "A13:U50": { title: "Tiers, mean & median",
        html: `<ul>
          <li>Companies are split into <strong>tiers</strong> (e.g. specialty vs commodity vs small-cap) because closer comparables deserve more weight.</li>
          <li>Each tier and the <strong>overall</strong> set get <span data-tex="\\text{mean}"></span>, <span data-tex="\\text{median}"></span>, high and low. Median is often preferred — it's not distorted by a single outlier.</li>
          <li>This is where judgement enters: a target that is higher-growth and lower-levered than the median peer should trade <em>above</em> the median multiple.</li></ul>` },
      "A52:U53": { title: "Sources & notes",
        html: `Data sourced from company filings, Bloomberg and consensus estimates; LTM as of the stated date. Consistent sourcing and dating is essential for a clean comparison.` },
    },
    footnotes: ["Benchmarking turns a table of numbers into a decision: which peers are truly comparable, and what multiple range to apply to the target."],
  },

  /* ========================= OUTPUT (summary) ========================= */
  Output: {
    overview:
      `The <strong>Output</strong> tab is the one-page summary an analyst actually shows — every comparable's
       <strong>trading multiples</strong> in one grid: EV/Sales, EV/EBITDA, EV/EBIT (LTM and forward), EBITDA
       margin, leverage, and P/E, with <strong>mean, median, high and low</strong>. From these you pick the
       range to apply to the target (Step V).`,
    flow:
      `<strong>Pulls from:</strong> each Spread page's multiples. <strong>Leads to valuation:</strong> the chosen
       median EV/EBITDA (≈ 7.3×) applied to ValueCo's $700m LTM EBITDA implies ~$5.1bn enterprise value — the
       comps answer you'll build in the Practice Lab and compare with the DCF.`,
    sections: [
      { title: "Header — the multiples tracked", intro: "Share price, equity & enterprise value, then the multiple columns.", groups: ["B1:AB8"] },
      { title: "Companies, tiers & summary statistics", intro: "Each company's multiples, grouped by tier, with mean / median / high / low.", groups: ["B10:AB46"] },
      { title: "Sources & notes", intro: "Provenance and dating.", groups: ["B48:AB49"] },
    ],
    notes: {},
    groups: {
      "B1:AB8": { title: "The multiple columns",
        html: `<ul>
          <li><strong>Current share price</strong>, % of 52-week high, <strong>equity value</strong> and <strong>enterprise value</strong>.</li>
          <li><strong>EV / Sales</strong>, <strong>EV / EBITDA</strong>, <strong>EV / EBIT</strong> — each shown LTM, 2019E and 2020E.</li>
          <li><strong>EBITDA margin</strong>, <strong>Total Debt / EBITDA</strong>, <strong>P / E</strong> (LTM/2019E/2020E) and <strong>long-term EPS growth</strong>.</li></ul>` },
      "B10:AB46": { title: "Reading the grid & choosing a multiple",
        html: `<ul>
          <li>Companies are grouped into <strong>tiers</strong>; each tier and the overall set show <strong>Mean / Median / High / Low</strong> (<code>AVERAGE</code>, <code>MEDIAN</code>, <code>MAX</code>, <code>MIN</code>).</li>
          <li>The valuation step applies a chosen multiple to the target's metric: <span data-tex="\\text{Implied EV} = \\text{Multiple}\\times\\text{Target Metric}" data-display></span></li>
          <li>For ValueCo: median EV/EBITDA ≈ 7.3× × $700m ≈ <strong>$5.1bn EV</strong>; the high/low multiples give the range. Equity value then = EV − net debt.</li></ul>` },
      "B48:AB49": { title: "Sources & notes",
        html: `Company filings, Bloomberg and consensus estimates; LTM based on the stated date, estimates on a calendar-year basis. The footnotes keep the page audit-ready.` },
    },
    footnotes: ["The Output page is the comps deliverable. The art is choosing where in the range the target belongs — guided by the benchmarking on the previous tab."],
  },
};

if (typeof module !== 'undefined') module.exports = { WORKBOOK_NOTES };
