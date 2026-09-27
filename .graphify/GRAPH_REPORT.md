# Graph Report - .  (2026-09-27)

## Corpus Check
- Corpus is ~13,659 words - fits in a single context window. You may not need a graph.

## Summary
- 261 nodes · 296 edges · 23 communities detected
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.67)
- Token cost: 0 input · 0 output
- Edge kinds: contains: 153 · imports: 35 · imports_from: 31 · references: 28 · calls: 17 · implements: 14 · conceptually_related_to: 7 · rationale_for: 5 · shares_data_with: 5 · semantically_similar_to: 1

## God Nodes (most connected - your core abstractions)
1. `cn()` - 12 edges
2. `Ticket Content Type` - 11 edges
3. `Implementation Phases 0-8 (Revised Timeline)` - 9 edges
4. `Row + Field-Level Authorization` - 6 edges
5. `BFF Auth Pattern (httpOnly JWT cookie)` - 6 edges
6. `Guarded Member Controller (anti privilege-escalation)` - 6 edges
7. `afterUpdate()` - 5 edges
8. `MVP Feature Set (Requested / Suggested / Out of Scope)` - 5 edges
9. `Kanban Board (drag-and-drop)` - 5 edges
10. `Definition of Done (MVP)` - 5 edges

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

### Community 0 - "Design Plan and Architecture"
Cohesion: 0.08
Nodes (38): Strapi CLI Workflow (develop / start / build / deploy), Strapi Default robots.txt (indexing left disabled), Next.js Scaffold Instructions (create-next-app), Vercel Deployment Path for Next.js, ActivityLog Content Type, BFF Auth Pattern (httpOnly JWT cookie), Comment Content Type (user-authored only), Dashboard Metrics (+30 more)

### Community 1 - "Base UI Primitives"
Cohesion: 0.09
Nodes (22): cn(), Badge(), BadgeProps, badgeVariants, Button, ButtonProps, buttonVariants, Card (+14 more)

### Community 2 - "Strapi Content Types and Plugins"
Cohesion: 0.07
Nodes (26): AdminApiToken, AdminApiTokenPermission, AdminPermission, AdminRole, AdminSession, AdminTransferToken, AdminTransferTokenPermission, AdminUser (+18 more)

### Community 3 - "Frontend Auth and Types"
Cohesion: 0.11
Nodes (11): RawStrapiUser, sanitizeUser(), AUTH_COOKIE_OPTIONS, isManager(), MANAGER_ROLE_TYPES, MediaFile, Role, ROLE_LABELS (+3 more)

### Community 4 - "App Shell and Navigation"
Cohesion: 0.17
Nodes (10): geistMono, geistSans, metadata, initials(), Nav(), NAV_LINKS, Providers(), Avatar (+2 more)

### Community 5 - "Role and Permission Seeding"
Cohesion: 0.22
Nodes (8): bootstrap(), CRUD, DEFAULT_ROLES, PERMISSION_MATRIX, READ, seedPermissions(), seedRoles(), SELF

### Community 6 - "Ticket Lifecycle Hooks"
Cohesion: 0.31
Nodes (9): afterCreate(), afterUpdate(), beforeUpdate(), currentActorId(), PrevSnapshot, resolveIdFromWhere(), toIso(), toStr() (+1 more)

### Community 7 - "Guarded Member Controller"
Cohesion: 0.33
Nodes (8): ASSIGNABLE_ROLES, deactivate(), generateTempPassword(), invite(), resolveUser(), toMember(), updateRole(), UserRecord

### Community 8 - "Dropdown Menu Primitive"
Cohesion: 0.22
Nodes (8): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuSubContent, DropdownMenuSubTrigger

### Community 9 - "Select Primitive"
Cohesion: 0.25
Nodes (7): SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger

### Community 10 - "Ticket Controller Logic"
Cohesion: 0.33
Nodes (2): MANAGER_ROLES, TICKET_POPULATE

### Community 11 - "Frontend Route Guard"
Cohesion: 0.40
Nodes (3): AUTH_ROUTES, config, PROTECTED_PREFIXES

### Community 12 - "Upload Plugin Config"
Cohesion: 0.50
Nodes (2): allowedMediaTypes, deniedTypes

### Community 13 - "Backend Brand Icon"
Cohesion: 1.00
Nodes (3): Browser Favicon / Web App Icon, Strapi Brand Identity, Strapi Logo Mark (favicon)

### Community 14 - "is-manager Policy"
Cohesion: 0.67
Nodes (1): MANAGER_ROLES

### Community 15 - "User Extension Sanitization"
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

### Community 32 - "Strapi Resource Links"
Cohesion: 1.00
Nodes (1): Strapi Official Resource Links

## Knowledge Gaps
- **98 isolated node(s):** `config`, `config`, `allowedMediaTypes`, `deniedTypes`, `ASSIGNABLE_ROLES` (+93 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Ticket Controller Logic`** (2 nodes): `MANAGER_ROLES`, `TICKET_POPULATE`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Upload Plugin Config`** (2 nodes): `allowedMediaTypes`, `deniedTypes`
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

- **Why does `cn()` connect `Base UI Primitives` to `App Shell and Navigation`, `Dropdown Menu Primitive`, `Select Primitive`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **What connects `config`, `config`, `allowedMediaTypes` to the rest of the system?**
  _98 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Design Plan and Architecture` be split into smaller, more focused modules?**
  _Cohesion score 0.07965860597439545 - nodes in this community are weakly interconnected._
- **Should `Base UI Primitives` be split into smaller, more focused modules?**
  _Cohesion score 0.09269162210338681 - nodes in this community are weakly interconnected._
- **Should `Strapi Content Types and Plugins` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._
- **Should `Frontend Auth and Types` be split into smaller, more focused modules?**
  _Cohesion score 0.10869565217391304 - nodes in this community are weakly interconnected._