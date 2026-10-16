export function validatePhoneNumber(library, country, value) {
  if (!library.getCountries().includes(country)) return { countryError: 'Choose a valid country code.' };
  if (!value.trim()) return { numberError: 'Enter your mobile number.' };
  if (!/^[\d\s().-]+$/.test(value)) return { numberError: 'Enter the mobile number only, without +country code or letters.' };
  const phone = library.parsePhoneNumberFromString(value, { defaultCountry: country, extract: false });
  if (!phone || !phone.isValid() || phone.country !== country) return { numberError: 'Enter a valid mobile number for the selected country.' };
  if (!['MOBILE', 'FIXED_LINE_OR_MOBILE'].includes(phone.getType())) return { numberError: 'Enter a mobile number that can receive SMS.' };
  return { number: phone.number };
}
