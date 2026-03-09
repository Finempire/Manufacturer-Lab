# Manufacturer Lab — Project Guidelines

## A. Product Scope Guard

SINGLE-COMPANY SCOPE:
- This is not multi-tenant.
- Only one company will use the system.
- Expected active users: ~20.
- Optimize for speed, clarity, and low maintenance.
- Prefer simpler architecture over enterprise overengineering.
- Do not add multi-company abstractions unless explicitly requested.

## B. UX Standards

UI / UX PRINCIPLES:
- Dry, professional, operations-first interface
- Fast list + detail-drawer workflow
- Minimize full page reloads
- Every dashboard must show "what needs action now"
- Every record must show current status, blocker, next owner, pending since
- Use saved filters, global search, quick actions, keyboard-friendly tables
- Runner UI must be mobile-first with sticky bottom actions
- Accountant UI must optimize approval speed and financial control
- PM / Store Manager UI must optimize operational throughput
- CEO UI must remain read-only and summary-first

## C. Performance Standards

PERFORMANCE REQUIREMENTS:
- Server-rendered list pages with pagination
- Global search across Orders, Buyers, Styles, Vendors, Purchases, Expenses
- Dashboard counts must use optimized aggregate queries or summary tables
- Heavy reports must use cached queries or precomputed summaries
- Avoid N+1 query patterns
- Use optimistic updates only for non-sensitive UX actions
- Financial approvals and status transitions must always use server-confirmed state

## D. Advanced Operational Controls

ADVANCED OPERATIONAL FEATURES:
- Add Action Inbox per role
- Add stage aging and SLA tracking
- Add blocker reasons and next_action_owner fields
- Add structured exception flags
- Add reopen workflow with Accountant-only control and mandatory reason
- Add duplicate invoice / duplicate expense detection
- Add report scheduler for Accountant and CEO
- Add internal comments and mentions on workflow entities
- Add tech pack templates and material/BOM presets
