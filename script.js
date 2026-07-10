const contactForm = document.getElementById('contactForm');
const formMessage = document.getElementById('formMessage');

if (contactForm && formMessage) {
  contactForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const name = document.getElementById('cf-name').value.trim();
    const email = document.getElementById('cf-email').value.trim();
    const message = document.getElementById('cf-message').value.trim();
    const to = 'oluwamuyiwaeyitayo@gmail.com';
    const subject = `Website message from ${name || 'Website visitor'}`;
    const body = `Name: ${name}\nEmail: ${email}\n\n${message}`;

    // EmailJS configuration placeholders — replace with your real IDs
    const EMAILJS_USER_ID = 'YOUR_EMAILJS_USER_ID';
    const EMAILJS_SERVICE_ID = 'YOUR_EMAILJS_SERVICE_ID';
    const EMAILJS_TEMPLATE_ID = 'YOUR_EMAILJS_TEMPLATE_ID';

    const templateParams = {
      from_name: name,
      from_email: email,
      message: message,
      to_email: to,
    };

    // If EmailJS is configured, try sending directly
    const isEmailJsConfigured = EMAILJS_USER_ID !== 'YOUR_EMAILJS_USER_ID'
      && EMAILJS_SERVICE_ID !== 'YOUR_EMAILJS_SERVICE_ID'
      && EMAILJS_TEMPLATE_ID !== 'YOUR_EMAILJS_TEMPLATE_ID';

    if (isEmailJsConfigured && window.emailjs) {
      try {
        emailjs.init(EMAILJS_USER_ID);
        formMessage.textContent = 'Sending message...';
        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
          .then(() => {
            formMessage.textContent = 'Message sent — thank you!';
            contactForm.reset();
          }, (err) => {
            console.error('EmailJS error', err);
            formMessage.textContent = 'Sending failed — opening your email client instead.';
            // fallback to mailto
            const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.location.href = mailto;
          });
      } catch (e) {
        console.error(e);
        // fallback to mailto
        const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailto;
        formMessage.textContent = 'Opening your email client to send the message...';
        setTimeout(() => contactForm.reset(), 1500);
      }
    } else {
      // Default: open user's email client with prefilled message
      const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailto;
      formMessage.textContent = 'Opening your email client to send the message...';
      setTimeout(() => contactForm.reset(), 1500);
    }
  });
}

// Rotating gallery controls
const gallery = document.getElementById('rotatingGallery');
if (gallery) {
  const imgs = Array.from(gallery.querySelectorAll('img'));
  const prevBtn = gallery.querySelector('.prev');
  const nextBtn = gallery.querySelector('.next');
  const playBtn = document.getElementById('galleryPlay');
  let current = 0;
  let playing = true;
  let timer = null;

  function showIndex(i) {
    imgs.forEach((img, idx) => {
      img.style.opacity = idx === i ? '1' : '0';
      img.style.zIndex = idx === i ? '10' : '1';
    });
    current = i;
  }

  function next() { showIndex((current + 1) % imgs.length); }
  function prev() { showIndex((current - 1 + imgs.length) % imgs.length); }

  function startAuto() { if (timer) clearInterval(timer); timer = setInterval(next, 4000); playing = true; playBtn.textContent = '▐▐'; }
  function stopAuto() { if (timer) clearInterval(timer); timer = null; playing = false; playBtn.textContent = '▶'; }

  // initial
  showIndex(0);
  startAuto();

  gallery.addEventListener('mouseover', () => stopAuto());
  gallery.addEventListener('mouseleave', () => startAuto());

  if (nextBtn) nextBtn.addEventListener('click', () => { next(); stopAuto(); });
  if (prevBtn) prevBtn.addEventListener('click', () => { prev(); stopAuto(); });
  if (playBtn) playBtn.addEventListener('click', () => { playing ? stopAuto() : startAuto(); });

  // keyboard control
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { next(); stopAuto(); }
    if (e.key === 'ArrowLeft') { prev(); stopAuto(); }
    if (e.key === ' ') { e.preventDefault(); playing ? stopAuto() : startAuto(); }
  });
}

// Project filters and lightbox
const projectGrid = document.getElementById('projectGrid');
if (projectGrid) {
  const filters = document.querySelectorAll('.filter-btn');
  const cards = Array.from(projectGrid.querySelectorAll('.project-card'));

  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      filters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      cards.forEach(card => {
        card.style.display = (f === 'all' || card.dataset.type === f) ? '' : 'none';
      });
    });
  });

  // Lightbox
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.innerHTML = `<div class="lightbox-inner"><img src="" alt=""/><div class="caption"></div></div>`;
  document.body.appendChild(lightbox);
  const lbImg = lightbox.querySelector('img');
  const lbCaption = lightbox.querySelector('.caption');

  cards.forEach(card => {
    card.addEventListener('click', () => {
      const img = card.querySelector('img');
      lbImg.src = img.src;
      lbCaption.textContent = card.querySelector('h3').textContent || '';
      lightbox.classList.add('open');
    });
  });

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target === lbImg) lightbox.classList.remove('open');
  });
}

// Reveal on scroll
const revealElements = document.querySelectorAll('.reveal, .section, .feature-card, .project-card, .panel-card');
if ('IntersectionObserver' in window) {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  revealElements.forEach(el => obs.observe(el));
} else {
  revealElements.forEach(el => el.classList.add('visible'));
}
