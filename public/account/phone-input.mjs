import { validatePhoneNumber } from './phone-number.mjs';
export function setupPhoneInput() {
  const library = window.libphonenumber;
  const select = document.querySelector('#phone-country');
  const input = document.querySelector('#login-phone');
  const flag = document.querySelector('#phone-country-flag');
  const names = new Intl.DisplayNames(['en'], { type: 'region' });
  const countries = library.getCountries().sort((a,b) => names.of(a).localeCompare(names.of(b)));
  for (const country of countries) {
    const option = document.createElement('option');
    option.value = country;
    option.textContent = `+${library.getCountryCallingCode(country)} · ${names.of(country)}`;
    select.append(option);
  }
  select.value = 'IN';
  function showErrors(result = {}) {
    for (const [field, id, message] of [[select, 'phone-country-error', result.countryError], [input, 'phone-number-error', result.numberError]]) {
      document.getElementById(id).textContent = message || '';
      field.setCustomValidity(message || '');
      field.setAttribute('aria-invalid', String(Boolean(message)));
    }
  }
  select.addEventListener('change', () => {
    const valid = library.getCountries().includes(select.value);
    flag.hidden = !valid;
    if (valid) flag.src = `/account/assets/flags/${select.value}.svg`;
    input.placeholder = select.value === 'IN' ? '98765 43210' : 'Mobile number';
    showErrors(valid ? {} : { countryError: 'Choose a valid country code.' });
    if (input.value.trim()) showErrors(validatePhoneNumber(library, select.value, input.value));
  });
  input.addEventListener('input', () => showErrors());
  input.addEventListener('blur', () => { if(input.value.trim()) showErrors(validatePhoneNumber(library, select.value, input.value)); });
  return { validate() {
    const result = validatePhoneNumber(library, select.value, input.value);
    showErrors(result);
    if (!result.number) {
      (result.countryError ? select : input).focus();
      throw new Error(result.countryError || result.numberError);
    }
    return result.number;
  } };
}
