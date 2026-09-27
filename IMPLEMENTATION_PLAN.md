# Appardas Ticketing Module — Implementation Plan (v2, Hardened)

> A concrete, phase-based plan to build a ticketing system using Strapi v5 (backend/admin), Next.js 14 + Tailwind (frontend), and PostgreSQL.
>
> **v2 changes:** custom RBAC policies (row + field-level), guarded member management, BFF auth pattern, Strapi v5 Document Service, fractional-index ordering, explicit ActivityLog, TanStack Query + shadcn/ui, revised timeline.

---

## 1. Objective

Build an internal **agile ticketing module** where a Scrum Master and Lead Dev manage tickets, members, and deadlines. The system exposes a Strapi backend (data + admin + REST API) consumed by a Next.js frontend styled with Tailwind.

---

## 2. Stack Overview

| Layer | Technology | Role |
|-------|-----------|------|
| Database | PostgreSQL | Persistent storage (Strapi default) |
| Backend + Admin | **Strapi v5** | Content modeling, REST API, **Document Service**, custom policies/controllers |
| Frontend | Next.js 14 (App Router) | User-facing ticketing UI + **BFF auth proxy** |
| Styling | Tailwind CSS + **shadcn/ui** (Radix) | Utility styling + accessible primitives |
| Client data | **TanStack Query** | Optimistic mutations, cache sync for Kanban |
| Auth | Strapi Users & Permissions + **custom policies** | JWT + role gating + row/field authorization |

---

## 3. Roles & Permissions Model

| Role | Capabilities |
|------|-------------|
| **Scrum Master** | Full CRUD on tickets, members, sprints; assign work; manage deadlines |
| **Lead Dev** | Full CRUD on tickets; assign devs; update status; manage deadlines |
| **Developer** | Read tickets; update **only `status` + comments** on **assigned** tickets |
| **Viewer** (optional) | Read-only access to boards |

> ⚠️ **Critical:** Strapi's Users & Permissions plugin only gates access at the **controller-action level** (a role can call `ticket.update` or it cannot). It does **not** natively enforce:
> - **Row-level** authorization (`ticket.assignee.id === user.id`)
> - **Field-level** authorization (Developer may change `status` but not `deadline`, `title`, or `assignee`)
>
> These MUST be implemented as **custom policies/controllers** (see §7 and §11). Plugin permissions alone are insufficient and will leak write access.

---

## 4. MVP Feature Set

### 4.1 Requested (core)

1. **CRUD Tickets** — create/delete restricted to Scrum Master & Lead Dev; assigned devs may update `status` only (enforced by custom controller).
2. **CRUD Manage Members** — invite, edit role, deactivate — via a **dedicated guarded controller**, never default user CRUD.
3. **Deadline Management** — UTC-stored due dates, overdue/due-soon flags, deadline sorting/filtering.

### 4.2 Suggested (high value, low cost)

| Feature | Why it matters |
|---------|---------------|
| **Kanban Board** (drag-and-drop) | Core agile UX; needs optimistic updates + fractional ordering |
| **Ticket Priority** (Low/Med/High/Critical) | Triage and sorting |
| **Ticket Types** (Bug / Feature / Task / Story) | Categorization |
| **Assignee & Reporter** | Accountability |
| **Comments + Activity Log** | Collaboration + **audit trail** (see §5.3 / §5.6) |
| **Labels / Tags** | Flexible grouping and filtering |
| **Sprints / Milestones** | Time-boxed cycles |
| **Search & Filter** | Find by status, assignee, priority, deadline |
| **Dashboard Metrics** | Open vs closed, overdue count, per-member load |
| **Notifications** (in-app or email) | Deadline reminders, assignment alerts |
| **File Attachments** | Screenshots, specs (Strapi media library) |

### 4.3 Out of scope for MVP (backlog)

- Time tracking / burndown charts
- Third-party integrations (Slack, GitHub)
- Custom workflows per project
- Multi-project / multi-team tenancy
- SMTP email invites (use direct-add + temp password for MVP — see §7 Phase 6)

---

## 5. Data Model (Strapi v5 Content Types)

> **Strapi v5 note:** Use the **Document Service API** (`strapi.documents('api::ticket.ticket')`), not the deprecated v4 Entity Service. Relational operations key off **`documentId` (string)**, not the integer `id`. Design routes and frontend fetches around `documentId`.

### 5.1 `Ticket`

| Field | Type | Notes |
|-------|------|-------|
| `title` | String | required |
| `description` | **Markdown (Text)** or Blocks | See rich-text decision in §10 |
| `status` | Enum | `backlog`, `todo`, `in_progress`, `in_review`, `done` |
| `priority` | Enum | `low`, `medium`, `high`, `critical` |
| `type` | Enum | `bug`, `feature`, `task`, `story` |
| `deadline` | DateTime | nullable, **stored UTC (ISO 8601)** |
| `assignee` | Relation → User | many-to-one |
| `reporter` | Relation → User | many-to-one, set server-side on create |
| `sprint` | Relation → Sprint | many-to-one, nullable |
| `labels` | Relation → Label | many-to-many |
| `attachments` | Media | multiple |
| `comments` | Relation → Comment | one-to-many |
| `activities` | Relation → ActivityLog | one-to-many |
| `rank` | **String** | **fractional index** for board ordering (see §5.5) |

### 5.2 `Sprint`

| Field | Type | Notes |
|-------|------|-------|
| `name` | String | required |
| `goal` | Text | |
| `startDate` | Date | |
| `endDate` | Date | |
| `status` | Enum | `planned`, `active`, `completed` |
| `tickets` | Relation → Ticket | one-to-many |

### 5.3 `Comment` (user-authored only)

| Field | Type | Notes |
|-------|------|-------|
| `body` | Text | required |
| `author` | Relation → User | |
| `ticket` | Relation → Ticket | |

### 5.4 `Label`

| Field | Type | Notes |
|-------|------|-------|
| `name` | String | required, unique |
| `color` | String | hex value |

### 5.5 `Ticket.rank` — Fractional Indexing (ordering)

- **Do not** use sequential integers (`1, 2, 3…`). Inserting/moving a card would require `O(N)` cascading writes across the column.
- Store `rank` as a **string fractional index**. Moving a card = compute a key between its new neighbors → **single `O(1)` update**.
- Library: [`fractional-indexing`](https://www.npmjs.com/package/fractional-indexing) (`generateKeyBetween(a, b)`).
- Ordering query: `sort=rank:asc`. Sort within a column client-side is stable and lexicographic.

### 5.6 `ActivityLog` (system events / audit trail)

The MVP requires an audit trail. Model system events explicitly rather than overloading `Comment`.

| Field | Type | Notes |
|-------|------|-------|
| `action` | Enum | `created`, `status_changed`, `assigned`, `deadline_changed`, `priority_changed` |
| `fromValue` | String | nullable |
| `toValue` | String | nullable |
| `actor` | Relation → User | who performed it |
| `ticket` | Relation → Ticket | |

> Written automatically from Strapi **lifecycle hooks / custom controller** on ticket mutations — never client-supplied.
>
> *Alternative:* add `type: 'user' | 'system'` to `Comment` and keep one stream. Explicit `ActivityLog` is cleaner for filtering/audit and is the recommended path.

### 5.7 User (extend built-in `users-permissions.user`)

Add fields: `displayName`, `avatar` (media), `title` (job title), `isActive` (boolean).

---

## 6. Architecture — BFF Auth Pattern

Strapi's `/api/auth/local` returns the JWT **in the JSON response body** (not a cookie). The frontend must convert that into an httpOnly cookie. Proxy all traffic through Next.js Route Handlers / Server Actions to make the JWT httpOnly-invisible to client JS and to eliminate cross-origin CORS between `localhost:3000` and `localhost:1337`.

```
┌────────────────────────────┐                         ┌──────────────────────┐
│      Next.js (BFF)         │   server-side fetch     │   Strapi Backend     │
│                            │  with Authorization:    │  (API + custom       │
│  /api/auth/login  ────────▶│  Bearer <jwt from       │   policies/controllers)│
│   route handler            │  httpOnly cookie)  ────▶ │                      │
│  /api/tickets/*  (proxy)   │                         └───────────┬──────────┘
│  server actions (mutate)   │                                     │
│                            │                                     ▼
│  sets httpOnly cookie:     │                          ┌──────────────────┐
│  Secure, SameSite=Lax      │                          │   PostgreSQL     │
└──────────────┬─────────────┘                          └──────────────────┘
               │  browser holds cookie only (no JWT in JS)
               ▼
   Tailwind + shadcn/ui  (Kanban via TanStack Query optimistic mutations)
```

**Auth flow:**
1. Client posts credentials to Next.js `/api/auth/login` (Route Handler).
2. Handler calls Strapi `/api/auth/local`, receives `{ jwt, user }`.
3. Handler sets `cookies().set('token', jwt, { httpOnly: true, secure: true, sameSite: 'lax' })`.
4. All subsequent reads/writes go through Next.js proxy handlers / server actions that attach `Authorization: Bearer <token>` server-side.
5. `middleware.ts` guards protected routes by checking cookie presence; role-aware UI reads `user` from a session endpoint.

> This eliminates CORS credential headaches and keeps the JWT out of client-accessible storage.

---

## 7. Implementation Phases (Revised Timeline)

### Phase 0 — Environment Setup (0.5 day)
- [ ] PostgreSQL (local or Docker).
- [ ] `npx create-strapi-app@latest backend --dbclient=postgres` (v5).
- [ ] `npx create-next-app@latest frontend --typescript --tailwind --app`.
- [ ] `npx shadcn@latest init` in frontend; install `@tanstack/react-query`, `@dnd-kit/core`, `fractional-indexing`.
- [ ] Optional `docker-compose.yml` for Postgres + Strapi.

### Phase 1 — Backend Data Modeling (1–2 days)
- [ ] Content types: `Ticket`, `Sprint`, `Comment`, `Label`, **`ActivityLog`**.
- [ ] Extend `User`.
- [ ] Define relations; `rank` as String.
- [ ] Seed enums + sample data (with valid fractional ranks).

### Phase 2 — Auth & Custom RBAC (**2–3 days**, was 1–2)
- [ ] Configure roles: Scrum Master, Lead Dev, Developer, Viewer.
- [ ] Set coarse plugin permissions per content type.
- [ ] **Custom policy `is-manager`** (`scrum_master` | `lead_dev`) for create/delete.
- [ ] **Custom `ticket.update` controller** implementing row + field-level auth (see §11.A).
- [ ] **Custom member controller** — no default user CRUD exposure (see §11.B).
- [ ] Test JWT login + each role's write boundaries via API.

### Phase 3 — Core API Behaviors (**2 days**)
- [ ] Auto-set `reporter` on create (server-side).
- [ ] Lifecycle hooks: write `ActivityLog` entries on status/assignee/deadline/priority change.
- [ ] `rank` assignment on create (append to column end).
- [ ] Overdue filter endpoint (`deadline < now && status != done`).

### Phase 4 — Frontend Foundation + BFF (**1.5 days**)
- [ ] Tailwind tokens + shadcn/ui setup (Dialog, Select, DropdownMenu, Avatar, Badge, DatePicker).
- [ ] BFF: `/api/auth/login`, `/api/auth/logout`, session route, proxy handlers.
- [ ] `middleware.ts` route guard; role-aware nav.
- [ ] TanStack Query provider + typed API client.

### Phase 5 — Ticketing UI (**3–4 days**, was 2–3)
- [ ] **Kanban** with `@dnd-kit` + **optimistic updates** via TanStack Query.
- [ ] Fractional-index recompute on drop; background sync to Strapi.
- [ ] Edge cases: drag cancellation, keyboard navigation, empty columns.
- [ ] Ticket create/edit modal (role-gated via shadcn `Dialog`).
- [ ] Ticket detail: comments, attachments, **activity log** stream.
- [ ] Filters: status, priority, assignee, deadline.
- [ ] Deadline badges (overdue / due-soon / on-track) in **local timezone**.

### Phase 6 — Member Management (**1 day**)
- [ ] Members list (Scrum Master / Lead Dev only).
- [ ] **MVP invite = direct-add with temp password** (no SMTP dependency).
- [ ] Edit role (bounded — cannot self-escalate), deactivate (`isActive=false`).
- [ ] Per-member workload view.

### Phase 7 — Dashboard & Polish (1–2 days)
- [ ] Metrics: open/closed, overdue, per-member load.
- [ ] Empty states, skeletons, error handling.
- [ ] Responsive pass (mobile Kanban → list view).

### Phase 8 — QA & Deploy (1–2 days)
- [ ] Seed script.
- [ ] **Per-role test matrix** (verify field/row auth cannot be bypassed).
- [ ] Env config; deploy Strapi (Render/Railway/VPS) + Postgres; Next.js (Vercel).

> **Revised MVP timeline: ~13–17 working days** (single dev). RBAC and Kanban DnD are the primary risk areas.

---

## 8. Deadline Management — Concrete Approach

1. **Storage:** `deadline` DateTime stored as **UTC ISO 8601** in PostgreSQL.
2. **Display:** format in the **user's browser local timezone** (e.g., `Intl.DateTimeFormat` / date-fns-tz). Never render raw UTC to users.
3. **Overdue query:** `?filters[deadline][$lt]=<nowUTC>&filters[status][$ne]=done`.
4. **UI states:** overdue → red; due within 48h → amber; on track → neutral (shadcn `Badge`).
5. **Reminders (MVP+):** Strapi `node-cron` daily job finds due-soon tickets → in-app notification (email deferred to backlog).

---

## 9. Suggested Repository Structure

```
Appardas-Ticketing-Module/
├── backend/                          # Strapi v5
│   ├── src/api/ticket/
│   │   ├── controllers/ticket.ts     # custom update: row + field auth
│   │   ├── content-types/            # lifecycle hooks → ActivityLog
│   │   └── routes/
│   ├── src/api/member/               # guarded invite/role/deactivate
│   ├── src/api/sprint/
│   ├── src/api/comment/
│   ├── src/api/label/
│   ├── src/api/activity-log/
│   └── src/policies/is-manager.ts
├── frontend/                         # Next.js + Tailwind + shadcn/ui
│   ├── app/
│   │   ├── api/auth/login/route.ts   # BFF: sets httpOnly cookie
│   │   ├── api/[...proxy]/route.ts   # BFF: attaches Bearer server-side
│   │   ├── (auth)/login/
│   │   ├── board/                    # TanStack Query + dnd-kit
│   │   ├── tickets/[documentId]/
│   │   ├── members/
│   │   └── dashboard/
│   ├── components/ui/                # shadcn primitives
│   ├── lib/api.ts
│   └── middleware.ts
├── docker-compose.yml
├── IMPLEMENTATION_PLAN.md
└── README.md
```

---

## 10. Key Technical Decisions

| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| API style | **REST** for MVP | GraphQL optional later |
| Strapi version / data layer | **v5 + Document Service** (`documentId`) | Entity Service deprecated |
| Auth transport | **BFF proxy + httpOnly cookie** | JWT returned in body; proxy kills CORS + XSS exposure |
| Board ordering | **Fractional indexing (string `rank`)** | `O(1)` moves vs `O(N)` integer reindex |
| Drag-and-drop | `@dnd-kit/core` | Accessible, keyboard-capable |
| Client data | **TanStack Query** (optimistic) | Zero-flicker Kanban vs `router.refresh()` |
| UI primitives | **shadcn/ui (Radix + Tailwind)** | Dialog/Select/DropdownMenu/DatePicker out of the box |
| Rich text (`description`) | **Markdown + `react-markdown`** for MVP | Simpler than Blocks AST; switch to Blocks + `@strapi/blocks-react-renderer` if structured content needed |
| Audit trail | **Explicit `ActivityLog` type** | Cleaner filtering/audit than overloading comments |
| Member invite | **Direct-add + temp password** | Avoids SMTP dependency for MVP |

---

## 11. Security — Custom Authorization (mandatory)

### 11.A Row + Field-Level Ticket Authorization

Plugin permissions cannot express "assignee may change only `status`." Implement a **custom `ticket.update` controller**:

```typescript
// src/api/ticket/controllers/ticket.ts
import { factories } from '@strapi/strapi';

const MANAGER_ROLES = ['scrum_master', 'lead_dev'];

export default factories.createCoreController('api::ticket.ticket', ({ strapi }) => ({
  async update(ctx) {
    const user = ctx.state.user;
    const { id: documentId } = ctx.params; // Strapi v5: documentId (string)

    const ticket = await strapi.documents('api::ticket.ticket').findOne({
      documentId,
      populate: { assignee: true },
    });
    if (!ticket) return ctx.notFound();

    const isManager = MANAGER_ROLES.includes(user.role?.type);

    if (!isManager) {
      // Row-level: only the assignee may touch this ticket
      if (ticket.assignee?.id !== user.id) {
        return ctx.forbidden('You are not assigned to this ticket.');
      }
      // Field-level: strip everything except status
      ctx.request.body.data = { status: ctx.request.body.data?.status };
    }

    return await super.update(ctx);
  },
}));
```

- Guard `create`/`delete` with a `policies/is-manager.ts` policy so non-managers get `403` before reaching the controller.

### 11.B Member Management — Prevent Privilege Escalation

**Never** grant standard tokens access to the default `users-permissions` create/update endpoints — that lets any authenticated user change roles or self-escalate.

- Build a **dedicated controller**: `POST /api/members/invite`, `PUT /api/members/:id/role`, `PUT /api/members/:id/deactivate`.
- Each action verifies caller is **Scrum Master / Lead Dev**.
- Validate role-assignment boundaries (e.g., cannot grant a role above the caller's; cannot self-promote).
- Server-side generates temp password for direct-add invites.

### 11.C Auth & Cookie Hygiene (BFF)

- JWT lives in an **httpOnly, Secure, SameSite=Lax** cookie set by the Next.js BFF (§6).
- Client JS never touches the token; mutations go through proxy handlers / server actions.
- `JWT_SECRET`, `APP_KEYS`, `API_TOKEN_SALT`, DB creds in `.env` (never committed).

### 11.D General

- All `ActivityLog` writes are **server-side only** (lifecycle hooks) — never trust client-supplied audit data.
- Enforce Strapi media upload size/type limits; validate attachments.
- Use Document Service / parameterized queries (default) — no raw SQL string building.

---

## 12. Timeline & Scope Sanity Check

| Phase | Original | Revised | Reason |
|-------|----------|---------|--------|
| Phase 2 (RBAC) | 1–2 d | **2–3 d** | Custom policy + field/row auth controller |
| Phase 3 (API) | 1–2 d | **2 d** | Lifecycle-driven ActivityLog + rank logic |
| Phase 5 (Kanban) | 2–3 d | **3–4 d** | dnd-kit edge cases + optimistic fractional ordering |
| Phase 6 (Members) | 1 d | **1 d** | Direct-add temp password avoids SMTP friction |
| **Total** | 10–15 d | **~13–17 d** | Realistic with shadcn/ui + strict scope control |

**Primary bottlenecks:** custom RBAC correctness (Phase 2) and Kanban DnD edge cases (Phase 5). shadcn/ui offsets UI cost; resisting scope creep keeps this achievable for one dev.

---

## 13. Definition of Done (MVP)

- [ ] Scrum Master & Lead Dev can create, edit, delete tickets.
- [ ] Developers can update **only `status`** on **assigned** tickets (verified unbypassable via API).
- [ ] Members added/role-edited/deactivated via **guarded controller** (no privilege escalation path).
- [ ] Tickets have UTC deadlines rendered in local time with overdue/due-soon indicators.
- [ ] Kanban with dnd-kit + optimistic updates + fractional `rank` (`O(1)` moves).
- [ ] Activity log records system events server-side.
- [ ] JWT held in httpOnly cookie via BFF; no token in client JS.
- [ ] Dashboard shows core metrics.
- [ ] App deployed and reachable.
