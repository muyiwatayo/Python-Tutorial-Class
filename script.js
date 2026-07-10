const contactForm = document.getElementById('contactForm');
const formMessage = document.getElementById('formMessage');

if (contactForm && formMessage) {
  contactForm.addEventListener('submit', function (event) {
    event.preventDefault();
    formMessage.textContent = 'Thanks for your message. I will get back to you soon.';
    contactForm.reset();
  });
}
