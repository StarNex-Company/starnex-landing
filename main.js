// Sticky nav background, mobile menu, scroll reveals and footer year.
const nav = document.querySelector('.nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

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
const WHATSAPP_NUMBER = '2349046908664';

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
    const lines = [
      'Hello StarNex! I just sent a message from your website.',
      `Name: ${entry.name}`, `Email: ${entry.email}`,
      entry.phone ? `Phone: ${entry.phone}` : null, entry.company ? `Company: ${entry.company}` : null,
      `About: ${entry.reason}`, entry.service ? `Service: ${entry.service}` : null,
      '', entry.message,
    ].filter((l) => l !== null);
    success.querySelector('.success-name').textContent = entry.name.split(' ')[0];
    success.querySelector('.success-wa').href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
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
