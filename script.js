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

    const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    // Open user's email client with prefilled message
    window.location.href = mailto;
    formMessage.textContent = 'Opening your email client to send the message...';

    setTimeout(() => {
      contactForm.reset();
    }, 1500);
  });
}
