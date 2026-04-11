/**
 * Category Icons — Lucide outline SVG data for tinted rounded squares.
 * Mirrored from mobile: _KeiprApp/src/utils/categoryIcons.ts
 *
 * Usage:
 *   import { getCategoryIcon, CATEGORY_COLORS } from '@/lib/categoryIcons';
 *   const icon = getCategoryIcon('Housing', isDark);
 *   // icon.stroke, icon.bg, icon.paths, icon.circles
 */

export interface CategoryIconDef {
  lightStroke: string;
  darkStroke: string;
  lightBg: string;
  darkBg: string;
  paths: string[];
  circles?: { cx: number; cy: number; r: number }[];
}

export interface ResolvedIcon {
  stroke: string;
  bg: string;
  paths: string[];
  circles?: { cx: number; cy: number; r: number }[];
}

const ICONS: Record<string, CategoryIconDef> = {
  Housing: {
    lightStroke: '#0C4A6E', darkStroke: '#60B5F0',
    lightBg: 'rgba(12,74,110,0.15)', darkBg: 'rgba(56,160,220,0.25)',
    paths: [
      'M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8',
      'M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    ],
  },
  Transport: {
    lightStroke: '#0369A1', darkStroke: '#67D4FF',
    lightBg: 'rgba(3,105,161,0.14)', darkBg: 'rgba(56,189,248,0.22)',
    paths: [
      'M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2',
      'M9 17h6',
    ],
    circles: [{ cx: 7, cy: 17, r: 2 }, { cx: 17, cy: 17, r: 2 }],
  },
  Groceries: {
    lightStroke: '#B45309', darkStroke: '#FBBD4E',
    lightBg: 'rgba(180,83,9,0.14)', darkBg: 'rgba(245,170,50,0.22)',
    paths: [
      'M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12',
    ],
    circles: [{ cx: 8, cy: 21, r: 1 }, { cx: 19, cy: 21, r: 1 }],
  },
  Dining: {
    lightStroke: '#B91C1C', darkStroke: '#FB7D7D',
    lightBg: 'rgba(185,28,28,0.13)', darkBg: 'rgba(240,100,100,0.22)',
    paths: [
      'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2',
      'M7 2v20',
      'M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7',
    ],
  },
  Subscriptions: {
    lightStroke: '#6D28D9', darkStroke: '#B8A1FA',
    lightBg: 'rgba(109,40,217,0.13)', darkBg: 'rgba(140,80,240,0.22)',
    paths: [
      'M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8',
      'M21 3v5h-5',
    ],
  },
  Fun: {
    lightStroke: '#A16207', darkStroke: '#FCD34D',
    lightBg: 'rgba(161,98,7,0.13)', darkBg: 'rgba(252,211,77,0.20)',
    paths: [
      'M12 8a2 2 0 0 0 2-2 2 2 0 0 0-2-2 2 2 0 0 0-2 2 2 2 0 0 0 2 2Z',
      'M12 2v2',
      'M12 8v14',
      'M8 22h8',
      'M17 14c0-1.5-.5-2.5-2-3l-3-1.5',
      'M7 14c0-1.5.5-2.5 2-3l3-1.5',
    ],
  },
  Insurance: {
    lightStroke: '#15803D', darkStroke: '#6EE7A8',
    lightBg: 'rgba(21,128,61,0.14)', darkBg: 'rgba(80,220,140,0.22)',
    paths: [
      'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z',
    ],
  },
  Savings: {
    lightStroke: '#0F766E', darkStroke: '#5EEAD4',
    lightBg: 'rgba(15,118,110,0.14)', darkBg: 'rgba(60,210,180,0.22)',
    paths: [
      'M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2',
      'M2 9.1C1.8 8 2 7 2 7',
      'M16 11h.01',
    ],
  },
  Utilities: {
    lightStroke: '#BE185D', darkStroke: '#F9A8D4',
    lightBg: 'rgba(190,24,93,0.13)', darkBg: 'rgba(240,100,180,0.22)',
    paths: [
      'M13 2 3 14h9l-1 8 10-12h-9l1-8z',
    ],
  },
  Shopping: {
    lightStroke: '#D97706', darkStroke: '#FCD34D',
    lightBg: 'rgba(217,119,6,0.14)', darkBg: 'rgba(252,211,77,0.22)',
    paths: [
      'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z',
      'M3 6h18',
      'M16 10a4 4 0 0 1-8 0',
    ],
  },
  Loans: {
    lightStroke: '#92400E', darkStroke: '#FCD34D',
    lightBg: 'rgba(146,64,14,0.14)', darkBg: 'rgba(252,211,77,0.22)',
    paths: [
      'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
    ],
  },
  'Personal Care': {
    lightStroke: '#7C3AED', darkStroke: '#C4B5FD',
    lightBg: 'rgba(124,58,237,0.13)', darkBg: 'rgba(196,181,253,0.22)',
    paths: [
      'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
    ],
  },
  Healthcare: {
    lightStroke: '#DC2626', darkStroke: '#FCA5A5',
    lightBg: 'rgba(220,38,38,0.12)', darkBg: 'rgba(252,165,165,0.20)',
    paths: [
      'M8 19V5', 'M16 19V5', 'M3 12h18',
    ],
  },
  Education: {
    lightStroke: '#1D4ED8', darkStroke: '#93C5FD',
    lightBg: 'rgba(29,78,216,0.13)', darkBg: 'rgba(147,197,253,0.22)',
    paths: [
      'M22 10v6M2 10l10-5 10 5-10 5z',
      'M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5',
    ],
  },
  Taxes: {
    lightStroke: '#6D28D9', darkStroke: '#C4B5FD',
    lightBg: 'rgba(109,40,217,0.12)', darkBg: 'rgba(196,181,253,0.20)',
    paths: [
      'M3 21h18M3 10h18M5 6l7-3 7 3',
      'M4 10v11M20 10v11M8 10v11M12 10v11M16 10v11',
    ],
  },
  'Home Improvement': {
    lightStroke: '#CA8A04', darkStroke: '#FDE047',
    lightBg: 'rgba(202,138,4,0.13)', darkBg: 'rgba(253,224,71,0.22)',
    paths: [
      'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
    ],
  },
  'Cash & ATM': {
    lightStroke: '#059669', darkStroke: '#6EE7B7',
    lightBg: 'rgba(5,150,105,0.12)', darkBg: 'rgba(110,231,183,0.20)',
    paths: [
      'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
    ],
  },
  Fitness: {
    lightStroke: '#E11D48', darkStroke: '#FDA4AF',
    lightBg: 'rgba(225,29,72,0.12)', darkBg: 'rgba(253,164,175,0.20)',
    paths: [
      'M6.5 6.5h11M6.5 17.5h11',
      'M2 12h4M18 12h4',
      'M6.5 6.5v11M17.5 6.5v11',
    ],
  },
  Phone: {
    lightStroke: '#0891B2', darkStroke: '#67E8F9',
    lightBg: 'rgba(8,145,178,0.12)', darkBg: 'rgba(103,232,249,0.20)',
    paths: [
      'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z',
    ],
  },
  Internet: {
    lightStroke: '#4F46E5', darkStroke: '#A5B4FC',
    lightBg: 'rgba(79,70,229,0.12)', darkBg: 'rgba(165,180,252,0.20)',
    paths: [
      'M5 12.55a11 11 0 0 1 14.08 0',
      'M1.42 9a16 16 0 0 1 21.16 0',
      'M8.53 16.11a6 6 0 0 1 6.95 0',
    ],
    circles: [{ cx: 12, cy: 20, r: 1 }],
  },
  Childcare: {
    lightStroke: '#DB2777', darkStroke: '#F9A8D4',
    lightBg: 'rgba(219,39,119,0.12)', darkBg: 'rgba(249,168,212,0.20)',
    paths: [
      'M9 12h.01M15 12h.01',
      'M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5',
    ],
    circles: [{ cx: 12, cy: 12, r: 10 }],
  },
  'Pet Care': {
    lightStroke: '#A16207', darkStroke: '#FCD34D',
    lightBg: 'rgba(161,98,7,0.12)', darkBg: 'rgba(252,211,77,0.20)',
    paths: [
      'M4.93 4.93c4.08-1.46 5.07.43 7.07 2.43 2-2 2.99-3.89 7.07-2.43 1.46 4.08-.43 5.07-2.43 7.07 2 2 3.89 2.99 2.43 7.07-4.08 1.46-5.07-.43-7.07-2.43-2 2-2.99 3.89-7.07 2.43-1.46-4.08.43-5.07 2.43-7.07-2-2-3.89-2.99-2.43-7.07z',
    ],
  },
  Entertainment: {
    lightStroke: '#C026D3', darkStroke: '#E879F9',
    lightBg: 'rgba(192,38,211,0.12)', darkBg: 'rgba(232,121,249,0.20)',
    paths: [
      'M4 20h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z',
      'M7 4v16M17 4v16M3 8h4M17 8h4M3 12h18M3 16h4M17 16h4',
    ],
  },
  Travel: {
    lightStroke: '#0284C7', darkStroke: '#7DD3FC',
    lightBg: 'rgba(2,132,199,0.12)', darkBg: 'rgba(125,211,252,0.20)',
    paths: [
      'M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z',
    ],
  },
  Donations: {
    lightStroke: '#059669', darkStroke: '#6EE7B7',
    lightBg: 'rgba(5,150,105,0.12)', darkBg: 'rgba(110,231,183,0.20)',
    paths: [
      'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
    ],
  },
  'Credit Card Payment': {
    lightStroke: '#475569', darkStroke: '#94A3B8',
    lightBg: 'rgba(71,85,105,0.12)', darkBg: 'rgba(148,163,184,0.20)',
    paths: [
      'M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z',
      'M1 10h22',
    ],
  },
  Transfer: {
    lightStroke: '#6366F1', darkStroke: '#A5B4FC',
    lightBg: 'rgba(99,102,241,0.12)', darkBg: 'rgba(165,180,252,0.20)',
    paths: [
      'M7 17l-5-5 5-5',
      'M17 7l5 5-5 5',
      'M2 12h20',
    ],
  },
  Paychecks: {
    lightStroke: '#16A34A', darkStroke: '#86EFAC',
    lightBg: 'rgba(22,163,74,0.13)', darkBg: 'rgba(134,239,172,0.22)',
    paths: [
      'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
    ],
  },
  Income: {
    lightStroke: '#15803D', darkStroke: '#4ADE80',
    lightBg: 'rgba(21,128,61,0.12)', darkBg: 'rgba(74,222,128,0.20)',
    paths: [
      'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
    ],
  },
  'Bank Fees': {
    lightStroke: '#DC2626', darkStroke: '#FCA5A5',
    lightBg: 'rgba(220,38,38,0.10)', darkBg: 'rgba(252,165,165,0.18)',
    paths: [
      'M3 21h18M3 10h18M5 6l7-3 7 3',
      'M4 10v11M20 10v11M8 10v11M12 10v11M16 10v11',
    ],
  },
  Financial: {
    lightStroke: '#0369A1', darkStroke: '#7DD3FC',
    lightBg: 'rgba(3,105,161,0.12)', darkBg: 'rgba(125,211,252,0.20)',
    paths: [
      'M22 12h-4l-3 9L9 3l-3 9H2',
    ],
  },
  Other: {
    lightStroke: '#525252', darkStroke: '#A8A8A8',
    lightBg: 'rgba(82,82,82,0.12)', darkBg: 'rgba(160,160,160,0.20)',
    paths: [
      'M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z',
    ],
  },
};

/** Flat color per category (matches light-mode stroke for legacy compat) */
export const CATEGORY_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(ICONS).map(([k, v]) => [k, v.lightStroke])
);

/** Get the resolved icon for a category + dark/light theme */
export function getCategoryIcon(category: string, isDark: boolean): ResolvedIcon {
  const def = ICONS[category] || ICONS.Other;
  return {
    stroke: isDark ? def.darkStroke : def.lightStroke,
    bg: isDark ? def.darkBg : def.lightBg,
    paths: def.paths,
    circles: def.circles,
  };
}
