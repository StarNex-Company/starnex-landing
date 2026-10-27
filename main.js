// Nav, mobile menu, reveals, hero sky, scroll effects, work track and footer year.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

const nav = document.querySelector('.nav');
const menu = document.querySelector('.menu');
const mobileNav = document.getElementById('mobile-nav');
const setMenu = (open) => {
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  mobileNav.hidden = !open;
  nav.classList.toggle('scrolled', open || window.scrollY > 20);
};
menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
mobileNav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !mobileNav.hidden) { setMenu(false); menu.focus(); } });

const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  reveals.forEach((el, i) => { el.style.transitionDelay = `${(i % 4) * 70}ms`; io.observe(el); });
} else {
  reveals.forEach((el) => el.classList.add('in'));
}

document.getElementById('year').textContent = new Date().getFullYear();

// Local time in Nigeria (WAT).
const clock = document.getElementById('clock');
const tick = () => {
  clock.textContent = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' }).format(new Date());
};
tick();
setInterval(tick, 15000);

// Hero sky: drifting stars that join into constellations around the pointer.
const sky = document.querySelector('.sky');
const hero = document.querySelector('.hero');
const ctx = sky.getContext('2d');
let stars = [];
let skyW = 0;
let skyH = 0;
let heroVisible = true;
const pointer = { x: -9999, y: -9999 };
const makeStars = () => {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  skyW = hero.clientWidth;
  skyH = hero.clientHeight;
  sky.width = skyW * dpr;
  sky.height = skyH * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const count = Math.min(240, Math.round((skyW * skyH) / 5200));
  stars = Array.from({ length: count }, () => ({
    x: Math.random() * skyW,
    y: Math.random() * skyH,
    r: Math.random() * 1.3 + 0.3,
    z: Math.random() * 0.8 + 0.2,
    t: Math.random() * Math.PI * 2,
    gold: Math.random() < 0.12,
  }));
};
let shooting = null;
const drawSky = (time) => {
  ctx.clearRect(0, 0, skyW, skyH);
  const near = [];
  for (const s of stars) {
    if (!reduceMotion) {
      s.y -= 0.04 * s.z;
      if (s.y < -4) { s.y = skyH + 4; s.x = Math.random() * skyW; }
    }
    const tw = reduceMotion ? 0.8 : 0.55 + Math.sin(time / 900 + s.t) * 0.35;
    ctx.globalAlpha = tw * (0.4 + s.z * 0.6);
    ctx.fillStyle = s.gold ? '#ffd978' : '#ffffff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r * (s.gold ? 1.4 : 1), 0, Math.PI * 2);
    ctx.fill();
    const dx = s.x - pointer.x;
    const dy = s.y - pointer.y;
    if (dx * dx + dy * dy < 170 * 170) near.push(s);
  }
  ctx.lineWidth = 1;
  for (let i = 0; i < near.length; i++) {
    for (let j = i + 1; j < near.length; j++) {
      const a = near[i];
      const b = near[j];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < 110) {
        ctx.globalAlpha = (1 - d / 110) * 0.5;
        ctx.strokeStyle = '#f6a93b';
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }
  if (!reduceMotion) {
    if (!shooting && Math.random() < 0.004) {
      shooting = { x: Math.random() * skyW * 0.7 + skyW * 0.2, y: Math.random() * skyH * 0.3, life: 1 };
    }
    if (shooting) {
      const { x, y, life } = shooting;
      const grad = ctx.createLinearGradient(x, y, x + 120, y - 50);
      grad.addColorStop(0, '#ffffffcc');
      grad.addColorStop(1, '#ffffff00');
      ctx.globalAlpha = life;
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 120, y - 50);
      ctx.stroke();
      shooting.x -= 9;
      shooting.y += 3.75;
      shooting.life -= 0.02;
      if (shooting.life <= 0) shooting = null;
    }
  }
  ctx.globalAlpha = 1;
};
const loop = (time) => {
  if (heroVisible && !document.hidden) drawSky(time);
  requestAnimationFrame(loop);
};
makeStars();
if (reduceMotion) drawSky(0); else requestAnimationFrame(loop);
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { makeStars(); if (reduceMotion) drawSky(0); }, 150);
});
hero.addEventListener('pointermove', (e) => {
  const rect = hero.getBoundingClientRect();
  pointer.x = e.clientX - rect.left;
  pointer.y = e.clientY - rect.top;
});
hero.addEventListener('pointerleave', () => { pointer.x = -9999; pointer.y = -9999; });
if ('IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => { heroVisible = entry.isIntersecting; }).observe(hero);
}

// Manifesto: split into words that light up as you scroll past.
const scrub = document.querySelector('.scrub');
const HIGHLIGHT = new Set(['star', 'next', 'big', 'sky:']);
scrub.innerHTML = scrub.textContent.trim().split(/\s+/).map((w) => {
  const key = w.toLowerCase().replace(/[.,]/g, '');
  return `<span class="w${HIGHLIGHT.has(key) ? ' hl' : ''}">${w}</span>`;
}).join(' ');
const words = scrub.querySelectorAll('.w');
if (reduceMotion) scrub.classList.add('static');

// Ventures accordion: one open at a time.
const vItems = document.querySelectorAll('.v-item');
vItems.forEach((item) => {
  const btn = item.querySelector('.v-head');
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') !== 'true';
    vItems.forEach((other) => {
      other.classList.remove('is-open');
      other.querySelector('.v-head').setAttribute('aria-expanded', 'false');
    });
    if (open) {
      item.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
    }
  });
});

// Ticker rows drift and speed up with scrolling.
const tickerRows = [...document.querySelectorAll('.ticker-row')].map((row) => {
  const track = row.querySelector('.ticker-track');
  track.innerHTML += track.innerHTML + track.innerHTML;
  return { track, dir: Number(row.dataset.dir), x: 0 };
});

// Scroll-linked effects share one rAF.
const progress = document.querySelector('.progress');
const dawn = document.querySelector('.dawn');
const steps = document.querySelector('.steps');
const stepItems = steps.querySelectorAll('li');
const navLinks = [...document.querySelectorAll('.nav-links a')];
const sections = navLinks.map((a) => document.querySelector(a.getAttribute('href')));
let lastY = window.scrollY;
let velocity = 0;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const frame = () => {
  const y = window.scrollY;
  const vh = window.innerHeight;
  velocity = velocity * 0.9 + (y - lastY) * 0.1;
  lastY = y;

  nav.classList.toggle('scrolled', y > 20 || !mobileNav.hidden);
  progress.style.setProperty('--p', clamp01(y / (document.documentElement.scrollHeight - vh)));

  if (!reduceMotion) {
    const speed = 0.6 + Math.min(Math.abs(velocity) * 0.25, 8);
    tickerRows.forEach((r) => {
      const third = r.track.scrollWidth / 3;
      r.x = (r.x + speed * r.dir) % third;
      const x = r.dir < 0 ? r.x : r.x - third;
      r.track.style.transform = `translate3d(${x}px,0,0)`;
    });

    const sr = scrub.getBoundingClientRect();
    const p = clamp01((vh * 0.85 - sr.top) / (sr.height + vh * 0.35));
    const lit = Math.round(p * words.length);
    words.forEach((w, i) => w.classList.toggle('on', i < lit));

    const dr = dawn.getBoundingClientRect();
    dawn.style.setProperty('--sun', clamp01((vh - dr.top) / (vh + dr.height * 0.4)).toFixed(3));
  }

  const st = steps.getBoundingClientRect();
  const fill = clamp01((vh * 0.6 - st.top) / st.height);
  steps.style.setProperty('--fill', fill.toFixed(3));
  stepItems.forEach((li) => {
    const r = li.getBoundingClientRect();
    li.classList.toggle('lit', r.top + r.height / 2 < vh * 0.6);
  });

  let current = -1;
  sections.forEach((s, i) => {
    const r = s && s.getBoundingClientRect();
    if (r && r.top < vh * 0.4 && r.bottom > vh * 0.4) current = i;
  });
  navLinks.forEach((a, i) => a.classList.toggle('active', i === current));

  requestAnimationFrame(frame);
};
requestAnimationFrame(frame);

// Magnetic buttons and the StarApp card tilt (mouse only).
if (finePointer && !reduceMotion) {
  document.querySelectorAll('.magnetic').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  const visual = document.querySelector('.starapp-visual');
  const tilt = visual.querySelector('.tilt');
  visual.addEventListener('pointermove', (e) => {
    const r = visual.getBoundingClientRect();
    tilt.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 16}deg`);
    tilt.style.setProperty('--rx', `${((e.clientY - r.top) / r.height - 0.5) * -12}deg`);
  });
  visual.addEventListener('pointerleave', () => { tilt.style.setProperty('--rx', '0deg'); tilt.style.setProperty('--ry', '0deg'); });
}

// Work track: drag with the mouse, arrow buttons, and a "Drag" cursor.
const track = document.querySelector('.track');
const dragCursor = document.querySelector('.drag-cursor');
const stepSize = () => (track.querySelector('.shot')?.offsetWidth || 300) + 22;
document.querySelectorAll('[data-go]').forEach((btn) => {
  btn.addEventListener('click', () => track.scrollBy({ left: Number(btn.dataset.go) * stepSize(), behavior: reduceMotion ? 'auto' : 'smooth' }));
});
let drag = null;
track.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'mouse' || e.button !== 0) return;
  drag = { x: e.clientX, left: track.scrollLeft, moved: false };
});
window.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.x;
  if (!drag.moved && Math.abs(dx) > 4) { drag.moved = true; track.classList.add('dragging'); }
  if (drag.moved) track.scrollLeft = drag.left - dx;
});
window.addEventListener('pointerup', () => {
  if (!drag) return;
  if (drag.moved) {
    track.classList.remove('dragging');
    const step = stepSize();
    track.scrollTo({ left: Math.round(track.scrollLeft / step) * step, behavior: 'smooth' });
  }
  drag = null;
});
if (finePointer) {
  track.addEventListener('pointermove', (e) => {
    dragCursor.style.setProperty('--x', `${e.clientX}px`);
    dragCursor.style.setProperty('--y', `${e.clientY}px`);
  });
  track.addEventListener('pointerenter', () => dragCursor.style.setProperty('--s', '1'));
  track.addEventListener('pointerleave', () => dragCursor.style.setProperty('--s', '0'));
}

// Contact form: answers are stored in the StarNex Google Form; the page keeps its own design.
const GOOGLE_FORM_ACTION = 'https://docs.google.com/forms/d/e/1FAIpQLScYpnUNNl2ovH2ne22b-3GLDx48NJIgBAy74CmkuSuQFI6crA/formResponse';
const FORM_ENTRIES = {
  name: 'entry.1360216485',
  email: 'entry.806069081',
  phone: 'entry.1481779097',
  reason: 'entry.1502566803',
  service: 'entry.1343175548',
  company: 'entry.1179681495',
  message: 'entry.242056973',
};

const form = document.getElementById('contact-form');
const success = document.querySelector('.form-success');
const errorBox = form.querySelector('.form-error');
const submitBtn = form.querySelector('.submit');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

document.querySelectorAll('[data-reason]').forEach((link) => {
  link.addEventListener('click', () => {
    const radio = form.querySelector(`input[name="reason"][value="${link.dataset.reason}"]`);
    if (radio) radio.checked = true;
  });
});

const showError = (msg, field) => {
  errorBox.textContent = msg;
  errorBox.hidden = false;
  if (field) { field.setAttribute('aria-invalid', 'true'); field.focus(); }
};
form.addEventListener('input', (e) => {
  e.target.removeAttribute('aria-invalid');
  errorBox.hidden = true;
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = new FormData(form);
  const value = (k) => String(data.get(k) || '').trim();
  const entry = {
    name: value('name'), email: value('email'), phone: value('phone'), reason: value('reason'),
    service: value('service'), company: value('company'), message: value('message'),
  };

  if (!entry.name) return showError('Please tell us your name.', form.elements.name);
  if (!EMAIL_RE.test(entry.email)) return showError('Please enter a valid email address so we can reply.', form.elements.email);
  if (entry.message.length < 5) return showError('Please add a short message about what you need.', form.elements.message);

  submitBtn.setAttribute('aria-busy', 'true');
  try {
    if (!value('website')) {
      const body = new URLSearchParams();
      Object.entries(FORM_ENTRIES).forEach(([key, id]) => { if (entry[key]) body.set(id, entry[key]); });
      // Google does not allow reading the reply (no-cors); a completed request means it was received.
      await fetch(GOOGLE_FORM_ACTION, { method: 'POST', mode: 'no-cors', body });
    }
    success.querySelector('.success-name').textContent = entry.name.split(' ')[0];
    form.hidden = true;
    success.hidden = false;
    success.focus();
  } catch {
    showError('We couldn’t send your message. Please check your connection, or reach us on WhatsApp.');
  } finally {
    submitBtn.removeAttribute('aria-busy');
  }
});

success.querySelector('.another').addEventListener('click', () => {
  form.reset();
  success.hidden = true;
  form.hidden = false;
  form.elements.name.focus();
});
