/* ============================================
   luisracosta.com — Full-Screen Scroll Redesign
   GSAP + ScrollTrigger + Lenis
   Per-section animations, gentle snap,
   scroll progress, clock, lottery, copy email
   ============================================ */

(function () {
  'use strict';

  var lenis;

  // ── Lenis Smooth Scroll ───────────────────

  function initLenis() {
    if (typeof Lenis === 'undefined') return;
    lenis = new Lenis({ lerp: 0.08, smooth: true });

    lenis.on('scroll', function () {
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.update();
    });

    gsap.ticker.add(function (time) {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }

  // ── Preloader ─────────────────────────────

  function initPreloader() {
    var preloader = document.getElementById('preloader');
    if (!preloader) { runEntrance(); return; }

    setTimeout(function () {
      preloader.classList.add('fade-out');
      setTimeout(function () {
        preloader.remove();
        runEntrance();
      }, 400);
    }, 800);
  }

  // ── Hero Entrance ─────────────────────────

  function runEntrance() {
    var items = document.querySelectorAll('.hero-anim');
    if (!items.length || typeof gsap === 'undefined') {
      items.forEach(function (el) { el.style.opacity = '1'; el.style.transform = 'none'; });
      startCoordLottery();
      return;
    }

    gsap.to(items, {
      opacity: 1, y: 0,
      duration: 0.7, ease: 'power2.out',
      stagger: 0.15, delay: 0.1,
      onComplete: startCoordLottery
    });
  }

  // ── Coordinate Lottery ────────────────────

  function startCoordLottery() {
    var el = document.getElementById('coordinates');
    if (!el) return;

    var finalText = '20.9674\u00B0 N, 89.5926\u00B0 W';
    var chars = '0123456789';
    var steps = 20;
    var step = 0;

    var interval = setInterval(function () {
      el.textContent = finalText.split('').map(function (c, i) {
        if (!/[0-9]/.test(c)) return c;
        var lock = (step / steps) * finalText.length;
        return i < lock ? c : chars[Math.floor(Math.random() * chars.length)];
      }).join('');
      step++;
      if (step > steps) { clearInterval(interval); el.textContent = finalText; }
    }, 40);
  }

  // ── Live Clock ────────────────────────────

  function initClock() {
    var el = document.getElementById('clock');
    if (!el) return;
    function tick() {
      try {
        el.textContent = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/Merida',
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        }).format(new Date());
      } catch (e) {
        el.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
      }
    }
    tick();
    setInterval(tick, 1000);
  }

  // ── Dark Mode ─────────────────────────────

  function initTheme() {
    var toggle = document.getElementById('theme-toggle');
    if (!toggle) return;
    var stored = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', stored);

    toggle.addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme');
      var next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    });
  }

  // ── Sticky Nav ────────────────────────────

  function initNav() {
    var nav = document.getElementById('site-nav');
    var hero = document.getElementById('hero');
    if (!nav || !hero || typeof ScrollTrigger === 'undefined') return;

    ScrollTrigger.create({
      trigger: hero, start: 'bottom top',
      onEnter: function () { nav.classList.add('visible'); },
      onLeaveBack: function () { nav.classList.remove('visible'); }
    });

    var links = document.querySelectorAll('.nav-link');
    var sections = ['about', 'setup', 'work', 'writing', 'newsletter'];

    sections.forEach(function (id) {
      var section = document.getElementById(id);
      if (!section) return;
      ScrollTrigger.create({
        trigger: section, start: 'top center', end: 'bottom center',
        onEnter: function () { setActiveNav(id); },
        onEnterBack: function () { setActiveNav(id); }
      });
    });

    function setActiveNav(id) {
      links.forEach(function (link) {
        link.classList.toggle('active', link.getAttribute('data-section') === id);
      });
    }

    links.forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var target = document.getElementById(link.getAttribute('data-section'));
        if (target && lenis) lenis.scrollTo(target, { offset: -60 });
        else if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  // ── Scroll Progress Indicator ─────────────

  function initScrollProgress() {
    var fill = document.getElementById('scroll-fill');
    if (!fill) return;

    window.addEventListener('scroll', function () {
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      fill.style.height = pct + '%';
    });
  }

  // ── Per-Section Scroll Animations ─────────

  function initSectionAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      document.querySelectorAll('[data-animate]').forEach(function (el) {
        el.style.opacity = '1'; el.style.transform = 'none';
      });
      return;
    }

    // About: paragraphs fade up staggered
    animateSection('#about', '[data-animate]', {
      y: 0, opacity: 1, duration: 0.6, stagger: 0.15
    });

    // Setup intro
    animateSection('#setup', '.setup-intro[data-animate]', {
      y: 0, opacity: 1, duration: 0.5
    });

    // Hardware images: scale up + fade
    document.querySelectorAll('.hw-image[data-animate]').forEach(function (el) {
      gsap.to(el, {
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        opacity: 1, scale: 1, y: 0, duration: 0.8, ease: 'power2.out'
      });
    });

    // Hardware specs: slide from right
    document.querySelectorAll('.hw-name[data-animate], .hw-tagline[data-animate], .hw-specs[data-animate]').forEach(function (el, i) {
      gsap.to(el, {
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        opacity: 1, x: 0, duration: 0.6, ease: 'power2.out', delay: i * 0.1
      });
    });

    // Subsection labels
    animateSection('#setup', '.subsection-label[data-animate]', {
      y: 0, opacity: 1, duration: 0.4, stagger: 0
    });

    // AI cards: pop in staggered
    document.querySelectorAll('.ai-primary-grid, .logo-grid').forEach(function (grid) {
      var cards = grid.querySelectorAll('[data-animate]');
      if (!cards.length) return;
      gsap.to(cards, {
        scrollTrigger: { trigger: grid, start: 'top 85%', once: true },
        opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'power2.out', stagger: 0.06
      });
    });

    // Work: slide up with rotation correction
    animateSection('#work', '[data-animate]', {
      y: 0, rotation: 0, opacity: 1, duration: 0.6, stagger: 0.1
    });

    // Writing: slide from left
    var writingItems = document.querySelectorAll('#writing [data-animate]');
    if (writingItems.length) {
      gsap.to(writingItems, {
        scrollTrigger: { trigger: '#writing', start: 'top 80%', once: true },
        opacity: 1, x: 0, duration: 0.5, ease: 'power2.out', stagger: 0.08
      });
    }

    // Newsletter: fade up
    animateSection('#newsletter', '[data-animate]', {
      y: 0, opacity: 1, duration: 0.6, stagger: 0.1
    });

    // Section labels: fade in with slide
    document.querySelectorAll('.section').forEach(function (section) {
      ScrollTrigger.create({
        trigger: section, start: 'top 80%', once: true,
        onEnter: function () { section.classList.add('visible'); }
      });
    });
  }

  function animateSection(sectionSelector, childSelector, props) {
    var section = document.querySelector(sectionSelector);
    if (!section) return;
    var children = section.querySelectorAll(childSelector);
    if (!children.length) return;

    var baseProps = {
      scrollTrigger: { trigger: section, start: 'top 80%', once: true },
      ease: 'power2.out'
    };

    for (var key in props) { baseProps[key] = props[key]; }
    gsap.to(children, baseProps);
  }

  // ── Hardware Parallax ─────────────────────

  function initHardwareParallax() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    if (window.innerWidth < 768) return;

    ['hw-mini', 'hw-mbp'].forEach(function (id) {
      var showcase = document.getElementById(id);
      if (!showcase) return;
      var img = showcase.querySelector('.hw-image');
      if (!img) return;

      gsap.to(img, {
        scrollTrigger: { trigger: showcase, start: 'top bottom', end: 'bottom top', scrub: 0.5 },
        y: -50, ease: 'none'
      });
    });
  }

  // ── Gentle Scroll Snap ────────────────────

  function initScrollSnap() {
    if (typeof ScrollTrigger === 'undefined') return;
    if (window.innerWidth < 768) return; // No snap on mobile

    var sections = gsap.utils.toArray('.section:not(.section-setup)');
    var hero = document.getElementById('hero');
    var panels = hero ? [hero].concat(sections) : sections;

    // Create snap points from section positions
    panels.forEach(function (panel) {
      ScrollTrigger.create({
        trigger: panel,
        start: 'top top',
        snap: {
          snapTo: 1,
          duration: { min: 0.2, max: 0.4 },
          ease: 'power1.inOut'
        }
      });
    });
  }

  // ── Copy Email ────────────────────────────

  function initCopyEmail() {
    var btn = document.getElementById('copy-email');
    if (!btn) return;

    btn.addEventListener('click', function () {
      if (navigator.clipboard) {
        navigator.clipboard.writeText('contacto@luisracosta.com').then(function () {
          showToast('Copied');
        });
      } else {
        var ta = document.createElement('textarea');
        ta.value = 'contacto@luisracosta.com';
        ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta); ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('Copied');
      }
    });
  }

  function showToast(msg) {
    var toast = document.createElement('div');
    toast.className = 'toast'; toast.textContent = msg;
    document.body.appendChild(toast);
    requestAnimationFrame(function () { toast.classList.add('visible'); });
    setTimeout(function () {
      toast.classList.remove('visible');
      setTimeout(function () { toast.remove(); }, 300);
    }, 2000);
  }

  // ── Newsletter ────────────────────────────

  function initNewsletter() {
    var form = document.getElementById('newsletter-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = document.getElementById('email-input').value.trim();
      if (!email || email.indexOf('@') === -1) return;

      try {
        var subs = JSON.parse(localStorage.getItem('newsletter_subs') || '[]');
        if (subs.indexOf(email) === -1) subs.push(email);
        localStorage.setItem('newsletter_subs', JSON.stringify(subs));
      } catch (err) {}

      document.getElementById('form-row').hidden = true;
      document.getElementById('newsletter-success').hidden = false;
    });
  }

  // ── Init ──────────────────────────────────

  document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initClock();
    initLenis();

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
    }

    initPreloader();
    initNav();
    initScrollProgress();
    initSectionAnimations();
    initHardwareParallax();
    initCopyEmail();
    initNewsletter();
  });

})();
