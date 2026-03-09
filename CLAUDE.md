# Manufacturer Lab — Consolidated Project Guidelines (V2)

## 2A. Product Scope (Single Company Fast Ops)

THIS SYSTEM IS STRICTLY:
- Single company only
- Single database only
- Single tenant only
- Expected users: ~20 active users
- Internal operations software, not public SaaS
- Optimized for low maintenance, speed, operational clarity, and fast daily execution

DO NOT OVER-ENGINEER:
- No multi-tenant architecture
- No organization switching
- No company isolation layers
- No microservices
- No event bus complexity unless truly needed
- No separate analytics warehouse
- No heavy BPM engine
- No offline-first sync engine unless explicitly requested later

ARCHITECTURE INTENT:
- Keep code simple, explicit, and production-safe
- Prefer relational clarity over abstraction
- Prefer server actions / API routes with clear domain modules
- Prefer cached summaries for reports over complex BI layers
- Prefer operational speed over feature bloat

PRIMARY OPTIMIZATION GOALS:
1. Fast form entry
2. Fast approvals
3. Fast list filtering and search
4. Fast dashboard load times
5. Clear pending actions by role
6. Low training burden
7. Strong auditability
8. Low maintenance cost

## 2B. Product Experience Principles

UI / UX MUST BE:
- Dry, professional, operations-first
- Fast and low-friction
- Clear enough for non-technical staff
- Dense but readable
- Consistent across all modules
- Optimized for real repetitive office work

GLOBAL UX RULES:
- Prefer list + detail drawer pattern over excessive page navigation
- Prefer inline create for Buyer / Vendor / Material / Style
- Prefer one-screen structured forms where possible
- Prefer step indicators only for truly long workflows
- Prefer right-side sheet/drawer for quick review and approval
- Use confirmation dialogs only on risky / irreversible actions
- Show current stage, next action, blocker, and pending-since on every key entity
- Minimize clicks for daily users
- Avoid decorative UI or fancy animation
- Use color for status meaning only, not decoration

LAYOUT STANDARD:
1. Left sidebar: role-based navigation
2. Top command bar: global search, quick actions, notifications, profile
3. Main area: table/list/grid depending on module
4. Right drawer: detail preview / quick actions / timeline
5. Mobile bottom action bar for RUNNER

VISUAL STYLE:
- Clean enterprise design
- Neutral background with strong contrast
- Compact cards
- Table-first workflow
- Sticky table header and filters
- Soft status colors only
- Avoid oversized cards and empty space
- Prefer readable typography over branded styling

## 2C. Role-Based UX Design

ACCOUNTANT UX:
- Approval-first dashboard
- Payment-first workflow
- Bulk action support where safe
- Clear pending approvals, pending payments, overdue provisional invoices
- Financial summary cards
- Fast export access
- Compact tables with pinned columns
- One-click view of proof documents and audit trail

SAMPLE_PM / PRODUCTION_MANAGER UX:
- Action-first dashboard
- Orders grouped by current operational stage
- Clear visibility into what is blocking material or production
- No rate/amount exposure anywhere
- Strong focus on tech pack, material readiness, production start, and production completion
- Required-by dates and shipping-risk visibility must be prominent

MERCHANDISER UX:
- Task-first dashboard
- Assigned tech packs, drafts, submitted, revisions required
- Orange revision alert banner
- Autosave drafts
- Easy file replacement for revised tech pack documents
- Side-by-side latest revision note + previous submission history

STORE_MANAGER UX:
- Queue-first dashboard
- Need requests awaiting acceptance
- Purchase requests to create
- Pending runner acceptance
- Pending invoices / blocked procurement
- Material + expense completion blockers visible per order/style
- Inline create for Vendor / Material / Buyer / Style must be fast

RUNNER UX:
- Mobile-first
- One current task card at top
- Large action buttons
- Fast upload flow using camera/gallery/pdf
- Minimal navigation
- Sticky bottom action bar
- Must always show: current request, buyer, order, style, vendor, status, next action
- No extra clutter

CEO UX:
- Read-only, summary-first
- High-level dashboard
- Buyer summary
- Delayed order visibility
- Stage distribution
- Financial and operational overview
- No action buttons anywhere

## 2D. Global Productivity Features

1. ACTION INBOX — Every role gets:
   - My Pending Actions
   - Waiting on Others
   - Blocked Items
   - Recently Updated
   - Overdue Items

2. GLOBAL SEARCH — Search across:
   - Order No, Buyer, Style Code / Style Name, Vendor, Material
   - Purchase No, Expense No, Invoice No, Runner Name
   - Must be fast and available from top command bar

3. SAVED FILTERS — Each list page supports:
   - Save current filter
   - Set default filter
   - Share filter internally (optional)
   - Date presets: Today, Yesterday, 7 Days, 30 Days, Custom

4. COMMAND PALETTE (Ctrl/Cmd + K):
   - Create Order, Raise Material Need, Create Purchase Request, Raise Expense
   - Search Order, Search Buyer, Search Vendor
   - Go to Reports, Go to Dashboard

5. RECENT ITEMS — Show recently viewed:
   - Orders, Purchases, Expenses, Tech Packs

6. SMART DEFAULTS — Auto-fill when appropriate:
   - Today date, current user, linked buyer/order/style
   - Last used vendor (module-specific)
   - Last selected payment method (Accountant only)

7. DRAFT AUTOSAVE — Enable for:
   - Tech Pack, Material Need Request draft, Expense Request draft
   - Purchase draft (before final submit)

8. DUPLICATE WARNING ENGINE — Show warning (not hard block unless configured) for:
   - Same vendor + same invoice no
   - Same expense category + same date + same amount + same order/style
   - Similar material request on same order/style
   - Duplicate style code
   - Duplicate buyer/vendor name

## 2E. Performance & Speed Requirements

PERFORMANCE STANDARDS:
- All major list pages must be server-rendered or server-fetched efficiently
- Use pagination, never load huge lists blindly
- Avoid N+1 queries
- Use Prisma select/include carefully
- Use indexed filtering on status, buyer_id, order_id, style_id, assigned_runner_id, vendor_id, created_at
- Dashboard summary queries must be optimized for speed
- Heavy reports must use cached queries or summary tables
- Expensive aggregates must not run on every page render
- Revalidate only affected sections after mutations
- Use optimistic UI only for non-sensitive actions
- Financial approvals and workflow transitions must always use confirmed server state

CACHE / SUMMARY STRATEGY:
- Create summary tables or cached query layer for:
  - Dashboard counts, stage aging, buyer-wise order summaries
  - Pending approval totals, pending payment totals
  - Overdue provisional invoice counts, production stage counts
- Refresh summaries: on mutation where possible, or scheduled cron fallback every few minutes

FAST REPORT RULE:
- Reports should open fast even with history
- Precompute where useful
- Export should use filtered dataset only
- Long exports may run as background job with ready-to-download link

## 2F. Advanced Operational Control Fields

COMMON WORKFLOW CONTROL FIELDS (add to relevant tables):
- pending_since_at
- next_action_role
- next_action_user_id
- next_action_label
- blocker_code
- blocker_note
- overdue_flag
- overdue_reason
- last_activity_at

BLOCKER_CODE ENUMS:
- WAITING_PM_ACCEPTANCE
- WAITING_MERCH_ACCEPTANCE
- WAITING_TECHPACK_SUBMISSION
- WAITING_PM_REVIEW
- WAITING_BUYER_DECISION
- WAITING_STORE_ACCEPTANCE
- WAITING_PURCHASE_REQUEST
- WAITING_RUNNER_ACCEPTANCE
- WAITING_INVOICE_UPLOAD
- WAITING_ACCOUNTANT_APPROVAL
- WAITING_PAYMENT
- WAITING_VENDOR_CONFIRMATION
- WAITING_FINAL_TAX_INVOICE
- WAITING_EXPENSE_COMPLETION
- WAITING_PRODUCTION_ACCEPTANCE
- WAITING_FINAL_SIGNOFF

AGING / SLA TRACKING (for major stage-based records):
- entered_stage_at
- exited_stage_at
- stage_duration_hours
- sla_due_at
- sla_breached
- Used for: dashboards, reminders, reports, exception visibility, operational discipline

## 2G. Advanced Workflow Features

1. REOPEN CONTROLS — ACCOUNTANT ONLY, with required reason + audit log:
   - Reopen purchase review, expense approval, tech pack completion
   - Reopen production completion, final order completion
   - Must be controlled, rare, and fully auditable

2. SOFT REMINDER SYSTEM:
   - Manual remind button for: PM, Merchandiser, Store Manager, Runner, Accountant
   - Auto reminder support for overdue stages

3. INTERNAL COMMENTS / MENTIONS:
   - Available on: Order, Tech Pack, Material Requirement, Material Request, Purchase, Expense Request
   - @mention internal user, timestamp, audit-safe comment history
   - Optional email/in-app mention notify

4. PRODUCTION READINESS CHECKLIST — Before PM accepts production start:
   - All required material requests completed
   - All required expense requests completed
   - Pending final tax invoice status visible
   - Blocked items visible
   - Remarks/history visible

5. EXCEPTION FLAGS — Show structured flags on cards/tables:
   - Missing Document, Overdue Required Date, Pending Tax Invoice
   - Vendor Mismatch, Blocked by Approval, Reopened Item
   - High Revision Count, Delayed Shipping Risk

## 2H. Dashboard V2 Requirements

ALL DASHBOARDS MUST SHOW:
- My Pending Actions, Waiting on Others, Blocked Items, Overdue Items, Recently Updated

ACCOUNTANT DASHBOARD ADD:
- Pending purchase approvals, pending expense approvals, pending payments
- Overdue final tax invoices, orders pending final sign-off
- Today cash / payment summary, active runners vs available runners
- Daily exception widget

PM DASHBOARD ADD:
- Orders by stage, tech packs awaiting review
- Material requirement pending acceptance, production-ready orders
- Delayed shipping risk, blocked orders, orders pending buyer decision

MERCHANDISER DASHBOARD ADD:
- Assigned tech packs, drafts, submitted awaiting PM review
- Revision required, completed this week

STORE MANAGER DASHBOARD ADD:
- Need requests awaiting acceptance, purchase requests to create
- Assigned runners by status, purchases pending invoice, purchases rejected
- Completion blockers by order/style

RUNNER DASHBOARD ADD:
- Current task, awaiting accept, invoice pending, payment received
- Show-to-vendor pending, final tax invoice pending, completed recent tasks

CEO DASHBOARD ADD:
- Orders by stage, buyer-wise summary, delayed orders
- Production completed pending sign-off
- Expense trend, procurement trend, financial snapshot, exception snapshot

## 2I. Reporting V2 Requirements

KEEP ALL EXISTING REPORTS. ADD:

1. ORDER AGING REPORT — order no, buyer, order type, current stage, pending since, aging days, blocker, next action owner
2. STAGE TURNAROUND REPORT — average time in each stage by order type, buyer, PM
3. TECH PACK REVISION REPORT — order, buyer, merchandiser, revision count, latest status, completion time
4. MATERIAL CYCLE TIME REPORT — need request date through completion date with cycle time
5. PENDING PROVISIONAL INVOICE REPORT — purchase no, vendor, invoice date, runner, days pending final tax invoice
6. EXPENSE APPROVAL TAT REPORT — requester, category, order/style, approval TAT, payment TAT
7. PRODUCTION LEAD TIME REPORT — material completed through production completion with days in production, PM
8. SHIPPING RISK REPORT — order no, buyer, shipping date, current stage, risk level, blocker
9. AUDIT EXCEPTION REPORT — reopened, rejected, overdue approvals, missing documents, vendor mismatches
10. RUNNER PERFORMANCE REPORT V2 — assigned, accepted, completed, rejected, provisional pending tax invoice, avg completion time

REPORT UX:
- Filter panel on left/top, save filter, export current view
- Drill into source records, show totals and counts first
- Charts optional, tables primary

## 2J. Form UX Standards

FORM PRINCIPLES:
- Fast entry, minimal scrolling, linked-field auto population
- Inline validation, autosave drafts where applicable
- Smart defaults, inline create for masters
- Never lose user data accidentally

FORM LAYOUT STANDARD:
- Header summary panel > Primary fields > Related entity linking > Line items > Attachments > Remarks/notes
- Sticky action footer: [ Cancel ] [ Save Draft ] [ Submit ] depending on workflow

TABLE UX STANDARD:
- Sticky header, row click opens detail drawer
- Multi-column filtering, saved views, export current view
- Density toggle: compact / comfortable
- Column visibility toggle, pinned first columns on desktop

DETAIL DRAWER STANDARD — Every major record drawer shows:
- Current status, key identifiers, summary values, linked records
- Required documents, activity timeline, comments
- Audit trail button, quick actions based on role

## 2K. Notification & Reminder UX

NOTIFICATION CENTER:
- Unread count in top bar, grouped by entity type
- Filter by unread / assigned / mentions / approvals / reminders
- Mark as read, open linked record directly, batch mark read

REMINDER RULES:
- Manual reminder button on appropriate stages
- Auto reminders for: PM acceptance, merch acceptance, tech pack review, store acceptance, runner acceptance, invoice pending, final tax invoice pending, expense approval pending, order final sign-off pending

NOTIFICATION PREFERENCE (per user):
- In-app only, email only, or both
- Critical workflow notifications remain mandatory in-app

## 2L. Master Data UX

MASTER DATA MUST BE FAST TO MAINTAIN: Buyers, Vendors, Materials, Styles

ADD:
- Duplicate detection hints, active/inactive filter
- Merge duplicate flow for Accountant
- created_inline badge, recently used badge, usage count per entity
- Soft deactivate only
- Search + sort + import via Excel

IMPORT FEATURES (for Buyers, Vendors, Materials, Styles, Opening Orders):
- Downloadable import templates
- Validation preview before commit
- Row-wise error report
- Partial success allowed with clear logs

## 2M. Advanced Security & Safety UX

KEEP EXISTING SECURITY CONTROLS. ADD:
- Session timeout warning modal
- Suspicious duplicate submission prevention
- Disable submit button while mutation pending
- Idempotency guard on critical approve/pay/complete actions
- File preview access log for sensitive proof documents
- Mandatory reason on reopen / reject / cancel actions
- Destructive action confirmation with entity reference (e.g. "Confirm complete Order ORD-2026-0012")

FINANCIAL DATA SAFETY:
- Never render restricted finance fields in DOM for PM/MERCH
- Never send totals/rates/amounts in hidden JSON props to restricted roles
- Separate select queries by role
- Review exports for role-based data leakage

## 2N. Non-Functional Standards

USABILITY:
- Must be usable by office staff with low training
- Must be keyboard-friendly on desktop
- Must be mobile-usable for Runner
- Must keep actions obvious and predictable

MAINTAINABILITY:
- Clear folder structure, domain-based modules
- Reusable form primitives, reusable table primitives
- Central status config, central permission config, central notification event map

TESTING PRIORITY — Must include tests for:
- Role visibility rules, financial data stripping, runner lock
- Status transitions, reopen controls, document requirements
- Production readiness validation, final sign-off guard, duplicate invoice warning logic

DELIVERY PRIORITY:
1. Workflow correctness
2. List speed
3. Dashboard clarity
4. Approval speed
5. Report speed
6. Export quality
7. Polish

## 2O. Features Not To Build Now

DO NOT BUILD IN V1/V2 UNLESS EXPLICITLY REQUESTED:
- Multi-tenant, customer-facing portal, supplier portal
- Warehouse inventory ledger, manufacturing machine integration
- Barcode/QR workflow, WhatsApp automation
- Advanced AI forecasting, offline-first sync engine
- Multi-language system, multi-currency accounting engine
- Complex workflow builder UI

FOCUS ON: speed, clarity, accuracy, low maintenance, operational excellence
