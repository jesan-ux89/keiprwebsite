import axios from 'axios';
import { auth } from './firebase';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://keipr-backend-production.up.railway.app/api';

const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

// Attach Firebase token to every request.
// Awaits Firebase's async persistence rehydration so requests fired before
// onAuthStateChanged completes still get a valid token. Without this, the very
// first API call after a hard refresh races and goes out without an
// Authorization header, producing 401 "Missing or invalid authorization header".
api.interceptors.request.use(async (config) => {
  if (typeof auth.authStateReady === 'function') {
    try { await auth.authStateReady(); } catch { /* ignore */ }
  }
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authAPI = {
  register:      (idToken: string, fullName: string) => api.post('/auth/register', { idToken, fullName }),
  login:         (idToken: string) => api.post('/auth/login', { idToken }),
  me:            () => api.get('/auth/me'),
  sendMfaCode:   (email: string) => api.post('/auth/send-mfa-code', { email }),
  verifyMfaCode: (email: string, code: string) => api.post('/auth/verify-mfa-code', { email, code }),
  // TOTP authenticator
  totpSetup:          () => api.post('/auth/totp/setup'),
  totpVerifySetup:    (code: string) => api.post('/auth/totp/verify-setup', { code }),
  totpVerify:         (email: string, code: string) => api.post('/auth/totp/verify', { email, code }),
  totpVerifyRecovery: (email: string, recoveryCode: string) => api.post('/auth/totp/verify-recovery', { email, recoveryCode }),
  totpDisable:        () => api.post('/auth/totp/disable'),
  isAdmin:            () => api.get('/auth/is-admin'),
};

// Paychecks
export const paychecksAPI = {
  getAll:     (params?: Record<string, string>) => api.get('/paychecks', { params }),
  getCurrent: () => api.get('/paychecks/current'),
  getById:    (id: string) => api.get(`/paychecks/${id}`),
  create:     (data: Record<string, unknown>) => api.post('/paychecks', data),
  update:     (id: string, data: Record<string, unknown>) => api.patch(`/paychecks/${id}`, data),
  upcoming:   (count: number) => api.get('/paychecks/forecast/upcoming', { params: { count } }),
};

// Bills
export const billsAPI = {
  getAll:      () => api.get('/bills'),
  getById:     (id: string) => api.get(`/bills/${id}`),
  create:      (data: Record<string, unknown>) => api.post('/bills', data),
  update:      (id: string, data: Record<string, unknown>) => api.patch(`/bills/${id}`, data),
  delete:      (id: string) => api.delete(`/bills/${id}`),
  setSplits:   (id: string, splits: unknown[]) => api.post(`/bills/${id}/splits`, { splits }),
  markSaved:   (splitId: string) => api.patch(`/bills/splits/${splitId}/saved`, { isSaved: true }),
  unmarkSaved: (splitId: string) => api.patch(`/bills/splits/${splitId}/saved`, { isSaved: false }),
  getPayments: (year: number, month: number) => api.get(`/bills/payments/${year}/${month}`),
  markPaid:    (data: Record<string, unknown>) => api.post('/bills/payments', data),
  unmarkPaid:  (paymentId: string) => api.delete(`/bills/payments/${paymentId}`),
  // Detected transactions
  getDetectedSummary: () => api.get('/bills/detected/summary'),
  confirmDetected:    (id: string, data?: Record<string, unknown>) => api.patch(`/bills/${id}/confirm-detected`, data || {}),
  dismissDetected:    (id: string) => api.patch(`/bills/${id}/dismiss-detected`),
  linkDuplicate:      (id: string, targetBillId: string) => api.post(`/bills/${id}/link-duplicate`, { targetBillId }),
  // Credit cards
  getCreditCards: () => api.get('/bills/credit-cards'),
  // Quick expense
  quickExpense: (data: { name: string; amount: number; category?: string }) => api.post('/bills/quick-expense', data),
};

// Allocations
export const allocationsAPI = {
  getByPaycheck: (paycheckId: string) => api.get('/allocations', { params: { paycheckId } }),
  create:        (data: Record<string, unknown>) => api.post('/allocations', data),
  update:        (id: string, data: Record<string, unknown>) => api.patch(`/allocations/${id}`, data),
  delete:        (id: string) => api.delete(`/allocations/${id}`),
};

// Forward Plans
export const planAPI = {
  getAll:        () => api.get('/plan'),
  get:           (year: number, month: number) => api.get(`/plan/${year}/${month}`),
  create:        (data: Record<string, unknown>) => api.post('/plan', data),
  update:        (id: string, data: Record<string, unknown>) => api.patch(`/plan/${id}`, data),
  // Multi-month projection (Pro+): rollover-compounded forecast
  getProjection: (months: number = 6) => api.get('/plan/projection', { params: { months } }),
  getBills:      (year: number, month: number) => api.get(`/plan/${year}/${month}/bills`),
  snapshotBills: (year: number, month: number) => api.post(`/plan/${year}/${month}/bills/snapshot`),
  updatePlanBill:(year: number, month: number, planBillId: string, data: Record<string, unknown>) => api.patch(`/plan/${year}/${month}/bills/${planBillId}`, data),
  addPlanBill:   (year: number, month: number, data: Record<string, unknown>) => api.post(`/plan/${year}/${month}/bills`, data),
  deletePlanBill:(year: number, month: number, planBillId: string) => api.delete(`/plan/${year}/${month}/bills/${planBillId}`),
};

// Users
export const usersAPI = {
  updateProfile:       (data: Record<string, unknown>) => api.patch('/users/me', data),
  updateNotifications: (data: Record<string, unknown>) => api.patch('/users/me/notifications', data),
  getIncomeSources:    () => api.get('/users/me/income-sources'),
  addIncomeSource:     (data: Record<string, unknown>) => api.post('/users/me/income-sources', data),
  updateIncomeSource:  (id: string, data: Record<string, unknown>) => api.patch(`/users/me/income-sources/${id}`, data),
  deleteIncomeSource:  (id: string) => api.delete(`/users/me/income-sources/${id}`),
  getCategories:       () => api.get('/users/me/categories'),
  addCategory:         (data: Record<string, unknown>) => api.post('/users/me/categories', data),
  updateCategory:      (id: string, data: Record<string, unknown>) => api.patch(`/users/me/categories/${id}`, data),
  deleteCategory:      (id: string) => api.delete(`/users/me/categories/${id}`),
  deleteAccount:       () => api.delete('/auth/delete-account'),
  // Fund allocations (one-time fund spending items)
  getFundAllocations:  (fundId: string) => api.get(`/users/me/income-sources/${fundId}/allocations`),
  addFundAllocation:   (fundId: string, data: Record<string, unknown>) => api.post(`/users/me/income-sources/${fundId}/allocations`, data),
  deleteFundAllocation:(fundId: string, allocId: string) => api.delete(`/users/me/income-sources/${fundId}/allocations/${allocId}`),
};

// Export
export const exportAPI = {
  requestExport: () => api.post('/export'),
};

// Subscriptions (Lemon Squeezy)
export const subscriptionsAPI = {
  getStatus:   () => api.get('/subscriptions/status'),
  checkout:    (planKey: string) => api.post('/subscriptions/checkout', { planKey }),
  getPortal:   () => api.post('/subscriptions/portal'),
  cancel:      () => api.post('/subscriptions/cancel'),
  resume:      () => api.post('/subscriptions/resume'),
  changePlan:  (planKey: string) => api.post('/subscriptions/change-plan', { planKey }),
};

// Banking (Ultra tier — Plaid integration)
export const bankingAPI = {
  getLinkToken:        () => api.post('/banking/link-token'),
  exchangeToken:       (data: Record<string, unknown>) => api.post('/banking/exchange-token', data),
  getAccounts:         () => api.get('/banking/accounts'),
  getBalances:         (force = false) => api.get(`/banking/balances${force ? '?force=true' : ''}`),
  toggleAccountSync:   (id: string, isSynced: boolean) => api.patch(`/banking/accounts/${id}`, { is_synced: isSynced }),
  getReconnectToken:   (id: string) => api.post(`/banking/accounts/${id}/reconnect`),
  reconnectComplete:   (id: string) => api.post(`/banking/accounts/${id}/reconnect-complete`),
  unlinkAccount:       (id: string) => api.delete(`/banking/accounts/${id}`),
  permanentDelete:     (id: string) => api.delete(`/banking/accounts/${id}/permanent`),
  getStatus:           () => api.get('/banking/status'),
  getSuggestions:      () => api.get('/banking-data/suggestions'),
  addSuggestion:       (id: string) => api.post(`/banking-data/suggestions/${id}/add`),
  dismissSuggestion:   (id: string, type: string) => api.post(`/banking-data/suggestions/${id}/dismiss`, { dismiss_type: type }),
  getConfirmations:    () => api.get('/banking-data/confirmations'),
  confirmMatch:        (id: string) => api.post(`/banking-data/confirmations/${id}/confirm`),
  rejectMatch:         (id: string) => api.post(`/banking-data/confirmations/${id}/reject`),
  getMatchedBills:     () => api.get('/banking-data/matched-bills'),
  getMatchHistory:     (billId?: string) => api.get('/banking-data/match-history', { params: billId ? { bill_id: billId } : {} }),
  unlinkMatch:         (id: string) => api.post(`/banking-data/matches/${id}/unlink`),
  getExclusionRules:   () => api.get('/banking-data/exclusion-rules'),
  addExclusionRule:    (data: Record<string, unknown>) => api.post('/banking-data/exclusion-rules', data),
  deleteExclusionRule: (id: string) => api.delete(`/banking-data/exclusion-rules/${id}`),
  triggerSync:         () => api.post('/banking-data/sync'),
  directSync:          () => api.post('/banking/sandbox/direct-sync'),
  getAllTransactions:  (params?: Record<string, unknown>) => api.get('/banking-data/all-transactions', { params }),
  transactionAction:   (id: string, data: Record<string, unknown>) => api.post(`/banking-data/transactions/${id}/action`, data),
  getAutoExclusionSettings: () => api.get('/banking-data/auto-exclusion-settings'),
  updateAutoExclusionSettings: (data: Record<string, unknown>) => api.post('/banking-data/auto-exclusion-settings', data),
  scanSuggestions:     () => api.post('/banking-data/suggest/scan'),
  backfillCategories:  () => api.post('/banking-data/backfill-categories'),
  reclassifySpending:  () => api.post('/banking-data/reclassify-spending'),
  migrateToUltra:      () => api.post('/banking-data/migrate-to-ultra', {}, { timeout: 300000 }),
  bulkExcludeMerchant: (merchantName: string) => api.post('/banking-data/bulk/exclude-merchant', { merchant_name: merchantName }),
  bulkConfirmHighConfidence: (minConfidence = 0.90) => api.post('/banking-data/bulk/confirm-high-confidence', { min_confidence: minConfidence }),
  onboardingImport:  () => api.post('/banking-data/onboarding-import', {}, { timeout: 120000 }),
};

// Rollover
export const rolloverAPI = {
  getCurrent: () => api.get('/rollover/current'),
  decide:     (data: { action: string; periodMonth: number; periodYear: number }) => api.post('/rollover/decide', data),
  getHistory: () => api.get('/rollover/history'),
};

// Secondary Income
export const secondaryIncomeAPI = {
  getAllocations: (month: number, year: number) => api.get('/secondary-income/allocations', { params: { month, year } }),
  allocate:       (data: Record<string, unknown>) => api.post('/secondary-income/allocate', data),
  removeAllocation: (id: string) => api.delete(`/secondary-income/allocations/${id}`),
  getSummary:     (month: number, year: number) => api.get('/secondary-income/summary', { params: { month, year } }),
};

// Reports (Ultra tier — analytics)
export const reportsAPI = {
  getSpendingByCategory: (months = 6) => api.get('/reports/spending-by-category', { params: { months } }),
  getMonthlyTrend:       (months = 6) => api.get('/reports/monthly-trend', { params: { months } }),
  getTopMerchants:       (months = 3, limit = 10) => api.get('/reports/top-merchants', { params: { months, limit } }),
};

// Spending budgets (Full Dollar Tracking)
export const spendingAPI = {
  getBudgets:      () => api.get('/spending/budgets'),
  createBudget:    (data: Record<string, unknown>) => api.post('/spending/budgets', data),
  updateBudget:    (id: string, data: Record<string, unknown>) => api.patch(`/spending/budgets/${id}`, data),
  deleteBudget:    (id: string) => api.delete(`/spending/budgets/${id}`),
  getSummary:      () => api.get('/spending/summary'),
  getPace:         (category: string) => api.get('/spending/pace', { params: { category } }),
  getAvailable:    () => api.get('/spending/available'),
  getSuggested:    () => api.get('/spending/budgets/suggested'),
};

// AI Accountant
export const aiAPI = {
  // User-facing — settings & consent
  getSettings:   () => api.get('/me/ai-settings'),
  setEnabled:    (enabled: boolean, reason?: string) => api.post('/me/ai-settings', { enabled, reason }),
  acceptConsent: (version: string) => api.post('/me/ai-consent', { version }),
  markPrompted:  () => api.post('/me/ai-prompted'),
  exportData:    () => api.get('/me/ai-data-export'),

  // User-facing — history & corrections
  getHistory:    (limit = 50, offset = 0) => api.get('/me/ai-history', { params: { limit, offset } }),
  getCorrection: (correctionId: string) => api.get(`/me/ai-corrections/${correctionId}`),

  // User-facing — flagged reviews (action cards)
  getReviews:        () => api.get('/me/ai-reviews'),
  dismissReview:     (correctionId: string) => api.post(`/me/ai-corrections/${correctionId}/dismiss`),
  undoCorrection:    (correctionId: string) => api.post(`/me/ai-corrections/${correctionId}/undo`),

  // User-facing — overrides & staging chains
  getOverrides:      () => api.get('/me/ai-overrides'),
  createOverride:    (data: Record<string, unknown>) => api.post('/me/ai-overrides', data),
  removeOverride:    (id: string) => api.delete(`/me/ai-overrides/${id}`),
  overrideBillPaycheck: (billId: string, paycheckNum: number, scope: 'current_cycle' | 'permanent') =>
    api.post(`/bills/${billId}/override-paycheck`, { paycheck: paycheckNum, scope }),

  getStagingChains:    () => api.get('/staging-chains'),
  anchorStagingChain:  (chainId: string, data: Record<string, unknown>) => api.post(`/staging-chains/${chainId}/anchor`, data),
  dissolveStagingChain: (chainId: string) => api.post(`/staging-chains/${chainId}/dissolve`),

  // User-facing — get corrections for a bill
  getCorrectionsForBill: (billId: string) => api.get(`/me/ai-corrections-by-bill`, { params: { bill_id: billId } }),

  // Admin
  adminGetSettings:       () => api.get('/admin/ai-settings'),
  adminUpdateSettings:    (data: Record<string, unknown>) => api.post('/admin/ai-settings', data),
  adminGetDashboard:      () => api.get('/admin/ai-dashboard'),
  adminGetRun:            (runId: string) => api.get(`/admin/ai-runs/${runId}`),
  adminUndoCorrection:    (correctionId: string) => api.post(`/admin/ai-corrections/${correctionId}/undo`),
  adminReaudit:           (userId: string, reason: string) => api.post(`/admin/ai-reaudit/${userId}`, { reason }),
  adminPurge:             () => api.post('/admin/ai-purge'),
  adminGetUsers:          (search: string, offset: number) => api.get('/admin/ai-users', { params: { search, offset } }),
  adminUpdateUserFlags:   (userId: string, flags: Record<string, boolean>) => api.post(`/admin/ai-users/${userId}/flags`, flags),
  adminDisableUserAi:     (userId: string, reason: string) => api.post(`/admin/ai-users/${userId}/disable-ai`, { reason }),
};

// ── Admin Management API (user management + admin users) ──
export const adminAPI = {
  // User management
  listUsers:        (search: string, offset = 0, limit = 50) => api.get('/admin/manage/users', { params: { search, offset, limit } }),
  getUser:          (userId: string) => api.get(`/admin/manage/users/${userId}`),
  deleteUser:       (userId: string, confirmEmail: string) => api.delete(`/admin/manage/users/${userId}`, { data: { confirmEmail } }),
  // Admin users
  listAdmins:       () => api.get('/admin/manage/admin-users'),
  addAdmin:         (email: string) => api.post('/admin/manage/admin-users', { email }),
  removeAdmin:      (adminId: string) => api.delete(`/admin/manage/admin-users/${adminId}`),
};

export default api;
