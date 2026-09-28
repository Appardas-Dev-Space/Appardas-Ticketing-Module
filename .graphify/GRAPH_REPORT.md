# Graph Report - .  (2026-09-28)

## Corpus Check
- Corpus is ~22,665 words - fits in a single context window. You may not need a graph.

## Summary
- 392 nodes · 738 edges · 24 communities detected
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.67)
- Token cost: 0 input · 0 output
- Edge kinds: contains: 265 · imports: 257 · imports_from: 132 · references: 28 · calls: 24 · implements: 14 · conceptually_related_to: 7 · rationale_for: 5 · shares_data_with: 5 · semantically_similar_to: 1

## God Nodes (most connected - your core abstractions)
1. `cn()` - 18 edges
2. `Ticket` - 12 edges
3. `Ticket Content Type` - 11 edges
4. `Button` - 10 edges
5. `TicketStatus` - 9 edges
6. `Implementation Phases 0-8 (Revised Timeline)` - 9 edges
7. `Badge()` - 8 edges
8. `Card` - 8 edges
9. `CardContent` - 8 edges
10. `Member` - 8 edges

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

## Communities

### Community 0 - "Kanban Board Components"
Cohesion: 0.06
Nodes (42): DeadlineBadge(), DeadlineBadgeProps, Columns, KanbanBoard(), KanbanBoardProps, KanbanColumn(), KanbanColumnProps, initials() (+34 more)

### Community 1 - "Client Data and Forms"
Cohesion: 0.07
Nodes (39): TicketFormDialog(), TicketFormDialogProps, apiFetch(), InviteMemberResult, InviteMemberValues, ticketDetailQuery(), TicketMove, useCreateTicket() (+31 more)

### Community 2 - "Dashboard Components"
Cohesion: 0.09
Nodes (26): ActivityFeed(), ActivityFeedProps, Distribution(), PRIORITY_COLOR, Row, STATUS_COLOR, activeSprintSummary(), KpiCards() (+18 more)

### Community 3 - "Design Plan and Architecture"
Cohesion: 0.08
Nodes (38): Strapi CLI Workflow (develop / start / build / deploy), Strapi Default robots.txt (indexing left disabled), Next.js Scaffold Instructions (create-next-app), Vercel Deployment Path for Next.js, ActivityLog Content Type, BFF Auth Pattern (httpOnly JWT cookie), Comment Content Type (user-authored only), Dashboard Metrics (+30 more)

### Community 4 - "App Shell and Navigation"
Cohesion: 0.08
Nodes (25): geistMono, geistSans, metadata, initials(), Nav(), NAV_LINKS, Providers(), isManager() (+17 more)

### Community 5 - "Strapi Content Types and Plugins"
Cohesion: 0.07
Nodes (26): AdminApiToken, AdminApiTokenPermission, AdminPermission, AdminRole, AdminSession, AdminTransferToken, AdminTransferTokenPermission, AdminUser (+18 more)

### Community 6 - "Board Page and Filters"
Cohesion: 0.15
Nodes (12): BoardFilters, DEFAULT_FILTERS, FilterBar(), FilterBarProps, useMembers(), useTickets(), TICKET_TYPES, useSession() (+4 more)

### Community 7 - "Frontend Auth and Route Guard"
Cohesion: 0.14
Nodes (6): AUTH_ROUTES, config, PROTECTED_PREFIXES, RawStrapiUser, sanitizeUser(), AUTH_COOKIE_OPTIONS

### Community 8 - "Role and Permission Seeding"
Cohesion: 0.22
Nodes (8): bootstrap(), CRUD, DEFAULT_ROLES, PERMISSION_MATRIX, READ, seedPermissions(), seedRoles(), SELF

### Community 9 - "Ticket Lifecycle Hooks"
Cohesion: 0.31
Nodes (9): afterCreate(), afterUpdate(), beforeUpdate(), currentActorId(), PrevSnapshot, resolveIdFromWhere(), toIso(), toStr() (+1 more)

### Community 10 - "Guarded Member Controller"
Cohesion: 0.33
Nodes (8): ASSIGNABLE_ROLES, deactivate(), generateTempPassword(), invite(), resolveUser(), toMember(), updateRole(), UserRecord

### Community 11 - "Ticket Controller Logic"
Cohesion: 0.22
Nodes (6): findOne(), MANAGER_ROLES, TICKET_DETAIL_POPULATE, TICKET_POPULATE, update(), USER_FIELDS

### Community 12 - "Upload Plugin Config"
Cohesion: 0.50
Nodes (2): allowedMediaTypes, deniedTypes

### Community 13 - "ActivityLog Controller"
Cohesion: 0.67
Nodes (1): USER_FIELDS

### Community 14 - "Backend Brand Icon"
Cohesion: 1.00
Nodes (3): Browser Favicon / Web App Icon, Strapi Brand Identity, Strapi Logo Mark (favicon)

### Community 15 - "is-manager Policy"
Cohesion: 0.67
Nodes (1): MANAGER_ROLES

### Community 16 - "User Extension Sanitization"
Cohesion: 0.67
Nodes (1): AnyUser

### Community 20 - "API Server Config"
Cohesion: 1.00
Nodes (1): config

### Community 22 - "Middleware Stack Config"
Cohesion: 1.00
Nodes (1): config

### Community 25 - "Next.js Build Config"
Cohesion: 1.00
Nodes (1): nextConfig

### Community 26 - "Next.js Type Declarations"
Cohesion: 1.00
Nodes (1): NOTE: This file should not be edited

### Community 27 - "PostCSS Pipeline Config"
Cohesion: 1.00
Nodes (1): config

### Community 28 - "Tailwind Theme Config"
Cohesion: 1.00
Nodes (1): config

### Community 30 - "Strapi Resource Links"
Cohesion: 1.00
Nodes (1): Strapi Official Resource Links

## Knowledge Gaps
- **119 isolated node(s):** `config`, `config`, `allowedMediaTypes`, `deniedTypes`, `USER_FIELDS` (+114 more)
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

- **Why does `cn()` connect `App Shell and Navigation` to `Kanban Board Components`, `Dashboard Components`, `Client Data and Forms`, `Board Page and Filters`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `Ticket` connect `Dashboard Components` to `Kanban Board Components`, `Board Page and Filters`, `Client Data and Forms`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Why does `SessionUser` connect `Client Data and Forms` to `Kanban Board Components`, `Frontend Auth and Route Guard`, `Board Page and Filters`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **What connects `config`, `config`, `allowedMediaTypes` to the rest of the system?**
  _119 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Kanban Board Components` be split into smaller, more focused modules?**
  _Cohesion score 0.06077694235588972 - nodes in this community are weakly interconnected._
- **Should `Client Data and Forms` be split into smaller, more focused modules?**
  _Cohesion score 0.07039187227866474 - nodes in this community are weakly interconnected._
- **Should `Dashboard Components` be split into smaller, more focused modules?**
  _Cohesion score 0.09059233449477352 - nodes in this community are weakly interconnected._