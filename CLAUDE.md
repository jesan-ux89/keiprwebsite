# CLAUDE.md — Keipr Website

@AGENTS.md

## Project Overview
Next.js web app for Keipr, a paycheck-forward budgeting app. The website is a **mirror of the React Native mobile app** — same backend, same user accounts, same data. Users can sign in on either platform and see identical information.

**The mobile app is the source of truth for all data logic.** When the mobile app's data handling changes, the website must be updated to match.

## Tech Stack
- **Framework:** Next.js 16.2.2 (App Router, Turbopack)
- **Auth:** Firebase Auth (web SDK) — Email/Password + Google sign-in
- **State:** React Context (`AppContext`, `AuthContext`, `ThemeContext`)
- **HTTP:** Axios with Firebase token interceptor (`src/lib/api.ts`)
- **Hosting:** Vercel (auto-deploys from `main` branch)
- **Landing:** Public landing page at `/`
- **Web App:** Behind Firebase auth at `/app/*`

## Repository
- **GitHub:** `https://github.com/jesan-ux89/keiprwebsite.git` (main branch)
- **Live URL:** `https://keiprwebsite.vercel.app`
- **Backend:** `https://keipr-backend-production.up.railway.app/api` (shared with mobile app)

## Project Structure
```
src/
├── app/
│   ├── page.tsx                    ← Public landing page
│   ├── layout.tsx                  ← Root layout
│   ├── providers.tsx               ← AppProvider + AuthProvider + ThemeProvider wrapper
│   ├── auth/
│   │   ├── login/page.tsx          ← Sign in
│   │   ├── signup/page.tsx         ← Create account
│   │   └── forgot-password/page.tsx
│   └── app/
│       ├── layout.tsx              ← Authenticated app shell (sidebar nav)
│       ├── page.tsx                ← Dashboard (3 tabs: Paycheck, Cycles, Monthly)
│       ├── bills/page.tsx          ← Bills list + AddBillModal.tsx
│       ├── tracker/page.tsx        ← Per-paycheck bill payment tracker
│       ├── plan/page.tsx           ← Forward month planning
│       ├── settings/page.tsx       ← Settings hub (income, currency, theme, subscription)
│       └── banking/                ← Connected banking (Ultra tier)
│           ├── page.tsx            ← Banking hub
│           ├── suggestions/page.tsx
│           ├── confirmations/page.tsx
│           ├── history/page.tsx
│           └── exclusions/page.tsx
├── components/
│   ├── layout/AppLayout.tsx        ← Sidebar + top bar shell
│   ├── ui/                         ← Button, Card, Input, Modal
│   └── MFAModal.tsx
├── context/
│   ├── AppContext.tsx               ← ** MIRRORED FROM MOBILE ** — bills, income, payments, categories
│   ├── AuthContext.tsx              ← Firebase auth state
│   └── ThemeContext.tsx             ← Dark/light/system theme
└── lib/
    ├── api.ts                      ← Axios client + all API endpoint definitions
    ├── firebase.ts                 ← Firebase config from env vars
    └── payPeriods.ts               ← ** MIRRORED FROM MOBILE ** — pay period calculation engine
```

## Data Parity with Mobile App (CRITICAL)

The #1 rule for this project: **the website must display identical data to the mobile app for the same user account.** Both apps share the same backend and database.

### Mirrored Files
These website files are direct ports of mobile app files. When the mobile version changes, the website version MUST be updated to match:

| Website File | Mobile Source File | What It Does |
|---|---|---|
| `src/context/AppContext.tsx` | `src/context/AppContext.tsx` | `mapApiBill()`, `mapIncomeSource()`, payment logic, `isSplitPaid`, `toggleSplitPaid`, `fmt()` |
| `src/lib/payPeriods.ts` | `src/utils/payPeriods.ts` | `getPayPeriods()`, `isBillInPeriod()`, `getMonthPayPeriods()`, `getPaycheckCount()` |
| `src/app/app/page.tsx` | `src/screens/dashboard/DashboardScreen.tsx` | `billAmountForPaycheck()`, bill filtering, paycheck calculations |
| `src/app/app/tracker/page.tsx` | `src/screens/tracker/TrackerScreen.tsx` | Per-paycheck payment tracking UI and logic |

### Key Data Mapping Rules (from `mapApiBill`)
- Backend field `total_amount` → app field `total`
- Backend field `due_day_of_month` → app field `dueDay`
- Backend field `is_recurring` → app field `isRecurring` (defaults to `true` if not set)
- Backend field `is_auto_pay` → app field `isAutoPay`
- Bill splits sorted by `sort_order` (NOT `paycheck_num`)
- Split amounts: `p1`-`p4` from `sorted[0..3].amount`
- Split done status: `p1done`-`p4done` from `sorted[0..3].is_saved_to_savings`
- Non-split bills: `p1 = total`, `p2-p4 = 0`, all done flags `false`
- `funded` = sum of amounts where `is_saved_to_savings` is true
- Category comes from `budget_categories.name` join, defaults to `'Other'`

### Key Data Mapping Rules (from `mapIncomeSource`)
- Backend field `typical_amount` → app field `typicalAmount`
- Backend field `next_pay_date` → app field `nextPayDate`
- Auto-advances `nextPayDate` if it's in the past (weekly +7d, biweekly +14d, etc.)

### Pay Period Logic
- `getPayPeriods(nextPayDate, frequency)` returns `{ current, next, isTwiceMonthly, periodsPerMonth }`
- Paycheck numbers are **1-based** within the month
- `isBillInPeriod(dueDay, period)` uses day-number comparison (handles month boundaries)
- Split bills **always appear in every period** — filter with: `b.isSplit || isBillInPeriod(b.dueDay, period)`

### Payment Tracking
- `isBillPaid(billId)` — checks if a payment record exists for current month
- `isSplitPaid(billId, paycheckNum)` — checks `p1done`-`p4done` from the bill object
- `toggleSplitPaid(billId, paycheckNum)` — toggles `is_saved_to_savings` via API
- Payment records use `periodMonth` / `periodYear` (1-indexed month)

### Dashboard Calculations
- Per-paycheck income = `primaryIncome.typicalAmount` (NOT monthly total)
- Monthly income = `typicalAmount * periodsPerMonth`
- Bill amount per paycheck: split bills show `p1`/`p2`/`p3`/`p4`, non-split show `bill.total`
- Remaining = paycheck income - bills due this period
- Spent % = bills due / paycheck income

## Key Patterns & Conventions

### Styling
- All components use `useTheme()` for colors — never hardcode color values
- Brand colors: Midnight `#0C4A6E`, Electric `#38BDF8`, Parchment `#D6D1C7`
- Dark background: `#1A1814`, Light background: `#F5F3EF`
- Landing page nav: Indigo Midnight `#0F3460` top bar, black `#1A1814` main nav

### State Management
- Bills, income sources, payments, categories, currency all live in `AppContext`
- Screens read/write through `useApp()` hook
- `fmt()` formats all money amounts (respects selected currency, no forced decimals)

### API Calls
- All API calls go through `src/lib/api.ts`
- Axios interceptor auto-attaches Firebase Bearer token
- Backend returns arrays wrapped in named objects: `res.data.bills`, `res.data.incomeSources`, etc.
- Always use `res.data?.propertyName || []` pattern — never assume `res.data` IS the array
- Income sources: check both `res.data?.incomeSources` and `res.data?.income_sources`

### Navigation
- Next.js App Router — file-based routing under `src/app/`
- `/app/*` routes are behind auth (checked in `AppLayout`)
- Sidebar nav in `AppLayout.tsx` links to Dashboard, Bills, Tracker, Plan, Settings, Banking

## 3-Tier Pricing
- **Free:** 1 income source, 1 split, 1 month planning
- **Pro:** $7.99/mo — unlimited splits/income/planning, export, trends
- **Ultra:** $11.99/mo — everything in Pro + connected banking via Plaid

## Environment Variables (Vercel)
- `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_API_URL` — Backend API base URL

## Commands
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
```

## Important Rules
- **Mobile app is the source of truth** — when mobile data logic changes, update the website to match
- Do NOT change `mapApiBill()`, `mapIncomeSource()`, `payPeriods.ts`, or dashboard calculations without checking the mobile app version first
- Do NOT mess up anything that is already confirmed working
- Split bills must appear in every paycheck section
- Always test with the same account on both mobile and web to verify data parity
- Backend CORS: `ALLOWED_ORIGINS` on Railway must include the Vercel domain
- Do NOT put sensitive keys in `NEXT_PUBLIC_*` env vars (only Firebase public config)
