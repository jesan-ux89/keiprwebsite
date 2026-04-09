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
