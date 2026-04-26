/* ===================================================
   SF-27 — Autonova Industries
   Script principal (navigation & interactions)
   =================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Navigation SPA ─────────────────────────────── */
  const navItems = document.querySelectorAll('.nav-item');
  const pages    = document.querySelectorAll('.page');
  const hamburger = document.getElementById('hamburger');
  const sidebar   = document.getElementById('sidebar');

  function showPage(id) {
    pages.forEach(p => p.classList.toggle('active', p.id === id));
    navItems.forEach(n => n.classList.toggle('active', n.dataset.page === id));
    window.scrollTo(0, 0);
    // Close sidebar on mobile
    if (window.innerWidth <= 900) sidebar.classList.remove('open');
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => showPage(item.dataset.page));
  });

  // CTA buttons that navigate
  document.querySelectorAll('[data-goto]').forEach(btn => {
    btn.addEventListener('click', () => showPage(btn.dataset.goto));
  });

  // Hamburger toggle
  hamburger.addEventListener('click', () => sidebar.classList.toggle('open'));

  // Close sidebar when clicking outside (mobile)
  document.addEventListener('click', e => {
    if (window.innerWidth <= 900 && !sidebar.contains(e.target) && e.target !== hamburger) {
      sidebar.classList.remove('open');
    }
  });

  // Start on accueil
  showPage('accueil');

  /* ── Tabs (Développement technique) ────────────── */
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === target));
      tabPanels.forEach(p => p.classList.toggle('active', p.id === target));
    });
  });

  /* ── Download Arduino code ──────────────────────── */
  const dlBtn = document.getElementById('download-code');
  if (dlBtn) {
    dlBtn.addEventListener('click', () => {
      const code = document.getElementById('arduino-source').innerText;
      const blob = new Blob([code], { type: 'text/plain' });
      const url  = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'SF27_main.ino';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  /* ── Gallery lightbox ───────────────────────────── */
  const galleryItems = document.querySelectorAll('.gallery-item');
  let lightbox = null;

  function openLightbox(item) {
    const label = item.querySelector('.gallery-label')?.textContent || '';
    const img   = item.querySelector('img');

    lightbox = document.createElement('div');
    lightbox.style.cssText = `
      position:fixed;inset:0;background:rgba(9,12,20,0.95);z-index:9999;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      cursor:pointer;animation:fadeIn .2s ease;
    `;

    const mediaBlock = img
      ? `<img src="${img.src}" alt="${label}"
             style="max-width:100%;max-height:70vh;object-fit:contain;border:1px solid #1C2338;">`
      : `<div style="border:1px dashed #1C2338;padding:80px 40px;color:#3E455A;
                     font-family:'Rajdhani',sans-serif;font-size:13px;letter-spacing:1px;">
           📁&nbsp; Remplace ce bloc par ton image réelle<br>
           <span style="font-size:11px;margin-top:6px;display:block;">Format recommandé : JPG/PNG, 1280×720 px</span>
         </div>`;

    lightbox.innerHTML = `
      <div style="border:1px solid #1C2338;background:#0E1220;padding:32px;max-width:900px;width:92%;text-align:center;">
        <div style="font-family:'Rajdhani',sans-serif;font-size:20px;font-weight:600;color:#E8EAF0;margin-bottom:8px;">${label}</div>
        <div style="font-family:'Rajdhani',sans-serif;font-size:12px;letter-spacing:2px;color:#7A8099;text-transform:uppercase;margin-bottom:24px;">Autonova Industries — SF-27</div>
        ${mediaBlock}
        <div style="margin-top:16px;font-family:'Rajdhani',sans-serif;font-size:11px;color:#3E455A;">Cliquer pour fermer</div>
      </div>
    `;
    lightbox.addEventListener('click', () => { lightbox.remove(); lightbox = null; });
    document.body.appendChild(lightbox);
  }

  galleryItems.forEach(item => item.addEventListener('click', () => openLightbox(item)));

  /* ── Animated counter ───────────────────────────── */
  function animateCounter(el, target, suffix = '') {
    let start = 0;
    const step = Math.ceil(target / 40);
    const interval = setInterval(() => {
      start += step;
      if (start >= target) { start = target; clearInterval(interval); }
      el.textContent = start + suffix;
    }, 30);
  }

  const countersDone = new Set();

  function runCounters() {
    document.querySelectorAll('[data-counter]').forEach(el => {
      if (countersDone.has(el)) return;
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        countersDone.add(el);
        animateCounter(el, parseInt(el.dataset.counter), el.dataset.suffix || '');
      }
    });
  }

  window.addEventListener('scroll', runCounters);
  runCounters();

});
