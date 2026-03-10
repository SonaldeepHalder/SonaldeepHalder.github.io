(function () {
  'use strict';
  var FORMSPREE_URL = 'https://formspree.io/f/xjgabnqb';

  var form        = document.getElementById('contact-form');
  var submitBtn   = document.getElementById('form-submit-btn');
  var errorEl     = document.getElementById('form-error');
  var successCard = document.getElementById('success-card');
  var resetBtn    = document.getElementById('success-reset-btn');

  if (!form) return;

  function setLoading(on) {
    submitBtn.classList.toggle('is-loading', on);
    submitBtn.disabled = on;
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.add('visible');
  }

  function clearError() {
    errorEl.textContent = '';
    errorEl.classList.remove('visible');
  }

  function resetCheckmarkAnimations() {
    ['.success-checkmark__circle', '.success-checkmark__check'].forEach(function (sel) {
      var el = successCard.querySelector(sel);
      if (!el) return;
      var clone = el.cloneNode(true);
      el.parentNode.replaceChild(clone, el);
    });
  }

  function showSuccess() {
    form.classList.add('is-exiting');
    setTimeout(function () {
      form.style.display = 'none';
      resetCheckmarkAnimations();
      successCard.removeAttribute('hidden');
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          successCard.classList.add('is-visible');
        });
      });
    }, 350);
  }

  function resetToForm() {
    successCard.classList.remove('is-visible');
    successCard.setAttribute('hidden', '');
    form.classList.remove('is-exiting');
    form.style.display = '';
    form.reset();
    clearError();
    setLoading(false);
  }

  resetBtn.addEventListener('click', resetToForm);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearError();

    var name    = form.elements['name'].value.trim();
    var email   = form.elements['email'].value.trim();
    var message = form.elements['message'].value.trim();

    if (!name || !email || !message) {
      showError('Please fill in all fields before sending.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    fetch(FORMSPREE_URL, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, email: email, message: message })
    }).then(function (response) {
      if (response.ok) {
        showSuccess();
      } else {
        return response.json().then(function (data) {
          var msg = 'Something went wrong. Please try again.';
          if (data && data.errors && data.errors.length > 0) {
            msg = data.errors.map(function (err) { return err.message; }).join(' ');
          }
          showError(msg);
          setLoading(false);
        });
      }
    }).catch(function () {
      showError('Network error — please check your connection and try again.');
      setLoading(false);
    });
  });
}());
