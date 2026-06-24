/* ============================================================================
   THE LAB  —  interactive DCF spreadsheet
   Renders the model, parses inputs, recomputes live via the verified engine,
   scores against the answer key, and drives guided coaching + completion.
   ========================================================================== */

const vals = {};        // id -> number (parsed) or undefined
let mode = 'guided';
let cursorIdx = 0;
let labStarted = false;
let solved = false;

const PROJ = DCF_CONST.projYears;            // [2020..2024]
const YR_HEADERS = PROJ.map(y => y + 'E');

/* ---- number formatting helpers ---- */
FMT.price = v => '$' + v.toFixed(2);
function trimNum(n) {
  if (n == null || isNaN(n)) return '';
  return parseFloat(n.toFixed(4)).toString();
}
function fmtVal(key, v) {
  if (v == null || isNaN(v)) return '—';
  const f = KEYFMT[key] || 'dollar';
  return (FMT[f] || FMT.dollar)(v);
}

/* which formatter each computed key uses */
const KEYFMT = {
  sales:'dollar', cogs:'dollar', gp:'dollar', sga:'dollar', ebitda:'dollar', da:'dollar',
  ebit:'dollar', taxes:'dollar', ebiat:'dollar', plusda:'dollar', capex:'dollar', dnwc:'dollar', fcf:'dollar',
  period:'num1', factor:'factor', pv:'dollar',
  cumPV:'dollar', terminalEbitda:'dollar', tv:'dollar', tvFactor:'factor', pvTV:'dollar',
  ev:'dollar', equity:'dollar', fullyDiluted:'shares', sharePrice:'price',
  impliedPGR:'pct2', impliedEVEBITDA:'mult',
};

/* resolve a computed value from the engine result */
function getVal(r, key, yr) {
  if (yr != null) {
    const row = r.rows[yr]; if (!row) return null;
    switch (key) {
      case 'plusda': return row.da;
      case 'capex':  return -row.capex;
      case 'dnwc':   return row.dNWC;
      default:       return row[key];
    }
  }
  return r[key];
}

/* tolerance for marking an input correct */
function tolFor(id) {
  const meta = INPUTS[id];
  if (meta.tol != null) return meta.tol;
  if (meta.as === 'pct') return 0.0006;          // accepts e.g. "19" for 18.99%
  if (id === 'exitMult') return 0.05;
  return 0.5;                                     // debt / cash
}
function isCorrect(id) {
  const v = vals[id];
  return v != null && Math.abs(v - INPUTS[id].answer) <= tolFor(id);
}
function isFilled(id) { return vals[id] != null; }

/* display string for an input element */
function displayRaw(id) {
  const v = vals[id];
  if (v == null) return '';
  return INPUTS[id].as === 'pct' ? trimNum(v * 100) : trimNum(v);
}

/* effective inputs for the engine (missing -> 0, never reveals answers) */
function effInputs() {
  const o = {};
  for (const id in INPUTS) o[id] = (vals[id] != null ? vals[id] : 0);
  return o;
}

/* ---------------------------------------------------------------------------
   Layout spec
   --------------------------------------------------------------------------- */
function inputCell(id) {
  return `<td class="cell-input" data-input="${id}"><input type="text" inputmode="decimal"
            data-id="${id}" value="${displayRaw(id)}" aria-label="${id}"><span class="tick"></span></td>`;
}
function calcCellsPerYear(key) {
  return PROJ.map((y, i) => `<td class="num calc" data-calc="${key}" data-yr="${i}"></td>`).join('');
}

function buildTableA() {
  let h = '<table class="sheet"><thead><tr><th style="text-align:left;min-width:230px;">($ in millions)</th>';
  YR_HEADERS.forEach(y => h += `<th class="head-year">${y}</th>`);
  h += '</tr></thead><tbody>';

  const sec = t => `<tr><td class="section" colspan="6">${t}</td></tr>`;
  const spacer = '<tr class="spacer"><td colspan="6"></td></tr>';

  // Operating assumptions
  h += sec('Operating Assumptions  ·  inputs');
  // sales growth — one input per year
  h += '<tr><td class="label">Sales growth (% YoY)</td>';
  ['g2020','g2021','g2022','g2023','g2024'].forEach(id => h += inputCell(id));
  h += '</tr>';
  // constant-driver rows: input in year 1, copied across
  const constRow = (label, id) => {
    let r = `<tr><td class="label">${label}</td>` + inputCell(id);
    for (let i = 1; i < 5; i++) r += `<td class="num calc" data-copy="${id}"></td>`;
    return r + '</tr>';
  };
  h += constRow('COGS (% of sales)', 'cogsPct');
  h += constRow('SG&amp;A (% of sales)', 'sgaPct');
  h += constRow('D&amp;A (% of sales)', 'daPct');
  h += constRow('Capital expenditure (% of sales)', 'capexPct');
  h += constRow('Marginal tax rate', 'taxRate');

  // FCF build
  h += spacer + sec('Unlevered Free Cash Flow  ·  calculated');
  const calcRow = (label, key, cls) => `<tr><td class="label ${cls||''}">${label}</td>${calcCellsPerYear(key)}</tr>`;
  h += calcRow('Sales', 'sales');
  h += calcRow('Cost of goods sold', 'cogs', 'indent');
  h += `<tr><td class="label">Gross profit</td>${PROJ.map((y,i)=>`<td class="num calc" data-calc="gp" data-yr="${i}"></td>`).join('')}</tr>`;
  h += calcRow('Selling, general &amp; administrative', 'sga', 'indent');
  h += `<tr><td class="label" style="font-weight:600">EBITDA</td>${PROJ.map((y,i)=>`<td class="num calc" data-calc="ebitda" data-yr="${i}" style="font-weight:600"></td>`).join('')}</tr>`;
  h += calcRow('Depreciation &amp; amortisation', 'da', 'indent');
  h += calcRow('EBIT', 'ebit');
  h += calcRow('Taxes', 'taxes', 'indent');
  h += calcRow('EBIAT', 'ebiat');
  h += calcRow('Plus: D&amp;A', 'plusda', 'indent');
  h += calcRow('Less: Capital expenditures', 'capex', 'indent');
  h += calcRow('Less: Increase in net working capital', 'dnwc', 'indent');
  h += `<tr><td class="label" style="font-weight:700">Unlevered free cash flow</td>${PROJ.map((y,i)=>`<td class="num calc total" data-calc="fcf" data-yr="${i}"></td>`).join('')}</tr>`;

  // Discounting
  h += spacer + sec('Discounting  ·  WACC is an input');
  h += `<tr><td class="label">WACC (discount rate)</td>${inputCell('wacc')}<td class="num calc" colspan="4" style="text-align:left;padding-left:12px;color:var(--slate-soft);font-style:italic;">applied to every period →</td></tr>`;
  h += calcRow('Discount period (mid-year)', 'period', 'indent');
  h += calcRow('Discount factor', 'factor', 'indent');
  h += `<tr><td class="label" style="font-weight:700">Present value of FCF</td>${PROJ.map((y,i)=>`<td class="num calc total" data-calc="pv" data-yr="${i}"></td>`).join('')}</tr>`;

  h += '</tbody></table>';
  return h;
}

function buildTableB() {
  const row = (label, key, opt) => {
    opt = opt || {};
    const cls = opt.total ? 'num calc total' : 'num calc';
    return `<tr><td class="label ${opt.indent?'indent':''}" ${opt.bold?'style="font-weight:700"':''}>${label}</td>
            <td class="${cls}" data-calc="${key}" style="min-width:140px"></td></tr>`;
  };
  const inRow = (label, id) => `<tr><td class="label">${label}</td>${inputCell(id)}</tr>`;
  const sec = t => `<tr><td class="section" colspan="2">${t}</td></tr>`;
  const spacer = '<tr class="spacer"><td colspan="2"></td></tr>';

  let h = '<table class="sheet" style="margin-top:22px;max-width:520px;"><thead><tr><th style="text-align:left;min-width:300px;">Valuation</th><th class="head-year">Value</th></tr></thead><tbody>';
  h += sec('Terminal Value &amp; Enterprise Value');
  h += row('Cumulative PV of free cash flow', 'cumPV', { indent: true });
  h += row('Terminal-year EBITDA (2024E)', 'terminalEbitda', { indent: true });
  h += inRow('Exit multiple (EV / EBITDA)', 'exitMult');
  h += row('Terminal value', 'tv', { indent: true });
  h += row('Discount factor (year 5)', 'tvFactor', { indent: true });
  h += row('PV of terminal value', 'pvTV', { indent: true });
  h += row('Enterprise value', 'ev', { total: true, bold: true });
  h += spacer + sec('Equity Value &amp; Implied Share Price');
  h += row('Enterprise value', 'ev', { indent: true });
  h += inRow('Less: total debt', 'debt');
  h += inRow('Plus: cash &amp; equivalents', 'cash');
  h += row('Implied equity value', 'equity', { total: true, bold: true });
  h += row('Fully diluted shares (m)', 'fullyDiluted', { indent: true });
  h += row('Implied share price', 'sharePrice', { total: true, bold: true });
  h += spacer + sec('Cross-checks');
  h += row('Implied perpetuity growth rate', 'impliedPGR', { indent: true });
  h += row('Implied EV / LTM EBITDA', 'impliedEVEBITDA', { indent: true });
  h += '</tbody></table>';
  return h;
}

function renderSheet() {
  document.getElementById('sheet').innerHTML = buildTableA() + buildTableB();
  // attach listeners
  document.querySelectorAll('#sheet input[data-id]').forEach(inp => {
    inp.addEventListener('input', onCellInput);
    inp.addEventListener('focus', onCellFocus);
  });
  recompute();
  if (mode === 'guided' && !solved) positionCoach();
}

/* ---- parse + react to typing ---- */
function parseCell(id, raw) {
  raw = String(raw).replace(/[, %x×$]/g, '').trim();
  if (raw === '' || raw === '-' || raw === '.') return undefined;
  let n = parseFloat(raw);
  if (isNaN(n)) return undefined;
  if (INPUTS[id].as === 'pct') n = n / 100;
  return n;
}
function onCellInput(e) {
  const id = e.target.dataset.id;
  vals[id] = parseCell(id, e.target.value);
  recompute();
  if (mode === 'guided' && !solved) maybeAdvanceCursor(id);
}
function onCellFocus(e) {
  if (mode === 'guided' && !solved) {
    const id = e.target.dataset.id;
    const idx = GUIDED_ORDER.indexOf(id);
    if (idx >= 0) { cursorIdx = idx; positionCoach(); }
  }
}

/* ---- recompute & repaint ---- */
function recompute() {
  const r = computeDCF(effInputs());

  // per-year + single calc cells
  document.querySelectorAll('[data-calc]').forEach(td => {
    const key = td.dataset.calc;
    const yr = td.dataset.yr != null ? +td.dataset.yr : null;
    const v = getVal(r, key, yr);
    td.textContent = fmtVal(key, v);
    if (v != null && v < 0) td.style.color = 'var(--red)'; else td.style.color = '';
  });
  // copied constant-driver cells (show the entered % across years)
  document.querySelectorAll('[data-copy]').forEach(td => {
    const id = td.dataset.copy;
    td.textContent = (vals[id] != null) ? FMT[INPUTS[id].fmt](vals[id]) : '—';
    td.style.fontStyle = 'italic'; td.style.color = 'var(--slate-soft)';
  });

  // input correctness styling
  let correct = 0;
  document.querySelectorAll('[data-input]').forEach(td => {
    const id = td.dataset.input;
    td.classList.remove('correct', 'wrong');
    const tick = td.querySelector('.tick');
    const showMark = (mode === 'guided') || td.dataset.checked === '1';
    if (isFilled(id)) {
      if (isCorrect(id)) { td.classList.add('correct'); correct++; }
      else if (showMark) { td.classList.add('wrong'); }
    }
    if (tick) tick.textContent = (isCorrect(id) && showMark) ? '✓' : (td.classList.contains('wrong') ? '✕' : '');
  });

  // scorecard
  const allCorrect = correct === GUIDED_ORDER.length;
  document.getElementById('sc-cells').textContent = correct + ' / ' + GUIDED_ORDER.length;
  const evEl = document.getElementById('sc-ev'), eqEl = document.getElementById('sc-eq'), pxEl = document.getElementById('sc-px');
  evEl.textContent = '$' + r.ev.toFixed(1); eqEl.textContent = '$' + r.equity.toFixed(1); pxEl.textContent = '$' + r.sharePrice.toFixed(2);
  [['sc-ev', allCorrect], ['sc-eq', allCorrect], ['sc-px', allCorrect]].forEach(([idd, ok]) => {
    const el = document.getElementById(idd); el.classList.toggle('match', ok);
  });

  if (allCorrect && !solved) onSolved(r);
  if (!allCorrect) solved = false;
  if (typeof updateProgress === 'function') updateProgress();
}

/* ---- guided coaching ---- */
function nextUnsolvedFrom(idx) {
  for (let i = idx; i < GUIDED_ORDER.length; i++) if (!isCorrect(GUIDED_ORDER[i])) return i;
  for (let i = 0; i < idx; i++) if (!isCorrect(GUIDED_ORDER[i])) return i;
  return -1;
}
function maybeAdvanceCursor(id) {
  if (isCorrect(id)) {
    const ni = nextUnsolvedFrom(GUIDED_ORDER.indexOf(id) + 1);
    if (ni === -1) { hideCoach(); return; }
    cursorIdx = ni;
    tutorSay(`Nicely done. <strong>${escapeHtml(prettyId(id))}</strong> ties out. Next up: <strong>${escapeHtml(HINTS[GUIDED_ORDER[ni]].title)}</strong>.`, 'Tutor · progress');
    setTimeout(positionCoach, 120);
  } else {
    positionCoach();
  }
}
function currentCursorId() { return GUIDED_ORDER[cursorIdx]; }

function positionCoach() {
  const coach = document.getElementById('coach');
  // clear previous cursor
  document.querySelectorAll('.cell-input.cursor').forEach(c => c.classList.remove('cursor'));
  if (mode !== 'guided' || solved) { coach.classList.remove('show'); return; }
  const id = currentCursorId();
  const idx2 = nextUnsolvedFrom(cursorIdx);
  if (idx2 === -1) { coach.classList.remove('show'); return; }
  cursorIdx = idx2;
  const realId = GUIDED_ORDER[cursorIdx];
  const td = document.querySelector(`[data-input="${realId}"]`);
  if (!td) { coach.classList.remove('show'); return; }
  td.classList.add('cursor');
  const hint = HINTS[realId];
  coach.innerHTML = `<div class="step-k">${hint.step}</div>
    <strong style="font-family:var(--f-display);font-size:1.05rem;">${hint.title}</strong>
    <p style="margin-top:8px;color:var(--mist);font-size:.86rem;line-height:1.5;">${hint.why}</p>
    <div class="type-hint">${hint.type}</div>
    <div class="coach-actions">
      <button class="reveal-b" onclick="revealCell('${realId}')">Fill this cell</button>
      <button class="skip" onclick="skipCell()">Skip</button>
    </div>`;
  coach.classList.add('show');
  // position near the cell, clamped to viewport
  const rect = td.getBoundingClientRect();
  const cw = 320, ch = coach.offsetHeight || 220;
  let left = rect.right + 16, top = rect.top - 10;
  if (left + cw > window.innerWidth - 12) left = Math.max(12, rect.left - cw - 16);
  if (top + ch > window.innerHeight - 12) top = Math.max(80, window.innerHeight - ch - 12);
  coach.style.left = left + 'px'; coach.style.top = top + 'px';
  // make sure the cell is visible
  td.scrollIntoView({ block: 'center', behavior: 'smooth' });
}
function hideCoach() { document.getElementById('coach').classList.remove('show'); document.querySelectorAll('.cell-input.cursor').forEach(c => c.classList.remove('cursor')); }

function revealCell(id) {
  vals[id] = INPUTS[id].answer;
  const inp = document.querySelector(`input[data-id="${id}"]`);
  if (inp) inp.value = displayRaw(id);
  recompute();
  const ni = nextUnsolvedFrom(GUIDED_ORDER.indexOf(id) + 1);
  if (ni === -1) hideCoach(); else { cursorIdx = ni; setTimeout(positionCoach, 100); }
}
function skipCell() {
  const ni = nextUnsolvedFrom(cursorIdx + 1);
  if (ni === -1) { hideCoach(); } else { cursorIdx = ni; positionCoach(); }
}

/* ---- modes ---- */
function setMode(m) {
  mode = m;
  document.getElementById('m-guided').classList.toggle('active', m === 'guided');
  document.getElementById('m-free').classList.toggle('active', m === 'free');
  // reset per-cell "checked" markers when toggling
  document.querySelectorAll('[data-input]').forEach(td => { if (m === 'guided') td.dataset.checked = '1'; else delete td.dataset.checked; });
  recompute();
  if (m === 'guided') { cursorIdx = 0; positionCoach(); tutorSay("Guided mode on. I'll point to the next cell and tell you exactly what to type — and why. Type the value, or hit <strong>Fill this cell</strong> if you want to see it.", 'Tutor'); }
  else { hideCoach(); tutorSay("Free-build mode. Fill in the blue cells yourself, then hit <strong>Check my answers</strong> when you're ready. I'm here if you get stuck.", 'Tutor'); }
}

/* "Start the guided walkthrough" button */
function startGuided() {
  if (!labStarted) { onEnterLab(); }
  setMode('guided');
  cursorIdx = 0;
  const sheet = document.getElementById('sheet');
  if (sheet) sheet.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(positionCoach, 420);
  tutorSay("Let's go. I'm pointing at the first blue cell — <strong>2020 sales growth</strong>. It's in your Case Brief under ①: type <strong>7.5</strong>. Each time you get one right, I'll move to the next.", 'Tutor · start');
}

function checkAll() {
  let correct = 0, wrong = [];
  document.querySelectorAll('[data-input]').forEach(td => {
    td.dataset.checked = '1';
    const id = td.dataset.input;
    if (isCorrect(id)) correct++; else wrong.push(prettyId(id));
  });
  recompute();
  if (correct === GUIDED_ORDER.length) { /* onSolved handles it */ }
  else {
    const miss = wrong.slice(0, 4).join(', ') + (wrong.length > 4 ? `, +${wrong.length - 4} more` : '');
    tutorSay(`You've got <strong>${correct} of ${GUIDED_ORDER.length}</strong> cells right. Still to fix: ${escapeHtml(miss)}. Want a hint? Click any blue cell and I'll explain it, or switch to <strong>Guided</strong>.`, 'Tutor · check');
  }
}

function resetSheet() {
  for (const id in INPUTS) delete vals[id];
  solved = false; cursorIdx = 0;
  document.getElementById('complete').classList.remove('show');
  renderSheet();
  if (mode === 'guided') { setTimeout(positionCoach, 80); }
  tutorSay('Cleared. Fresh model — let’s build it again.', 'Tutor');
}
function revealAll() {
  for (const id in INPUTS) vals[id] = INPUTS[id].answer;
  document.querySelectorAll('[data-input]').forEach(td => td.dataset.checked = '1');
  renderSheet();
  hideCoach();
  tutorSay("Here's the full solution. Walk through how each input flows down to the <strong>$6,008.7m</strong> enterprise value — then try <strong>Reset</strong> and build it yourself.", 'Tutor · solution');
}

function onSolved(r) {
  solved = true;
  hideCoach();
  const banner = document.getElementById('complete');
  document.getElementById('complete-sub').innerHTML =
    `You built ValueCo's DCF to an enterprise value of <strong>$${r.ev.toFixed(1)}m</strong>, equity value of <strong>$${r.equity.toFixed(1)}m</strong>, and an implied share price of <strong>$${r.sharePrice.toFixed(2)}</strong> — matching the official Rosenbaum model to the dollar.`;
  banner.classList.add('show');
  banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
  tutorSay("🎉 <strong>That ties out.</strong> Enterprise value $6,008.7m, share price $59.45 — exactly the official model. You've just built a complete DCF. Notice the terminal value is ~69% of total value: that's why the exit multiple and WACC are the assumptions bankers sweat most.", 'Tutor · complete');
}

/* ---- helpers ---- */
function prettyId(id) {
  const map = { g2020:'2020 sales growth', g2021:'2021 sales growth', g2022:'2022 sales growth',
    g2023:'2023 sales growth', g2024:'2024 sales growth', cogsPct:'COGS %', sgaPct:'SG&A %',
    daPct:'D&A %', capexPct:'Capex %', taxRate:'tax rate', wacc:'WACC', exitMult:'exit multiple',
    debt:'total debt', cash:'cash' };
  return map[id] || id;
}
function escapeHtml(s){ return s.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }

/* ---- progress for the top bar ---- */
function labProgress() {
  let c = 0; GUIDED_ORDER.forEach(id => { if (isCorrect(id)) c++; });
  return c / GUIDED_ORDER.length;
}

/* ---- first entry into the Lab ---- */
function onEnterLab() {
  if (!labStarted) {
    labStarted = true;
    renderSheet();
    // keep the coach bubble pinned to its cell when the lab panel scrolls
    const lm = document.querySelector('.lab-main');
    if (lm) lm.addEventListener('scroll', () => {
      if (mode === 'guided' && !solved && document.getElementById('coach').classList.contains('show')) positionCoach();
    }, { passive: true });
    tutorSay("Welcome to the Lab. This is ValueCo's DCF — the same model from the Theory tab, now empty. The <strong>blue cells</strong> are yours to fill; black cells calculate automatically.", 'Tutor');
    tutorSay("We'll start with <strong>Step II — projecting sales</strong>. I'll point to each cell. Ready when you are.", 'Tutor');
    setMode('guided');
  } else {
    if (mode === 'guided' && !solved) setTimeout(positionCoach, 100);
  }
}

/* reposition coach on scroll/resize while guiding */
['scroll', 'resize'].forEach(ev => window.addEventListener(ev, () => {
  if (mode === 'guided' && !solved && document.getElementById('coach').classList.contains('show')) positionCoach();
}, { passive: true }));
