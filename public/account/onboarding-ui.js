(() => {
  const dialog = document.querySelector('#onboarding-dialog');
  const title = document.querySelector('#onboarding-title');
  const step = number => {
    dialog.dataset.step = number;
    document.querySelector('#onboarding-interests').hidden = number !== 1;
    document.querySelector('#onboarding-contact').hidden = number !== 2;
    document.querySelector('#onboarding-next').hidden = number !== 1;
    document.querySelector('#onboarding-save').hidden = number !== 2;
    document.querySelector('#onboarding-step-label').textContent = `STEP ${number} OF 2`;
    title.innerHTML = number === 1 ? 'What sparks<br>your <span class="onboarding-gradient">curiosity?</span>' : 'Let’s stay<br><span class="onboarding-gradient">connected.</span>';
    document.querySelector('#onboarding-intro').textContent = number === 1 ? 'Choose a few interests. You can change them anytime in your profile.' : 'Add a mobile number to your profile, or skip this step. It’s completely optional.';
    document.querySelector('#onboarding-skip').textContent = number === 1 ? 'Skip for now' : 'Skip mobile & finish';
    document.querySelector('#onboarding-status').textContent = '';
    dialog.scrollTop = 0;
  };
  document.querySelector('#onboarding-next').addEventListener('click', () => { step(2); document.querySelector('#onboarding-mobile').focus({preventScroll:true}); });
  document.querySelector('#onboarding-back').addEventListener('click', () => step(1));
  document.querySelector('#onboarding-close').addEventListener('click', () => dialog.close());
  const options = [...dialog.querySelectorAll('.interest-card input')];
  for (const input of options) input.addEventListener('change', () => {
    if (!input.checked) return;
    if (input.value === 'all') options.filter(x => x !== input).forEach(x => x.checked = false);
    else options.find(x => x.value === 'all').checked = false;
  });
  window.aimerOnboarding = {
    open(profile) {
      dialog.dataset.originalInterests = JSON.stringify(profile.interests || []);
      options.forEach(input => input.checked = input.value !== 'all' && (profile.interests || []).includes(input.value));
      document.querySelector('#onboarding-mobile').value = profile.mobileNumber || '';
      step(1); if (!dialog.open) dialog.showModal();
    }
  };
})();
