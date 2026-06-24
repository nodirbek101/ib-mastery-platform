/* ============================================================================
   COMPS TUTOR — built-in, context-aware (no API key). Mirrors the DCF tutor.
   ========================================================================== */

const tutorLog = () => document.getElementById('tutorlog');

function tutorSay(html, head) {
  const log = tutorLog(); const m = document.createElement('div');
  m.className = 'msg bot';
  m.innerHTML = (head ? `<div class="mhead">${head}</div>` : '') + html;
  log.appendChild(m); log.scrollTop = log.scrollHeight;
  if (typeof renderTexIn === 'function') renderTexIn(m);
}
function tutorUser(text) {
  const log = tutorLog(); const m = document.createElement('div');
  m.className = 'msg user'; m.textContent = text;
  log.appendChild(m); log.scrollTop = log.scrollHeight;
}
function tutorThinking() {
  const log = tutorLog(); const m = document.createElement('div');
  m.className = 'msg bot'; m.id = 'thinking';
  m.innerHTML = '<div class="typing"><span></span><span></span><span></span></div>';
  log.appendChild(m); log.scrollTop = log.scrollHeight;
}
function tutorStopThinking() { const t = document.getElementById('thinking'); if (t) t.remove(); }

const KB = [
  { k: ['why comps', 'market value', 'vs dcf', 'relative'], a:
    "Comparable companies gives a <strong>market-based</strong> (relative) valuation: what investors pay <em>today</em> for similar businesses. It's the perfect cross-check on the DCF's intrinsic value — here comps imply ~<strong>$5.1bn</strong> for ValueCo vs the DCF's $6.0bn, so the DCF looks a touch optimistic." },
  { k: ['ev/ebitda', 'ebitda multiple', 'enterprise multiple'], a:
    "<strong>EV/EBITDA</strong> is the workhorse multiple: <code>EV ÷ EBITDA</code>. It's capital-structure- and D&A-neutral, so it compares cleanly across peers with different leverage. ValueCo: median 7.3× × $700m ≈ <strong>$5.1bn EV</strong>." },
  { k: ['p/e', 'pe ', 'price earnings', 'earnings multiple'], a:
    "<strong>P/E</strong> = share price ÷ EPS — an <em>equity</em> multiple. Because it already reflects leverage and tax, it varies more across differently-financed peers, so it's used alongside (not instead of) EV multiples." },
  { k: ['enterprise value', 'equity value', 'bridge', 'net debt'], a:
    "<strong>Enterprise value</strong> = equity + debt + preferred + minority − cash (value to all investors). To go back to <strong>equity value</strong> subtract net debt. EV pairs with EBITDA/EBIT/Sales; equity value pairs with net income / EPS." },
  { k: ['ltm', 'last twelve', 'calendar', 'stub'], a:
    "<strong>LTM</strong> (last twelve months) calendarises results so every company is measured over the same trailing year: <code>LTM = Current FY + Current stub − Prior stub</code>. Essential when companies have different fiscal year-ends." },
  { k: ['adjust', 'non-recurring', 'one-off', 'clean'], a:
    "Reported earnings are <strong>adjusted</strong> for non-recurring items (restructuring, asset sales, write-downs) so the multiple reflects <em>ongoing</em> performance. Every add-back must be sourced from filings." },
  { k: ['median', 'mean', 'why median', 'average'], a:
    "Bankers usually lead with the <strong>median</strong> because it isn't distorted by a single outlier multiple. Mean, high and low are shown too — high/low define the valuation <em>range</em>." },
  { k: ['select', 'universe', 'choose comps', 'comparable'], a:
    "Step I is choosing the <strong>universe</strong>: companies similar in <em>business</em> (sector, products, end-markets) and <em>financials</em> (size, growth, margins). Sources: competitors named in filings, equity-research peer groups, and screens. Garbage in, garbage out." },
  { k: ['implied', 'valuation', 'apply', 'how value', 'value valueco', 'how do i value', 'value the target'], a:
    "Step V applies a chosen multiple to the target's metric: <code>Implied EV = multiple × metric</code>. ValueCo: 7.3× × $700m EBITDA ≈ $5.1bn EV; subtract net debt ($1,317m) → ~$3.8bn equity. The low/high multiples give the range ($4.2–6.3bn EV)." },
  { k: ['ev/sales', 'sales multiple', 'revenue multiple'], a:
    "<strong>EV/Sales</strong> ignores profitability, so it's mainly used for low- or negative-margin companies. For a profitable industrial like ValueCo it reads low (~$3.7bn) and gets little weight." },
  { k: ['ev/ebit', 'ebit multiple'], a:
    "<strong>EV/EBIT</strong> is like EV/EBITDA but after depreciation, so it captures differences in capital intensity. A useful cross-check: 9.9× × $500m EBIT ≈ $4.95bn EV for ValueCo." },
];

const FALLBACK =
  "I'm a focused comps tutor — strongest on: choosing comparables, EV vs equity value, the EV/EBITDA / EV/EBIT / P/E multiples, LTM calendarisation, adjusting for one-offs, mean vs median, and applying a multiple to value the target. Ask about any of those, use a chip below, or tell me which cell you're on.";

function tutorAnswer(q) {
  const s = q.toLowerCase(); let best = null, score = 0;
  for (const it of KB) { let sc = 0; for (const kw of it.k) if (s.includes(kw)) sc += kw.length; if (sc > score) { score = sc; best = it; } }
  return best ? best.a : FALLBACK;
}
function sendTutor(preset) {
  const el = document.getElementById('tutorinput');
  const q = (preset != null ? preset : el.value).trim();
  if (!q) return;
  el.value = ''; tutorUser(q); tutorThinking();
  setTimeout(() => { tutorStopThinking(); tutorSay(tutorAnswer(q)); }, 460);
}
const CHIPS = ['Why comps vs DCF?', 'What is EV/EBITDA?', 'EV vs equity value?', 'Why median?', 'How do I value ValueCo?'];
function renderChips() {
  const host = document.getElementById('tutorchips'); host.innerHTML = '';
  CHIPS.forEach(c => { const b = document.createElement('button'); b.textContent = c; b.onclick = () => sendTutor(c); host.appendChild(b); });
}
document.addEventListener('DOMContentLoaded', () => {
  renderChips();
  const inp = document.getElementById('tutorinput');
  if (inp) inp.addEventListener('keydown', e => { if (e.key === 'Enter') sendTutor(); });
});
