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
- **Custom Domain:** `keipr.app` (Vercel + Cloudflare DNS)
- **Backend:** `https://keipr-backend-production.up.railway.app/api` (shared with mobile app)
- **Local Path:** `C:\Users\Jess\_keiprwebsite`

## Local Paths (All Projects)
- **Mobile App:** `C:\Users\Jess\_KeiprApp`
- **Backend:** `C:\Users\Jess\_keipr-complete-backend`
- **Website:** `C:\Users\Jess\_keiprwebsite`

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
│           ├── page.tsx            ← Banking hub (accounts, sync, disconnect, exclusion rules)
│           └── exclusions/page.tsx ← Manage ignored merchants
│           (suggestions/ and confirmations/ deprecated — replaced by detection engine)
├── components/
│   ├── layout/AppLayout.tsx        ← Sidebar + top bar shell
│   ├── ui/                         ← Button, Card, Input, Modal
│   ├── MFAModal.tsx
│   ├── CategoryIcon.tsx            ← Lucide SVG icon in tinted rounded square
│   ├── MerchantLogo.tsx            ← ** MIRRORED FROM MOBILE ** — real company logo with CategoryIcon fallback
│   ├── ErrorBoundary.tsx           ← Catches page crashes, shows reload button
│   ├── LoadingSkeleton.tsx         ← Shimmer skeleton components per page type
│   └── EmptyState.tsx              ← Illustrated empty states with action buttons
├── context/
│   ├── AppContext.tsx               ← ** MIRRORED FROM MOBILE ** — bills, income, payments, categories, detected transactions
│   ├── AuthContext.tsx              ← Firebase auth state
│   └── ThemeContext.tsx             ← Dark/light/system theme
└── lib/
    ├── api.ts                      ← Axios client + all API endpoint definitions
    ├── firebase.ts                 ← Firebase config from env vars
    ├── payPeriods.ts               ← ** MIRRORED FROM MOBILE ** — pay period calculation engine
    ├── categoryIcons.ts            ← ** MIRRORED FROM MOBILE ** — category icon definitions
    └── merchantLogos.ts            ← ** MIRRORED FROM MOBILE ** — merchant domain map + getMerchantLogoUrl()
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
| `src/lib/categoryIcons.ts` | `src/utils/categoryIcons.ts` | Category icon definitions, colors, SVG paths |
| `src/components/CategoryIcon.tsx` | `src/components/CategoryIcon.tsx` | Reusable category icon component |
| `src/lib/merchantLogos.ts` | `src/utils/merchantLogos.ts` | Merchant domain map, `getMerchantLogoUrl()`, `guessDomain()` |
| `src/components/MerchantLogo.tsx` | `src/components/MerchantLogo.tsx` | Logo display with CategoryIcon fallback |

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
- **Free:** 1 income source, 1 split, 1 month planning, no one-time funds
- **Pro:** $7.99/mo ($6.99/mo annual) — unlimited splits/income/planning, one-time fund tracking, export, trends
- **Ultra:** $11.99/mo ($10.99/mo annual) — everything in Pro + connected banking via Plaid

## Payments (Lemon Squeezy)
- **Payment provider:** Lemon Squeezy (merchant of record, handles tax/billing/refunds)
- **Custom domain:** `keipr.app` (Vercel + Cloudflare DNS)
- **Subscription UI:** `src/app/app/settings/page.tsx` (Subscription section)
  - Monthly/Annual billing toggle
  - Plan cards (Free, Pro, Ultra) with dynamic button states
  - "Start 7-day free trial" → opens LS checkout URL via `window.open()`
  - Manage Billing / Cancel / Resume for active subscribers
  - Upgrade/Downgrade between tiers via API
- **Deep-linking:** Settings page reads `?section=income` query param via `useSearchParams` to auto-expand specific sections
- **API client:** `subscriptionsAPI` in `src/lib/api.ts`
  - `getStatus()`, `checkout(planKey)`, `getPortal()`, `cancel()`, `resume()`, `changePlan(planKey)`
- **Plan keys:** `pro_monthly`, `pro_annual`, `ultra_monthly`, `ultra_annual`

## Dashboard Features
- **One-time fund discovery:** Monthly tab shows a dashed-border prompt ("Got a bonus or tax refund?") when user has no one-time funds configured. Links to `/app/settings?section=income` for direct navigation to income settings.
- **Detected transactions alert:** When detected bills exist, an alert card appears at top of dashboard showing count and merchant preview, linking to `/app/bills?showDetected=true`.

## Detected Transactions (Mirrored from Mobile)
Auto-discovered recurring charges from Plaid appear as `detected` bills. Website mirrors the mobile app's handling exactly.

### Bill Status
- `regular` → `detected` → `confirmed` (same lifecycle as mobile)
- `bill.status`, `bill.detectedMerchant`, `bill.detectedAt` fields in `mapApiBill()`

### UI
- **Dashboard:** Alert card at top: "N new transactions detected" → links to Bills page
- **Bills page:** Detected section at top with "Recurring bill" / "One-time expense" buttons per bill
- Recurring bill = keeps tracking monthly; One-time expense = confirms as non-recurring, auto-paid this month, drops off next month

### AppContext Methods (mirrored from mobile)
- `detectedBills`, `detectedCount` — computed from bills state
- `confirmDetectedBill(billId, overrides?)` — confirms as recurring
- `confirmAsOneTime(billId)` — confirms as one-time expense
- `dismissDetectedBill(billId)` — soft-deletes + exclusion rule

### API Methods (in `src/lib/api.ts`)
- `billsAPI.getDetectedSummary()`, `billsAPI.confirmDetected(id, data)`, `billsAPI.dismissDetected(id)`

## Merchant Logos (Mirrored from Mobile)
Real company logos display on bill rows. Logos served from Keipr's own backend cache at `/api/logos/:domain`.

### Key Files
- `src/lib/merchantLogos.ts` — **MIRRORED FROM MOBILE** — merchant domain map (150+) + `getMerchantLogoUrl()` with 3-tier lookup: exact match → partial keyword → dynamic domain guess (`guessDomain()`)
- `src/components/MerchantLogo.tsx` — **MIRRORED FROM MOBILE** — `<img>` with `onError` fallback to `CategoryIcon`

### Where MerchantLogo Is Used
- **Dashboard** (`src/app/app/page.tsx`): expanded bill sub-rows in all 4 tabs (Monthly, This Check, Next Check, Cycles)
- **Bills** (`src/app/app/bills/page.tsx`): detected bill rows + regular bill rows
- Category-level headers (donut chart, category cards) remain as `CategoryIcon`

### Graceful Fallback
Logo URL includes `?v=2` cache-bust param. If logo fails to load (no cache, domain doesn't exist, no internet), `onError` silently renders `CategoryIcon`.

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
