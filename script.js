(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const menuButton = document.querySelector('.menu-button');
  const nav = document.querySelector('#site-nav');
  const siteHeader = document.querySelector('.site-header');

  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!open));
    nav?.classList.toggle('open');
  });

  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
  }));

  const revealItems = [...document.querySelectorAll('.reveal')];
  if (!reduceMotion.matches && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });
    revealItems.forEach(item => revealObserver.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('visible'));
  }

  if (!reduceMotion.matches && finePointer.matches) {
    document.querySelectorAll('.interactive-glass').forEach(card => {
      let pointerFrame = 0;
      let pointerX = 0.5;
      let pointerY = 0.18;

      const renderPointer = () => {
        card.style.setProperty('--mx', `${(pointerX * 100).toFixed(1)}%`);
        card.style.setProperty('--my', `${(pointerY * 100).toFixed(1)}%`);
        card.style.setProperty('--ry', `${((pointerX - 0.5) * 5).toFixed(2)}deg`);
        card.style.setProperty('--rx', `${((0.5 - pointerY) * 4).toFixed(2)}deg`);
        pointerFrame = 0;
      };

      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        pointerX = (event.clientX - rect.left) / rect.width;
        pointerY = (event.clientY - rect.top) / rect.height;
        if (!pointerFrame) pointerFrame = requestAnimationFrame(renderPointer);
      }, { passive: true });

      card.addEventListener('pointerleave', () => {
        pointerX = 0.5;
        pointerY = 0.18;
        if (!pointerFrame) pointerFrame = requestAnimationFrame(renderPointer);
      }, { passive: true });
    });
  }

  let scrollFrame = 0;
  const updateHeader = () => {
    siteHeader?.classList.toggle('is-scrolled', window.scrollY > 28);
    scrollFrame = 0;
  };
  const queueHeaderUpdate = () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateHeader);
  };
  window.addEventListener('scroll', queueHeaderUpdate, { passive: true });
  window.addEventListener('pageshow', updateHeader, { passive: true });
  updateHeader();

  const sectionLinks = [...document.querySelectorAll('#site-nav a[href^="#"]')];
  const sectionTargets = sectionLinks
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);
  if (sectionTargets.length && 'IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(entries => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      sectionLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${visible.target.id}`);
      });
    }, { rootMargin: '-24% 0px -62% 0px', threshold: [0, 0.2, 0.6] });
    sectionTargets.forEach(section => sectionObserver.observe(section));
  }

  const prefetched = new Set();
  const prefetch = href => {
    if (!href || prefetched.has(href)) return;
    prefetched.add(href);
    const hint = document.createElement('link');
    hint.rel = 'prefetch';
    hint.href = href;
    hint.as = 'document';
    document.head.appendChild(hint);
  };
  const internalPages = [...document.querySelectorAll('a[href^="/projects/"]')];
  internalPages.forEach(link => link.addEventListener('pointerenter', () => prefetch(link.href), { passive: true, once: true }));
  window.addEventListener('load', () => {
    const warmPages = () => internalPages.forEach(link => prefetch(link.href));
    if ('requestIdleCallback' in window) requestIdleCallback(warmPages, { timeout: 1800 });
    else setTimeout(warmPages, 800);
  }, { once: true });
})();
