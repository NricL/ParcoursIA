// Reveal on scroll
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// Animated counter for hero
const counter = document.querySelector('[data-counter]');
if (counter) {
  const target = parseInt(counter.dataset.counter, 10);
  const dur = 1600;
  const start = performance.now();
  const fmt = new Intl.NumberFormat('fr-FR');
  function step(now) {
    const t = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - t, 3);
    counter.textContent = fmt.format(Math.round(target * eased));
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
