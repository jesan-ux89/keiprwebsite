# CLAUDE.md — Keipr Website

@AGENTS.md

## 🔒 LOCKED DESIGN DECISIONS — DO NOT REVERSE

These decisions were debated, tested, and finalized by Jesse. Do NOT change, "improve," or revert them without Jesse's explicit approval in the current session. If you think one is wrong, ASK Jesse — do not silently "fix" it.

1. **Income auto-adjusts from real deposits.** Backend auto-updates `typical_amount` when Plaid deposits arrive. The website uses `typicalAmount` from AppContext for remaining calculations. Do NOT add logic to "preserve the user's original input."

2. **CC-paid bills: excluded from Expenses display, included in Remaining.** `totalBillsThisCheck` = direct-pay bills only (for Expenses card). But `remaining` and `nextRemaining` subtract ALL bills (direct + CC). Do NOT change remaining to exclude CC bills.

3. **No auto-migrateToUltra after Plaid Link.** The website's bank-import flow calls `exchangeToken` + `onboardingImport` only. Never `migrateToUltra`.

4. **Detection bugs are backend bugs.** The website only displays results. Fixes go in `_keipr-complete-backend/src/lib/detectionEngine.js`.

5. **Mobile app is source of truth.** All data logic, calculations, and shared components must match mobile. Do not invent website-only logic without checking mobile first.

6. **AI Accountant onboarding runs ONCE.** Backend enforces this — the first AI run uses `'onboarding'` trigger, all subsequent 48h-window runs downgrade to `'bank_sync'`. Website just displays results. Do not add AI trigger logic to the website.

---

## ⚠ RULE #1 (MOST IMPORTANT): Hit `/api/debug/user-state` BEFORE speculating about state

When Jesse reports ANY bug with ambiguous state ("wrong category on web", "bill missing", "balance not matching mobile", etc.), the FIRST action is to hit `GET /api/debug/user-state`. Do NOT guess at DB state. Do NOT start reading website code to form hypotheses — the bug is almost always visible in backend state (and is probably also present on mobile, since the data layer is the same).

The endpoint returns bills (active + inactive), income sources, payments, categories, and for Ultra users — bank connections, transactions with `display_category`, match_log, learned matches, exclusion rules.

**This has been a game changer.** Issues that used to recur session after session get diagnosed in minutes because we see actual state instead of guessing. Keep using it.

Quickest access (admin key — no Firebase token needed):
- `DEBUG_ADMIN_KEY`: `NM9OOGFMyQTCLIZKQvwiC0Ej2v0onsbH` (set on Railway)
- Jesse's app email: `jessenetworkengineer@gmail.com` (NOT `jessesan82@gmail.com` — that's his Railway/personal email)
- curl: `curl -H "Authorization: Bearer NM9OOGFMyQTCLIZKQvwiC0Ej2v0onsbH" "https://keipr-backend-production.up.railway.app/api/debug/user-state?email=jessenetworkengineer@gmail.com"`
- Also supports `?uid=<firebase_uid>` as an alternative lookup

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
│       ├── page.tsx                ← Dashboard ROUTER (reads isUltra, renders Free or Ultra)
│       ├── DashboardFreeContent.tsx ← Free/Pro dashboard (Monthly, This Check, Next Check, Cycles)
│       ├── DashboardUltraContent.tsx ← Ultra dashboard (Overview, This Check, Next Check)
│       ├── bills/
│       │   ├── page.tsx            ← Bills/Budget ROUTER (reads isUltra, renders Free or Ultra)
│       │   ├── BillsFreeContent.tsx ← Free/Pro "Bills" page
│       │   └── BillsUltraContent.tsx ← Ultra "Budget" page (detected banner, bank badges)
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
    ├── dashboardHelpers.ts        ← ** MIRRORED ** billAmountForPaycheck, computeDashboardTotals
    ├── billsHelpers.ts            ← ** MIRRORED ** groupBillsByCategory, filterBills, computeBillsTotals
    ├── categoryIcons.ts           ← ** MIRRORED ** category icon definitions
    └── merchantLogos.ts           ← ** MIRRORED ** merchant domain map
```

## ⚠ Tier Separation (Screen-Level Isolation)

Dashboard and Bills pages are **physically split into separate files** per tier, matching the mobile app's architecture. Editing the Free/Pro dashboard CANNOT break Ultra, and vice versa.

**How it works:**
- `page.tsx` files are thin routers (~10 lines) that read `isUltra` and render the correct component
- `DashboardFreeContent.tsx` / `DashboardUltraContent.tsx` — separate dashboard implementations
- `BillsFreeContent.tsx` / `BillsUltraContent.tsx` — separate bills/budget implementations
- Shared helpers in `src/lib/dashboardHelpers.ts` and `src/lib/billsHelpers.ts`
- Shared data layer (AppContext, payPeriods, api.ts) stays unified

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

**Budget (Bills)** — Monarch-style columns: Expenses | Budget | Actual | Remaining. Groups: Fixed (recurring) and Flexible (discretionary). Items show category icon + name + budget/actual/remaining. Detected expenses banner with review CTA. Right sidebar: total expenses, income/fixed/flexible breakdown, left to spend, coverage progress. **Note:** Mobile has a "Quick Spend" section (amber-themed, combines manual quick expenses + bank spending transactions) that is NOT yet mirrored to the website — the website Budget uses a column layout without paycheck groups, so the Quick Spend display pattern doesn't apply directly. When the website gets paycheck-grouped views, Quick Spend should be added.

**Transactions** — Date-grouped list with daily totals. Rows: colored merchant initials square + name + category dot + account name + amount. Tab filter: All / Expenses / Income. Search in top bar.

**Accounts** — Hero stats (Net Worth + Cash Balance). Account groups (Cash, Credit, Loans) with rows: circle bank icon + name/type + sparkline + balance/sync time. Right sidebar: assets/liabilities summary.

**Tracker** — SVG ring progress (120x120) with stats (Paid/Remaining/Total). Bill checklist: circular checkboxes + category icons + name/meta + amount. Right sidebar: paycheck totals + auto-verify hint.

**Reports** (NEW, Ultra only) — Spending by category bar chart + monthly trend chart (6 months). Right sidebar: category breakdown with dots + totals + month-over-month comparison. Export to CSV.

## Mirrored Files (CRITICAL)
| Website File | Mobile Source | What's Shared |
|---|---|---|
| `src/context/AppContext.tsx` | `src/context/AppContext.tsx` | `mapApiBill()`, `mapIncomeSource()`, payment logic, `fmt()` |
| `src/lib/payPeriods.ts` | `src/utils/payPeriods.ts` | `getPayPeriods()`, `isBillInPeriod()` |
| `src/app/app/DashboardFreeContent.tsx` | `src/screens/dashboard/DashboardFreeScreen.tsx` | Free/Pro dashboard (Monthly, This Check, Next Check, Cycles) |
| `src/app/app/DashboardUltraContent.tsx` | `src/screens/dashboard/DashboardUltraScreen.tsx` | Ultra dashboard (Overview, This Check, Next Check) |
| `src/lib/dashboardHelpers.ts` | `src/screens/dashboard/dashboardHelpers.ts` | `billAmountForPaycheck()`, `computeDashboardTotals()` |
| `src/app/app/tracker/page.tsx` | `src/screens/tracker/TrackerScreen.tsx` | Payment tracking, auto-verify hint |
| `src/app/app/bills/BillsFreeContent.tsx` | `src/screens/bills/BillsFreeScreen.tsx` | Free/Pro "Bills" page |
| `src/app/app/bills/BillsUltraContent.tsx` | `src/screens/bills/BillsUltraScreen.tsx` | Ultra "Budget" page (detected banner, bank badges) |
| `src/lib/billsHelpers.ts` | `src/screens/bills/billsHelpers.ts` | `groupBillsByCategory()`, `filterBills()` |
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
Backend exposes `GET /api/debug/user-state` — tier-aware JSON dump of everything needed to diagnose a user's issue (bills, income, payments, connections, transactions, match log, exclusions). Use this FIRST before speculating about state.

**Preferred method — admin key (no Firebase token needed):**
`curl -H "Authorization: Bearer <DEBUG_ADMIN_KEY>" "https://keipr-backend-production.up.railway.app/api/debug/user-state?email=jessenetworkengineer@gmail.com"`

`DEBUG_ADMIN_KEY` is set on Railway. Supports `?email=` or `?uid=` to look up any user.

## AI Features — REMOVED
All AI-related pages and features were removed: `/app/settings/ai`, `/app/settings/ai-admin`, `AISuggestionCard`, `aiAPI` in `src/lib/api.ts`. Categorization and detection run entirely through the backend's rule-based engines. Do NOT re-introduce AI pages without explicit user request.

## Unified Expenses (IMPORTANT)
All user-facing text uses "expenses" instead of "bills" or "spending budgets." The spending budgets DB table still exists but:
- **Auto-creation disabled:** Backend no longer auto-creates spending budgets during sync/migration
- **UI unified:** Spending budgets render as bill-style rows — no TARGET/OVER badges, no separate progress bars
- **Text standardized:** "expenses" everywhere — detection alerts, sync dialogs, settings

## AI Accountant (Phases 1-3)

**Status:** Phases 1-3 frontend complete. Phase 0 operational. Backend endpoints integration in progress.

**Design doc:** `/sessions/affectionate-keen-planck/mnt/_keipr-complete-backend/docs/design/ai-accountant.md`

**Feature flag:** Backend controls via `system_ai_settings.ai_enabled`. Website hides all AI UI when `/api/me/ai-settings` returns 503.

### User-Facing Routes

**Phase 0 (operational):**
- `/app/settings/ai` — Toggle, privacy details, links to history/overrides
- `/app/settings/ai/details` — Data processing & privacy

**Phases 1-3 (new):**
- `/app/settings/ai/history` — Audit runs with expandable corrections, before/after JSON modal, export button
- `/app/settings/ai/overrides` — Active overrides grouped by type, remove action
- **Inline (Tracker/Bills):** CorrectionBadge (✨ with count) + CorrectionDetailModal
- **Inline (Tracker):** StagingChainPanel (savings chain details) + StagingChainAnchorModal
- **Dashboard top bar (Ultra):** SyncingIndicator (animated audit-in-progress pill)

### Admin Routes

**Phase 0 (shell):**
- `/app/admin/ai` — Control bar + status/activity/alert placeholders

**Phases 1-3 (new):**
- `/app/admin/ai/runs?id=<uuid>` — Single audit run drill-down, corrections with modal + Undo

**Phase 0 (shell):**
- `/app/admin/ai/users` — User search + triage (needs backend)

### Backend Endpoints Required (14 total)

**User-side (10):**
- `GET /api/me/ai-history` — paginated runs
- `GET /api/me/ai-corrections/:id` — single correction
- `GET /api/me/ai-corrections-by-bill` — corrections for a bill
- `GET /api/me/ai-overrides` — active overrides
- `POST /api/me/ai-overrides` — create override
- `DELETE /api/me/ai-overrides/:id` — remove override
- `POST /api/bills/:billId/override-paycheck` — paycheck override
- `GET /api/staging-chains` — list chains
- `POST /api/staging-chains/:id/anchor` — anchor setup
- `POST /api/staging-chains/:id/dissolve` — break chain
- `GET /api/me/ai-data-export` — JSON export

**Admin-side (4):**
- `GET /api/admin/ai-runs/:runId` — run + corrections
- `POST /api/admin/ai-corrections/:id/undo` — revert correction
- `POST /api/admin/ai-reaudit/:userId` — trigger reaudit
- `POST /api/admin/ai-purge` — purge AI data

Response shapes: design doc §9-10.

### New Components (5)

1. `CorrectionDetailModal.tsx` — Full correction context, before/after JSON, reasoning, confidence, undo (admin-only)
2. `CorrectionBadge.tsx` — ✨ sparkle with count, inline
3. `SyncingIndicator.tsx` — Animated "Refining ledger…" pill, auto-hides
4. `StagingChainPanel.tsx` — Collapsible chain details, anchor setup, dissolve
5. `StagingChainAnchorModal.tsx` — 4-option cycle setup

### API Extensions (22 methods added to `aiAPI`)

User: `getHistory`, `getCorrection`, `getCorrectionsForBill`, `getOverrides`, `createOverride`, `removeOverride`, `overrideBillPaycheck`, `getStagingChains`, `anchorStagingChain`, `dissolveStagingChain`

Admin: `adminGetRun`, `adminUndoCorrection`, `adminReaudit`, `adminPurge`

### Integration Checklist for Tracker/Bills/Dashboard

**Tracker/Bills page:**
```tsx
import CorrectionBadge from '@/components/ai/CorrectionBadge';
import CorrectionDetailModal from '@/components/ai/CorrectionDetailModal';
import StagingChainPanel from '@/components/ai/StagingChainPanel';

// Load AI corrections per bill
const { data } = await aiAPI.getCorrectionsForBill(billId);
setAiCorrections(data.corrections);

// Render badge + modal + chain panel
<span>{bill.name}</span>
{aiCorrections[billId]?.length > 0 && (
  <CorrectionBadge
    correctionCount={aiCorrections[billId].length}
    onClick={() => setSelected(aiCorrections[billId][0].id)}
  />
)}
{bill.staging_type === 'staging_contribution' && (
  <StagingChainPanel billId={bill.id} billName={bill.name} />
)}
<CorrectionDetailModal correctionId={selected} open={!!selected} onClose={() => setSelected(null)} />
```

**Dashboard (Ultra only):**
```tsx
import SyncingIndicator from '@/components/ai/SyncingIndicator';

{isUltra && (
  <SyncingIndicator enabled={aiSettingsAvailable} onComplete={() => loadBills()} />
)}
```

### Files Created

- `src/lib/api.ts` (extended +22 methods)
- `src/components/ai/CorrectionDetailModal.tsx`
- `src/components/ai/CorrectionBadge.tsx`
- `src/components/ai/SyncingIndicator.tsx`
- `src/components/ai/StagingChainPanel.tsx`
- `src/components/ai/StagingChainAnchorModal.tsx`
- `src/app/app/settings/ai/history/page.tsx`
- `src/app/app/settings/ai/overrides/page.tsx`
- `src/app/app/admin/ai/runs/page.tsx`

### Files Updated (Phase 1 now live)

**Admin Dashboard (fully built):**
- `src/app/app/admin/ai/page.tsx` — Full live dashboard with Row 0-5 (system controls, status cards, feature breakdown, activity log, quality signals, guardrail alerts). Auto-refreshes every 30s.
- `src/app/app/admin/ai/users/page.tsx` — User search, per-feature flags modal, disable AI modal with reason, Last Run column.

**Tracker & Bills Integrations:**
- `src/app/app/tracker/page.tsx` — `CorrectionBadge` inline on bills with AI corrections, modal detail on click.
- `src/app/app/bills/page.tsx` — Same badge integration in Budget table rows.
- `src/app/app/page.tsx` — `SyncingIndicator` rendered for Ultra users only.

**Unchanged (Phase 0 remains operational):**
- `src/app/app/settings/ai/page.tsx` ✓
- `src/app/app/settings/ai/details/page.tsx` ✓
- `src/components/AIConsentModal.tsx` ✓

### How to Disable

1. **Globally:** Backend sets `system_ai_settings.ai_enabled = false`
2. **Per-user:** User toggles in Settings → AI Assistant
3. **Per-feature:** Admin sets `users.ai_accountant_*_disabled` flags

All UIs automatically hide when `/api/me/ai-settings` returns 503.

### How to Remove

If AI Accountant never ships:
1. Delete Phase 0 shells: `/app/settings/ai/`, `/app/admin/ai/`
2. Delete Phase 1-3 pages: history/overrides/runs/
3. Delete Phase 1-3 components: `/components/ai/` (5 files)
4. Remove `aiAPI` from `/lib/api.ts`
5. Update AppLayout.tsx sidebar (remove AI entries)

### Testing

- [x] **Admin Dashboard (fully live):**
  - [x] Row 0: System controls (toggle, model dropdowns, numeric inputs, confirmation modals)
  - [x] Row 1: Status cards (5-column grid, live data from `adminGetDashboard`)
  - [x] Row 2: Feature breakdown (3-card grid, per-feature stats)
  - [x] Row 3: Activity log (paginated table, links to `/admin/ai/runs?id=<uuid>`)
  - [x] Row 4: Quality signals (top overridden types, top cost users)
  - [x] Row 5: Guardrail alerts (blocked corrections, hard-limit aborts)
  - [x] Auto-refresh every 30 seconds
- [x] **Admin Users Page (fully live):**
  - [x] Debounced search (300ms)
  - [x] Per-user action buttons (Flags modal, Disable AI modal)
  - [x] Flags modal: checkbox toggles for 3 features
  - [x] Disable modal: textarea reason, confirm/cancel buttons
  - [x] Last Run column shows user's most recent audit date
- [x] **Tracker Integration:**
  - [x] `CorrectionBadge` renders inline next to bill names with count
  - [x] Click opens `CorrectionDetailModal` with selected correction
  - [x] Hides gracefully when `aiSettingsAvailable = false`
- [x] **Bills Integration:**
  - [x] Same badge + modal pattern in Budget table rows
  - [x] Works alongside existing split/recurring/bank-synced tags
- [x] **Dashboard Integration:**
  - [x] `SyncingIndicator` visible for Ultra users only
  - [x] Animates during AI audit, shows completion message, auto-hides after 5s
- [x] History page: runs load, expand to show corrections
- [x] Correction modal: before/after JSON, reasoning, confidence
- [x] Overrides page: grouped, scope badges, remove action works
- [x] Staging chain: expands, shows cycle, anchor setup works
- [x] Admin run detail: loads via `/admin/ai/runs?id=uuid`
- [x] Undo button: works, prevents re-application via fingerprint
- [x] All pages hide when `aiSettingsAvailable = false`

### Notes

- All pages are `'use client'` (Next.js 16 App Router)
- All components use `useTheme()` (no hardcoded colors)
- Monarch design: glassmorphism, 240px sidebar, sticky headers
- No new npm packages
- No breaking changes to AppContext
- Full implementation in `/IMPLEMENTATION_SUMMARY.md`

## What's Left to Build
1. ~~**Onboarding split**~~ — ✓ Complete on mobile (`SetupChoiceScreen.tsx`). Website onboarding mirror TBD.
2. **Quick Spend section** — exists on mobile Budget screen (BillsUltraScreen.tsx) showing manual quick expenses + bank spending transactions in amber-themed collapsible section. Website mirror deferred because the website Budget uses Monarch column layout without paycheck groups.
