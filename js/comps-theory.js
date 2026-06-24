/* Comps page: tab switching, step nav, progress, KaTeX, theory widget. */

function switchTab(which) {
  ['theory', 'workbook', 'practice'].forEach(p => {
    const pane = document.getElementById('pane-' + p), tab = document.getElementById('tab-' + p);
    if (pane) pane.classList.toggle('active', which === p);
    if (tab) { tab.classList.toggle('active', which === p); tab.setAttribute('aria-selected', which === p); }
  });
  window.scrollTo({ top: 0, behavior: 'auto' });
  if (which === 'practice' && typeof onEnterLab === 'function') onEnterLab();
  if (which === 'workbook' && typeof initWorkbook === 'function') initWorkbook();
  updateProgress();
}
function goStep(n) { const el = document.getElementById('step' + n); if (el) el.scrollIntoView({ behavior: 'smooth' }); }

(function () {
  const pills = document.querySelectorAll('.step-pill');
  const steps = [1, 2, 3, 4, 5].map(n => document.getElementById('step' + n));
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { const i = steps.indexOf(e.target); pills.forEach((p, j) => p.classList.toggle('on', j === i)); }
  }), { threshold: 0.3, rootMargin: '-120px 0px -55% 0px' });
  steps.forEach(s => s && io.observe(s));
})();

function updateProgress() {
  const bar = document.getElementById('progressbar'); const pane = document.getElementById('pane-practice'); if (!bar || !pane) return;
  if (pane.classList.contains('active')) {
    const p = (typeof labProgress === 'function') ? labProgress() : 0;
    bar.style.width = (50 + p * 50) + '%';
  } else {
    const h = document.body.scrollHeight - window.innerHeight;
    bar.style.width = ((h > 0 ? Math.min(1, window.scrollY / h) : 0) * 50) + '%';
  }
}
window.addEventListener('scroll', updateProgress, { passive: true });
window.addEventListener('scroll', () => {
  const mb = document.getElementById('modbar'); if (mb) mb.style.boxShadow = window.scrollY > 10 ? '0 10px 30px -18px rgba(0,0,0,.5)' : 'none';
}, { passive: true });

/* KaTeX for theory formula blocks (display mode) */
function renderFormulas() {
  if (typeof katex === 'undefined') return;
  document.querySelectorAll('.eq[data-tex]').forEach(el => {
    if (el.dataset.rendered) return;
    try { katex.render(el.getAttribute('data-tex'), el, { displayMode: true, throwOnError: false }); el.dataset.rendered = '1'; }
    catch (e) {}
  });
}
renderFormulas();
document.addEventListener('DOMContentLoaded', renderFormulas);

/* Theory widget: pick an EV/EBITDA multiple, watch ValueCo's implied value */
(function () {
  const M = document.getElementById('cw-mult');
  if (!M) return;
  const Mo = document.getElementById('cw-mult-o'), ev = document.getElementById('cw-ev'), eq = document.getElementById('cw-eq');
  function calc() {
    const m = +M.value, EV = m * 700, EQ = EV - (1500 - 183);
    Mo.textContent = m.toFixed(1) + '×';
    ev.textContent = '$' + EV.toLocaleString(undefined, { maximumFractionDigits: 0 }) + 'm';
    eq.textContent = '$' + EQ.toLocaleString(undefined, { maximumFractionDigits: 0 }) + 'm';
  }
  M.addEventListener('input', calc); calc();
})();

updateProgress();
