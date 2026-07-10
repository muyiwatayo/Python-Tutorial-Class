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
