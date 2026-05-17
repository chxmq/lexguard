const STORAGE_KEY = 'lexguard_google_tokens';

export function getGoogleTokens() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(atob(raw.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

export function setGoogleTokens(tokens) {
  const encoded = btoa(JSON.stringify(tokens));
  sessionStorage.setItem(STORAGE_KEY, encoded);
}

export function clearGoogleTokens() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function hasGoogleTokens() {
  return !!getGoogleTokens()?.access_token;
}
