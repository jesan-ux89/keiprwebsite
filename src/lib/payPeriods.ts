/**
 * Pay period calculation utilities
 * Supports: weekly, biweekly, twicemonthly, monthly
 */

export interface PayPeriod {
  start: Date;
  end: Date;
  label: string;
  paycheckNum: number;
}

export interface BillLike {
  dueDay: number;
  isSplit: boolean;
}

/**
 * Get pay periods from anchor date with specified frequency
 * Generates periods for current month +/- 2 months
 */
export function getPayPeriods(
  anchorDateStr: string,
  frequency: 'weekly' | 'biweekly' | 'twicemonthly' | 'monthly'
): PayPeriod[] {
  const anchorDate = new Date(anchorDateStr);
  const today = new Date();
  const periods: PayPeriod[] = [];

  // Generate periods covering approximately 6 months (current -2, +3 from anchor)
  const startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1);
  const endDate = new Date(today.getFullYear(), today.getMonth() + 4, 0);

  if (frequency === 'weekly') {
    let current = new Date(anchorDate);
    // Back up to start range
    while (current > startDate) {
      current.setDate(current.getDate() - 7);
    }
    let paycheckNum = 0;
    while (current <= endDate) {
      const periodEnd = new Date(current);
      periodEnd.setDate(periodEnd.getDate() + 6);
      periods.push({
        start: new Date(current),
        end: periodEnd,
        label: formatPeriodLabel(new Date(current), periodEnd),
        paycheckNum: paycheckNum++,
      });
      current.setDate(current.getDate() + 7);
    }
  } else if (frequency === 'biweekly') {
    let current = new Date(anchorDate);
    // Back up to start range
    while (current > startDate) {
      current.setDate(current.getDate() - 14);
    }
    let paycheckNum = 0;
    while (current <= endDate) {
      const periodEnd = new Date(current);
      periodEnd.setDate(periodEnd.getDate() + 13);
      periods.push({
        start: new Date(current),
        end: periodEnd,
        label: formatPeriodLabel(new Date(current), periodEnd),
        paycheckNum: paycheckNum++,
      });
      current.setDate(current.getDate() + 14);
    }
  } else if (frequency === 'twicemonthly') {
    // 1st-15th and 16th-end of month
    let currentMonth = startDate.getMonth();
    let currentYear = startDate.getFullYear();
    let paycheckNum = 0;

    while (currentYear < endDate.getFullYear() || (currentYear === endDate.getFullYear() && currentMonth <= endDate.getMonth())) {
      // First period: 1st-15th
      const first = new Date(currentYear, currentMonth, 1);
      const fifteenth = new Date(currentYear, currentMonth, 15);
      if (first >= startDate && first <= endDate) {
        periods.push({
          start: new Date(first),
          end: new Date(fifteenth),
          label: formatPeriodLabel(new Date(first), new Date(fifteenth)),
          paycheckNum: paycheckNum++,
        });
      }

      // Second period: 16th-end of month
      const sixteenth = new Date(currentYear, currentMonth, 16);
      const lastDay = new Date(currentYear, currentMonth + 1, 0);
      if (sixteenth >= startDate && sixteenth <= endDate) {
        periods.push({
          start: new Date(sixteenth),
          end: new Date(lastDay),
          label: formatPeriodLabel(new Date(sixteenth), new Date(lastDay)),
          paycheckNum: paycheckNum++,
        });
      }

      // Move to next month
      currentMonth++;
      if (currentMonth === 12) {
        currentMonth = 0;
        currentYear++;
      }
    }
  } else if (frequency === 'monthly') {
    // 1st-end of month
    let currentMonth = startDate.getMonth();
    let currentYear = startDate.getFullYear();
    let paycheckNum = 0;

    while (currentYear < endDate.getFullYear() || (currentYear === endDate.getFullYear() && currentMonth <= endDate.getMonth())) {
      const first = new Date(currentYear, currentMonth, 1);
      const lastDay = new Date(currentYear, currentMonth + 1, 0);

      if (first >= startDate && first <= endDate) {
        periods.push({
          start: new Date(first),
          end: new Date(lastDay),
          label: formatPeriodLabel(new Date(first), new Date(lastDay)),
          paycheckNum: paycheckNum++,
        });
      }

      // Move to next month
      currentMonth++;
      if (currentMonth === 12) {
        currentMonth = 0;
        currentYear++;
      }
    }
  }

  return periods;
}

/**
 * Check if a bill's due day falls within a pay period
 * Handles split bills (always included) and normal bills
 */
export function isBillInPeriod(bill: BillLike, period: PayPeriod): boolean {
  if (bill.isSplit) {
    return true; // Split bills appear in every period
  }

  const dueDay = bill.dueDay;
  const year = period.start.getFullYear();
  const month = period.start.getMonth();

  // Create date for bill due day in this period's month
  const billDueDate = new Date(year, month, dueDay);

  // Check if bill due date falls within the period
  return billDueDate >= period.start && billDueDate <= period.end;
}

/**
 * Find the current pay period from a list of periods
 */
export function getCurrentPeriod(periods: PayPeriod[]): PayPeriod | undefined {
  const today = new Date();
  return periods.find((p) => today >= p.start && today <= p.end);
}

/**
 * Format a period as "Jan 1 - 14" or "Jan 1 - Feb 3"
 */
function formatPeriodLabel(start: Date, end: Date): string {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const startMonth = monthNames[start.getMonth()];
  const startDay = start.getDate();

  const endMonth = monthNames[end.getMonth()];
  const endDay = end.getDate();

  if (start.getMonth() === end.getMonth()) {
    return `${startMonth} ${startDay} - ${endDay}`;
  } else {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  }
}

/**
 * Get an array of months for the plan view (current + next 3)
 */
export function getPlanMonths(): { year: number; month: number; label: string }[] {
  const today = new Date();
  const months = [];

  for (let i = 0; i < 4; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    months.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1, // 1-indexed for API
      label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
    });
  }

  return months;
}
