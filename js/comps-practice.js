/* ============================================================================
   COMPS PRACTICE LAB — Step V: value ValueCo with the comps' multiples.
   Single valuation worksheet; guided + free modes, live recompute, scoring,
   coaching, completion. Reuses dcf.css styles (.cell-input, .coach, scorecard).
   ========================================================================== */

const cvals = {};
let cmode = 'guided', ccursor = 0, cStarted = false, cSolved = false;

/* ---- formatting ---- */
function cMoney(v) { return (v < 0 ? '($' + Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 0 }) + ')'
                                   : '$' + v.toLocaleString(undefined, { maximumFractionDigits: 0 })); }
function cTrim(n) { return n == null || isNaN(n) ? '' : parseFloat(n.toFixed(4)).toString(); }
function cDisplayRaw(id) { const v = cvals[id]; return v == null ? '' : cTrim(v); }

/* ---- worksheet layout ---- */
const CLAYOUT = [
  ['sec', '① ValueCo — the target (LTM metrics)'],
  ['input', 'ltmEbitda', 'LTM EBITDA'],
  ['input', 'ltmEbit', 'LTM EBIT'],
  ['input', 'ltmSales', 'LTM Sales'],
  ['sec', '② Net-debt bridge'],
  ['input', 'debt', 'Total debt'],
  ['input', 'cash', 'Less: Cash & equivalents'],
  ['calc', 'netDebt', 'Net debt', 'money'],
  ['sec', '③ Chosen comp multiples (from the Output tab)'],
  ['input', 'mEbitda', 'EV / EBITDA — median'],
  ['input', 'mEbit', 'EV / EBIT — median'],
  ['input', 'mSales', 'EV / Sales — median'],
  ['sec', '④ Implied enterprise value  (multiple × metric)'],
  ['calc', 'evEbitda', 'via EV / EBITDA', 'money'],
  ['calc', 'evEbit', 'via EV / EBIT', 'money'],
  ['calc', 'evSales', 'via EV / Sales', 'money'],
  ['sec', '⑤ Implied equity value  (EV/EBITDA basis)'],
  ['calc', 'impliedEV', 'Implied enterprise value', 'money'],
  ['calc', 'lessNetDebt', 'Less: Net debt', 'moneyNeg'],
  ['total', 'impliedEquity', 'Implied equity value', 'money'],
  ['sec', '⑥ Valuation range  (EV/EBITDA low–high)'],
  ['input', 'mLow', 'Low multiple'],
  ['input', 'mHigh', 'High multiple'],
  ['calc', 'evLow', 'Implied EV — low end', 'money'],
  ['calc', 'evHigh', 'Implied EV — high end', 'money'],
  ['sec', '⑦ Cross-check vs the DCF'],
  ['calc', 'dcfEV', 'DCF enterprise value', 'money'],
  ['calc', 'impliedEV2', 'Comps implied EV (EV/EBITDA)', 'money'],
  ['total', 'diff', 'DCF above comps by', 'money'],
];

function cResolve(r, key) {
  switch (key) {
    case 'netDebt': return r.netDebt;
    case 'evEbitda': return r.evEbitda;
    case 'evEbit': return r.evEbit;
    case 'evSales': return r.evSales;
    case 'impliedEV': case 'impliedEV2': return r.impliedEV;
    case 'lessNetDebt': return -r.netDebt;
    case 'impliedEquity': return r.impliedEquity;
    case 'evLow': return r.evLow;
    case 'evHigh': return r.evHigh;
    case 'dcfEV': return r.dcfEV;
    case 'diff': return r.dcfVsComps;
  }
  return null;
}

function cInputCell(id) {
  return `<td class="cell-input" data-input="${id}"><input type="text" inputmode="decimal" data-id="${id}" value="${cDisplayRaw(id)}"><span class="tick"></span></td>`;
}

function renderCompsSheet() {
  let h = '<table class="sheet" style="max-width:560px"><tbody>';
  CLAYOUT.forEach(row => {
    if (row[0] === 'sec') { h += `<tr><td class="section" colspan="2">${row[1]}</td></tr>`; return; }
    const [type, id, label, fmt] = row;
    if (type === 'input') {
      h += `<tr><td class="label">${label}</td>${cInputCell(id)}</tr>`;
    } else {
      const cls = type === 'total' ? 'num calc total' : 'num calc';
      h += `<tr><td class="label ${type === 'total' ? '' : 'indent'}">${label}</td><td class="${cls}" data-calc="${id}" style="min-width:150px"></td></tr>`;
    }
  });
  h += '</tbody></table>';
  const host = document.getElementById('sheet');
  host.innerHTML = h;
  host.querySelectorAll('input[data-id]').forEach(inp => {
    inp.addEventListener('input', cOnInput);
    inp.addEventListener('focus', cOnFocus);
  });
  cRecompute();
  if (cmode === 'guided' && !cSolved) cPositionCoach();
}

function cParse(id, raw) {
  raw = String(raw).replace(/[, x×$]/gi, '').trim();
  if (raw === '' || raw === '-' || raw === '.') return undefined;
  const n = parseFloat(raw);
  return isNaN(n) ? undefined : n;
}
function cOnInput(e) {
  const id = e.target.dataset.id;
  cvals[id] = cParse(id, e.target.value);
  cRecompute();
  if (cmode === 'guided' && !cSolved) cMaybeAdvance(id);
}
function cOnFocus(e) {
  if (cmode === 'guided' && !cSolved) { const i = CGUIDED_ORDER.indexOf(e.target.dataset.id); if (i >= 0) { ccursor = i; cPositionCoach(); } }
}

function cEff() { const o = {}; for (const id in CINPUTS) o[id] = cvals[id] != null ? cvals[id] : 0; return o; }
function cIsCorrect(id) { const v = cvals[id]; return v != null && Math.abs(v - CINPUTS[id].answer) <= ctol(id); }

function cRecompute() {
  const r = computeComps(cEff());
  document.querySelectorAll('[data-calc]').forEach(td => {
    const key = td.dataset.calc, v = cResolve(r, key);
    td.textContent = (v == null || isNaN(v)) ? '—' : cMoney(v);
    td.style.color = (v < 0 && key !== 'lessNetDebt') ? 'var(--red)' : '';
  });
  let correct = 0;
  document.querySelectorAll('[data-input]').forEach(td => {
    const id = td.dataset.input; td.classList.remove('correct', 'wrong');
    const tick = td.querySelector('.tick');
    const show = (cmode === 'guided') || td.dataset.checked === '1';
    if (cvals[id] != null) {
      if (cIsCorrect(id)) { td.classList.add('correct'); correct++; if (tick && show) tick.textContent = '✓'; }
      else if (show) { td.classList.add('wrong'); if (tick) tick.textContent = '✕'; }
      else if (tick) tick.textContent = '';
    } else if (tick) tick.textContent = '';
  });
  const all = correct === CGUIDED_ORDER.length;
  setText('sc-ev', cMoney(r.impliedEV));
  setText('sc-eq', cMoney(r.impliedEquity));
  setText('sc-range', cMoney(r.evLow) + '–' + cMoney(r.evHigh));
  setText('sc-cells', correct + ' / ' + CGUIDED_ORDER.length);
  ['sc-ev', 'sc-eq', 'sc-range'].forEach(id => { const el = document.getElementById(id); if (el) el.classList.toggle('match', all); });
  if (all && !cSolved) cOnSolved(r);
  if (!all) cSolved = false;
  if (typeof updateProgress === 'function') updateProgress();
}
function setText(id, t) { const el = document.getElementById(id); if (el) el.textContent = t; }

/* ---- guided coach (reuses #coach) ---- */
function cNextUnsolved(from) {
  for (let i = from; i < CGUIDED_ORDER.length; i++) if (!cIsCorrect(CGUIDED_ORDER[i])) return i;
  for (let i = 0; i < from; i++) if (!cIsCorrect(CGUIDED_ORDER[i])) return i;
  return -1;
}
function cMaybeAdvance(id) {
  if (cIsCorrect(id)) {
    const ni = cNextUnsolved(CGUIDED_ORDER.indexOf(id) + 1);
    if (ni === -1) { cHideCoach(); return; }
    ccursor = ni;
    tutorSay(`Good — <strong>${CHINTS[id].title}</strong> is right. Next: <strong>${CHINTS[CGUIDED_ORDER[ni]].title}</strong>.`, 'Tutor · progress');
    setTimeout(cPositionCoach, 120);
  } else cPositionCoach();
}
function cPositionCoach() {
  const coach = document.getElementById('coach');
  document.querySelectorAll('.cell-input.cursor').forEach(c => c.classList.remove('cursor'));
  if (cmode !== 'guided' || cSolved) { coach.classList.remove('show'); return; }
  const idx = cNextUnsolved(ccursor);
  if (idx === -1) { coach.classList.remove('show'); return; }
  ccursor = idx;
  const id = CGUIDED_ORDER[ccursor];
  const td = document.querySelector(`[data-input="${id}"]`);
  if (!td) { coach.classList.remove('show'); return; }
  td.classList.add('cursor');
  const hint = CHINTS[id];
  coach.innerHTML = `<div class="step-k">${hint.step}</div>
    <strong style="font-family:var(--f-display);font-size:1.05rem;">${hint.title}</strong>
    <p style="margin-top:8px;color:var(--mist);font-size:.86rem;line-height:1.5;">${hint.why}</p>
    <div class="type-hint">${hint.type}</div>
    <div class="coach-actions"><button class="reveal-b" onclick="cRevealCell('${id}')">Fill this cell</button>
    <button class="skip" onclick="cSkip()">Skip</button></div>`;
  coach.classList.add('show');
  if (typeof renderTexIn === 'function') renderTexIn(coach);
  const rect = td.getBoundingClientRect(), cw = 320, ch = coach.offsetHeight || 220;
  let left = rect.right + 16, top = rect.top - 10;
  if (left + cw > window.innerWidth - 12) left = Math.max(12, rect.left - cw - 16);
  if (top + ch > window.innerHeight - 12) top = Math.max(80, window.innerHeight - ch - 12);
  coach.style.left = left + 'px'; coach.style.top = top + 'px';
  td.scrollIntoView({ block: 'center', behavior: 'smooth' });
}
function cHideCoach() { document.getElementById('coach').classList.remove('show'); document.querySelectorAll('.cell-input.cursor').forEach(c => c.classList.remove('cursor')); }
function cRevealCell(id) {
  cvals[id] = CINPUTS[id].answer;
  const inp = document.querySelector(`input[data-id="${id}"]`); if (inp) inp.value = cDisplayRaw(id);
  cRecompute();
  const ni = cNextUnsolved(CGUIDED_ORDER.indexOf(id) + 1);
  if (ni === -1) cHideCoach(); else { ccursor = ni; setTimeout(cPositionCoach, 100); }
}
function cSkip() { const ni = cNextUnsolved(ccursor + 1); if (ni === -1) cHideCoach(); else { ccursor = ni; cPositionCoach(); } }

/* ---- modes / actions ---- */
function setMode(m) {
  cmode = m;
  document.getElementById('m-guided').classList.toggle('active', m === 'guided');
  document.getElementById('m-free').classList.toggle('active', m === 'free');
  document.querySelectorAll('[data-input]').forEach(td => { if (m === 'guided') td.dataset.checked = '1'; else delete td.dataset.checked; });
  cRecompute();
  if (m === 'guided') { ccursor = 0; cPositionCoach(); tutorSay("Guided mode on. I'll point to each blue cell and tell you what to type and why.", 'Tutor'); }
  else { cHideCoach(); tutorSay("Free-build mode. Fill the blue cells from the Case Brief, then hit <strong>Check my answers</strong>.", 'Tutor'); }
}
function checkAll() {
  let correct = 0, wrong = [];
  document.querySelectorAll('[data-input]').forEach(td => { td.dataset.checked = '1'; const id = td.dataset.input; if (cIsCorrect(id)) correct++; else wrong.push(CHINTS[id].title); });
  cRecompute();
  if (correct !== CGUIDED_ORDER.length)
    tutorSay(`You have <strong>${correct} of ${CGUIDED_ORDER.length}</strong> right. Still to fix: ${wrong.slice(0, 4).join(', ')}${wrong.length > 4 ? '…' : ''}. Click a blue cell for a hint, or switch to Guided.`, 'Tutor · check');
}
function resetSheet() {
  for (const id in CINPUTS) delete cvals[id];
  cSolved = false; ccursor = 0;
  document.getElementById('complete').classList.remove('show');
  renderCompsSheet();
  if (cmode === 'guided') setTimeout(cPositionCoach, 80);
  tutorSay('Cleared — let’s value ValueCo again.', 'Tutor');
}
function revealAll() {
  for (const id in CINPUTS) cvals[id] = CINPUTS[id].answer;
  document.querySelectorAll('[data-input]').forEach(td => td.dataset.checked = '1');
  renderCompsSheet(); cHideCoach();
  tutorSay("Here's the full solution. Comps imply ~<strong>$5.1bn</strong> EV for ValueCo (range $4.2–6.3bn) — versus the DCF's $6.0bn. Reset and try it yourself.", 'Tutor · solution');
}
function cOnSolved(r) {
  cSolved = true; cHideCoach();
  const banner = document.getElementById('complete');
  document.getElementById('complete-sub').innerHTML =
    `Comparable companies imply an enterprise value of <strong>${cMoney(r.impliedEV)}</strong> for ValueCo (range ${cMoney(r.evLow)}–${cMoney(r.evHigh)}), and equity value of <strong>${cMoney(r.impliedEquity)}</strong>. The DCF gave ${cMoney(r.dcfEV)} — so the DCF sits near the <em>top</em> of the comps range. That triangulation is exactly the point of running both.`;
  banner.classList.add('show');
  banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
  tutorSay("🎉 <strong>Valued.</strong> Comps ≈ $5.1bn EV vs DCF $6.0bn. When intrinsic (DCF) and relative (comps) methods bracket each other like this, you have a defensible valuation range to put in front of a client.", 'Tutor · complete');
}

function labProgress() { let c = 0; CGUIDED_ORDER.forEach(id => { if (cIsCorrect(id)) c++; }); return c / CGUIDED_ORDER.length; }

function startGuided() {
  if (!cStarted) onEnterLab();
  setMode('guided'); ccursor = 0;
  const s = document.getElementById('sheet'); if (s) s.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(cPositionCoach, 420);
  tutorSay("Let's value ValueCo by comps. First blue cell — <strong>LTM EBITDA</strong>: from the Case Brief, type <strong>700</strong>.", 'Tutor · start');
}

function onEnterLab() {
  if (!cStarted) {
    cStarted = true;
    renderCompsSheet();
    const lm = document.querySelector('.lab-main');
    if (lm) lm.addEventListener('scroll', () => { if (cmode === 'guided' && !cSolved && document.getElementById('coach').classList.contains('show')) cPositionCoach(); }, { passive: true });
    tutorSay("Welcome to the comps Lab. You'll apply the comparable companies' multiples to <strong>ValueCo</strong> to get an implied valuation — and compare it with the DCF.", 'Tutor');
    setMode('guided');
  } else if (cmode === 'guided' && !cSolved) setTimeout(cPositionCoach, 100);
}

['scroll', 'resize'].forEach(ev => window.addEventListener(ev, () => {
  if (cmode === 'guided' && !cSolved && document.getElementById('coach') && document.getElementById('coach').classList.contains('show')) cPositionCoach();
}, { passive: true }));
