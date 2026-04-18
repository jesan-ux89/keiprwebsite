/**
 * billsHelpers.ts — Shared helper functions for the Budget/Bills page.
 *
 * PORTED FROM MOBILE APP (src/screens/bills/billsHelpers.ts) — must stay in sync.
 *
 * Extracted so both Free/Pro and Ultra tiers can reuse the same logic
 * without duplication.
 *
 * NOTE: Icon components (LockIcon, WavesIcon, etc.) and showExpenseActions
 * are NOT included here — those use React Native primitives. The website
 * uses its own SVG/UI approach.
 */

import type { PayPeriod } from './payPeriods';
import { billBelongsToPaycheck } from './payPeriods';

// ─── groupBillsByCategory ───────────────────────────────────────────
// Groups an array of bills by their `category` field and sorts the
// groups by total amount descending.  Returns an array of
// { category, bills, total, count } objects.

export interface CategoryGroup {
  category: string;
  bills: any[];
  total: number;
  count: number;
}

export function groupBillsByCategory(
  bills: any[],
  _categories?: any[],
): CategoryGroup[] {
  const catMap: Record<string, any[]> = {};

  for (const bill of bills) {
    const cat = bill.category || 'Other';
    if (!catMap[cat]) catMap[cat] = [];
    catMap[cat].push(bill);
  }

  const groups: CategoryGroup[] = Object.entries(catMap).map(([category, catBills]) => ({
    category,
    bills: catBills.sort((a: any, b: any) => (a.dueDay || 1) - (b.dueDay || 1)),
    total: catBills.reduce((s: number, b: any) => s + b.total, 0),
    count: catBills.length,
  }));

  // Sort groups by total amount descending
  groups.sort((a, b) => b.total - a.total);

  return groups;
}

// ─── splitBillsFixedFlexible ────────────────────────────────────────
// Separates bills into "Fixed" (recurring / default) vs "Flexible"
// (expenseType === 'flexible') groups, then groups each by category.

export interface FixedFlexibleGroups {
  fixed: {
    bills: any[];
    total: number;
    count: number;
    categoryGroups: CategoryGroup[];
  };
  flexible: {
    bills: any[];
    total: number;
    count: number;
    categoryGroups: CategoryGroup[];
  };
}

export function splitBillsFixedFlexible(bills: any[]): FixedFlexibleGroups {
  const fixedBills = bills.filter((b: any) => (b.expenseType || 'fixed') === 'fixed');
  const flexibleBills = bills.filter((b: any) => b.expenseType === 'flexible');

  return {
    fixed: {
      bills: fixedBills,
      total: fixedBills.reduce((s: number, b: any) => s + b.total, 0),
      count: fixedBills.length,
      categoryGroups: groupBillsByCategory(fixedBills),
    },
    flexible: {
      bills: flexibleBills,
      total: flexibleBills.reduce((s: number, b: any) => s + b.total, 0),
      count: flexibleBills.length,
      categoryGroups: groupBillsByCategory(flexibleBills),
    },
  };
}

// ─── computeBillsTotals ─────────────────────────────────────────────
// Computes aggregate totals from an array of bills.

export interface BillsTotals {
  totalBills: number;
  totalFunded: number;
  totalPending: number;
  fixedTotal: number;
  flexibleTotal: number;
  fixedCount: number;
  flexibleCount: number;
}

export function computeBillsTotals(bills: any[]): BillsTotals {
  const totalBills = bills.reduce((s: number, b: any) => s + b.total, 0);
  const totalFunded = bills.reduce((s: number, b: any) => s + b.funded, 0);
  const totalPending = totalBills - totalFunded;

  const fixedBills = bills.filter((b: any) => (b.expenseType || 'fixed') === 'fixed');
  const flexibleBills = bills.filter((b: any) => b.expenseType === 'flexible');

  return {
    totalBills,
    totalFunded,
    totalPending,
    fixedTotal: fixedBills.reduce((s: number, b: any) => s + b.total, 0),
    flexibleTotal: flexibleBills.reduce((s: number, b: any) => s + b.total, 0),
    fixedCount: fixedBills.length,
    flexibleCount: flexibleBills.length,
  };
}

// ─── filterBills ────────────────────────────────────────────────────
// Applies the tab filter (All / Split / Upcoming / Recurring) and
// optionally splits by current vs next pay period.

export interface FilteredBills {
  /** Pre-filtered list (before pay-period split) */
  preFiltered: any[];
  /** Bills assigned to current paycheck (sorted by dueDay) */
  thisPaycheckBills: any[];
  /** Bills assigned to next paycheck (sorted by dueDay) — empty when not twice-monthly */
  nextPaycheckBills: any[];
  thisTotal: number;
  nextTotal: number;
}

export function filterBills(
  bills: any[],
  filter: string,
  currentPeriod: PayPeriod | null,
  nextPeriod: PayPeriod | null,
  isTwiceMonthly: boolean = false,
): FilteredBills {
  // Step 1: Apply tab filter
  const preFiltered = bills.filter((b: any) => {
    if (filter === 'Split') return b.isSplit;
    if (filter === 'Recurring') return b.isRecurring;
    return true; // 'All' and 'Upcoming'
  });

  // Step 2: Split by pay period
  const thisPaycheckBills = isTwiceMonthly && currentPeriod
    ? preFiltered
        .filter((b: any) => billBelongsToPaycheck(b, currentPeriod))
        .sort((a: any, b: any) => (a.dueDay || 1) - (b.dueDay || 1))
    : preFiltered.sort((a: any, b: any) => (a.dueDay || 1) - (b.dueDay || 1));

  const nextPaycheckBills = isTwiceMonthly && nextPeriod
    ? preFiltered
        .filter((b: any) => billBelongsToPaycheck(b, nextPeriod))
        .sort((a: any, b: any) => (a.dueDay || 1) - (b.dueDay || 1))
    : [];

  const thisTotal = thisPaycheckBills.reduce((s: number, b: any) => s + b.total, 0);
  const nextTotal = nextPaycheckBills.reduce((s: number, b: any) => s + b.total, 0);

  return {
    preFiltered,
    thisPaycheckBills,
    nextPaycheckBills,
    thisTotal,
    nextTotal,
  };
}
