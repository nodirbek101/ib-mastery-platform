/* Landing-page interactions: sticky nav, scroll reveals, number count-up. */
(function () {
  const nav = document.getElementById('nav');
  const hero = document.querySelector('.hero');

  function onScroll() {
    const y = window.scrollY;
    if (y > 24) nav.classList.add('scrolled'); else nav.classList.remove('scrolled');
    // keep nav text light only while over the dark hero
    if (hero) {
      const overHero = y < hero.offsetHeight - 80;
      nav.classList.toggle('dark', overHero);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Reveal on scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.14 });
  document.querySelectorAll('.reveal:not(.in)').forEach(el => io.observe(el));

  // Count-up for simple integer stats
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = +el.getAttribute('data-count');
    let n = 0; const step = Math.max(1, Math.round(target / 24));
    const t = setInterval(() => {
      n += step; if (n >= target) { n = target; clearInterval(t); }
      el.textContent = n;
    }, 34);
  });

  // Smooth-scroll for same-page anchors
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', ev => {
      const id = a.getAttribute('href');
      if (id.length > 1) {
        const t = document.querySelector(id);
        if (t) { ev.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
      }
    });
  });
})();
