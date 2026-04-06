import axios from 'axios';
import { auth } from './firebase';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://keipr-backend-production.up.railway.app/api';

const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

// Attach Firebase token to every request
api.interceptors.request.use(async (config) => {
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

// Banking (Ultra tier — Plaid integration)
export const bankingAPI = {
  getLinkToken:        () => api.post('/banking/link-token'),
  exchangeToken:       (data: Record<string, unknown>) => api.post('/banking/exchange-token', data),
  getAccounts:         () => api.get('/banking/accounts'),
  toggleAccountSync:   (id: string, isSynced: boolean) => api.patch(`/banking/accounts/${id}`, { is_synced: isSynced }),
  getReconnectToken:   (id: string) => api.post(`/banking/accounts/${id}/reconnect`),
  unlinkAccount:       (id: string) => api.delete(`/banking/accounts/${id}`),
  getStatus:           () => api.get('/banking/status'),
  getSuggestions:      () => api.get('/banking-data/suggestions'),
  addSuggestion:       (id: string) => api.post(`/banking-data/suggestions/${id}/add`),
  dismissSuggestion:   (id: string, type: string) => api.post(`/banking-data/suggestions/${id}/dismiss`, { dismiss_type: type }),
  getConfirmations:    () => api.get('/banking-data/confirmations'),
  confirmMatch:        (id: string) => api.post(`/banking-data/confirmations/${id}/confirm`),
  rejectMatch:         (id: string) => api.post(`/banking-data/confirmations/${id}/reject`),
  getMatchHistory:     (billId?: string) => api.get('/banking-data/match-history', { params: billId ? { bill_id: billId } : {} }),
  unlinkMatch:         (id: string) => api.post(`/banking-data/matches/${id}/unlink`),
  getExclusionRules:   () => api.get('/banking-data/exclusion-rules'),
  addExclusionRule:    (data: Record<string, unknown>) => api.post('/banking-data/exclusion-rules', data),
  deleteExclusionRule: (id: string) => api.delete(`/banking-data/exclusion-rules/${id}`),
  triggerSync:         () => api.post('/banking-data/sync'),
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

export default api;
