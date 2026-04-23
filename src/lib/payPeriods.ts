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
    return getSemiMonthlyPeriods(today, nextPayDateStr);
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

  // Determine paycheck number within the month by counting how many periods
  // start in the same month before this one. Replaces the old <= 15 heuristic.
  const currentPaycheckNum = biweeklyPaycheckNum(currentStart);
  const nextPaycheckNum = biweeklyPaycheckNum(nextStart);

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

/**
 * Calculate which paycheck number a biweekly period is within its month.
 * Walks backward 14 days at a time from periodStart to count how many
 * earlier periods also start in the same month.
 */
function biweeklyPaycheckNum(periodStart: Date): number {
  const targetMonth = periodStart.getMonth();
  const targetYear = periodStart.getFullYear();

  let count = 1;
  const check = new Date(periodStart);
  check.setDate(check.getDate() - 14);

  while (check.getMonth() === targetMonth && check.getFullYear() === targetYear) {
    count++;
    check.setDate(check.getDate() - 14);
  }

  return Math.min(count, 3); // Cap at 3 (rare but possible for some months)
}

// ── Semi-monthly: anchor-aware pay day split ────────────────

/**
 * Semi-monthly periods using the anchor date to determine custom pay days.
 * If anchor is provided:
 *   - anchorDay <= 15 → payDay1 = anchorDay, payDay2 = anchorDay + 15
 *   - anchorDay > 15  → payDay2 = anchorDay, payDay1 = anchorDay - 15
 * Falls back to 1st/16th if no anchor.
 */
function getSemiMonthlyPeriods(today: Date, anchorStr?: string): PayPeriodInfo {
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();

  // ── Derive two semimonthly pay days from anchor ──
  // Mirrors payPeriodCalc.js deriveSemimonthlyPayDays()
  let payDay1 = 1;
  let payDay2 = 15;
  let useEOM = false;

  if (anchorStr) {
    const anchor = new Date(anchorStr.includes('T') ? anchorStr : anchorStr + 'T00:00:00');
    if (!isNaN(anchor.getTime())) {
      const anchorDay = anchor.getDate();
      if (anchorDay === 15) {
        payDay1 = 15; useEOM = true;
      } else if (anchorDay === 1) {
        payDay1 = 1; payDay2 = 15;
      } else if (anchorDay <= 15) {
        payDay1 = anchorDay; payDay2 = anchorDay + 15;
      } else {
        payDay1 = anchorDay - 15; payDay2 = anchorDay;
      }
    }
  }

  // ── Helper: clamp day to actual last day of month ──
  const clamp = (d: number, y: number, m: number) =>
    Math.min(d, new Date(y, m + 1, 0).getDate());

  // ── Compute current and next period ──
  // Mirrors payPeriodCalc.js getSemimonthlyPeriod()
  let currentStart: Date, currentEnd: Date, nextStart: Date, nextEnd: Date;
  let currentPaycheckNum: number, nextPaycheckNum: number;

  if (useEOM) {
    // Pattern: payDay1 (e.g. 15) and last-day-of-month
    const eom = new Date(year, month + 1, 0).getDate();
    if (day >= payDay1) {
      currentStart = new Date(year, month, payDay1);
      currentEnd = new Date(year, month, eom);
      currentPaycheckNum = 2;
      const nxtMo = month + 1;
      const nxtYr = nxtMo > 11 ? year + 1 : year;
      const nxtMoIdx = nxtMo > 11 ? 0 : nxtMo;
      nextStart = new Date(nxtYr, nxtMoIdx, 1);
      nextEnd = new Date(nxtYr, nxtMoIdx, payDay1 - 1);
      nextPaycheckNum = 1;
    } else {
      currentStart = new Date(year, month, 1);
      currentEnd = new Date(year, month, payDay1 - 1);
      currentPaycheckNum = 1;
      const thisEom = new Date(year, month + 1, 0).getDate();
      nextStart = new Date(year, month, payDay1);
      nextEnd = new Date(year, month, thisEom);
      nextPaycheckNum = 2;
    }
  } else {
    // Pattern: payDay1 (e.g. 5) and payDay2 (e.g. 20)
    const clampedPD1 = clamp(payDay1, year, month);
    const clampedPD2 = clamp(payDay2, year, month);

    if (day >= clampedPD2) {
      const nxtMo = month + 1;
      const nxtYr = nxtMo > 11 ? year + 1 : year;
      const nxtMoIdx = nxtMo > 11 ? 0 : nxtMo;
      const endDay = clamp(payDay1 - 1, nxtYr, nxtMoIdx);
      currentStart = new Date(year, month, clampedPD2);
      currentEnd = new Date(nxtYr, nxtMoIdx, endDay);
      currentPaycheckNum = 2;
      const nxtPD1 = clamp(payDay1, nxtYr, nxtMoIdx);
      const nxtPD2 = clamp(payDay2, nxtYr, nxtMoIdx);
      nextStart = new Date(nxtYr, nxtMoIdx, nxtPD1);
      nextEnd = new Date(nxtYr, nxtMoIdx, nxtPD2 - 1);
      nextPaycheckNum = 1;
    } else if (day >= clampedPD1) {
      currentStart = new Date(year, month, clampedPD1);
      currentEnd = new Date(year, month, clampedPD2 - 1);
      currentPaycheckNum = 1;
      const nxtMo = month + 1;
      const nxtYr = nxtMo > 11 ? year + 1 : year;
      const nxtMoIdx = nxtMo > 11 ? 0 : nxtMo;
      const endDay = clamp(payDay1 - 1, nxtYr, nxtMoIdx);
      nextStart = new Date(year, month, clampedPD2);
      nextEnd = new Date(nxtYr, nxtMoIdx, endDay);
      nextPaycheckNum = 2;
    } else {
      const prevMo = month - 1;
      const prevYr = prevMo < 0 ? year - 1 : year;
      const prevMoIdx = prevMo < 0 ? 11 : prevMo;
      const startDay = clamp(payDay2, prevYr, prevMoIdx);
      currentStart = new Date(prevYr, prevMoIdx, startDay);
      currentEnd = new Date(year, month, clampedPD1 - 1);
      currentPaycheckNum = 2;
      nextStart = new Date(year, month, clampedPD1);
      nextEnd = new Date(year, month, clampedPD2 - 1);
      nextPaycheckNum = 1;
    }
  }

  return {
    current: { start: currentStart, end: currentEnd, label: formatRange(currentStart, currentEnd), paycheckNumber: currentPaycheckNum },
    next: { start: nextStart, end: nextEnd, label: formatRange(nextStart, nextEnd), paycheckNumber: nextPaycheckNum },
    isTwiceMonthly: true,
    hasMultiplePeriods: true,
    periodsPerMonth: 2,
    frequency: 'semimonthly',
  };
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

// ── Paycheck assignment (pinning) ─────────────────────────────

/**
 * Determine if a bill belongs to a given pay period.
 * Priority: pinned paycheck → raw due day via isBillInPeriod.
 * Split bills always appear in every period.
 *
 * If a bill bounces between paychecks due to due-date shifts,
 * the user can pin it via the Paycheck Assignment picker in
 * Add/Edit Bill screens.
 */
export function billBelongsToPaycheck(
  bill: { dueDay: number; pinnedPaycheck?: number | null; isSplit?: boolean },
  period: PayPeriod
): boolean {
  if (bill.isSplit) return true;

  if (bill.pinnedPaycheck != null && bill.pinnedPaycheck > 0) {
    return bill.pinnedPaycheck === period.paycheckNumber;
  }

  return isBillInPeriod(bill.dueDay, period);
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
 * Starts from NEXT month (current month is managed via Dashboard/Bills/Tracker).
 * Free/default: 2 months ahead
 * Pro: 6 months ahead
 * Matches the getPlanMonths() used by PlanScreen.
 */
export function getPlanMonths(isPro: boolean = false): { year: number; month: number; label: string }[] {
  const today = new Date();
  const months = [];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const count = isPro ? 6 : 2;
  for (let i = 1; i <= count; i++) {
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
