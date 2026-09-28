# Graph Report - .  (2026-09-28)

## Corpus Check
- Corpus is ~25,847 words - fits in a single context window. You may not need a graph.

## Summary
- 459 nodes · 836 edges · 27 communities detected
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output
- Edge kinds: contains: 284 · imports: 257 · imports_from: 132 · references: 76 · calls: 35 · implements: 22 · rationale_for: 13 · conceptually_related_to: 9 · shares_data_with: 7 · semantically_similar_to: 1

## God Nodes (most connected - your core abstractions)
1. `cn()` - 18 edges
2. `Strapi v5 Backend (Render Web Service / Railway / VPS)` - 16 edges
3. `Ticket` - 12 edges
4. `Ticket Content Type` - 11 edges
5. `Button` - 10 edges
6. `TicketStatus` - 9 edges
7. `Implementation Phases 0-8 (Revised Timeline)` - 9 edges
8. `Badge()` - 8 edges
9. `Card` - 8 edges
10. `CardContent` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Strapi Default robots.txt (indexing left disabled)` --semantically_similar_to--> `BFF Auth Pattern (httpOnly JWT cookie)`  [INFERRED] [semantically similar]
  /Users/sebastianrafaellachica/codingprojects/Appardas/Appardas-Ticketing-Module/backend/public/robots.txt → /Users/sebastianrafaellachica/codingprojects/Appardas/Appardas-Ticketing-Module/IMPLEMENTATION_PLAN.md
- `Strapi CLI Workflow (develop / start / build / deploy)` --implements--> `Appardas Ticketing Module Implementation Plan (v2 Hardened)`  [INFERRED]
  /Users/sebastianrafaellachica/codingprojects/Appardas/Appardas-Ticketing-Module/backend/README.md → /Users/sebastianrafaellachica/codingprojects/Appardas/Appardas-Ticketing-Module/IMPLEMENTATION_PLAN.md
- `Strapi Default robots.txt (indexing left disabled)` --conceptually_related_to--> `Appardas Ticketing Module Implementation Plan (v2 Hardened)`  [INFERRED]
  /Users/sebastianrafaellachica/codingprojects/Appardas/Appardas-Ticketing-Module/backend/public/robots.txt → /Users/sebastianrafaellachica/codingprojects/Appardas/Appardas-Ticketing-Module/IMPLEMENTATION_PLAN.md
- `Next.js Scaffold Instructions (create-next-app)` --implements--> `Appardas Ticketing Module Implementation Plan (v2 Hardened)`  [INFERRED]
  /Users/sebastianrafaellachica/codingprojects/Appardas/Appardas-Ticketing-Module/frontend/README.md → /Users/sebastianrafaellachica/codingprojects/Appardas/Appardas-Ticketing-Module/IMPLEMENTATION_PLAN.md
- `Vercel Deployment Path for Next.js` --references--> `Per-Role QA Test Matrix`  [INFERRED]
  /Users/sebastianrafaellachica/codingprojects/Appardas/Appardas-Ticketing-Module/frontend/README.md → /Users/sebastianrafaellachica/codingprojects/Appardas/Appardas-Ticketing-Module/IMPLEMENTATION_PLAN.md

## Hyperedges (group relationships)
- **Row + Field-Level Ticket Authorization Flow** — implementation_plan_users_permissions_plugin, implementation_plan_row_field_authorization, implementation_plan_is_manager_policy, implementation_plan_ticket_content_type, implementation_plan_roles_permissions_model [EXTRACTED 0.90]
- **BFF Auth Pipeline (login -> cookie -> guarded proxy)** — implementation_plan_bff_auth_pattern, implementation_plan_middleware_route_guard, implementation_plan_users_permissions_plugin, implementation_plan_document_service [EXTRACTED 0.85]
- **Kanban Ordering & Client Data Stack** — implementation_plan_kanban_board, implementation_plan_fractional_indexing, implementation_plan_tanstack_query, implementation_plan_shadcn_ui, implementation_plan_ticket_content_type [EXTRACTED 0.90]
- **Server-side BFF proxy security model** — deployment_bff_proxy, deployment_auth_cookie, deployment_bearer_header, deployment_no_browser_strapi_traffic [EXTRACTED 1.00]
- **Production auth cookie hardening (Secure/SameSite over HTTPS)** — deployment_auth_cookie_options, deployment_secure_flag_production, deployment_samesite_lax, deployment_https_required [EXTRACTED 1.00]
- **Post-deploy QA: health check, RBAC verification, operational scripts** — deployment_verification, deployment_health_check, deployment_test_rbac, deployment_operational_scripts [EXTRACTED 1.00]

## Communities

### Community 0 - "Board Page and Navigation"
Cohesion: 0.05
Nodes (44): BoardFilters, DEFAULT_FILTERS, FilterBar(), FilterBarProps, initials(), Nav(), NAV_LINKS, useAddComment() (+36 more)

### Community 1 - "Client Data and Forms"
Cohesion: 0.07
Nodes (43): TicketFormDialog(), TicketFormDialogProps, apiFetch(), InviteMemberResult, InviteMemberValues, ticketDetailQuery(), TicketMove, useCreateTicket() (+35 more)

### Community 2 - "Deployment Topology and Secrets"
Cohesion: 0.07
Nodes (46): First admin created via Strapi /admin panel, httpOnly `token` cookie, AUTH_COOKIE_OPTIONS (lib/config.ts), app/api/auth/login/route.ts, app/api/auth/logout/route.ts, Backend environment variables (APP_KEYS, API_TOKEN_SALT, ADMIN_JWT_SECRET, TRANSFER_TOKEN_SALT, JWT_SECRET, ENCRYPTION_KEY, DATABASE_*, HOST, PORT), Authorization: Bearer header attachment, Next.js BFF Proxy (app/api/[...proxy]) (+38 more)

### Community 3 - "Dashboard Components"
Cohesion: 0.09
Nodes (26): ActivityFeed(), ActivityFeedProps, Distribution(), PRIORITY_COLOR, Row, STATUS_COLOR, activeSprintSummary(), KpiCards() (+18 more)

### Community 4 - "Design Plan and Architecture"
Cohesion: 0.08
Nodes (38): Strapi CLI Workflow (develop / start / build / deploy), Strapi Default robots.txt (indexing left disabled), Next.js Scaffold Instructions (create-next-app), Vercel Deployment Path for Next.js, ActivityLog Content Type, BFF Auth Pattern (httpOnly JWT cookie), Comment Content Type (user-authored only), Dashboard Metrics (+30 more)

### Community 5 - "Kanban Board Components"
Cohesion: 0.09
Nodes (27): DeadlineBadge(), DeadlineBadgeProps, Columns, KanbanBoard(), KanbanBoardProps, KanbanColumn(), KanbanColumnProps, initials() (+19 more)

### Community 6 - "Strapi Content Types and Plugins"
Cohesion: 0.07
Nodes (26): AdminApiToken, AdminApiTokenPermission, AdminPermission, AdminRole, AdminSession, AdminTransferToken, AdminTransferTokenPermission, AdminUser (+18 more)

### Community 7 - "Frontend Auth and Route Guard"
Cohesion: 0.14
Nodes (6): AUTH_ROUTES, config, PROTECTED_PREFIXES, RawStrapiUser, sanitizeUser(), AUTH_COOKIE_OPTIONS

### Community 8 - "RBAC Verification Harness"
Cohesion: 0.22
Nodes (12): api(), c, login(), main(), ok2xx(), printTable(), record(), Result (+4 more)

### Community 9 - "Role and Permission Seeding"
Cohesion: 0.22
Nodes (8): bootstrap(), CRUD, DEFAULT_ROLES, PERMISSION_MATRIX, READ, seedPermissions(), seedRoles(), SELF

### Community 10 - "Ticket Lifecycle Hooks"
Cohesion: 0.31
Nodes (9): afterCreate(), afterUpdate(), beforeUpdate(), currentActorId(), PrevSnapshot, resolveIdFromWhere(), toIso(), toStr() (+1 more)

### Community 11 - "Guarded Member Controller"
Cohesion: 0.33
Nodes (8): ASSIGNABLE_ROLES, deactivate(), generateTempPassword(), invite(), resolveUser(), toMember(), updateRole(), UserRecord

### Community 12 - "Ticket Controller Logic"
Cohesion: 0.22
Nodes (6): findOne(), MANAGER_ROLES, TICKET_DETAIL_POPULATE, TICKET_POPULATE, update(), USER_FIELDS

### Community 13 - "App Shell and Providers"
Cohesion: 0.29
Nodes (4): geistMono, geistSans, metadata, Providers()

### Community 14 - "Demo Data Seed Script"
Cohesion: 0.36
Nodes (7): dateOnly(), daysFromNow(), hoursFromNow(), LABELS, run(), SeedUser, USERS

### Community 15 - "Upload Plugin Config"
Cohesion: 0.50
Nodes (2): allowedMediaTypes, deniedTypes

### Community 16 - "ActivityLog Controller"
Cohesion: 0.67
Nodes (1): USER_FIELDS

### Community 17 - "Backend Brand Icon"
Cohesion: 1.00
Nodes (3): Browser Favicon / Web App Icon, Strapi Brand Identity, Strapi Logo Mark (favicon)

### Community 18 - "is-manager Policy"
Cohesion: 0.67
Nodes (1): MANAGER_ROLES

### Community 19 - "User Extension Sanitization"
Cohesion: 0.67
Nodes (1): AnyUser

### Community 23 - "API Server Config"
Cohesion: 1.00
Nodes (1): config

### Community 25 - "Middleware Stack Config"
Cohesion: 1.00
Nodes (1): config

### Community 28 - "Next.js Build Config"
Cohesion: 1.00
Nodes (1): nextConfig

### Community 29 - "Next.js Type Declarations"
Cohesion: 1.00
Nodes (1): NOTE: This file should not be edited

### Community 30 - "PostCSS Pipeline Config"
Cohesion: 1.00
Nodes (1): config

### Community 31 - "Tailwind Theme Config"
Cohesion: 1.00
Nodes (1): config

### Community 33 - "Strapi Resource Links"
Cohesion: 1.00
Nodes (1): Strapi Official Resource Links

## Knowledge Gaps
- **143 isolated node(s):** `config`, `config`, `allowedMediaTypes`, `deniedTypes`, `SeedUser` (+138 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Upload Plugin Config`** (2 nodes): `allowedMediaTypes`, `deniedTypes`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ActivityLog Controller`** (1 nodes): `USER_FIELDS`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `is-manager Policy`** (1 nodes): `MANAGER_ROLES`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `User Extension Sanitization`** (1 nodes): `AnyUser`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `API Server Config`** (1 nodes): `config`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Middleware Stack Config`** (1 nodes): `config`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next.js Build Config`** (1 nodes): `nextConfig`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next.js Type Declarations`** (1 nodes): `NOTE: This file should not be edited`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `PostCSS Pipeline Config`** (1 nodes): `config`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Tailwind Theme Config`** (1 nodes): `config`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Strapi Resource Links`** (1 nodes): `Strapi Official Resource Links`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Board Page and Navigation` to `Kanban Board Components`, `Dashboard Components`, `Client Data and Forms`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `Ticket` connect `Dashboard Components` to `Kanban Board Components`, `Board Page and Navigation`, `Client Data and Forms`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Strapi v5 Backend (Render Web Service / Railway / VPS)` (e.g. with `Deployment order: Postgres, then Strapi, then Next.js` and `npm run seed (backend/scripts/seed.ts) - idempotent demo data population`) actually correct?**
  _`Strapi v5 Backend (Render Web Service / Railway / VPS)` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `config`, `config`, `allowedMediaTypes` to the rest of the system?**
  _143 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Board Page and Navigation` be split into smaller, more focused modules?**
  _Cohesion score 0.05311676909569798 - nodes in this community are weakly interconnected._
- **Should `Client Data and Forms` be split into smaller, more focused modules?**
  _Cohesion score 0.06766917293233082 - nodes in this community are weakly interconnected._
- **Should `Deployment Topology and Secrets` be split into smaller, more focused modules?**
  _Cohesion score 0.06859903381642513 - nodes in this community are weakly interconnected._