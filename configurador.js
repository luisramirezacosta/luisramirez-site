/* ============================================
   Configurador (CPQ) — luisracosta.com
   Stepper engine, pricing calculator, PDF gen
   ============================================ */

(function () {
  'use strict';

  // ── Pricing Matrix (all values at 0 — fill in) ──

  var PRICING = {
    infraestructura: {
      estrategia: { base: 0 },
      web: {
        landing: 7000,
        estandar: 13000,
        completo: 21000,
        plataforma: 36000,
        addons: {
          blog: 2500,
          citas: 1800,
          galeria: 1800,
          formulario_crm: 1500,
          copywriting_even: 4000,
          copywriting_bilingue: 6500,
          fotografia: 4500
        }
      },
      google: {
        perfil_negocio: 2000,
        workspace: 2500,
        workspace_per_user: 300,
        analytics: 1500,
        ads_setup: 3500,
        ads_budget_5k: 2000,
        ads_budget_10k: 3500,
        ads_budget_25k: 5000
      },
      crm: {
        hubspot: 6000,
        custom: 12500,
        secuencias_email: 2500,
        lead_scoring: 2000,
        dashboard: 2500
      },
      automatizacion: {
        tools_2_3: 5000,
        tools_4_6: 8000,
        tools_7_plus: 12500,
        flujo_formulario: 2000,
        agenda: 1500,
        facturacion: 2500,
        notificaciones: 1500
      },
      contenido: {
        por_canal: 2000,
        calendario: 2000,
        estrategia_doc: 3000,
        creacion_even: 5500,
        creacion_mixto: 3000,
        retainer_mensual: 4500
      }
    },
    software: {
      discovery: 6500,
      retainer: {
        '40h': 24000,
        '80h': 44000,
        '120h': 60000
      }
    },
    discounts: {
      threeModules: 0.10,
      fiveModules: 0.15
    },
    usd_rate: 17.5,
    currency: 'MXN',
    locale: 'es-MX'
  };

  // ── Stripe Payment Links (fill in real URLs) ──

  var STRIPE_LINKS = {
    5000: '',
    10000: '',
    15000: '',
    25000: '',
    50000: '',
    75000: '',
    100000: ''
  };

  // ── Module display names & timelines ──

  var MODULE_NAMES = {
    web: 'Diseño & Desarrollo Web',
    google: 'Ecosistema Google',
    crm: 'CRM & Pipeline de Clientes',
    automatizacion: 'Automatización & Flujos de Trabajo',
    contenido: 'Redes Sociales & Contenido'
  };

  var MODULE_WEEKS = {
    web: '2–4',
    google: '1–2',
    crm: '1–3',
    automatizacion: '1–2',
    contenido: '2–3'
  };

  // ── State ──

  var state = {
    currentStep: 1,
    totalSteps: 5,
    package: 'infraestructura',

    discovery: {
      companyName: '',
      industry: '',
      employees: '',
      currentPresence: [],
      goal: ''
    },

    modules: {
      estrategia: true,
      web: false,
      google: false,
      crm: false,
      automatizacion: false,
      contenido: false
    },

    options: {
      web: { pages: '', addons: [], copy: '' },
      google: { services: [], users: 5, adsBudget: '' },
      crm: { platform: '', users: 3, features: [] },
      automatizacion: { tools: '', flows: [] },
      contenido: { channels: [], deliverables: [], creation: '', retainer: false }
    },

    // Software-specific state
    software: {
      systemType: '',
      systemOther: '',
      complexity: '',
      users: '',
      features: [],
      integrations: [],
      mobileSupport: '',
      projectDesc: '',
      retainer: '',
      timeline: ''
    },

    timeline: '',
    priority: '',

    client: {
      name: '',
      email: '',
      phone: ''
    },

    pricing: {
      lineItems: [],
      subtotal: 0,
      discount: 0,
      discountPercent: 0,
      total: 0,
      activeModuleCount: 0
    }
  };

  // ── DOM refs ──

  var stepperEl, progressFill, backBtn, nextBtn, navEl;
  var allSteps = [];

  // ── Init ──

  function init() {
    stepperEl = document.getElementById('stepper');
    if (!stepperEl) return;

    state.package = stepperEl.getAttribute('data-package') || 'infraestructura';
    state.totalSteps = parseInt(stepperEl.getAttribute('data-total-steps'), 10) || 5;

    progressFill = document.getElementById('cfg-progress-fill');
    backBtn = document.getElementById('cfg-back');
    nextBtn = document.getElementById('cfg-next');
    navEl = document.getElementById('cfg-nav');
    allSteps = Array.prototype.slice.call(stepperEl.querySelectorAll('.cfg-step'));

    restoreState();
    parseURLParams();
    bindNavigation();
    bindToggles();
    bindFormInputs();
    bindStepperInputs();
    updateProgress();
    updateNavButtons();
    showCurrentStep();
  }

  // ── URL Params (pre-fill) ──

  function parseURLParams() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('company')) {
      state.discovery.companyName = params.get('company');
      var el = document.getElementById('company-name');
      if (el) el.value = state.discovery.companyName;
    }
    if (params.get('name')) {
      state.client.name = params.get('name');
      var nameEl = document.getElementById('client-name');
      if (nameEl) nameEl.value = state.client.name;
    }
    if (params.get('email')) {
      state.client.email = params.get('email');
      var emailEl = document.getElementById('client-email');
      if (emailEl) emailEl.value = state.client.email;
    }
  }

  // ── Session Storage ──

  function saveState() {
    try {
      sessionStorage.setItem('cfg_state_' + state.package, JSON.stringify(state));
    } catch (e) {}
  }

  function restoreState() {
    try {
      var saved = sessionStorage.getItem('cfg_state_' + state.package);
      if (!saved) return;
      var parsed = JSON.parse(saved);
      // Merge saved state
      state.discovery = parsed.discovery || state.discovery;
      state.modules = parsed.modules || state.modules;
      state.options = parsed.options || state.options;
      state.software = parsed.software || state.software;
      state.timeline = parsed.timeline || '';
      state.priority = parsed.priority || '';
      state.client = parsed.client || state.client;
      state.currentStep = parsed.currentStep || 1;
      // Restore form values from state
      restoreFormValues();
    } catch (e) {}
  }

  function restoreFormValues() {
    // Text inputs
    setVal('company-name', state.discovery.companyName);
    setVal('industry', state.discovery.industry);
    setVal('client-name', state.client.name);
    setVal('client-email', state.client.email);
    setVal('client-phone', state.client.phone);

    // Radio buttons
    checkRadio('employees', state.discovery.employees);
    checkRadio('goal', state.discovery.goal);
    checkRadio('timeline', state.timeline);

    // Checkboxes
    state.discovery.currentPresence.forEach(function (v) { checkBox('presence', v); });

    // Module toggles
    var moduleKeys = ['web', 'google', 'crm', 'automatizacion', 'contenido'];
    moduleKeys.forEach(function (key) {
      if (state.modules[key]) {
        var toggle = document.querySelector('[data-toggle="' + key + '"]');
        if (toggle) {
          toggle.setAttribute('aria-pressed', 'true');
          var module = document.querySelector('[data-module="' + key + '"]');
          if (module) module.classList.add('cfg-module-active');
          var sub = document.querySelector('[data-suboptions="' + key + '"]');
          if (sub) sub.hidden = false;
        }
      }
    });

    // Module sub-options
    checkRadio('web-pages', state.options.web.pages);
    state.options.web.addons.forEach(function (v) { checkBox('web-addons', v); });
    checkRadio('web-copy', state.options.web.copy);
    state.options.google.services.forEach(function (v) { checkBox('google-svc', v); });
    setVal('google-users', state.options.google.users);
    checkRadio('google-ads-budget', state.options.google.adsBudget);
    checkRadio('crm-platform', state.options.crm.platform);
    setVal('crm-users', state.options.crm.users);
    state.options.crm.features.forEach(function (v) { checkBox('crm-feat', v); });
    checkRadio('auto-tools', state.options.automatizacion.tools);
    state.options.automatizacion.flows.forEach(function (v) { checkBox('auto-flow', v); });
    state.options.contenido.channels.forEach(function (v) { checkBox('content-ch', v); });
    state.options.contenido.deliverables.forEach(function (v) { checkBox('content-del', v); });
    checkRadio('content-creation', state.options.contenido.creation);
    if (state.options.contenido.retainer) checkBox('content-ret', 'retainer_mensual');

    // Software-specific restore
    if (state.package === 'software') {
      checkRadio('system-type', state.software.systemType);
      setVal('system-other', state.software.systemOther);
      checkRadio('complexity', state.software.complexity);
      checkRadio('users', state.software.users);
      state.software.features.forEach(function (v) { checkBox('sw-feat', v); });
      state.software.integrations.forEach(function (v) { checkBox('sw-integ', v); });
      checkRadio('mobile-support', state.software.mobileSupport);
      setVal('project-desc', state.software.projectDesc);
      checkRadio('retainer', state.software.retainer);
      checkRadio('timeline', state.software.timeline);
    }
  }

  function setVal(id, value) {
    var el = document.getElementById(id);
    if (el && value) el.value = value;
  }

  function checkRadio(name, value) {
    if (!value) return;
    var el = document.querySelector('input[name="' + name + '"][value="' + value + '"]');
    if (el) el.checked = true;
  }

  function checkBox(name, value) {
    var el = document.querySelector('input[name="' + name + '"][value="' + value + '"]');
    if (el) el.checked = true;
  }

  // ── Navigation ──

  function bindNavigation() {
    if (backBtn) {
      backBtn.addEventListener('click', function () {
        if (state.currentStep > 1) goToStep(state.currentStep - 1, -1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        if (state.currentStep < state.totalSteps && validateCurrentStep()) {
          goToStep(state.currentStep + 1, 1);
        }
      });
    }

    document.addEventListener('keydown', function (e) {
      // Don't intercept in textareas or when focus is in input
      var tag = e.target.tagName;
      if (tag === 'TEXTAREA') return;

      if (e.key === 'Enter' && tag !== 'BUTTON') {
        e.preventDefault();
        if (state.currentStep < state.totalSteps && validateCurrentStep()) {
          goToStep(state.currentStep + 1, 1);
        }
      }
      if (e.key === 'Escape' && state.currentStep > 1) {
        goToStep(state.currentStep - 1, -1);
      }
    });
  }

  function goToStep(nextStep, direction) {
    if (nextStep < 1 || nextStep > state.totalSteps) return;

    var currentEl = allSteps[state.currentStep - 1];
    var nextEl = allSteps[nextStep - 1];
    if (!currentEl || !nextEl) return;

    collectCurrentStepData();

    // Pre-render work for specific steps
    if (state.package === 'infraestructura') {
      if (nextStep === 3) populatePriorityDropdown();
      if (nextStep === 4) populateContactCompany();
      if (nextStep === 5) {
        recalculate();
        renderSummary();
      }
    }
    if (state.package === 'software') {
      if (nextStep === 5) {
        collectCurrentStepData();
        recalculateSoftware();
        renderSoftwareSummary();
      }
    }

    var outX = direction === 1 ? -60 : 60;
    var inX = direction === 1 ? 60 : -60;

    var transitioned = false;
    function applyTransition() {
      if (transitioned) return;
      transitioned = true;
      currentEl.classList.remove('cfg-step-active');
      currentEl.style.display = 'none';
      currentEl.style.transform = '';
      currentEl.style.opacity = '';
      nextEl.style.display = 'block';
      nextEl.classList.add('cfg-step-active');
    }

    if (typeof gsap !== 'undefined') {
      gsap.to(currentEl, {
        x: outX, opacity: 0, duration: 0.35, ease: 'power2.in',
        onComplete: function () {
          applyTransition();
          gsap.fromTo(nextEl,
            { x: inX, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.45, ease: 'power2.out' }
          );
        }
      });
      // Safety fallback if rAF is throttled (backgrounded tab)
      setTimeout(applyTransition, 500);
    } else {
      applyTransition();
    }

    state.currentStep = nextStep;
    updateProgress();
    updateNavButtons();
    saveState();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showCurrentStep() {
    allSteps.forEach(function (step, i) {
      if (i === state.currentStep - 1) {
        step.style.display = 'block';
        step.classList.add('cfg-step-active');
      } else {
        step.style.display = 'none';
        step.classList.remove('cfg-step-active');
      }
    });
  }

  function updateProgress() {
    if (!progressFill) return;
    var pct = ((state.currentStep - 1) / (state.totalSteps - 1)) * 100;
    if (typeof gsap !== 'undefined') {
      gsap.to(progressFill, { width: pct + '%', duration: 0.5, ease: 'power2.out' });
    } else {
      progressFill.style.width = pct + '%';
    }
  }

  function updateNavButtons() {
    if (backBtn) backBtn.disabled = state.currentStep === 1;
    if (nextBtn) {
      if (state.currentStep === state.totalSteps) {
        nextBtn.style.display = 'none';
      } else {
        nextBtn.style.display = '';
      }
    }
  }

  // ── Validation ──

  function validateCurrentStep() {
    var step = allSteps[state.currentStep - 1];
    if (!step) return true;
    var stepId = step.getAttribute('data-step-id');

    if (stepId === 'discovery') {
      var company = document.getElementById('company-name');
      if (company && !company.value.trim()) {
        company.focus();
        return false;
      }
      return true;
    }

    if (stepId === 'modules') {
      var activeCount = countActiveModules();
      if (activeCount === 0) {
        // Flash the first toggle to hint
        var firstToggle = step.querySelector('.cfg-toggle');
        if (firstToggle) firstToggle.focus();
        return false;
      }
      return true;
    }

    if (stepId === 'contact') {
      var name = document.getElementById('client-name');
      var email = document.getElementById('client-email');
      if (name && !name.value.trim()) { name.focus(); return false; }
      if (email && !email.value.trim()) { email.focus(); return false; }
      return true;
    }

    if (stepId === 'work-model') {
      var retainer = document.querySelector('input[name="retainer"]:checked');
      if (!retainer) {
        var firstRet = step.querySelector('input[name="retainer"]');
        if (firstRet) firstRet.focus();
        return false;
      }
      return true;
    }

    if (stepId === 'contact-summary') {
      return true; // Last step, no forward nav
    }

    return true;
  }

  // ── Data Collection ──

  function collectCurrentStepData() {
    var step = allSteps[state.currentStep - 1];
    if (!step) return;
    var stepId = step.getAttribute('data-step-id');

    if (stepId === 'discovery') {
      state.discovery.companyName = getVal('company-name');
      state.discovery.industry = getVal('industry');
      state.discovery.employees = getRadio('employees');
      state.discovery.currentPresence = getChecked('presence');
      state.discovery.goal = getRadio('goal');
    }

    if (stepId === 'modules') {
      collectModuleOptions();
    }

    if (stepId === 'timeline') {
      state.timeline = getRadio('timeline');
      state.priority = getVal('priority-module');
    }

    if (stepId === 'contact') {
      state.client.name = getVal('client-name');
      state.client.email = getVal('client-email');
      state.client.phone = getVal('client-phone');
    }

    // Software-specific steps
    if (stepId === 'system-type') {
      state.software.systemType = getRadio('system-type');
      state.software.systemOther = getVal('system-other');
      state.software.complexity = getRadio('complexity');
    }

    if (stepId === 'tech-scope') {
      state.software.users = getRadio('users');
      state.software.features = getChecked('sw-feat');
      state.software.integrations = getChecked('sw-integ');
      state.software.mobileSupport = getRadio('mobile-support');
      state.software.projectDesc = getVal('project-desc');
    }

    if (stepId === 'work-model') {
      state.software.retainer = getRadio('retainer');
      state.software.timeline = getRadio('timeline');
    }

    if (stepId === 'contact-summary') {
      state.client.name = getVal('client-name');
      state.client.email = getVal('client-email');
      state.client.phone = getVal('client-phone');
    }

    saveState();
  }

  function collectModuleOptions() {
    // Web
    state.options.web.pages = getRadio('web-pages');
    state.options.web.addons = getChecked('web-addons');
    state.options.web.copy = getRadio('web-copy');
    // Google
    state.options.google.services = getChecked('google-svc');
    state.options.google.users = parseInt(getVal('google-users'), 10) || 5;
    state.options.google.adsBudget = getRadio('google-ads-budget');
    // CRM
    state.options.crm.platform = getRadio('crm-platform');
    state.options.crm.users = parseInt(getVal('crm-users'), 10) || 3;
    state.options.crm.features = getChecked('crm-feat');
    // Automation
    state.options.automatizacion.tools = getRadio('auto-tools');
    state.options.automatizacion.flows = getChecked('auto-flow');
    // Content
    state.options.contenido.channels = getChecked('content-ch');
    state.options.contenido.deliverables = getChecked('content-del');
    state.options.contenido.creation = getRadio('content-creation');
    state.options.contenido.retainer = getChecked('content-ret').indexOf('retainer_mensual') !== -1;
  }

  function getVal(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function getRadio(name) {
    var el = document.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : '';
  }

  function getChecked(name) {
    var els = document.querySelectorAll('input[name="' + name + '"]:checked');
    return Array.prototype.slice.call(els).map(function (el) { return el.value; });
  }

  // ── Module Toggles ──

  function bindToggles() {
    var toggles = document.querySelectorAll('.cfg-toggle');
    toggles.forEach(function (toggle) {
      toggle.addEventListener('click', function () {
        var key = toggle.getAttribute('data-toggle');
        var isOn = toggle.getAttribute('aria-pressed') === 'true';
        var newState = !isOn;

        toggle.setAttribute('aria-pressed', String(newState));
        state.modules[key] = newState;

        var module = document.querySelector('[data-module="' + key + '"]');
        if (module) module.classList.toggle('cfg-module-active', newState);

        var sub = document.querySelector('[data-suboptions="' + key + '"]');
        if (sub) toggleSuboptions(sub, newState);

        if (!newState) clearModuleOptions(key);
        saveState();
      });
    });
  }

  function toggleSuboptions(el, show) {
    if (typeof gsap === 'undefined') {
      el.hidden = !show;
      return;
    }

    if (show) {
      el.hidden = false;
      el.style.height = '0';
      el.style.opacity = '0';
      el.style.overflow = 'hidden';
      gsap.to(el, {
        height: 'auto', opacity: 1, duration: 0.4, ease: 'power2.out',
        onComplete: function () { el.style.overflow = ''; }
      });
    } else {
      el.style.overflow = 'hidden';
      gsap.to(el, {
        height: 0, opacity: 0, duration: 0.3, ease: 'power2.in',
        onComplete: function () { el.hidden = true; el.style.overflow = ''; }
      });
    }
  }

  function clearModuleOptions(key) {
    if (key === 'web') state.options.web = { pages: '', addons: [], copy: '' };
    if (key === 'google') state.options.google = { services: [], users: 5, adsBudget: '' };
    if (key === 'crm') state.options.crm = { platform: '', users: 3, features: [] };
    if (key === 'automatizacion') state.options.automatizacion = { tools: '', flows: [] };
    if (key === 'contenido') state.options.contenido = { channels: [], deliverables: [], creation: '', retainer: false };

    // Uncheck all inputs in the suboption container
    var sub = document.querySelector('[data-suboptions="' + key + '"]');
    if (sub) {
      sub.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(function (input) {
        input.checked = false;
      });
    }
  }

  // ── Form Input Binding ──

  function bindFormInputs() {
    // Mutual exclusion: "Ninguno" unchecks others and vice versa
    var noneCheckbox = document.getElementById('pres-none');
    if (noneCheckbox) {
      noneCheckbox.addEventListener('change', function () {
        if (noneCheckbox.checked) {
          document.querySelectorAll('input[name="presence"]:not(#pres-none)').forEach(function (cb) {
            cb.checked = false;
          });
        }
      });
      document.querySelectorAll('input[name="presence"]:not(#pres-none)').forEach(function (cb) {
        cb.addEventListener('change', function () {
          if (cb.checked) noneCheckbox.checked = false;
        });
      });
    }
  }

  // ── Stepper Inputs (number +/-) ──

  function bindStepperInputs() {
    document.querySelectorAll('.cfg-stepper-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var targetId = btn.getAttribute('data-stepper');
        var dir = parseInt(btn.getAttribute('data-dir'), 10);
        var input = document.getElementById(targetId);
        if (!input) return;
        var val = parseInt(input.value, 10) || 0;
        val = Math.max(1, Math.min(50, val + dir));
        input.value = val;
      });
    });
  }

  // ── Step Pre-render ──

  function populatePriorityDropdown() {
    var select = document.getElementById('priority-module');
    if (!select) return;

    // Clear existing options except placeholder
    while (select.options.length > 1) select.remove(1);

    var moduleKeys = ['web', 'google', 'crm', 'automatizacion', 'contenido'];
    moduleKeys.forEach(function (key) {
      if (state.modules[key]) {
        var opt = document.createElement('option');
        opt.value = key;
        opt.textContent = MODULE_NAMES[key];
        select.appendChild(opt);
      }
    });

    if (state.priority) select.value = state.priority;
  }

  function populateContactCompany() {
    var el = document.getElementById('contact-company-display');
    if (el) el.textContent = state.discovery.companyName || '—';
  }

  // ── Pricing Engine ──

  function countActiveModules() {
    var count = 0;
    var keys = ['web', 'google', 'crm', 'automatizacion', 'contenido'];
    keys.forEach(function (k) { if (state.modules[k]) count++; });
    return count;
  }

  function recalculate() {
    collectModuleOptions();

    var items = [];
    var activeCount = countActiveModules();

    // Strategy — free gift with every project
    items.push({
      name: 'Estrategia Digital & Hoja de Ruta',
      detail: 'Cortesia',
      price: 0,
      included: true
    });

    // Web
    if (state.modules.web) {
      var webPrice = 0;
      var p = PRICING.infraestructura.web;
      if (state.options.web.pages) webPrice += p[state.options.web.pages] || 0;
      state.options.web.addons.forEach(function (a) { webPrice += p.addons[a] || 0; });
      if (state.options.web.copy === 'even') webPrice += p.addons.copywriting_even || 0;
      if (state.options.web.copy === 'bilingue') webPrice += p.addons.copywriting_bilingue || 0;
      items.push({ name: MODULE_NAMES.web, price: webPrice, weeks: MODULE_WEEKS.web });
    }

    // Google
    if (state.modules.google) {
      var gPrice = 0;
      var g = PRICING.infraestructura.google;
      state.options.google.services.forEach(function (s) {
        if (s === 'perfil_negocio') gPrice += g.perfil_negocio;
        if (s === 'workspace') gPrice += g.workspace + (Math.max(0, state.options.google.users - 1) * g.workspace_per_user);
        if (s === 'analytics') gPrice += g.analytics;
        if (s === 'ads') {
          gPrice += g.ads_setup;
          if (state.options.google.adsBudget === '5k') gPrice += g.ads_budget_5k;
          if (state.options.google.adsBudget === '10k') gPrice += g.ads_budget_10k;
          if (state.options.google.adsBudget === '25k') gPrice += g.ads_budget_25k;
        }
      });
      items.push({ name: MODULE_NAMES.google, price: gPrice, weeks: MODULE_WEEKS.google });
    }

    // CRM
    if (state.modules.crm) {
      var cPrice = 0;
      var c = PRICING.infraestructura.crm;
      if (state.options.crm.platform === 'hubspot') cPrice += c.hubspot;
      if (state.options.crm.platform === 'custom') cPrice += c.custom;
      state.options.crm.features.forEach(function (f) { cPrice += c[f] || 0; });
      items.push({ name: MODULE_NAMES.crm, price: cPrice, weeks: MODULE_WEEKS.crm });
    }

    // Automation
    if (state.modules.automatizacion) {
      var aPrice = 0;
      var a = PRICING.infraestructura.automatizacion;
      if (state.options.automatizacion.tools === '2-3') aPrice += a.tools_2_3;
      if (state.options.automatizacion.tools === '4-6') aPrice += a.tools_4_6;
      if (state.options.automatizacion.tools === '7+') aPrice += a.tools_7_plus;
      state.options.automatizacion.flows.forEach(function (f) { aPrice += a[f] || 0; });
      items.push({ name: MODULE_NAMES.automatizacion, price: aPrice, weeks: MODULE_WEEKS.automatizacion });
    }

    // Content
    if (state.modules.contenido) {
      var coPrice = 0;
      var co = PRICING.infraestructura.contenido;
      coPrice += state.options.contenido.channels.length * co.por_canal;
      state.options.contenido.deliverables.forEach(function (d) { coPrice += co[d] || 0; });
      if (state.options.contenido.creation === 'even') coPrice += co.creacion_even;
      if (state.options.contenido.creation === 'mixed') coPrice += co.creacion_mixto;
      if (state.options.contenido.retainer) coPrice += co.retainer_mensual;
      items.push({ name: MODULE_NAMES.contenido, price: coPrice, weeks: MODULE_WEEKS.contenido });
    }

    // Totals
    var subtotal = items.reduce(function (sum, item) { return sum + item.price; }, 0);

    var discountPercent = 0;
    if (activeCount >= 5) discountPercent = PRICING.discounts.fiveModules;
    else if (activeCount >= 3) discountPercent = PRICING.discounts.threeModules;

    var discountAmount = subtotal * discountPercent;

    state.pricing = {
      lineItems: items,
      subtotal: subtotal,
      discount: discountAmount,
      discountPercent: discountPercent,
      total: subtotal - discountAmount,
      activeModuleCount: activeCount
    };
  }

  function formatMXN(amount) {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency', currency: 'MXN', minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(amount);
  }

  function formatUSD(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(Math.round(amount / PRICING.usd_rate));
  }

  // ── Summary Rendering ──

  function renderSummary() {
    var container = document.getElementById('cfg-summary');
    if (!container) return;

    var html = '';

    // Client card
    html += '<div class="cfg-summary-section">';
    html += '<div class="cfg-summary-heading">Cliente</div>';
    html += specRow(state.client.name || '—', state.discovery.companyName || '—');
    if (state.client.email) html += specRow('Email', state.client.email);
    if (state.discovery.industry) html += specRow('Industria', state.discovery.industry);
    html += '</div>';

    // Scope
    html += '<div class="cfg-summary-section">';
    html += '<div class="cfg-summary-heading">Alcance</div>';
    state.pricing.lineItems.forEach(function (item) {
      if (item.included) {
        html += '<div class="spec-row"><span class="spec-key">' + esc(item.name) + '</span>';
        html += '<span class="spec-dots"></span>';
        html += '<span class="spec-val cfg-summary-included">Cortes\u00eda</span></div>';
      } else {
        html += specRow(item.name, formatMXN(item.price));
      }
    });
    html += '</div>';

    // Totals
    html += '<div class="cfg-summary-section cfg-summary-totals">';

    if (state.pricing.discountPercent > 0) {
      html += specRow('Subtotal', formatMXN(state.pricing.subtotal));
      html += '<div class="spec-row spec-highlight"><span class="spec-key">Descuento por ' +
        (state.pricing.activeModuleCount >= 5 ? 'paquete completo' : '3+ módulos') +
        ' (' + (state.pricing.discountPercent * 100) + '%)</span>';
      html += '<span class="spec-dots"></span>';
      html += '<span class="spec-val">-' + formatMXN(state.pricing.discount) + '</span></div>';
    }

    html += '<div class="spec-row spec-highlight cfg-summary-total-row"><span class="spec-key">Inversión total</span>';
    html += '<span class="spec-dots"></span>';
    html += '<span class="spec-val">' + formatMXN(state.pricing.total) + ' (' + formatUSD(state.pricing.total) + ')</span></div>';

    // Nudge for discount upgrade
    if (state.pricing.activeModuleCount >= 3 && state.pricing.activeModuleCount < 5) {
      var remaining = 5 - state.pricing.activeModuleCount;
      html += '<p class="cfg-summary-nudge">Agregue ' + remaining + ' módulo' + (remaining > 1 ? 's' : '') +
        ' más para obtener 15% de descuento.</p>';
    }

    html += '</div>';

    // Timeline
    var totalWeeksMin = 1; // strategy
    var totalWeeksMax = 2;
    state.pricing.lineItems.forEach(function (item) {
      if (item.weeks) {
        var parts = item.weeks.split('–');
        totalWeeksMin += parseInt(parts[0], 10) || 0;
        totalWeeksMax += parseInt(parts[1] || parts[0], 10) || 0;
      }
    });

    html += '<div class="cfg-timeline-estimate">';
    html += '<div class="cfg-timeline-label">Tiempo estimado de entrega</div>';
    html += '<div class="cfg-timeline-value">' + totalWeeksMin + '–' + totalWeeksMax + ' semanas</div>';
    html += '</div>';

    container.innerHTML = html;
  }

  function specRow(key, value) {
    return '<div class="spec-row"><span class="spec-key">' + esc(key) + '</span>' +
      '<span class="spec-dots"></span>' +
      '<span class="spec-val">' + esc(value) + '</span></div>';
  }

  function esc(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // ── Software Pricing ──

  var RETAINER_NAMES = {
    '40h': '40 horas / mes',
    '80h': '80 horas / mes',
    '120h': '120 horas / mes'
  };

  var SYSTEM_TYPE_NAMES = {
    internal_tool: 'Herramienta interna',
    client_portal: 'Portal de clientes',
    dashboard: 'Dashboard / reportes',
    web_platform: 'Plataforma web',
    mobile_app: 'App móvil',
    other: 'Otro'
  };

  var COMPLEXITY_NAMES = {
    simple: 'Simple (1–2 semanas)',
    medium: 'Medio (3–6 semanas)',
    complex: 'Complejo (2+ meses)'
  };

  var FEATURE_NAMES = {
    auth: 'Autenticación de usuarios',
    roles: 'Roles y permisos',
    admin_panel: 'Panel de administración',
    reports: 'Reportes / dashboards',
    notifications: 'Notificaciones',
    file_upload: 'Carga de archivos'
  };

  var INTEGRATION_NAMES = {
    stripe: 'Stripe / pagos',
    crm: 'CRM',
    google: 'Google',
    email: 'Email / SMTP',
    calendar: 'Calendario',
    whatsapp: 'WhatsApp',
    billing: 'Facturación',
    other: 'Otro'
  };

  function recalculateSoftware() {
    var sw = state.software;
    var p = PRICING.software;

    var discoveryPrice = p.discovery || 0;
    var retainerPrice = sw.retainer ? (p.retainer[sw.retainer] || 0) : 0;

    state.pricing = {
      lineItems: [
        { name: 'Sesión de discovery', price: discoveryPrice, oneTime: true },
        { name: 'Retainer mensual — ' + (RETAINER_NAMES[sw.retainer] || '—'), price: retainerPrice, monthly: true }
      ],
      subtotal: discoveryPrice,
      discount: 0,
      discountPercent: 0,
      total: discoveryPrice,
      monthlyTotal: retainerPrice,
      activeModuleCount: 0
    };
  }

  function renderSoftwareSummary() {
    var container = document.getElementById('cfg-summary');
    if (!container) return;

    var sw = state.software;
    var html = '';

    // Client card
    html += '<div class="cfg-summary-section">';
    html += '<div class="cfg-summary-heading">Cliente</div>';
    html += specRow(state.client.name || '—', state.discovery.companyName || '—');
    if (state.client.email) html += specRow('Email', state.client.email);
    if (state.discovery.industry) html += specRow('Industria', state.discovery.industry);
    html += '</div>';

    // Project scope
    html += '<div class="cfg-summary-section">';
    html += '<div class="cfg-summary-heading">Proyecto</div>';
    if (sw.systemType) html += specRow('Tipo de sistema', SYSTEM_TYPE_NAMES[sw.systemType] || sw.systemType);
    if (sw.systemType === 'other' && sw.systemOther) html += specRow('Descripción', sw.systemOther);
    if (sw.complexity) html += specRow('Complejidad', COMPLEXITY_NAMES[sw.complexity] || sw.complexity);
    if (sw.users) html += specRow('Usuarios estimados', sw.users);
    if (sw.mobileSupport) {
      var mobLabel = sw.mobileSupport === 'desktop' ? 'Solo desktop' : sw.mobileSupport === 'responsive' ? 'Responsivo' : 'App nativa';
      html += specRow('Soporte móvil', mobLabel);
    }
    if (sw.projectDesc) {
      html += '<div class="cfg-summary-desc">' + esc(sw.projectDesc) + '</div>';
    }
    html += '</div>';

    // Features
    if (sw.features.length > 0) {
      html += '<div class="cfg-summary-section">';
      html += '<div class="cfg-summary-heading">Funcionalidades</div>';
      sw.features.forEach(function (f) {
        html += specRow(FEATURE_NAMES[f] || f, '✓');
      });
      html += '</div>';
    }

    // Integrations
    if (sw.integrations.length > 0) {
      html += '<div class="cfg-summary-section">';
      html += '<div class="cfg-summary-heading">Integraciones</div>';
      sw.integrations.forEach(function (i) {
        html += specRow(INTEGRATION_NAMES[i] || i, '✓');
      });
      html += '</div>';
    }

    // Investment
    html += '<div class="cfg-summary-section cfg-summary-totals">';
    html += '<div class="cfg-summary-heading">Inversión</div>';
    html += '<div class="spec-row"><span class="spec-key">Sesión de discovery (única vez)</span>';
    html += '<span class="spec-dots"></span>';
    html += '<span class="spec-val">' + (state.pricing.subtotal > 0 ? formatMXN(state.pricing.subtotal) : 'Incluido') + '</span></div>';

    html += '<div class="spec-row spec-highlight cfg-summary-total-row"><span class="spec-key">Retainer mensual</span>';
    html += '<span class="spec-dots"></span>';
    html += '<span class="spec-val">' + formatMXN(state.pricing.monthlyTotal) +
      ' (' + formatUSD(state.pricing.monthlyTotal) + ') / mes</span></div>';
    html += '</div>';

    container.innerHTML = html;
  }

  // ── PDF Generation ──

  function generatePDF() {
    var template = document.getElementById('pdf-template');
    if (!template) return;

    // Build PDF HTML
    var html = '';

    // Page 1: Cover
    html += '<div class="cfg-pdf-page" style="display:flex;flex-direction:column;justify-content:space-between;">';
    html += '<div>';
    html += '<div class="cfg-pdf-meta">Luis Alberto Ramirez Acosta</div>';
    html += '<div class="cfg-pdf-meta" style="margin-bottom:0;">Estratega Digital &amp; Consultor Técnico</div>';
    html += '</div>';
    html += '<div style="text-align:center;">';
    html += '<div class="cfg-pdf-cover-title" style="margin-bottom:16px;">Propuesta de Servicios</div>';
    html += '<div class="cfg-pdf-cover-client">' + esc(state.client.name || '') + '</div>';
    if (state.discovery.companyName) {
      html += '<div class="cfg-pdf-cover-client" style="font-size:16px;margin-top:4px;">' + esc(state.discovery.companyName) + '</div>';
    }
    html += '</div>';
    html += '<div style="display:flex;justify-content:space-between;">';
    html += '<div class="cfg-pdf-meta">' + new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) + '</div>';
    html += '<div class="cfg-pdf-meta">luisracosta.com</div>';
    html += '</div>';
    html += '</div>';

    // Page 2: Scope
    html += '<div class="cfg-pdf-page">';
    html += '<div class="cfg-pdf-section-header">ALCANCE</div>';
    state.pricing.lineItems.forEach(function (item) {
      html += '<div class="spec-row" style="margin-bottom:12px;">';
      html += '<span class="spec-key">' + esc(item.name) + '</span>';
      html += '<span class="spec-dots"></span>';
      html += '<span class="spec-val">' + (item.included ? 'Incluido' : esc(formatMXN(item.price))) + '</span>';
      html += '</div>';
    });
    html += '</div>';

    // Page 3: Investment
    html += '<div class="cfg-pdf-page">';
    html += '<div class="cfg-pdf-section-header">INVERSIÓN</div>';
    state.pricing.lineItems.forEach(function (item) {
      if (!item.included) {
        html += '<div class="spec-row" style="margin-bottom:10px;">';
        html += '<span class="spec-key">' + esc(item.name) + '</span>';
        html += '<span class="spec-dots"></span>';
        html += '<span class="spec-val">' + esc(formatMXN(item.price)) + '</span>';
        html += '</div>';
      }
    });
    html += '<hr style="border:none;border-top:1px solid #E5E5E5;margin:24px 0;">';

    if (state.pricing.discountPercent > 0) {
      html += '<div class="spec-row" style="margin-bottom:10px;">';
      html += '<span class="spec-key">Subtotal</span><span class="spec-dots"></span>';
      html += '<span class="spec-val">' + esc(formatMXN(state.pricing.subtotal)) + '</span></div>';
      html += '<div class="spec-row spec-highlight" style="margin-bottom:10px;">';
      html += '<span class="spec-key">Descuento (' + (state.pricing.discountPercent * 100) + '%)</span>';
      html += '<span class="spec-dots"></span>';
      html += '<span class="spec-val">-' + esc(formatMXN(state.pricing.discount)) + '</span></div>';
    }

    html += '<div class="spec-row spec-highlight" style="margin-bottom:32px;">';
    html += '<span class="spec-key" style="font-weight:600;">Total</span><span class="spec-dots"></span>';
    html += '<span class="spec-val cfg-pdf-total">' + esc(formatMXN(state.pricing.total)) + ' (' + esc(formatUSD(state.pricing.total)) + ')</span></div>';

    // Terms
    html += '<div style="margin-top:48px;">';
    html += '<div class="cfg-pdf-section-header">CONDICIONES</div>';
    html += '<div style="font-family:Satoshi,sans-serif;font-size:12px;color:#737373;line-height:1.8;">';
    html += '<p>1. Esta propuesta tiene vigencia de 30 días naturales a partir de la fecha de emisión.</p>';
    html += '<p>2. Forma de pago: 50% de anticipo para iniciar, 50% al entregar.</p>';
    html += '<p>3. El alcance se limita a lo descrito en esta propuesta.</p>';
    html += '<p>4. Cambios de alcance están sujetos a cotización adicional.</p>';
    html += '<p>5. Los tiempos de entrega dependen de la disponibilidad del cliente para proporcionar insumos.</p>';
    html += '</div>';
    html += '</div>';
    html += '</div>';

    template.innerHTML = html;

    // Render each page
    var pages = template.querySelectorAll('.cfg-pdf-page');
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit: 'mm', format: 'a4' });
    var pageIndex = 0;

    function renderPage() {
      if (pageIndex >= pages.length) {
        var filename = 'propuesta-' + (state.discovery.companyName || 'cliente').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') +
          '-' + new Date().toISOString().slice(0, 10) + '.pdf';
        doc.save(filename);
        return;
      }

      html2canvas(pages[pageIndex], { scale: 2, useCORS: true, backgroundColor: '#FFFFFF' }).then(function (canvas) {
        if (pageIndex > 0) doc.addPage();
        var imgData = canvas.toDataURL('image/jpeg', 0.95);
        doc.addImage(imgData, 'JPEG', 0, 0, 210, 297);
        pageIndex++;
        renderPage();
      });
    }

    // Small delay to let fonts render
    setTimeout(renderPage, 100);
  }

  // ── Stripe ──

  function getPaymentLink(totalMXN) {
    var thresholds = Object.keys(STRIPE_LINKS).map(Number).sort(function (a, b) { return a - b; });
    for (var i = 0; i < thresholds.length; i++) {
      if (thresholds[i] >= totalMXN && STRIPE_LINKS[thresholds[i]]) {
        return STRIPE_LINKS[thresholds[i]];
      }
    }
    var last = thresholds[thresholds.length - 1];
    return STRIPE_LINKS[last] || '';
  }

  // ── Event Bindings ──

  function bindActions() {
    var pdfBtn = document.getElementById('cfg-download-pdf');
    if (pdfBtn) {
      pdfBtn.addEventListener('click', function () {
        generatePDF();
      });
    }

    var payBtn = document.getElementById('cfg-pay');
    if (payBtn) {
      payBtn.addEventListener('click', function () {
        var link = getPaymentLink(state.pricing.total);
        if (link) {
          window.open(link, '_blank');
        }
      });
    }
  }

  // ── Boot ──

  document.addEventListener('DOMContentLoaded', function () {
    init();
    bindActions();
  });

})();
