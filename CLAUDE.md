# CLAUDE.md — Keipr Website

@AGENTS.md

## Project Overview
Next.js web app for Keipr, a paycheck-forward budgeting app. The website is a **mirror of the React Native mobile app** — same backend, same user accounts, same data.

**The mobile app is the source of truth for all data logic.** When the mobile app changes, the website must be updated to match.

## Tech Stack
- **Framework:** Next.js 16.2.2 (App Router, Turbopack)
- **Auth:** Firebase Auth (web SDK) — Email/Password + Google sign-in
- **State:** React Context (`AppContext`, `AuthContext`, `ThemeContext`)
- **HTTP:** Axios with Firebase token interceptor (`src/lib/api.ts`)
- **Hosting:** Vercel (auto-deploys from `main` branch)

## Repository
- **GitHub:** `https://github.com/jesan-ux89/keiprwebsite.git` (main branch)
- **Live URL:** `https://keiprwebsite.vercel.app`
- **Custom Domain:** `keipr.app` (Vercel + Cloudflare DNS)
- **Backend:** `https://keipr-backend-production.up.railway.app/api`
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
│   ├── auth/                       ← login, signup, forgot-password
│   └── app/
│       ├── layout.tsx              ← Authenticated shell (tier-based sidebar nav)
│       ├── page.tsx                ← Dashboard (tier-based tabs: Ultra Overview vs Free/Pro Monthly)
│       ├── bills/page.tsx          ← Bills list (becomes "Budget" for Ultra, adds spending progress bars)
│       ├── tracker/page.tsx        ← Per-paycheck bill tracker (adds auto-verify hint for Ultra)
│       ├── plan/page.tsx           ← Forward month planning (Free/Pro only in nav)
│       ├── settings/page.tsx       ← Settings hub
│       └── banking/                ← Connected banking (Ultra tier)
│           ├── page.tsx            ← Banking hub / "Accounts" for Ultra
│           ├── transactions/page.tsx ← All transactions / "Transactions" for Ultra
│           └── exclusions/page.tsx ← Manage ignored merchants
├── components/
│   ├── layout/AppLayout.tsx        ← Sidebar + top bar shell (tier-based nav: FREE_PRO_NAV vs ULTRA_NAV)
│   ├── ui/                         ← Button, Card, Input, Modal
│   ├── CategoryIcon.tsx            ← ** MIRRORED ** Lucide SVG icon
│   ├── MerchantLogo.tsx            ← ** MIRRORED ** Real company logo with fallback
│   ├── ErrorBoundary.tsx           ← Catches page crashes
│   ├── LoadingSkeleton.tsx         ← Shimmer skeletons
│   └── EmptyState.tsx              ← Illustrated empty states
├── context/
│   ├── AppContext.tsx              ← ** MIRRORED ** bills, income, payments, spending, available number
│   ├── AuthContext.tsx             ← Firebase auth state
│   └── ThemeContext.tsx            ← Dark/light/system theme
└── lib/
    ├── api.ts                     ← Axios client + all API endpoints
    ├── firebase.ts                ← Firebase config
    ├── payPeriods.ts              ← ** MIRRORED ** pay period calculation engine
    ├── categoryIcons.ts           ← ** MIRRORED ** category icon definitions
    └── merchantLogos.ts           ← ** MIRRORED ** merchant domain map
```

## Dual UI Design (Mirrors Mobile)

### Free/Pro — Manual Control
- **Sidebar Nav:** Dashboard · Bills · Tracker · Plan · Settings
- **Dashboard Tabs:** Monthly · This Check · Next Check · Cycles
- Standard header, no TopBar-style elements

### Ultra — Automated Intelligence
- **Sidebar Nav:** Dashboard · Accounts · Transactions · Budget · Tracker (+ Settings link + notification bell in top section)
- **Dashboard Tabs:** Overview · This Check · Next Check
- **Overview tab:** Available Number hero, spending velocity, quick stats, upcoming bills, recent activity, category summary
- **Bills page:** Title "Budget", spending budget progress bars added
- **Tracker page:** Auto-verify hint banner for bank-matched bills
- **Banking page:** Title "Accounts" for Ultra
- **Transactions page:** Serves as "Transactions" tab for Ultra

### AppLayout.tsx (Tier-Based Nav)
```tsx
const FREE_PRO_NAV = [Dashboard, Bills, Tracker, Plan, Settings];
const ULTRA_NAV = [Dashboard, Accounts, Transactions, Budget, Tracker];
```
Ultra top section adds Settings link + Bell notification icon with `detectedCount` badge.

## Mirrored Files (CRITICAL)
| Website File | Mobile Source | What's Shared |
|---|---|---|
| `src/context/AppContext.tsx` | `src/context/AppContext.tsx` | `mapApiBill()`, `mapIncomeSource()`, payment logic, `fmt()` |
| `src/lib/payPeriods.ts` | `src/utils/payPeriods.ts` | `getPayPeriods()`, `isBillInPeriod()` |
| `src/app/app/page.tsx` | `src/screens/dashboard/DashboardScreen.tsx` | Tier-based tabs, Ultra Overview, `billAmountForPaycheck()` |
| `src/app/app/tracker/page.tsx` | `src/screens/tracker/TrackerScreen.tsx` | Payment tracking, auto-verify hint |
| `src/app/app/bills/page.tsx` | `src/screens/bills/BillsScreen.tsx` | Budget title for Ultra, spending budgets |
| `src/lib/categoryIcons.ts` | `src/utils/categoryIcons.ts` | Category icons |
| `src/components/CategoryIcon.tsx` | `src/components/CategoryIcon.tsx` | Category icon component |
| `src/lib/merchantLogos.ts` | `src/utils/merchantLogos.ts` | Merchant domain map |
| `src/components/MerchantLogo.tsx` | `src/components/MerchantLogo.tsx` | Logo with fallback |

## Key Data Mapping (from `mapApiBill`)
- `total_amount` → `total`, `due_day_of_month` → `dueDay`, `is_recurring` → `isRecurring`
- Splits sorted by `sort_order`, amounts in `p1`-`p4`, done flags in `p1done`-`p4done`
- `funded` = sum of `is_saved_to_savings` amounts
- Category from `budget_categories.name` join, defaults to `'Other'`

## Key Patterns

### Styling
- `useTheme()` for colors — never hardcode
- Brand colors: Midnight `#0C4A6E`, Electric `#38BDF8`, Parchment `#D6D1C7`
- Website green: `#0A7B6C`, amber: `#854F0B` (NOT mobile's `colors.green`/`colors.amber` values)
- Use `colors.progressTrack || colors.cardBorder` as fallback for progress bars

### API Calls
- All through `src/lib/api.ts` with Firebase token interceptor
- `res.data?.propertyName || []` pattern — never assume `res.data` IS the array
- Income sources: check both `res.data?.incomeSources` and `res.data?.income_sources`

### Dashboard ViewMode
- Website uses string-based `ViewMode`: `'overview' | 'paycheck' | 'nextcheck' | 'cycles' | 'monthly'`
- Ultra defaults to `'overview'` via useEffect, Free/Pro defaults to `'monthly'`
- Tab arrays are tier-conditional: `isUltra ? ['overview', 'paycheck', 'nextcheck'] : ['monthly', 'paycheck', 'nextcheck', 'cycles']`

## 3-Tier Pricing
- **Free:** 1 income source, 1 split, 1 month planning
- **Pro:** $7.99/mo ($6.99/mo annual) — unlimited, trends, export
- **Ultra:** $11.99/mo ($10.99/mo annual) — Pro + banking + automated UI

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

### ⚠ MANDATORY: Cross-Project Sync Workflow
**This is the #1 rule. Every session must follow it.**
1. **Mobile app is source of truth.** If you're working on the website and a feature doesn't exist on mobile yet, check with the user — don't invent website-only logic.
2. **When working on mobile or backend changes**, always check the Mirrored Files table above. If any mirrored file was changed on mobile, update the website equivalent in the SAME session.
3. **After completing ALL code changes**, always provide full copy-pasteable commands for EVERY repo that was modified. Never finish a task without giving push commands. Rules:
   - **PowerShell-compatible** — use semicolons (`;`) not `&&` to chain commands.
   - **Full local paths** — always start with `cd C:\Users\Jess\_keiprwebsite`, `cd C:\Users\Jess\_KeiprApp`, or `cd C:\Users\Jess\_keipr-complete-backend`.
   - **SQL changes** — provide the full SQL statement ready to copy-paste into the Supabase SQL Editor. No placeholders, no "run this migration" — give the actual SQL.
   - **Once given, assume push/SQL commands have been executed.** Do NOT re-provide the same commands later in the session. Jesse runs them immediately.
   - **Example format:**
     ```powershell
     cd C:\Users\Jess\_keiprwebsite; git add src/context/AppContext.tsx src/app/app/bills/page.tsx; git commit -m "Mirror mobile bill changes"; git push origin main
     ```
4. **UI changes to shared screens** (Dashboard, Bills/Budget, Tracker, Banking/Accounts, Transactions) on mobile MUST be mirrored here. This includes new banners, new fields, conditional logic, and styling.
5. Do NOT change `mapApiBill()`, `mapIncomeSource()`, `payPeriods.ts`, or dashboard calculations without checking mobile first.

### General Rules
- Do NOT mess up anything that is already confirmed working
- Split bills must appear in every paycheck section
- Backend CORS: `ALLOWED_ORIGINS` on Railway must include the Vercel domain
- Do NOT put sensitive keys in `NEXT_PUBLIC_*` env vars

### Trash Folder Convention
- **Location:** `C:\Users\Jess\_KeiprTrash` — organized by subfolder: `mobile-mockups/`, `backend-unused/`, `website-previews/`
- **Purpose:** Instead of deleting temp files, mockups, unused code, or design artifacts, MOVE them to the trash folder. This preserves them in case they're needed later.
- **What goes there:** Design preview HTML files, unused components, experiment files — anything that doesn't belong in production.
- **Cleanup:** Jesse periodically deletes the trash folder contents (weekly/monthly). Do NOT permanently delete files from project folders — always move to trash first.

## Pro-to-Ultra Migration Engine (Website Mirror)
- Settings → Smart Detection → "Re-sync & match bills" calls `POST /api/banking-data/migrate-to-ultra`
- Dashboard quick stats (INCOME / BILLS / SPENT) are clickable: Income → `/app/income`, Bills → `/app/bills`, Spent → `/app/banking/transactions`
- `/app/income` page shows income sources + recent bank deposits (fetches `income`, `income_matched`, and `transfer` categories filtered for deposits)
- `bankingAPI.migrateToUltra()` available in `src/lib/api.ts`

## What's Left to Build
1. **Onboarding split** — Manual vs Automated path recommendation
