/* ============================================================================
   BUILT-IN DCF TUTOR  (no API key — a curated, context-aware knowledge base)
   Exposes: tutorSay(), sendTutor(), and helpers used by the guided lab.
   ========================================================================== */

const tutorLog = () => document.getElementById('tutorlog');

function tutorSay(html, head) {
  const log = tutorLog();
  const m = document.createElement('div');
  m.className = 'msg bot';
  m.innerHTML = (head ? `<div class="mhead">${head}</div>` : '') + html;
  log.appendChild(m);
  log.scrollTop = log.scrollHeight;
}
function tutorUser(text) {
  const log = tutorLog();
  const m = document.createElement('div');
  m.className = 'msg user';
  m.textContent = text;
  log.appendChild(m);
  log.scrollTop = log.scrollHeight;
}
function tutorThinking() {
  const log = tutorLog();
  const m = document.createElement('div');
  m.className = 'msg bot'; m.id = 'thinking';
  m.innerHTML = '<div class="typing"><span></span><span></span><span></span></div>';
  log.appendChild(m); log.scrollTop = log.scrollHeight;
}
function tutorStopThinking() { const t = document.getElementById('thinking'); if (t) t.remove(); }

/* ---- Knowledge base: keyword-matched answers ---------------------------- */
const KB = [
  { k: ['wacc', 'discount rate', 'cost of capital'], a:
    "<strong>WACC</strong> is the blended return debt and equity investors require — the rate we discount every future cash flow with. Formula: <code>WACC = (D/V)·k_d·(1−t) + (E/V)·k_e</code>. For ValueCo it's <strong>11.0%</strong> (after-tax cost of debt ~4.9% at 30% weight, cost of equity ~13.6% at 70%). A higher WACC means more risk → cash is discounted harder → lower value." },
  { k: ['cost of equity', 'capm', 'beta'], a:
    "Cost of equity comes from <strong>CAPM</strong>: <code>k_e = risk-free rate + β × equity risk premium</code> (often + a size premium). β measures how much the stock moves with the market. ValueCo's build-up: 2.5% + 1.43×7.0% + 1.1% ≈ <strong>13.6%</strong>." },
  { k: ['terminal value', 'exit multiple', 'tv'], a:
    "<strong>Terminal value</strong> captures all value beyond the 5-year forecast. The <strong>Exit Multiple Method</strong>: <code>TV = terminal-year EBITDA × exit multiple</code>. ValueCo: $929.2m × 7.5× = <strong>$6,969m</strong>. It's usually the majority of total DCF value — here about <strong>69%</strong>." },
  { k: ['perpetuity', 'growth method', 'gordon', 'pgm'], a:
    "The <strong>Perpetuity Growth Method</strong> treats terminal-year FCF as a perpetuity: <code>TV = FCF·(1+g)/(WACC−g)</code>. We use it as a cross-check: ValueCo's 7.5× exit multiple implies <strong>g ≈ 2.6%</strong> — a sensible long-run rate, so the multiple is defensible." },
  { k: ['free cash flow', 'fcf', 'unlevered'], a:
    "<strong>Unlevered free cash flow</strong> is cash available to all investors, before financing: <code>FCF = EBIT×(1−t) + D&A − Capex − Increase in NWC</code>. 'Unlevered' = before interest, which is why we tax EBIT (not pre-tax income)." },
  { k: ['ebitda', 'ebit', 'ebiat'], a:
    "<strong>EBITDA</strong> = Gross profit − SG&A (earnings before interest, tax, D&A). Subtract D&A → <strong>EBIT</strong>. Tax EBIT → <strong>EBIAT</strong> (after-tax). We add D&A back in the FCF build because it's non-cash." },
  { k: ['mid-year', 'midyear', 'convention'], a:
    "The <strong>mid-year convention</strong> assumes cash arrives in the middle of each year, so discount periods are 0.5, 1.5, 2.5… instead of 1, 2, 3. Cash comes sooner → slightly higher present value. It's the market-standard assumption." },
  { k: ['nwc', 'working capital'], a:
    "<strong>Net working capital</strong> = current operating assets − current operating liabilities (receivables + inventory + prepaids − payables − accruals). When sales grow, NWC grows and <em>ties up</em> cash, so an <em>increase</em> in NWC is subtracted from FCF." },
  { k: ['enterprise value', 'ev'], a:
    "<strong>Enterprise value</strong> = sum of the present values of projected FCF + PV of terminal value. It's the value of the whole business to all capital providers. ValueCo: $1,872.9m (FCF) + $4,135.8m (TV) = <strong>$6,008.7m</strong>." },
  { k: ['equity value', 'share price', 'per share', 'diluted'], a:
    "Bridge from EV to equity: <code>Equity = EV − Total Debt − Preferred − Minority + Cash</code>. ValueCo: 6,008.7 − 1,500 + 250 = <strong>$4,758.7m</strong>. Divide by <strong>80.05m</strong> fully-diluted shares (treasury-stock method) → <strong>$59.45</strong>/share." },
  { k: ['tax', 'tax rate'], a:
    "We apply the <strong>25%</strong> marginal tax rate to <strong>EBIT</strong>, giving EBIAT. Crucially we tax EBIT, not earnings after interest — unlevered FCF ignores the interest tax shield, which lives in the WACC instead." },
  { k: ['sensitivity', 'data table'], a:
    "Because a DCF rests on assumptions, the output is a <strong>range</strong>, not one number. <strong>Sensitivity analysis</strong> flexes WACC and the exit multiple (the two biggest swing factors) to show how EV moves — try the WACC slider in the Theory tab." },
  { k: ['intrinsic', 'why dcf', 'vs comps', 'market value'], a:
    "A DCF gives <strong>intrinsic value</strong> — based on the company's own cash flows, not what the market currently pays. That makes it a vital cross-check on comparable-companies and precedent-transaction analysis, which can be distorted by market sentiment." },
  { k: ['growth', 'sales growth', 'projection'], a:
    "Sales growth is the model's biggest lever — every line scales off sales. ValueCo glides from <strong>7.5% → 3%</strong> over five years, converging to a sustainable steady-state rate that the terminal value can be built on." },
];

const FALLBACK =
  "Great question. I'm a focused DCF tutor, so I'm best on: free cash flow, WACC, cost of equity/CAPM, terminal value, the perpetuity cross-check, the mid-year convention, working capital, and bridging EV → equity → share price. Try one of the chips below, or ask about any of those — or just tell me which cell you're stuck on.";

function tutorAnswer(q) {
  const s = q.toLowerCase();
  let best = null, bestScore = 0;
  for (const item of KB) {
    let score = 0;
    for (const kw of item.k) if (s.includes(kw)) score += kw.length;
    if (score > bestScore) { bestScore = score; best = item; }
  }
  return best ? best.a : FALLBACK;
}

function sendTutor(preset) {
  const inputEl = document.getElementById('tutorinput');
  const q = (preset != null ? preset : inputEl.value).trim();
  if (!q) return;
  inputEl.value = '';
  tutorUser(q);
  tutorThinking();
  setTimeout(() => { tutorStopThinking(); tutorSay(tutorAnswer(q)); }, 480);
}

/* suggestion chips */
const CHIPS = ['Why WACC?', 'What is terminal value?', 'Why tax EBIT?', 'Mid-year convention?', 'EV → share price'];
function renderChips() {
  const host = document.getElementById('tutorchips');
  host.innerHTML = '';
  CHIPS.forEach(c => {
    const b = document.createElement('button');
    b.textContent = c;
    b.onclick = () => sendTutor(c);
    host.appendChild(b);
  });
}

/* Enter-to-send */
document.addEventListener('DOMContentLoaded', () => {
  renderChips();
  const inp = document.getElementById('tutorinput');
  if (inp) inp.addEventListener('keydown', e => { if (e.key === 'Enter') sendTutor(); });
});
