# WEBSITE REBUILD BRIEF — luisracosta.com
**Status:** DEFINITIVE SPEC · Supersedes Part 2 of MISSION-CONTROL-BRIEF.md  
**Target repo:** `even-admin/luisramirez-site` · Branch: `main`  
**Deploy:** GitHub Pages · CNAME: `luisracosta.com`  
**Commit message:** `website: full rebuild — Remy-inspired minimal site with Apple-style setup showcase`

---

## 1. PHILOSOPHY

This is not a portfolio site. It is an operating statement. The site itself demonstrates how Luis works: clean thinking, deliberate decisions, zero waste. Every element earns its place.

**Reference:** [remygaskell.com](https://remygaskell.com) — single-page scroll, content-driven discovery, absolute section labels, monochromatic restraint. Study the rhythm of that site. Luis's site should feel like that but warmer — editorial rather than technical.

**Aesthetic target:** Apple product page meets Remy Gaskell. The Setup section is the hero product. Everything else frames it.

---

## 2. DESIGN SYSTEM

### 2.1 Fonts

Load both fonts at the top of `index.html`:

```html
<!-- Google Fonts: Instrument Serif + DM Mono -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">

<!-- Fontshare: Satoshi -->
<link href="https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700&display=swap" rel="stylesheet">
```

| Role | Font | Size | Weight |
|---|---|---|---|
| Display / headings | Instrument Serif | varies | 400 (use italic sparingly for emphasis) |
| Body copy | Satoshi | 14px | 400, line-height 1.7 |
| UI / buttons / labels | Satoshi | 13–14px | 500 |
| Coordinates / time / mono details | DM Mono | 12–13px | 400 |
| Section labels | Satoshi | 11px | 500, letter-spacing 0.08em, UPPERCASE |

### 2.2 Color Palette

```css
:root {
  --black:    #0A0A0A;
  --white:    #FAFAF8;
  --gray-50:  #F5F5F3;
  --gray-100: #EEEDEA;
  --gray-200: #D4D3CE;
  --gray-300: #B8B7B2;
  --gray-400: #8A8885;
  --gray-500: #6E6D6A;
  --gray-600: #525250;
  --gray-700: #3A3A38;
  --gray-800: #1A1A18;

  /* Light mode surfaces */
  --bg:         var(--white);
  --bg-card:    #FFFFFF;
  --text:       var(--black);
  --text-muted: var(--gray-500);
  --border:     var(--gray-200);
}

[data-theme="dark"] {
  --bg:         var(--black);
  --bg-card:    #111111;
  --text:       #E8E6E3;
  --text-muted: var(--gray-500);
  --border:     #2A2A2A;
}
```

### 2.3 Card System

```css
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: none; /* NEVER use box-shadow */
  transition: background 180ms cubic-bezier(0.16, 1, 0.3, 1),
              border-color 180ms cubic-bezier(0.16, 1, 0.3, 1),
              transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.card:hover {
  background: var(--gray-50);
  border-color: var(--gray-300);
  transform: translateY(-2px);
}

[data-theme="dark"] .card:hover {
  background: #1A1A18;
}
```

### 2.4 Global Link Reset

```css
a {
  color: inherit;
  text-decoration: none;
}
```

No blue links anywhere. Hover states use underline or color shift — never browser-default blue.

### 2.5 Layout

```css
.content {
  max-width: 500px;    /* Intimate reading width, like Remy */
  margin: 0 auto;
  padding: 0 24px;
}
```

Mobile: full-width, padding 16px.

### 2.6 Section Label Pattern (Remy-style)

```css
.section-label {
  font-family: 'Satoshi', sans-serif;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gray-400);
  position: absolute;
  left: -90px;   /* Offset into left margin */
  top: 4px;
}

.section {
  position: relative;
  padding: 64px 0;
}
```

On mobile (`max-width: 640px`): labels become inline block above the section content, `position: static`, `margin-bottom: 12px`.

---

## 3. ANIMATION SYSTEM

All animations MUST respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 3.1 Entrance Sequence (page load)

Use CSS classes toggled by JS with `requestAnimationFrame`:

```css
.fade-up {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 600ms cubic-bezier(0.4, 0, 0.2, 1),
              transform 600ms cubic-bezier(0.4, 0, 0.2, 1);
}
.fade-up.visible {
  opacity: 1;
  transform: translateY(0);
}
```

**Load sequence** (staggered with `setTimeout` delays):
1. `0ms` — Clock fades in
2. `200ms` — Name + tagline fade up
3. `400ms` — Coordinate lottery begins (digits randomize → settle over 800ms)
4. `1000ms` — Social icons pop in, 50ms between each
5. `1200ms` — Action buttons fade in

### 3.2 Coordinate Lottery (DM Mono)

Replicates Remy's digit-randomizing location reveal:

```js
function animateLottery(el, finalText, duration = 800) {
  const chars = '0123456789';
  const steps = 20;
  let step = 0;
  
  const interval = setInterval(() => {
    el.textContent = finalText.split('').map((char, i) => {
      if (!/[0-9]/.test(char)) return char;
      // Gradually lock in digits from left
      const lockThreshold = (step / steps) * finalText.length;
      return i < lockThreshold 
        ? char 
        : chars[Math.floor(Math.random() * chars.length)];
    }).join('');
    
    step++;
    if (step > steps) {
      clearInterval(interval);
      el.textContent = finalText;
    }
  }, duration / steps);
}
// Usage: animateLottery(coordEl, '20.9674° N, 89.5926° W');
```

### 3.3 Live Clock (DM Mono)

```js
function updateClock() {
  const now = new Date();
  const merida = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Merida',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(now);
  document.getElementById('clock').textContent = merida;
}
setInterval(updateClock, 1000);
updateClock();
```

### 3.4 Scroll-Triggered Reveals (IntersectionObserver)

```js
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      // Stagger child elements
      const children = entry.target.querySelectorAll('[data-animate]');
      children.forEach((child, j) => {
        setTimeout(() => child.classList.add('visible'), j * 80);
      });
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.section').forEach(el => observer.observe(el));
```

### 3.5 Hover Transitions

All interactive elements: `180ms cubic-bezier(0.16, 1, 0.3, 1)`

- **Cards:** `translateY(-2px)` + border-color shift (see §2.3)
- **Social icons:** gray-100 bg circle appears behind icon
- **Links in Thinking section:** underline slides in from left via `::after` pseudo-element
- **Buttons:** background lightens (primary) or border darkens (secondary)

### 3.6 The Setup Scroll Interaction

Cards in the Setup section reveal with a **staggered scroll cascade** using IntersectionObserver:

- Hardware cards (large): `translateY(40px) → 0` + `opacity 0 → 1`, 600ms
- Each subsequent hardware card: +120ms delay from previous
- AI layer cards: same but +80ms stagger
- Stack/ops grid items: +40ms stagger each

Optional enhancement (if GSAP is used via CDN): hardware cards can pin briefly on scroll using `ScrollTrigger`, creating an Apple-style pause-and-reveal. Use only if it doesn't impact performance.

**GSAP CDN (optional, only if using ScrollTrigger):**
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
```

---

## 4. PAGE STRUCTURE

### Section 0: PRELOADER (optional but premium)

Simple fade-in reveal. Show a minimal mark — the letter "L" in Instrument Serif at 48px — centered on a white/black background. After 800ms, fade out and trigger the entrance sequence.

```html
<div id="preloader" aria-hidden="true">
  <span class="preloader-mark">L</span>
</div>
```

```css
#preloader {
  position: fixed;
  inset: 0;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  transition: opacity 400ms ease;
}
#preloader.fade-out {
  opacity: 0;
  pointer-events: none;
}
.preloader-mark {
  font-family: 'Instrument Serif', serif;
  font-size: 48px;
  color: var(--text);
}
```

JS: after `DOMContentLoaded` + 800ms, add `.fade-out` to `#preloader`, then remove from DOM after transition.

---

### Section 1: HERO

```html
<header class="hero">
  <!-- Dark mode toggle: top-right, fixed -->
  <button id="theme-toggle" class="theme-toggle" aria-label="Toggle dark mode">
    <!-- Sun icon (light mode) / Moon icon (dark mode) — inline SVG -->
  </button>

  <div class="content">
    <!-- Live clock -->
    <div id="clock" class="clock fade-up" aria-live="polite"></div>

    <!-- Name + tagline -->
    <h1 class="name fade-up">Luis Alberto Ramirez Acosta</h1>
    <p class="tagline fade-up">Fractional CTO. AI-native builder.</p>

    <!-- Location with lottery animation -->
    <p class="location fade-up">
      MER, MX · <span id="coordinates" class="mono">20.9674° N, 89.5926° W</span>
    </p>

    <!-- Social icons -->
    <div class="social-bar fade-up">
      <a href="https://x.com/luisracosta" target="_blank" rel="noopener noreferrer" 
         class="social-icon" aria-label="X / Twitter">
        <!-- X SVG icon, 20×20 -->
      </a>
      <a href="https://linkedin.com/in/luisracosta" target="_blank" rel="noopener noreferrer" 
         class="social-icon" aria-label="LinkedIn">
        <!-- LinkedIn SVG icon, 20×20 -->
      </a>
      <a href="https://github.com/even-admin" target="_blank" rel="noopener noreferrer" 
         class="social-icon" aria-label="GitHub">
        <!-- GitHub SVG icon, 20×20 -->
      </a>
      <a href="https://fold.mx" target="_blank" rel="noopener noreferrer" 
         class="social-icon" aria-label="fold.mx">
        <!-- fold.mx mark, 20×20 or text "f" -->
      </a>
    </div>

    <!-- Action row -->
    <div class="action-row fade-up">
      <a href="mailto:contacto@luisracosta.com" class="btn btn-primary">
        <!-- Mail SVG icon --> Contact me
      </a>
      <span class="action-divider">or</span>
      <button id="copy-email" class="btn btn-secondary">
        <!-- Copy SVG icon --> Copy email
      </button>
    </div>
  </div>
</header>
```

**CSS notes:**
```css
.clock {
  font-family: 'DM Mono', monospace;
  font-size: 13px;
  color: var(--gray-400);
  margin-bottom: 32px;
}
.name {
  font-family: 'Instrument Serif', serif;
  font-size: 20px;
  font-weight: 600;  /* Note: Instrument Serif uses 400 normally — use bold variant */
  color: var(--text);
  margin: 0 0 6px;
}
.tagline {
  font-family: 'Satoshi', sans-serif;
  font-size: 16px;
  font-weight: 400;
  color: var(--gray-500);
  margin: 0 0 12px;
}
.location {
  font-size: 13px;
  color: var(--gray-400);
  margin-bottom: 32px;
}
.mono {
  font-family: 'DM Mono', monospace;
}
.social-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}
.social-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gray-500);
  transition: background 180ms cubic-bezier(0.16, 1, 0.3, 1),
              color 180ms cubic-bezier(0.16, 1, 0.3, 1);
}
.social-icon:hover {
  background: var(--gray-100);
  color: var(--text);
}
.action-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.btn {
  font-family: 'Satoshi', sans-serif;
  font-size: 14px;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid var(--border);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 180ms cubic-bezier(0.16, 1, 0.3, 1);
}
.btn-primary {
  background: var(--text);
  color: var(--bg);
  border-color: var(--text);
}
.btn-primary:hover {
  opacity: 0.85;
}
.btn-secondary {
  background: transparent;
  color: var(--text);
}
.btn-secondary:hover {
  background: var(--gray-50);
  border-color: var(--gray-300);
}
.action-divider {
  font-size: 13px;
  color: var(--gray-400);
}
```

**Copy email toast:**
```js
document.getElementById('copy-email').addEventListener('click', () => {
  navigator.clipboard.writeText('contacto@luisracosta.com').then(() => {
    showToast('Email copied');
  });
});

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('visible'));
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}
```

```css
.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%) translateY(8px);
  background: var(--text);
  color: var(--bg);
  font-family: 'Satoshi', sans-serif;
  font-size: 13px;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 8px;
  opacity: 0;
  transition: opacity 200ms ease, transform 200ms ease;
  z-index: 100;
  pointer-events: none;
}
.toast.visible {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
```

**Dark mode toggle** (fixed top-right):
```css
.theme-toggle {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--gray-500);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 180ms cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 50;
}
.theme-toggle:hover {
  background: var(--gray-50);
  color: var(--text);
}
```

```js
const toggle = document.getElementById('theme-toggle');
const stored = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', stored);
updateToggleIcon(stored);

toggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateToggleIcon(next);
});

function updateToggleIcon(theme) {
  // Swap sun/moon SVG based on theme
}
```

---

### Section 2: ABOUT

Section label: "About" (absolute left, -90px offset)

```html
<section class="section" id="about">
  <span class="section-label">About</span>
  <div class="content">
    <div class="about-text">
      <!-- 2–3 paragraphs, written below -->
    </div>
  </div>
</section>
```

**Copy (write exactly this):**

> I build operating systems for businesses — the kind that let one person do the work of five. Based in Mérida, México.
>
> I'm the founder of [EVEN Venture Studio](https://evenai.co), where I serve as Fractional CTO for founders and business families building with AI. My background is in Design Thinking and Human-Centered System Design, and I'm currently studying Programación y Transformación Digital at EBC.
>
> The setup below is not a list of tools. It's the actual infrastructure I run on. Every client engagement is built on top of it.

**CSS:**
```css
.about-text p {
  font-family: 'Satoshi', sans-serif;
  font-size: 14px;
  line-height: 1.7;
  color: var(--text);
  margin: 0 0 16px;
}
.about-text p:last-child {
  margin-bottom: 0;
}
.about-text a {
  border-bottom: 1px solid var(--gray-300);
  transition: border-color 180ms ease;
}
.about-text a:hover {
  border-color: var(--text);
}
```

---

### Section 3: THE SETUP

Section label: "Setup"

This is the showpiece. Three tiers of content: hardware (large cards), AI layer (medium cards), and dev/ops stack (icon grid).

#### 3a. Hardware Cards (large, featured)

Each card is near full-width within the 500px container. They should feel like product cards — premium, spacious, with clear hierarchy.

```html
<section class="section" id="setup">
  <span class="section-label">Setup</span>
  <div class="content">
    <p class="setup-intro">This is how I operate.</p>

    <!-- Hardware cards -->
    <div class="hardware-grid">
      <div class="hardware-card card" data-animate>
        <div class="hw-label">Mac Mini</div>
        <div class="hw-desc">Always-on server. Runs orchestration, Cal.com, agent systems. The brain that never sleeps.</div>
      </div>
      <div class="hardware-card card" data-animate>
        <div class="hw-label">MacBook Pro</div>
        <div class="hw-desc">Mobile development. Claude Code, React, Python. Ships from anywhere.</div>
      </div>
      <div class="hardware-card card" data-animate>
        <div class="hw-label">iPhone × 2</div>
        <div class="hw-desc">WhatsApp client comms on one. Monitoring and notifications on the other.</div>
      </div>
    </div>

    <!-- AI Layer cards -->
    <div class="ai-layer-label">AI Layer</div>
    <div class="ai-grid">
      <div class="ai-card card" data-animate>
        <div class="ai-name">Perplexity</div>
        <div class="ai-desc">Strategy, research, intelligence. The executive assistant that plans everything.</div>
      </div>
      <div class="ai-card card" data-animate>
        <div class="ai-name">Claude + Claude Code</div>
        <div class="ai-desc">The builder. Writes code, ships features, deploys production.</div>
      </div>
      <div class="ai-card card" data-animate>
        <div class="ai-name">Paperclip</div>
        <div class="ai-desc">Agent orchestration. Project management for AI teams.</div>
      </div>
    </div>

    <!-- Dev Stack icon grid (Remy-style) -->
    <div class="stack-label">Dev Stack</div>
    <div class="stack-grid">
      <div class="stack-item">React / Next.js</div>
      <div class="stack-item">Tailwind / shadcn</div>
      <div class="stack-item">Python</div>
      <div class="stack-item">Supabase / PostgreSQL</div>
      <div class="stack-item">GitHub</div>
    </div>

    <!-- Client Ops icon grid -->
    <div class="stack-label">Client Ops</div>
    <div class="stack-grid">
      <div class="stack-item">Cal.com</div>
      <div class="stack-item">HubSpot</div>
      <div class="stack-item">Google Workspace</div>
    </div>
  </div>
</section>
```

**CSS:**
```css
.setup-intro {
  font-family: 'Satoshi', sans-serif;
  font-size: 13px;
  color: var(--gray-400);
  margin: 0 0 32px;
}

/* Hardware cards — large, almost full-width */
.hardware-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 48px;
}
.hardware-card {
  padding: 24px;
}
.hw-label {
  font-family: 'Instrument Serif', serif;
  font-size: 18px;
  color: var(--text);
  margin-bottom: 8px;
}
.hw-desc {
  font-family: 'Satoshi', sans-serif;
  font-size: 13px;
  line-height: 1.6;
  color: var(--gray-500);
}

/* AI Layer: medium cards */
.ai-layer-label,
.stack-label {
  font-family: 'Satoshi', sans-serif;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gray-400);
  margin-bottom: 12px;
}
.ai-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 40px;
}
.ai-card {
  padding: 16px 20px;
}
.ai-name {
  font-family: 'Satoshi', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
  margin-bottom: 4px;
}
.ai-desc {
  font-family: 'Satoshi', sans-serif;
  font-size: 13px;
  line-height: 1.5;
  color: var(--gray-500);
}

/* Dev Stack + Client Ops: small icon-grid (Remy-style) */
.stack-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 32px;
}
.stack-item {
  font-family: 'Satoshi', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
  padding: 10px 14px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  transition: all 180ms cubic-bezier(0.16, 1, 0.3, 1);
}
.stack-item:hover {
  background: var(--gray-50);
  border-color: var(--gray-300);
}
```

---

### Section 4: WORK

Section label: "Work"

```html
<section class="section" id="work">
  <span class="section-label">Work</span>
  <div class="content">
    <div class="work-cards">

      <a href="https://evenai.co" target="_blank" rel="noopener noreferrer" 
         class="work-card card" data-animate>
        <div class="work-card-inner">
          <div class="work-title">EVEN Venture Studio</div>
          <div class="work-desc">Fractional CTO as a Service. AI-native operations for businesses in México.</div>
          <div class="work-link-indicator">evenai.co ↗</div>
        </div>
      </a>

      <a href="https://fold.mx" target="_blank" rel="noopener noreferrer" 
         class="work-card card" data-animate>
        <div class="work-card-inner">
          <div class="work-title">fold.mx</div>
          <div class="work-desc">AI and technology media. Real impact, no noise.</div>
          <div class="work-link-indicator">fold.mx ↗</div>
        </div>
      </a>

      <div class="work-card card" data-animate>
        <div class="work-card-inner">
          <div class="work-title">Newsletter</div>
          <div class="work-desc">Ideas sobre IA, tecnología y negocios. Cada dos semanas.</div>
          <div class="work-link-indicator">→ <a href="#newsletter">Suscríbete</a></div>
        </div>
      </div>

    </div>
  </div>
</section>
```

**CSS:**
```css
.work-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.work-card {
  display: block;
  padding: 20px 24px;
}
.work-title {
  font-family: 'Instrument Serif', serif;
  font-size: 17px;
  color: var(--text);
  margin-bottom: 6px;
}
.work-desc {
  font-family: 'Satoshi', sans-serif;
  font-size: 13px;
  line-height: 1.6;
  color: var(--gray-500);
  margin-bottom: 12px;
}
.work-link-indicator {
  font-family: 'Satoshi', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: var(--gray-400);
}
```

---

### Section 5: THINKING

Section label: "Thinking"

Clean list of published articles. Title + date. Hover: underline slides in.

```html
<section class="section" id="thinking">
  <span class="section-label">Thinking</span>
  <div class="content">
    <ol class="article-list" reversed>
      <li class="article-item" data-animate>
        <a href="/caballos-salvajes.html" class="article-link">
          <span class="article-title">Caballos Salvajes</span>
          <span class="article-date">2026</span>
        </a>
      </li>
      <li class="article-item" data-animate>
        <a href="/el-territorio-cambio.html" class="article-link">
          <span class="article-title">El Territorio Cambió</span>
          <span class="article-date">2026</span>
        </a>
      </li>
      <li class="article-item" data-animate>
        <a href="/como-construi-mi-sistema-operativo.html" class="article-link">
          <span class="article-title">Cómo Construí Mi Sistema Operativo</span>
          <span class="article-date">2026</span>
        </a>
      </li>
      <li class="article-item" data-animate>
        <a href="/por-que-construimos-diferente.html" class="article-link">
          <span class="article-title">Por Qué Construimos Diferente</span>
          <span class="article-date">2026</span>
        </a>
      </li>
      <li class="article-item" data-animate>
        <a href="/la-carrera-de-la-ia-es-un-ciclo.html" class="article-link">
          <span class="article-title">La Carrera de la IA es un Ciclo</span>
          <span class="article-date">2026</span>
        </a>
      </li>
    </ol>
  </div>
</section>
```

**CSS:**
```css
.article-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.article-item {
  border-bottom: 1px solid var(--border);
}
.article-item:first-child {
  border-top: 1px solid var(--border);
}
.article-link {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 14px 0;
  gap: 16px;
  transition: color 180ms ease;
}
.article-link:hover .article-title {
  /* Underline slide-in via border-bottom */
  border-bottom: 1px solid var(--text);
}
.article-title {
  font-family: 'Satoshi', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: var(--text);
  border-bottom: 1px solid transparent;
  transition: border-color 180ms ease;
}
.article-date {
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  color: var(--gray-400);
  white-space: nowrap;
  flex-shrink: 0;
}
```

---

### Section 6: NEWSLETTER

Section label: "Newsletter"

```html
<section class="section" id="newsletter">
  <span class="section-label">Newsletter</span>
  <div class="content">
    <h2 class="newsletter-heading">Newsletter</h2>
    <p class="newsletter-sub">Ideas sobre IA, tecnología y negocios. Sin spam. Un email cada dos semanas.</p>

    <form id="newsletter-form" class="newsletter-form" novalidate>
      <div class="form-row">
        <input 
          type="email" 
          id="email-input"
          class="email-input" 
          placeholder="tu@email.com" 
          required
          autocomplete="email"
        >
        <button type="submit" class="btn btn-primary">Suscribirme</button>
      </div>
      <div id="newsletter-success" class="newsletter-success" hidden>
        Gracias. Te escribo pronto.
      </div>
    </form>
  </div>
</section>
```

**CSS:**
```css
.newsletter-heading {
  font-family: 'Instrument Serif', serif;
  font-size: 24px;
  font-weight: 400;
  color: var(--text);
  margin: 0 0 8px;
}
.newsletter-sub {
  font-family: 'Satoshi', sans-serif;
  font-size: 14px;
  color: var(--gray-500);
  line-height: 1.6;
  margin: 0 0 24px;
}
.form-row {
  display: flex;
  gap: 8px;
}
.email-input {
  flex: 1;
  font-family: 'Satoshi', sans-serif;
  font-size: 14px;
  padding: 8px 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-card);
  color: var(--text);
  outline: none;
  transition: border-color 180ms ease;
}
.email-input:focus {
  border-color: var(--gray-400);
}
.email-input::placeholder {
  color: var(--gray-400);
}
.newsletter-success {
  font-family: 'Satoshi', sans-serif;
  font-size: 14px;
  color: var(--gray-600);
  margin-top: 12px;
}
```

**JS:**
```js
document.getElementById('newsletter-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const email = document.getElementById('email-input').value.trim();
  if (!email || !email.includes('@')) return;
  
  // Store to localStorage
  const subs = JSON.parse(localStorage.getItem('newsletter_subs') || '[]');
  if (!subs.includes(email)) subs.push(email);
  localStorage.setItem('newsletter_subs', JSON.stringify(subs));
  
  // Show success state
  this.querySelector('.form-row').hidden = true;
  document.getElementById('newsletter-success').hidden = false;
});
```

---

### Section 7: FOOTER

```html
<footer class="footer">
  <div class="content">
    <div class="footer-inner">
      <div class="footer-left">
        <p>© 2026 Luis Alberto Ramirez Acosta</p>
        <p>Mérida, Yucatán, México</p>
        <p class="footer-cheeky">built with claude code</p>
      </div>
      <div class="footer-links">
        <a href="https://x.com/luisracosta" target="_blank" rel="noopener noreferrer">X</a>
        <a href="https://linkedin.com/in/luisracosta" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        <a href="https://github.com/even-admin" target="_blank" rel="noopener noreferrer">GitHub</a>
      </div>
    </div>
  </div>
</footer>
```

**CSS:**
```css
.footer {
  padding: 48px 0 32px;
  border-top: 1px solid var(--border);
}
.footer-inner {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}
.footer-left p {
  font-family: 'Satoshi', sans-serif;
  font-size: 13px;
  color: var(--gray-500);
  margin: 0 0 4px;
}
.footer-cheeky {
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  color: var(--gray-400);
  margin-top: 8px !important;
}
.footer-links {
  display: flex;
  gap: 16px;
}
.footer-links a {
  font-family: 'Satoshi', sans-serif;
  font-size: 13px;
  color: var(--gray-400);
  transition: color 180ms ease;
}
.footer-links a:hover {
  color: var(--text);
}

@media (max-width: 480px) {
  .footer-inner {
    flex-direction: column;
  }
}
```

---

## 5. HTML DOCUMENT STRUCTURE

Complete `index.html` document head:

```html
<!DOCTYPE html>
<html lang="es" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Luis Alberto Ramirez Acosta — Fractional CTO</title>
  <meta name="description" content="Fractional CTO y AI-native builder en Mérida, México. Fundador de EVEN Venture Studio. Sistemas operativos con IA para negocios.">
  
  <!-- Open Graph -->
  <meta property="og:title" content="Luis Alberto Ramirez Acosta">
  <meta property="og:description" content="Fractional CTO. AI-native builder. Mérida, México.">
  <meta property="og:url" content="https://luisracosta.com">
  <meta property="og:type" content="website">

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
  <link href="https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700&display=swap" rel="stylesheet">

  <!-- Styles -->
  <link rel="stylesheet" href="base.css">
  <link rel="stylesheet" href="style.css">

  <!-- JSON-LD structured data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Luis Alberto Ramirez Acosta",
    "url": "https://luisracosta.com",
    "jobTitle": "Fractional CTO",
    "worksFor": { "@type": "Organization", "name": "EVEN Venture Studio", "url": "https://evenai.co" },
    "address": { "@type": "PostalAddress", "addressLocality": "Mérida", "addressCountry": "MX" },
    "email": "contacto@luisracosta.com",
    "sameAs": [
      "https://x.com/luisracosta",
      "https://linkedin.com/in/luisracosta",
      "https://github.com/even-admin",
      "https://fold.mx"
    ]
  }
  </script>
</head>
<body>
  <div id="preloader">…</div>
  <button id="theme-toggle">…</button>
  <main>
    <header class="hero">…</header>
    <section id="about">…</section>
    <section id="setup">…</section>
    <section id="work">…</section>
    <section id="thinking">…</section>
    <section id="newsletter">…</section>
  </main>
  <footer class="footer">…</footer>
  <!-- Scripts deferred -->
  <script src="app.js" defer></script>
</body>
</html>
```

---

## 6. FILES

### What to rewrite completely

| File | Action |
|---|---|
| `index.html` | Full rewrite per this brief |
| `style.css` | Full rewrite with all styles from this brief |

### What to keep untouched

| File | Reason |
|---|---|
| `base.css` | Reset/base styles — already good |
| `CNAME` | Domain config — never touch |
| `*.html` (article pages) | Individual articles — never touch |
| `la-carrera-de-la-ia-es-un-ciclo.html` | Article — never touch |
| `por-que-construimos-diferente.html` | Article — never touch |
| `como-construi-mi-sistema-operativo.html` | Article — never touch |
| `el-territorio-cambio.html` | Article — never touch |
| `caballos-salvajes.html` | Article — never touch |

### New file to create

| File | Contents |
|---|---|
| `app.js` | All JavaScript: preloader, clock, lottery, dark mode, copy email, IntersectionObserver, newsletter form |

---

## 7. RESPONSIVE BREAKPOINTS

```css
/* Mobile: max-width 640px */
@media (max-width: 640px) {
  .content { padding: 0 16px; }
  
  .section-label {
    position: static;
    display: block;
    margin-bottom: 12px;
    left: auto;
    top: auto;
  }
  
  .section { padding: 48px 0; }
  
  .stack-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .form-row {
    flex-direction: column;
  }
  
  .footer-inner {
    flex-direction: column;
    gap: 20px;
  }
}
```

On mobile, the absolute section labels become inline block above section content. The 500px content max-width collapses naturally.

---

## 8. ANTI-PATTERNS (DO NOT)

| Pattern | Rule |
|---|---|
| Blue links | Never. `a { color: inherit; text-decoration: none; }` globally |
| Box-shadows | Never. Not on cards, not on inputs, not anywhere |
| Gradients | Never |
| Emojis in body text | Never (social icons OK) |
| Generic hero image / stock photos | Never |
| LinkedIn-summary "About Me" | Never |
| Framework logos or tool badges | Never (use text names only) |
| "Let's work together" language | Never |
| Testimonials section | Never |
| Pricing section | Never |
| Contact form | Never — just email + copy button |
| `!important` overuse | Avoid |
| Inline styles | Avoid — use CSS classes |

---

## 9. COMMIT

```
git add index.html style.css app.js
git commit -m "website: full rebuild — Remy-inspired minimal site with Apple-style setup showcase"
git push origin main
```

GitHub Pages serves automatically from `main` at `luisracosta.com` via the existing `CNAME`.

---

## 10. QUALITY CHECKLIST

Before pushing, verify:

- [ ] Clock shows Mérida time and updates every second
- [ ] Coordinate lottery animation runs on load
- [ ] Dark mode toggle persists via localStorage
- [ ] "Copy email" button triggers toast ("Email copied")
- [ ] Newsletter form stores to localStorage and shows success message
- [ ] All article links in Thinking section work (relative paths)
- [ ] All external links open in new tab with `rel="noopener noreferrer"`
- [ ] No blue links anywhere on the page
- [ ] No box-shadows anywhere
- [ ] Section labels are offset left on desktop, inline on mobile
- [ ] Cards have hover lift (`translateY(-2px)`)
- [ ] `prefers-reduced-motion` disables all animations
- [ ] Page renders correctly in dark mode
- [ ] Content max-width is 500px on desktop
- [ ] Article pages (`*.html`) are untouched
- [ ] `CNAME` is untouched
- [ ] `base.css` is untouched

---

*This brief is the single source of truth for the luisracosta.com rebuild. Part 2 of MISSION-CONTROL-BRIEF.md is deprecated and superseded by this document.*
