const PENDING_BANK_ONBOARDING_KEY = 'keipr_pending_bank_onboarding';

function canUseStorage() {
  return typeof window !== 'undefined' && !!window.localStorage;
}

export function markPendingBankOnboarding() {
  if (!canUseStorage()) return;
  window.localStorage.setItem(PENDING_BANK_ONBOARDING_KEY, '1');
}

export function clearPendingBankOnboarding() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(PENDING_BANK_ONBOARDING_KEY);
}

export function hasPendingBankOnboarding() {
  if (!canUseStorage()) return false;
  return window.localStorage.getItem(PENDING_BANK_ONBOARDING_KEY) === '1';
}
