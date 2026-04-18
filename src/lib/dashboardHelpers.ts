/**
 * Dashboard Helpers
 *
 * PORTED FROM MOBILE APP (src/screens/dashboard/dashboardHelpers.ts) — must stay in sync.
 *
 * Pure utility functions for dashboard calculations: bill amounts per paycheck,
 * occurrence dates within periods, sorting, and full dashboard totals computation.
 *
 * NOTE: showExpenseActions is intentionally omitted — it uses React Native Alert
 * which doesn't exist on web. The website handles expense actions via its own UI patterns.
 */

import { billBelongsToPaycheck } from './payPeriods';

/**
 * What a bill costs for a given paycheck: full total for non-split, p1-p4 for split.
 */
export function billAmountForPaycheck(b: any, paycheck: number): number {
  if (b.isSplit) {
    if (paycheck === 1) return b.p1 || 0;
    if (paycheck === 2) return b.p2 || 0;
    if (paycheck === 3) return b.p3 || 0;
    if (paycheck === 4) return b.p4 || 0;
    return b.p1 || 0;
  }
  return b.total || 0;
}

/**
 * Find the actual date a dueDay falls on within a given pay period.
 * Periods can span month boundaries (e.g. Apr 28 - May 11), so try the period's
 * start-month first, then the end-month. Returns period.start as fallback.
 */
export function occurrenceInPeriod(dueDay: number, period: { start: Date; end: Date }): Date {
  const start = period.start instanceof Date ? period.start : new Date(period.start);
  const end = period.end instanceof Date ? period.end : new Date(period.end);
  const d1 = new Date(start.getFullYear(), start.getMonth(), dueDay);
  if (d1 >= start && d1 <= end) return d1;
  const d2 = new Date(end.getFullYear(), end.getMonth(), dueDay);
  if (d2 >= start && d2 <= end) return d2;
  return start;
}

/**
 * Sort bills by actual occurrence date within the period (closest-upcoming first).
 * Past-due bills in the current period naturally sort to the top since their
 * occurrence date is in the past.
 */
export function sortByOccurrence(list: any[], period: { start: Date; end: Date }): any[] {
  return [...list].sort((a, b) => {
    const da = occurrenceInPeriod(a.dueDay || 1, period).getTime();
    const db = occurrenceInPeriod(b.dueDay || 1, period).getTime();
    return da - db;
  });
}

/**
 * Compute all dashboard totals from bills, income sources, and pay periods.
 * Pure function — no references to component state.
 */
export function computeDashboardTotals(args: {
  bills: any[];
  incomeSources: any[];
  currentPeriod: any;
  nextPeriod: any;
  isTwiceMonthly: boolean;
  periodsPerMonth: number;
  isUltra: boolean;
  spendingBudgets: any[];
  currentRollover: any;
}): {
  totalPaycheck: number;
  regularIncome: any[];
  primaryIncome: any | null;
  secondaryIncome: any[];
  incomeName: string;
  thisPaycheckBills: any[];
  nextPaycheckBills: any[];
  directBillsThisCheck: any[];
  ccBillsThisCheck: any[];
  totalBillsThisCheck: number;
  totalCCBillsThisCheck: number;
  totalAllBillsThisCheck: number;
  totalSpendingBudgetsAmount: number;
  remaining: number;
  spentPct: number;
  directNextBills: any[];
  nextBillsTotal: number;
  nextCCBillsTotal: number;
  nextRemaining: number;
  directBills: any[];
  totalBillsMonthly: number;
  totalCCBillsMonthly: number;
  totalSpentMonthly: number;
  monthlyIncome: number;
  monthlyRemaining: number;
  paycheckCount: number;
  rolloverBonus: number;
} {
  const {
    bills,
    incomeSources,
    currentPeriod,
    nextPeriod,
    isTwiceMonthly,
    periodsPerMonth,
    isUltra,
    spendingBudgets,
    currentRollover,
  } = args;

  // Derive paycheck from real income sources (exclude one-time funds from paycheck calculations)
  const regularIncome = incomeSources.filter((s: any) => !s.isOneTime);
  const primaryIncome = regularIncome.find((s: any) => s.isPrimary) || (regularIncome.length > 0 ? regularIncome[0] : null);
  const secondaryIncome = regularIncome.filter((s: any) => s.id !== primaryIncome?.id);
  const totalPaycheck = regularIncome.reduce((sum: number, s: any) => sum + (s.typicalAmount || 0), 0);
  const incomeName = primaryIncome ? primaryIncome.name : 'No income set';
  const paycheckCount = periodsPerMonth;

  // ── Monthly totals (full bill amounts, excluding CC-paid to avoid double-counting) ──
  const directBills = bills.filter((b: any) => !b.paidWith);
  const totalBillsMonthly = directBills.reduce((s: number, b: any) => s + (b.total || 0), 0);
  const totalCCBillsMonthly = bills.filter((b: any) => !!b.paidWith).reduce((s: number, b: any) => s + (b.total || 0), 0);
  const totalSpentMonthly = bills.reduce((s: number, b: any) => s + (b.funded || 0), 0);

  // Filter bills by which pay period they fall into
  const thisPaycheckBills = isTwiceMonthly
    ? sortByOccurrence(bills.filter((b: any) => billBelongsToPaycheck(b, currentPeriod)), currentPeriod)
    : sortByOccurrence(bills, currentPeriod);

  const nextPaycheckBills = isTwiceMonthly
    ? sortByOccurrence(bills.filter((b: any) => billBelongsToPaycheck(b, nextPeriod)), nextPeriod)
    : [];

  // This check totals
  const directBillsThisCheck = thisPaycheckBills.filter((b: any) => !b.paidWith);
  const ccBillsThisCheck = thisPaycheckBills.filter((b: any) => !!b.paidWith);
  const totalBillsThisCheck = directBillsThisCheck.reduce(
    (s: number, b: any) => s + billAmountForPaycheck(b, currentPeriod.paycheckNumber as number), 0,
  );
  const totalCCBillsThisCheck = ccBillsThisCheck.reduce(
    (s: number, b: any) => s + billAmountForPaycheck(b, currentPeriod.paycheckNumber as number), 0,
  );

  // Ultra: subtract spending budgets (groceries, gas, etc.) from remaining
  const totalSpendingBudgetsAmount = isUltra
    ? (spendingBudgets || []).reduce((s: number, b: any) => s + (b.budget_amount || 0), 0)
    : 0;

  const totalAllBillsThisCheck = totalBillsThisCheck + totalCCBillsThisCheck;
  const remaining = (totalPaycheck || 0) - totalAllBillsThisCheck - totalSpendingBudgetsAmount;
  const spentPct = totalPaycheck > 0 ? Math.round((totalBillsThisCheck / totalPaycheck) * 100) : 0;

  // Next check totals
  const directNextBills = nextPaycheckBills.filter((b: any) => !b.paidWith);
  const nextBillsTotal = directNextBills.reduce(
    (s: number, b: any) => s + billAmountForPaycheck(b, nextPeriod.paycheckNumber as number), 0,
  );
  const nextCCBillsTotal = nextPaycheckBills.filter((b: any) => !!b.paidWith).reduce(
    (s: number, b: any) => s + billAmountForPaycheck(b, nextPeriod.paycheckNumber as number), 0,
  );
  const nextRemaining = (totalPaycheck || 0) - nextBillsTotal - nextCCBillsTotal;

  // Rollover + monthly income
  const rolloverBonus = (currentRollover?.action === 'rolled_over' && currentRollover.rolloverAmount > 0)
    ? currentRollover.rolloverAmount
    : 0;
  const monthlyIncome = totalPaycheck * paycheckCount + rolloverBonus;
  const monthlyRemaining = monthlyIncome - totalBillsMonthly;

  return {
    totalPaycheck,
    regularIncome,
    primaryIncome,
    secondaryIncome,
    incomeName,
    thisPaycheckBills,
    nextPaycheckBills,
    directBillsThisCheck,
    ccBillsThisCheck,
    totalBillsThisCheck,
    totalCCBillsThisCheck,
    totalAllBillsThisCheck,
    totalSpendingBudgetsAmount,
    remaining,
    spentPct,
    directNextBills,
    nextBillsTotal,
    nextCCBillsTotal,
    nextRemaining,
    directBills,
    totalBillsMonthly,
    totalCCBillsMonthly,
    totalSpentMonthly,
    monthlyIncome,
    monthlyRemaining,
    paycheckCount,
    rolloverBonus,
  };
}
