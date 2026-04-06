/**
 * Pay Period Calculation Utilities
 *
 * PORTED FROM MOBILE APP (src/utils/payPeriods.ts) — must stay in sync.
 *
 * Given a "next pay date" anchor and frequency, calculates:
 * - Which paycheck we're currently in (this paycheck)
 * - The date range for this paycheck and the next one
 * - Which bills fall into each paycheck window
 *
 * Supported frequencies:
 *   biweekly     — 14-day windows from anchor date
 *   semimonthly  — fixed 1st-15th / 16th-end split
 *   weekly       — 7-day windows from anchor date
 *   monthly      — full month as one period
 */

export interface PayPeriod {
  start: Date;       // First day of this pay period
  end: Date;         // Last day of this pay period (inclusive)
  label: string;     // e.g. "Apr 3 – Apr 16"
  paycheckNumber: number; // 1-based within the month
}

export interface PayPeriodInfo {
  current: PayPeriod;
  next: PayPeriod;
  isTwiceMonthly: boolean;     // true when there are 2+ pay periods per month
  hasMultiplePeriods: boolean;  // alias — true for weekly, biweekly, semimonthly
  periodsPerMonth: number;     // 1, 2, or 4
  frequency: string;
}

/** Pay period boundaries for a whole planned month (used by Forward Planner). */
export interface MonthPayPeriod {
  label: string;
  startDay: number;
  endDay: number;
  paycheckNumber: number;
}

// ── Normalise frequency string ──────────────────────────────

function normaliseFreq(frequency: string): string {
  return (frequency || '').toLowerCase().replace(/[\s\-_]/g, '');
}

function isTwiceMonthlyFreq(freq: string): boolean {
  return ['biweekly', 'twicemonthly', 'semimonthly', 'twiceamonth', 'bimonthly'].includes(freq);
}

// ── Main entry point ────────────────────────────────────────

/**
 * Calculate current and next pay periods based on anchor date and frequency.
 */
export function getPayPeriods(
  nextPayDateStr: string | undefined,
  frequency: string,
  today: Date = new Date()
): PayPeriodInfo {
  const freqLower = normaliseFreq(frequency);

  // Weekly
  if (freqLower === 'weekly') {
    if (nextPayDateStr) {
      return getWeeklyPeriods(nextPayDateStr, today);
    }
    return getWeeklyFallback(today);
  }

  // Bi-weekly (with anchor)
  if (freqLower === 'biweekly' && nextPayDateStr) {
    return getBiweeklyPeriods(nextPayDateStr, today);
  }

  // Semi-monthly / twice-monthly
  if (isTwiceMonthlyFreq(freqLower)) {
    return getSemiMonthlyPeriods(today);
  }

  // Monthly / irregular / unknown — one period = full month
  return getMonthlyPeriods(today, freqLower);
}

// ── Weekly: 7-day windows from anchor ───────────────────────

function getWeeklyPeriods(anchorStr: string, today: Date): PayPeriodInfo {
  const anchor = new Date(anchorStr.includes('T') ? anchorStr : anchorStr + 'T00:00:00');
  if (isNaN(anchor.getTime())) {
    console.warn('[getWeeklyPeriods] Invalid anchor date:', anchorStr, '— using fallback');
    return getWeeklyFallback(today);
  }
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const diffMs = todayStart.getTime() - anchor.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const periodsBehind = Math.floor(diffDays / 7);

  const currentStart = new Date(anchor);
  currentStart.setDate(currentStart.getDate() + periodsBehind * 7);
  if (currentStart > todayStart) {
    currentStart.setDate(currentStart.getDate() - 7);
  }

  const currentEnd = new Date(currentStart);
  currentEnd.setDate(currentEnd.getDate() + 6);

  const nextStart = new Date(currentEnd);
  nextStart.setDate(nextStart.getDate() + 1);
  const nextEnd = new Date(nextStart);
  nextEnd.setDate(nextEnd.getDate() + 6);

  const currentPaycheckNum = Math.min(4, Math.ceil(currentStart.getDate() / 7));
  const nextPaycheckNum = Math.min(4, Math.ceil(nextStart.getDate() / 7));

  return {
    current: {
      start: currentStart,
      end: currentEnd,
      label: formatRange(currentStart, currentEnd),
      paycheckNumber: currentPaycheckNum,
    },
    next: {
      start: nextStart,
      end: nextEnd,
      label: formatRange(nextStart, nextEnd),
      paycheckNumber: nextPaycheckNum,
    },
    isTwiceMonthly: true,
    hasMultiplePeriods: true,
    periodsPerMonth: 4,
    frequency: 'weekly',
  };
}

function getWeeklyFallback(today: Date): PayPeriodInfo {
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();

  const weekBounds: [number, number][] = [
    [1, 7],
    [8, 14],
    [15, 21],
    [22, new Date(year, month + 1, 0).getDate()],
  ];

  let currentIdx = weekBounds.findIndex(([s, e]) => day >= s && day <= e);
  if (currentIdx === -1) currentIdx = 3;
  const nextIdx = Math.min(currentIdx + 1, 3);

  const currentStart = new Date(year, month, weekBounds[currentIdx][0]);
  const currentEnd = new Date(year, month, weekBounds[currentIdx][1]);

  let nextStart: Date, nextEnd: Date;
  if (currentIdx < 3) {
    nextStart = new Date(year, month, weekBounds[nextIdx][0]);
    nextEnd = new Date(year, month, weekBounds[nextIdx][1]);
  } else {
    const nm = month + 1;
    const ny = nm > 11 ? year + 1 : year;
    const nmi = nm > 11 ? 0 : nm;
    nextStart = new Date(ny, nmi, 1);
    nextEnd = new Date(ny, nmi, 7);
  }

  return {
    current: {
      start: currentStart,
      end: currentEnd,
      label: formatRange(currentStart, currentEnd),
      paycheckNumber: currentIdx + 1,
    },
    next: {
      start: nextStart,
      end: nextEnd,
      label: formatRange(nextStart, nextEnd),
      paycheckNumber: currentIdx < 3 ? nextIdx + 1 : 1,
    },
    isTwiceMonthly: true,
    hasMultiplePeriods: true,
    periodsPerMonth: 4,
    frequency: 'weekly',
  };
}

// ── Bi-weekly: 14-day windows from anchor ───────────────────

function getBiweeklyPeriods(anchorStr: string, today: Date): PayPeriodInfo {
  const anchor = new Date(anchorStr.includes('T') ? anchorStr : anchorStr + 'T00:00:00');
  if (isNaN(anchor.getTime())) {
    console.warn('[getBiweeklyPeriods] Invalid anchor date:', anchorStr, '— using semi-monthly fallback');
    return getSemiMonthlyPeriods(today);
  }
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const diffMs = todayStart.getTime() - anchor.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const periodsBehind = Math.floor(diffDays / 14);

  const currentStart = new Date(anchor);
  currentStart.setDate(currentStart.getDate() + periodsBehind * 14);
  if (currentStart > todayStart) {
    currentStart.setDate(currentStart.getDate() - 14);
  }

  const currentEnd = new Date(currentStart);
  currentEnd.setDate(currentEnd.getDate() + 13);

  const nextStart = new Date(currentEnd);
  nextStart.setDate(nextStart.getDate() + 1);
  const nextEnd = new Date(nextStart);
  nextEnd.setDate(nextEnd.getDate() + 13);

  const currentPaycheckNum = currentStart.getDate() <= 15 ? 1 : 2;
  const nextPaycheckNum = nextStart.getDate() <= 15 ? 1 : 2;

  return {
    current: {
      start: currentStart,
      end: currentEnd,
      label: formatRange(currentStart, currentEnd),
      paycheckNumber: currentPaycheckNum,
    },
    next: {
      start: nextStart,
      end: nextEnd,
      label: formatRange(nextStart, nextEnd),
      paycheckNumber: nextPaycheckNum,
    },
    isTwiceMonthly: true,
    hasMultiplePeriods: true,
    periodsPerMonth: 2,
    frequency: 'biweekly',
  };
}

// ── Semi-monthly: fixed 1st-15th / 16th-end ─────────────────

function getSemiMonthlyPeriods(today: Date): PayPeriodInfo {
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();
  const lastDay = new Date(year, month + 1, 0).getDate();

  if (day <= 15) {
    const currentStart = new Date(year, month, 1);
    const currentEnd = new Date(year, month, 15);
    const nextStart = new Date(year, month, 16);
    const nextEnd = new Date(year, month, lastDay);

    return {
      current: { start: currentStart, end: currentEnd, label: formatRange(currentStart, currentEnd), paycheckNumber: 1 },
      next: { start: nextStart, end: nextEnd, label: formatRange(nextStart, nextEnd), paycheckNumber: 2 },
      isTwiceMonthly: true,
      hasMultiplePeriods: true,
      periodsPerMonth: 2,
      frequency: 'semimonthly',
    };
  } else {
    const currentStart = new Date(year, month, 16);
    const currentEnd = new Date(year, month, lastDay);
    const nextMonth = month + 1;
    const nextYear = nextMonth > 11 ? year + 1 : year;
    const nextMonthIdx = nextMonth > 11 ? 0 : nextMonth;
    const nextStart = new Date(nextYear, nextMonthIdx, 1);
    const nextEnd = new Date(nextYear, nextMonthIdx, 15);

    return {
      current: { start: currentStart, end: currentEnd, label: formatRange(currentStart, currentEnd), paycheckNumber: 2 },
      next: { start: nextStart, end: nextEnd, label: formatRange(nextStart, nextEnd), paycheckNumber: 1 },
      isTwiceMonthly: true,
      hasMultiplePeriods: true,
      periodsPerMonth: 2,
      frequency: 'semimonthly',
    };
  }
}

// ── Monthly: full month as one period ────────────────────────

function getMonthlyPeriods(today: Date, freqLower: string): PayPeriodInfo {
  const year = today.getFullYear();
  const month = today.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const start = new Date(year, month, 1);
  const end = new Date(year, month, lastDay);

  const nextMonthStart = new Date(year, month + 1, 1);
  const nextMonthEnd = new Date(year, month + 2, 0);

  return {
    current: { start, end, label: formatRange(start, end), paycheckNumber: 1 },
    next: { start: nextMonthStart, end: nextMonthEnd, label: formatRange(nextMonthStart, nextMonthEnd), paycheckNumber: 1 },
    isTwiceMonthly: false,
    hasMultiplePeriods: false,
    periodsPerMonth: 1,
    frequency: freqLower || 'monthly',
  };
}

// ── Bill-in-period check ─────────────────────────────────────

/**
 * Check if a bill's due day falls within a pay period.
 * Handles periods that cross month boundaries (e.g. Apr 25 – May 8).
 *
 * NOTE: This takes a raw dueDay number, NOT a bill object.
 * Split bills should be checked separately (they always appear in every period).
 */
export function isBillInPeriod(billDueDay: number, period: PayPeriod): boolean {
  const startDay = period.start.getDate();
  const endDay = period.end.getDate();

  // Same month
  if (period.start.getMonth() === period.end.getMonth()) {
    return billDueDay >= startDay && billDueDay <= endDay;
  }

  // Crosses month boundary
  return billDueDay >= startDay || billDueDay <= endDay;
}

// ── Month pay periods for Forward Planner ────────────────────

/**
 * Get all paycheck period boundaries for a planned month.
 * Used by plan screens to split bills into sections.
 *
 * @param frequency - user's pay frequency
 * @param year - plan year
 * @param month - plan month (1-indexed: January=1)
 */
export function getMonthPayPeriods(frequency: string, year: number, month: number): MonthPayPeriod[] {
  const freqLower = normaliseFreq(frequency);
  const lastDay = new Date(year, month, 0).getDate();

  const suffix = (d: number) =>
    d === 1 || d === 21 || d === 31 ? 'st' :
    d === 2 || d === 22 ? 'nd' :
    d === 3 || d === 23 ? 'rd' : 'th';

  if (freqLower === 'weekly') {
    return [
      { label: `1${suffix(1)}–7${suffix(7)}`, startDay: 1, endDay: 7, paycheckNumber: 1 },
      { label: `8${suffix(8)}–14${suffix(14)}`, startDay: 8, endDay: 14, paycheckNumber: 2 },
      { label: `15${suffix(15)}–21${suffix(21)}`, startDay: 15, endDay: 21, paycheckNumber: 3 },
      { label: `22${suffix(22)}–${lastDay}${suffix(lastDay)}`, startDay: 22, endDay: lastDay, paycheckNumber: 4 },
    ];
  }

  if (isTwiceMonthlyFreq(freqLower)) {
    return [
      { label: `1${suffix(1)}–15${suffix(15)}`, startDay: 1, endDay: 15, paycheckNumber: 1 },
      { label: `16${suffix(16)}–${lastDay}${suffix(lastDay)}`, startDay: 16, endDay: lastDay, paycheckNumber: 2 },
    ];
  }

  // Monthly / irregular — single period
  return [
    { label: `1${suffix(1)}–${lastDay}${suffix(lastDay)}`, startDay: 1, endDay: lastDay, paycheckNumber: 1 },
  ];
}

// ── Paycheck count helper ─────────────────────────────────

/**
 * Get the number of paychecks per month for a given frequency.
 */
export function getPaycheckCount(frequency: string): number {
  const f = normaliseFreq(frequency);
  if (f === 'weekly') return 4;
  if (isTwiceMonthlyFreq(f)) return 2;
  return 1;
}

// ── Helpers ──────────────────────────────────────────────────

/**
 * Get an array of months for the plan view.
 * Free/default: current + next 3 (4 total)
 * Pro: current + next 6 (7 total)
 * Matches the getPlanMonths() used by PlanScreen.
 */
export function getPlanMonths(isPro: boolean = false): { year: number; month: number; label: string }[] {
  const today = new Date();
  const months = [];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const count = isPro ? 7 : 4;
  for (let i = 0; i < count; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    months.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1, // 1-indexed for API
      label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
    });
  }

  return months;
}

// ── Helpers ──────────────────────────────────────────────────

function formatRange(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const startStr = start.toLocaleDateString('en-US', opts);
  const endStr = end.toLocaleDateString('en-US', opts);
  return `${startStr} – ${endStr}`;
}
