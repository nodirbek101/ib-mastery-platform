/* ============================================================================
   THE WORKBOOK renderer — recreates each real Excel tab from WORKBOOK (data)
   + WORKBOOK_NOTES (authored line-by-line explanations), with click-to-explain.
   ========================================================================== */

let wbSheet = null;
let wbShowFormulas = false;
let wbInited = false;

/* Default config = the DCF workbook. A page may define a global WB_CONFIG
   (tabs / map / defaultTab) before loading this file to drive a different model
   (e.g. comps.html). dcf.html defines none, so it uses these defaults. */
const WB_DEFAULT = {
  defaultTab: 'WACC',
  tabs: [
    { id: 'DCF',  sub: 'output' },
    { id: 'AS1',  sub: 'assumptions I' },
    { id: 'AS2',  sub: 'assumptions II' },
    { id: 'NWC',  sub: 'working capital' },
    { id: 'WACC', sub: 'discount rate' },
  ],
  map: [
    { id: 'AS1',  nk: 'AS1',  nt: 'Income-statement & cash-flow assumptions', nd: 'Growth, margins, capex →' },
    { id: 'AS2',  nk: 'AS2',  nt: 'Balance-sheet assumptions', nd: 'Working-capital drivers →' },
    { id: 'NWC',  nk: 'NWC',  nt: 'Net working capital', nd: 'Δ in NWC → DCF cash flow' },
    { id: 'WACC', nk: 'WACC', nt: 'Cost of capital', nd: 'Discount rate (11%) → DCF' },
    { id: 'DCF',  nk: 'DCF',  nt: 'The output sheet', nd: 'FCF → EV → share price', out: true },
  ],
};
const _WBC = (typeof WB_CONFIG !== 'undefined') ? WB_CONFIG : WB_DEFAULT;
const WB_TABS = _WBC.tabs;
const WB_MAP = _WBC.map;

function wbReady(name) { return typeof WORKBOOK_NOTES !== 'undefined' && !!WORKBOOK_NOTES[name]; }

/* Render LaTeX (KaTeX) inside any container's [data-tex] elements.
   data-display attribute => block/display math, otherwise inline. */
function renderTexIn(root) {
  if (typeof katex === 'undefined' || !root) return;
  root.querySelectorAll('[data-tex]').forEach(el => {
    if (el.dataset.rendered) return;
    try {
      katex.render(el.getAttribute('data-tex'), el,
        { throwOnError: false, displayMode: el.hasAttribute('data-display') });
      el.dataset.rendered = '1';
    } catch (e) { /* leave source text on failure */ }
  });
}

/* ---- address helpers ---- */
function colToNum(s) { let n = 0; for (const ch of s) n = n * 26 + (ch.charCodeAt(0) - 64); return n; }
function numToCol(n) { let s = ''; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = (n - m - 1) / 26; } return s; }
function parseAddr(a) { const m = a.match(/^([A-Z]+)(\d+)$/); return { c: colToNum(m[1]), r: +m[2] }; }
function parseRange(rng) {
  const [a, b] = rng.split(':'); const A = parseAddr(a), B = parseAddr(b || a);
  return { c1: Math.min(A.c, B.c), c2: Math.max(A.c, B.c), r1: Math.min(A.r, B.r), r2: Math.max(A.r, B.r) };
}
function addrInRange(addr, rng) {
  const p = parseAddr(addr), R = parseRange(rng);
  return p.c >= R.c1 && p.c <= R.c2 && p.r >= R.r1 && p.r <= R.r2;
}

/* ---- init ---- */
function initWorkbook() {
  if (wbInited) return;
  wbInited = true;
  buildWbMap();
  buildWbSubnav();
  selectWbSheet(_WBC.defaultTab);
}

function buildWbMap() {
  const host = document.getElementById('wb-map');
  if (!host) return;
  host.innerHTML = '';
  WB_MAP.forEach((n, i) => {
    const node = document.createElement('div');
    node.className = 'node' + (n.out ? ' out' : '');
    node.innerHTML = `<div class="nk">${n.nk}</div><div class="nt">${n.nt}</div><div class="nd">${n.nd}</div>`;
    if (wbReady(n.id)) {
      node.onclick = () => selectWbSheet(n.id);
      node.tabIndex = 0; node.setAttribute('role', 'button');
      node.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectWbSheet(n.id); } });
    }
    else node.style.cursor = 'default';
    host.appendChild(node);
    if (i < WB_MAP.length - 1) {
      const ar = document.createElement('div'); ar.className = 'arrow'; ar.textContent = '→';
      host.appendChild(ar);
    }
  });
}

function buildWbSubnav() {
  const host = document.getElementById('wb-subnav');
  host.innerHTML = '';
  WB_TABS.forEach(t => {
    const b = document.createElement('button');
    const ready = wbReady(t.id);
    b.className = (ready ? '' : 'soon');
    b.innerHTML = `${t.id}<span class="sub">${ready ? t.sub : 'soon'}</span>`;
    if (ready) b.onclick = () => selectWbSheet(t.id);
    b.dataset.id = t.id;
    host.appendChild(b);
  });
}

function selectWbSheet(name) {
  if (!wbReady(name)) return;
  wbSheet = name;
  document.querySelectorAll('#wb-subnav button').forEach(b => b.classList.toggle('active', b.dataset.id === name));
  renderWbHead(name);
  renderWbGrid(name);
  renderWbLines(name);
  clearWbExplain();
}

/* ---- sheet header (overview + link note) ---- */
function renderWbHead(name) {
  const d = WORKBOOK[name], notes = WORKBOOK_NOTES[name];
  document.getElementById('wb-sheet-head').innerHTML =
    `<h3>${d.subtitle}</h3><div class="sub">${d.title} · tab “${name}” · ${d.maxRow} rows</div>
     <div class="wb-overview">${notes.overview}</div>
     <div class="wb-link"><div class="h">◆ How this tab connects</div>${notes.flow}</div>`;
  renderTexIn(document.getElementById('wb-sheet-head'));
}

/* ---- grid ---- */
function renderWbGrid(name) {
  const d = WORKBOOK[name];
  const cells = d.cells;
  // merges
  const covered = new Set(); const span = {};
  (d.merges || []).forEach(rng => {
    const R = parseRange(rng);
    const anchor = numToCol(R.c1) + R.r1;
    span[anchor] = { cs: R.c2 - R.c1 + 1, rs: R.r2 - R.r1 + 1 };
    for (let r = R.r1; r <= R.r2; r++) for (let c = R.c1; c <= R.c2; c++) {
      const a = numToCol(c) + r; if (a !== anchor) covered.add(a);
    }
  });

  let h = '<table class="wb-sheet"><thead><tr><th class="corner"></th>';
  for (let c = 1; c <= d.maxCol; c++) h += `<th>${numToCol(c)}</th>`;
  h += '</tr></thead><tbody>';
  for (let r = 1; r <= d.maxRow; r++) {
    h += `<tr><td class="rownum">${r}</td>`;
    for (let c = 1; c <= d.maxCol; c++) {
      const addr = numToCol(c) + r;
      if (covered.has(addr)) continue;
      const rec = cells[addr];
      const sp = span[addr];
      const spAttr = sp ? ` colspan="${sp.cs}" rowspan="${sp.rs}"` : '';
      if (!rec) { h += `<td class="empty"${spAttr}></td>`; continue; }
      const cls = ['k-' + rec.k];
      if (rec.k === 'label') cls.push('t-label');
      if (rec.b) cls.push('b');
      if (rec.a === 'l') cls.push('al-l'); else if (rec.a === 'c') cls.push('al-c');
      const text = (wbShowFormulas && rec.f) ? rec.f.replace(/&/g, '&amp;').replace(/</g, '&lt;') : (rec.v || '');
      const title = rec.f ? ` title="${rec.f.replace(/"/g, '&quot;')}"` : '';
      const interactive = rec.k !== 'label' ? ' tabindex="0" role="button"' : '';
      h += `<td class="${cls.join(' ')}" data-addr="${addr}"${spAttr}${title}${interactive}>${text}</td>`;
    }
    h += '</tr>';
  }
  h += '</tbody></table>';
  const wrap = document.getElementById('wb-grid');
  wrap.innerHTML = h;
  wrap.querySelectorAll('td[data-addr]').forEach(td => {
    if (cells[td.dataset.addr].k === 'label') return;
    td.addEventListener('click', () => wbCellClick(td.dataset.addr, td));
    td.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); wbCellClick(td.dataset.addr, td); } });
  });
}

/* ---- find a friendly row label for a cell (nearest text to the left) ---- */
function rowLabel(name, addr) {
  const cells = WORKBOOK[name].cells, p = parseAddr(addr);
  for (let c = p.c - 1; c >= 1; c--) {
    const rec = cells[numToCol(c) + p.r];
    if (rec && rec.k === 'label' && rec.v) return rec.v;
  }
  return null;
}

/* ---- explanation panel ---- */
const KIND_LABEL = { input: 'Input — you type this', formula: 'Formula — calculates automatically',
  link: 'Link — pulled from another tab', number: 'Given constant', datatable: 'Data-table output (computed by Excel)',
  label: 'Label' };
const KIND_GENERIC = {
  input: 'An <strong>input</strong> — a value you enter yourself (a market data point or a chosen assumption). On the real sheet these are coloured blue.',
  formula: 'A <strong>formula</strong> — Excel computes it from other cells, so you never type it.',
  link: 'A <strong>link</strong> — it pulls a value from another tab in the workbook.',
  number: 'A <strong>given constant</strong> — a hardcoded figure provided in the model.',
  datatable: 'A <strong>data-table output</strong> — Excel recomputes it across a grid of input combinations. Part of a sensitivity analysis; never typed by hand.',
};

function findGroup(name, addr) {
  const g = WORKBOOK_NOTES[name].groups || {};
  for (const rng in g) if (addrInRange(addr, rng)) return g[rng];
  return null;
}

function wbCellClick(addr, td) {
  document.querySelectorAll('.wb-sheet td.sel').forEach(x => x.classList.remove('sel'));
  if (td) td.classList.add('sel');
  const rec = WORKBOOK[wbSheet].cells[addr];
  const note = (WORKBOOK_NOTES[wbSheet].notes || {})[addr];
  const group = note ? null : findGroup(wbSheet, addr);
  const name = note && note.label ? note.label : (rowLabel(wbSheet, addr) || 'Cell ' + addr);

  let body = '';
  body += `<span class="x-addr">${addr}</span>`;
  body += `<div class="x-name">${name}</div>`;
  body += `<div class="x-kind k-${rec.k}" style="color:var(--gold-soft)">${KIND_LABEL[rec.k] || rec.k}</div>`;
  if (rec.v) body += `<div class="x-val">${rec.v}</div>`;
  if (rec.f) body += `<div class="x-row"><div class="lbl">Excel formula</div><div class="x-fml">${rec.f.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</div></div>`;

  if (note) {
    if (note.what) body += `<div class="x-row"><div class="lbl">What it is</div><div class="x-text">${note.what}</div></div>`;
    if (note.why)  body += `<div class="x-row"><div class="lbl">Why / how</div><div class="x-text">${note.why}</div></div>`;
  } else if (group) {
    body += `<div class="x-row"><div class="lbl">${group.title}</div><div class="x-text">${group.html}</div></div>`;
  } else {
    body += `<div class="x-row"><div class="lbl">About this cell</div><div class="x-text">${KIND_GENERIC[rec.k] || ''}</div></div>`;
  }
  document.getElementById('wb-explain').innerHTML = body;
  renderTexIn(document.getElementById('wb-explain'));
}

function clearWbExplain() {
  document.getElementById('wb-explain').innerHTML =
    `<div class="x-empty"><span class="big">☝︎</span>Click any cell in the sheet to see its real formula and a plain-English explanation of what it does and why.</div>`;
}

/* ---- line-by-line list ---- */
function renderWbLines(name) {
  const d = WORKBOOK[name], notes = WORKBOOK_NOTES[name];
  const cells = d.cells;
  let h = '';
  (notes.sections || []).forEach(sec => {
    h += `<div class="sec"><div class="sec-h">${sec.title}</div>`;
    if (sec.intro) h += `<div class="sec-intro">${sec.intro}</div>`;
    (sec.cells || []).forEach(addr => {
      const rec = cells[addr] || { v: '', k: 'formula' };
      const note = (notes.notes || {})[addr] || {};
      const tagClass = rec.k === 'input' ? 'tag-input' : rec.k === 'link' ? 'tag-link' : 'tag-formula';
      const tag = `<span class="tag ${tagClass}">${rec.k}</span>`;
      h += `<div class="wb-line"><div class="cellref"><span class="addr">${addr}</span><span class="val">${rec.v || ''}</span></div>
        <div class="body"><div class="nm">${note.label || rowLabel(name, addr) || addr}${tag}</div>
        ${note.what ? `<p>${note.what}</p>` : ''}${note.why ? `<p>${note.why}</p>` : ''}
        ${rec.f ? `<span class="fml">${rec.f.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span>` : ''}</div></div>`;
    });
    (sec.groups || []).forEach(rng => {
      const g = (notes.groups || {})[rng];
      if (g) h += `<div class="wb-group"><div class="gt">${g.title}</div>${g.html}</div>`;
    });
    h += `</div>`;
  });
  if (notes.footnotes && notes.footnotes.length)
    h += `<div class="wb-foot">${notes.footnotes.join('<br>')}</div>`;
  document.getElementById('wb-lines').innerHTML = h;
  renderTexIn(document.getElementById('wb-lines'));
}

/* ---- toggles ---- */
function toggleWbFormulas(btn) {
  wbShowFormulas = !wbShowFormulas;
  if (btn) btn.classList.toggle('on', wbShowFormulas);
  if (wbSheet) renderWbGrid(wbSheet);
}
function toggleWbHighlight(btn) {
  const wrap = document.getElementById('wb-grid');   // this element carries class wb-grid-wrap
  const on = wrap.classList.toggle('hi');
  if (btn) btn.classList.toggle('on', on);
}
