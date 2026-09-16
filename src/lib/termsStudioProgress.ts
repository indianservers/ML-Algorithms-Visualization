const LEARNED_KEY = 'ml-suite-terms-learned';
const LANG_KEY = 'ml-suite-terms-lang';
const EVENT = 'ml:terms-learned';

export function getLearnedTerms(): string[] {
  try {
    const raw = localStorage.getItem(LEARNED_KEY);
    const parsed = raw ? JSON.parse(raw) as unknown : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export function isTermLearned(slug: string): boolean {
  return getLearnedTerms().includes(slug);
}

export function toggleTermLearned(slug: string): string[] {
  const current = new Set(getLearnedTerms());
  if (current.has(slug)) current.delete(slug);
  else current.add(slug);
  const next = [...current];
  localStorage.setItem(LEARNED_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT));
  return next;
}

export function getTermsLanguage(): 'default' | 'simple' | 'hindi' {
  const value = localStorage.getItem(LANG_KEY);
  return value === 'simple' || value === 'hindi' ? value : 'default';
}

export function setTermsLanguage(lang: 'default' | 'simple' | 'hindi') {
  localStorage.setItem(LANG_KEY, lang);
}

export function subscribeTermsProgress(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}
