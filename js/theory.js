/* Theory pane: tab switching, step navigation, interactive widgets, progress. */

/* ---- Render LaTeX formulas with KaTeX (local, offline) ---- */
function renderFormulas() {
  if (typeof katex === 'undefined') return;          // graceful: leave source if KaTeX missing
  document.querySelectorAll('.eq[data-tex]').forEach(el => {
    if (el.dataset.rendered) return;
    try {
      katex.render(el.getAttribute('data-tex'), el, { displayMode: true, throwOnError: false });
      el.dataset.rendered = '1';
    } catch (e) { el.textContent = el.getAttribute('data-tex'); }
  });
}
renderFormulas();
document.addEventListener('DOMContentLoaded', renderFormulas);

/* ---- Tab switching (Theory · The Workbook · Practice) ---- */
function switchTab(which) {
  ['theory', 'workbook', 'practice'].forEach(p => {
    const pane = document.getElementById('pane-' + p);
    const tab = document.getElementById('tab-' + p);
    if (pane) pane.classList.toggle('active', which === p);
    if (tab) { tab.classList.toggle('active', which === p); tab.setAttribute('aria-selected', which === p); }
  });
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  if (which === 'practice' && typeof onEnterLab === 'function') onEnterLab();
  if (which === 'workbook' && typeof initWorkbook === 'function') initWorkbook();
  updateProgress();
}

/* ---- Step rail navigation ---- */
function goStep(n) {
  const el = document.getElementById('step' + n);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

/* highlight active step pill as you scroll */
(function () {
  const pills = document.querySelectorAll('.step-pill');
  const steps = [1, 2, 3, 4, 5].map(n => document.getElementById('step' + n));
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const idx = steps.indexOf(e.target);
        pills.forEach((p, i) => p.classList.toggle('on', i === idx));
      }
    });
  }, { threshold: 0.3, rootMargin: '-120px 0px -55% 0px' });
  steps.forEach(s => s && io.observe(s));
})();

/* ---- Progress bar: theory scroll + lab completion ---- */
function updateProgress() {
  const bar = document.getElementById('progressbar');
  const pane = document.getElementById('pane-practice');
  if (!bar || !pane) return;
  const practiceActive = pane.classList.contains('active');
  if (practiceActive) {
    const pct = (typeof labProgress === 'function') ? labProgress() : 0;
    bar.style.width = (50 + pct * 50) + '%';
  } else {
    const h = document.body.scrollHeight - window.innerHeight;
    const pct = h > 0 ? Math.min(1, window.scrollY / h) : 0;
    bar.style.width = (pct * 50) + '%';
  }
}
window.addEventListener('scroll', updateProgress, { passive: true });

/* sticky modbar shadow */
window.addEventListener('scroll', () => {
  const mb = document.getElementById('modbar'); if (mb) mb.style.boxShadow = window.scrollY > 10 ? '0 10px 30px -18px rgba(0,0,0,.5)' : 'none';
}, { passive: true });

/* ============ Widget 1 — build a year of FCF ============ */
(function () {
  const S = document.getElementById('fx-sales'), M = document.getElementById('fx-margin'), T = document.getElementById('fx-tax');
  if (!S) return;
  const So = document.getElementById('fx-sales-o'), Mo = document.getElementById('fx-margin-o'), To = document.getElementById('fx-tax-o'), out = document.getElementById('fx-out');
  function calc() {
    const sales = +S.value, margin = +M.value / 100, tax = +T.value / 100;
    const ebitda = sales * margin;
    const da = sales * 0.06, ebit = ebitda - da;
    const ebiat = ebit * (1 - tax);
    const capex = sales * 0.045, dnwc = sales * 0.013; // approx working-capital drag
    const fcf = ebiat + da - capex - dnwc;
    So.textContent = (+S.value).toLocaleString();
    Mo.textContent = (+M.value).toFixed(1) + '%';
    To.textContent = (+T.value) + '%';
    out.textContent = '$' + fcf.toFixed(0) + 'm';
  }
  [S, M, T].forEach(x => x.addEventListener('input', calc)); calc();
})();

/* ============ Widget 2 — WACC -> Enterprise Value (uses the real engine) ============ */
(function () {
  const W = document.getElementById('ww-wacc'), X = document.getElementById('ww-exit');
  if (!W) return;
  const Wo = document.getElementById('ww-wacc-o'), Xo = document.getElementById('ww-exit-o'), out = document.getElementById('ww-out');
  function calc() {
    const inp = Object.assign({}, DCF_ANSWERS, { wacc: +W.value / 100, exitMult: +X.value });
    const r = computeDCF(inp);
    Wo.textContent = (+W.value).toFixed(1) + '%';
    Xo.textContent = (+X.value).toFixed(1) + '×';
    out.textContent = '$' + r.ev.toLocaleString(undefined, { maximumFractionDigits: 0 }) + 'm';
  }
  [W, X].forEach(x => x.addEventListener('input', calc)); calc();
})();

/* ============ Widget 3 — PV bars (present value of each cash flow) ============ */
(function () {
  const host = document.getElementById('pvbars');
  if (!host) return;
  const r = correctDCF();
  const pvs = r.rows.map(x => x.pv).concat([r.pvTV]);
  const max = Math.max(...pvs);
  const labels = ['2020', '2021', '2022', '2023', '2024', 'TV'];
  host.innerHTML = '';
  pvs.forEach((v, i) => {
    const bar = document.createElement('div');
    bar.className = 'bar' + (i === pvs.length - 1 ? ' tv' : '');
    bar.style.height = '0%';
    bar.innerHTML = '<span>$' + v.toFixed(0) + '</span>';
    host.appendChild(bar);
    setTimeout(() => { bar.style.height = (v / max * 100) + '%'; }, 120 + i * 90);
  });
})();

updateProgress();
