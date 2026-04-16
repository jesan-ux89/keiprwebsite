# CLAUDE.md — Keipr Website

@AGENTS.md

## ⚠ RULE #1 (MOST IMPORTANT): Hit `/api/debug/user-state` BEFORE speculating about state

When Jesse reports ANY bug with ambiguous state ("wrong category on web", "bill missing", "balance not matching mobile", etc.), the FIRST action is to hit `GET /api/debug/user-state` with his Firebase token. Do NOT guess at DB state. Do NOT start reading website code to form hypotheses — the bug is almost always visible in backend state (and is probably also present on mobile, since the data layer is the same).

The endpoint returns bills (active + inactive), income sources, payments, categories, and for Ultra users — bank connections, transactions with `display_category`, match_log, learned matches, exclusion rules.

**This has been a game changer.** Issues that used to recur session after session get diagnosed in minutes because we see actual state instead of guessing. Keep using it.

Quickest access: hit `https://keipr-backend-production.up.railway.app/api/debug/user-state` from the browser dev tools fetch with Jesse's Firebase token in the Authorization header.

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
│       ├── layout.tsx              ← Authenticated shell
│       ├── page.tsx                ← Dashboard (hero stats + spending pace + upcoming + recent activity)
│       ├── bills/page.tsx          ← Budget page (Monarch-style Budget/Actual/Remaining columns)
│       ├── tracker/page.tsx        ← Tracker (SVG ring progress + bill checklist)
│       ├── plan/page.tsx           ← Forward month planning (Free/Pro only in nav)
│       ├── reports/page.tsx        ← Reports (NEW — spending charts + trends, Ultra only)
│       ├── settings/page.tsx       ← Settings hub
│       └── banking/                ← Connected banking (Ultra tier)
│           ├── page.tsx            ← Accounts page (hero stats + account groups + sparklines)
│           ├── transactions/page.tsx ← Transactions (date-grouped + daily totals + category dots)
│           └── exclusions/page.tsx ← Manage ignored merchants
├── components/
│   ├── layout/AppLayout.tsx        ← Monarch-inspired: 240px sidebar + sticky top bar + TwoColumnLayout export
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

## Website Design System (Monarch-Inspired Redesign)

The website has its own web-native design, inspired by Monarch. NOT a direct mirror of the mobile app's visual style — the data logic is mirrored, but the UI is purpose-built for desktop web.

### AppLayout.tsx Architecture
- **Sidebar:** 240px fixed, section labels (Overview/Planning/Insights), user profile footer
- **Top Bar:** 56px sticky, glassmorphism (`backdrop-filter: blur(12px)`), page title + month nav + action buttons
- **TwoColumnLayout:** Exported helper — main content (1fr) + sticky sidebar (340px), single-column under 1100px
- **Props:** `pageTitle`, `showMonthNav`, `topBarActions` (React nodes for right side buttons)

### Free/Pro Navigation
- **Sections:** Overview (Dashboard) · Planning (Bills, Tracker, Plan) · Settings
- **Dashboard Tabs:** Monthly · This Check · Next Check · Cycles (pill-style)

### Ultra Navigation
- **Sections:** Overview (Dashboard, Accounts, Transactions) · Planning (Budget + detected badge, Tracker) · Insights (Reports) · Settings
- **Dashboard Tabs:** Overview · This Check · Next Check (pill-style)

### Page Designs

**Dashboard** — Hero stats row (Available/Income/Expenses) + detected alert banner + spending pace card + upcoming expenses + recent activity. Right sidebar: available number, income/bills/spent breakdown, paycheck progress, top spending categories.

**Budget (Bills)** — Monarch-style columns: Expenses | Budget | Actual | Remaining. Groups: Fixed (recurring) and Flexible (discretionary). Items show category icon + name + budget/actual/remaining. Detected expenses banner with review CTA. Right sidebar: total expenses, income/fixed/flexible breakdown, left to spend, coverage progress.

**Transactions** — Date-grouped list with daily totals. Rows: colored merchant initials square + name + category dot + account name + amount. Tab filter: All / Expenses / Income. Search in top bar.

**Accounts** — Hero stats (Net Worth + Cash Balance). Account groups (Cash, Credit, Loans) with rows: circle bank icon + name/type + sparkline + balance/sync time. Right sidebar: assets/liabilities summary.

**Tracker** — SVG ring progress (120x120) with stats (Paid/Remaining/Total). Bill checklist: circular checkboxes + category icons + name/meta + amount. Right sidebar: paycheck totals + auto-verify hint.

**Reports** (NEW, Ultra only) — Spending by category bar chart + monthly trend chart (6 months). Right sidebar: category breakdown with dots + totals + month-over-month comparison. Export to CSV.

## Mirrored Files (CRITICAL)
| Website File | Mobile Source | What's Shared |
|---|---|---|
| `src/context/AppContext.tsx` | `src/context/AppContext.tsx` | `mapApiBill()`, `mapIncomeSource()`, payment logic, `fmt()` |
| `src/lib/payPeriods.ts` | `src/utils/payPeriods.ts` | `getPayPeriods()`, `isBillInPeriod()` |
| `src/app/app/page.tsx` | `src/screens/dashboard/DashboardScreen.tsx` | Tier-based tabs, Ultra Overview, `billAmountForPaycheck()` |
| `src/app/app/tracker/page.tsx` | `src/screens/tracker/TrackerScreen.tsx` | Payment tracking, auto-verify hint |
| `src/app/app/bills/page.tsx` | `src/screens/bills/BillsScreen.tsx` | Budget title for Ultra, unified expenses |
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
   - **SINGLE COMMAND BLOCK** — combine ALL repo pushes into ONE copy-pasteable command, chained with semicolons. Jesse should only need to copy once.
   - **SQL separate** — SQL statements go in their own block since they're pasted into the Supabase SQL Editor, not PowerShell. Provide the full SQL ready to copy-paste. No placeholders.
   - **Once given, assume push/SQL commands have been executed.** Do NOT re-provide the same commands later in the session. Jesse runs them immediately.
   - **Example format (all repos in one block):**
     ```powershell
     cd C:\Users\Jess\_KeiprApp; git add src/context/AppContext.tsx; git commit -m "Fix bill logic"; git push origin master; cd C:\Users\Jess\_keiprwebsite; git add src/context/AppContext.tsx src/app/app/bills/page.tsx; git commit -m "Mirror bill fix"; git push origin main
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
- Settings → Smart Detection → "Re-sync & match bills" calls `POST /api/banking-data/migrate-to-ultra` (manual user action only — NEVER auto-trigger)
- Dashboard quick stats (INCOME / BILLS / SPENT) are clickable: Income → `/app/income`, Bills → `/app/bills`, Spent → `/app/banking/transactions`
- `/app/income` page shows income sources + recent bank deposits (fetches `income`, `income_matched`, and `transfer` categories filtered for deposits)
- `bankingAPI.migrateToUltra()` available in `src/lib/api.ts`

### ⚠ Do NOT add auto-migrateToUltra after Plaid Link
The website's `/app/onboarding/bank-import/page.tsx` calls `bankingAPI.exchangeToken` + `bankingAPI.onboardingImport` only. It does NOT call `migrateToUltra`, and must never be changed to. Auto-migrate-on-bank-add caused 31 spurious "bill matches need your review" entries on mobile — website Plaid Link flow (when it ships) must stay clean.

## Accounts / Transactions Mirror (today's cleanup)
- **Sync Transactions button REMOVED** from `/app/banking/page.tsx` — was sandbox-only endpoint, blocked in production
- **Dead Search + Filter buttons REMOVED** from `/app/banking/transactions/page.tsx` topbar — had no onClick handlers. Transaction filtering happens via tab bar (All / Expenses / Income).
- **Refresh Balances tucked behind collapsible "Sync Settings"** header for cost control (each Plaid balance call = $0.30). Description now mentions balances auto-refresh daily.

## Detection Engine — BACKEND-ONLY
All rules for recurring-expense detection (when a transaction becomes a bill, how splits are calculated, how names are cleaned, variable-amount handling for CC/ATM) live in `_keipr-complete-backend/src/lib/detectionEngine.js`. The website consumes results — it doesn't own any detection logic. If a detection bug is reported while browsing the website:
1. Don't try to "fix it" by changing website code — nothing here controls detection
2. The bug is in the backend; verify with `npm test` in `_keipr-complete-backend`
3. Fix goes in `detectionEngine.js`

## Debug Endpoint (for diagnosing web bugs)
Backend exposes `GET /api/debug/user-state` — tier-aware JSON dump of everything needed to diagnose a user's issue (bills, income, payments, connections, transactions, match log, exclusions). Use this FIRST before speculating about state. Hit directly with browser dev tools + the user's Firebase token.

## AI Features — REMOVED
All AI-related pages and features were removed: `/app/settings/ai`, `/app/settings/ai-admin`, `AISuggestionCard`, `aiAPI` in `src/lib/api.ts`. Categorization and detection run entirely through the backend's rule-based engines. Do NOT re-introduce AI pages without explicit user request.

## Unified Expenses (IMPORTANT)
All user-facing text uses "expenses" instead of "bills" or "spending budgets." The spending budgets DB table still exists but:
- **Auto-creation disabled:** Backend no longer auto-creates spending budgets during sync/migration
- **UI unified:** Spending budgets render as bill-style rows — no TARGET/OVER badges, no separate progress bars
- **Text standardized:** "expenses" everywhere — detection alerts, sync dialogs, settings

## AI Accountant (Phase 0 scaffolding)

**Status:** Scaffolding complete. All features default OFF. No backend integration yet.

**Design doc:** `/sessions/affectionate-keen-planck/mnt/_keipr-complete-backend/docs/design/ai-accountant.md` (§9 admin dashboard, §11.4 user UI, §11.5 compliance)

**Feature flag:** Backend controls via environment variable. Website hides UI gracefully if `/api/me/ai-settings` returns 503.

**Routes (all Phase 0 shells):**
- User-facing: `/app/settings/ai` (master toggle + 3 card links) → `/app/settings/ai/details` (privacy) → `/app/settings/ai/history` (empty) → `/app/settings/ai/overrides` (empty)
- Admin-only: `/app/admin/ai` (dashboard shell) → `/app/admin/ai/users` (user search/triage)

**Sidebar integration:**
- Settings section: "AI Assistant" link appears only if `aiAPI.getSettings()` succeeds (runtime check, no errors logged to user)
- New Admin section (below Settings): "AI Dashboard" + "AI Users" links, only shown if user passes `aiAPI.adminGetSettings()` check (403 → hidden, 503 → "feature disabled" message)

**API endpoints (`src/lib/api.ts` → `aiAPI` object):**
- User: `getSettings()` / `setEnabled(enabled, reason)` / `acceptConsent(version)` / `exportData()`
- Admin: `adminGetSettings()` / `adminUpdateSettings(data)` / `adminGetDashboard()` / `adminGetUsers(search, offset)` / `adminUpdateUserFlags(userId, flags)` / `adminDisableUserAi(userId, reason)`
- All 503 responses hide UI cleanly (no error to user). 403 redirects to /app.

**Components:**
- `AIConsentModal.tsx` — first-time consent, shown inline (title "Try the AI Assistant?", bullet list, buttons "Not now" + "Turn on AI")
- Pages use `useTheme()`, match Monarch design (glassmorphism, 240px sidebar context)

**How to disable:**
1. Backend: unset the AI feature flag environment variable
2. Website: UI automatically hides when API returns 503
3. Users: toggle off in Settings → AI Assistant (optional reason textarea)

**How to remove (if needed):**
- Delete: `/src/app/app/settings/ai/`, `/src/app/app/admin/ai/`, `/src/components/AIConsentModal.tsx`
- Remove: `aiAPI` object from `/src/lib/api.ts`
- Update: `AppLayout.tsx` to remove AI Settings + Admin sidebar sections (search for `aiSettingsAvailable` and `isAdmin` state)
- Update: This CLAUDE.md section

**Testing checklist for future phases:**
- [ ] User toggle on/off works and calls API
- [ ] Consent modal appears on first enable
- [ ] Admin dashboard settings persists across refresh
- [ ] User search works in admin users page
- [ ] Sidebar entries hide gracefully when feature flag off or API unreachable
- [ ] Redirect to /app if user tries to access admin pages without permission

## What's Left to Build
1. **Onboarding split** — Manual vs Automated path recommendation
