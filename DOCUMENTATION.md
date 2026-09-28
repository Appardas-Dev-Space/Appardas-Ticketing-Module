# Appardas Ticketing Module — Documentation

Welcome to the **Appardas Ticketing Module**, an internal agile project management and issue-tracking platform built for agile product teams.

---

## 1. System Overview & Architecture

The application is structured as a **Decoupled Monorepo** featuring a Next.js 14 frontend and a Strapi v5 backend backed by PostgreSQL.

```
┌─────────────────────────────────┐
│     Client Browser (Chrome)     │
└───────────────┬─────────────────┘
                │  HTTPS (UI + /api/* requests)
                │  Holds httpOnly session cookie
                ▼
┌─────────────────────────────────┐
│   Next.js 14 Frontend (BFF)     │
│   • App Router + Tailwind UI    │
│   • Route guard (middleware.ts) │
│   • /api/[...proxy] BFF Handler │
│   • Theme Provider (next-themes)│
└───────────────┬─────────────────┘
                │  Server-to-Server REST
                │  Attaches Authorization: Bearer <JWT>
                ▼
┌─────────────────────────────────┐
│       Strapi v5 Backend         │
│   • Document Service API        │
│   • Custom RBAC & is-manager    │
│   • Account & Member APIs       │
│   • Automated Activity Logs     │
└───────────────┬─────────────────┘
                │  Port 5432
                ▼
┌─────────────────────────────────┐
│       PostgreSQL Database       │
└─────────────────────────────────┘
```

### Security & BFF Guarantees
1. **Zero Client-Side Token Exposure**: The raw JWT is never transmitted to or accessible by client-side JavaScript. It is stored inside an encrypted `HttpOnly; Secure; SameSite=Lax` cookie.
2. **Backend-For-Frontend (BFF) Pattern**: The Next.js API route (`/api/[...proxy]`) intercepts requests from the browser, extracts the JWT from the secure cookie, and forwards the call server-to-server to Strapi.
3. **No Direct Browser-to-Database/Strapi Exposure**: Strapi CORS remains locked down. All communication flows through the BFF.
4. **Server-Enforced RBAC**: Even if a developer modifies client state or sends raw HTTP requests, the custom backend controller enforces row-level and field-level permission checks.

---

## 2. Role & Permission Hierarchy

The system defines four operational roles arranged in a strict security hierarchy:

```
┌──────────────────────────────────────────────────┐
│                   Scrum Master                   │ 👑 Full Administrative Authority
│  Full CRUD on Tickets, Sprints, Labels, Members  │
└────────────────────────┬─────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────┐
│                     Lead Dev                     │ 🛠️ Technical Leadership
│   Full Ticket CRUD, Manage & Assign Developers   │    (Anti-escalation bound: cannot manage SMs)
└────────────────────────┬─────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
┌────────▼──────────────┐     ┌──────────▼────────────┐
│   Developer (Alex)    │     │   Developer (Maria)   │ 💻 Contributor Peers (Row-Isolated)
│  Status-only on own   │     │  Status-only on own   │    (Alex cannot touch Maria's tickets;
│   assigned tickets    │     │   assigned tickets    │     neither can change titles/deadlines)
└────────┬──────────────┘     └──────────┬────────────┘
         │                               │
         └───────────────┬───────────────┘
                         │
┌────────────────────────▼─────────────────────────┐
│               Viewer / Observer                  │ 👁️ Read-Only Access
│       Inspect Boards, Dashboard, & Tickets       │    (No mutation or state transition privileges)
└──────────────────────────────────────────────────┘
```

### Role Capabilities Matrix

| Feature / Action | Scrum Master | Lead Dev | Developer | Viewer |
|---|:---:|:---:|:---:|:---:|
| **View Dashboard & Metrics** | ✅ | ✅ | ✅ | ✅ |
| **View Kanban Board & Tickets** | ✅ | ✅ | ✅ | ✅ |
| **Create New Tickets** | ✅ | ✅ | ❌ | ❌ |
| **Edit Full Ticket Fields** *(Title, Desc, Assignee, Priority, Deadline)* | ✅ | ✅ | ❌ *(Stripped)* | ❌ |
| **Update Ticket Status (Drag & Drop)** | ✅ Any ticket | ✅ Any ticket | ✅ **Assigned tickets only** | ❌ |
| **Delete Tickets** | ✅ | ✅ | ❌ | ❌ |
| **Post Comments** | ✅ | ✅ | ✅ | ❌ |
| **Access `/members` Directory** | ✅ | ✅ | ❌ *(Access Restricted)* | ❌ *(Access Restricted)* |
| **Invite New Members** | ✅ Any role | ✅ Developers & Viewers | ❌ | ❌ |
| **Promote to Scrum Master** | ✅ | ❌ *(403 Anti-escalation)* | ❌ | ❌ |
| **Deactivate Members** | ✅ | ✅ | ❌ | ❌ |
| **Manage Own Profile & Theme (`/settings`)** | ✅ | ✅ | ✅ | ✅ |

---

## 3. Feature Guide

### A. Interactive Kanban Board (`/board`)
* **5 Standard Agile Columns**: `Backlog` ➔ `To Do` ➔ `In Progress` ➔ `In Review` ➔ `Done`.
* **Zero-Flicker Optimistic Drag & Drop**: Powered by `@dnd-kit` and TanStack Query. Dragging a card immediately updates the UI; rank recomputation and backend persistence happen seamlessly in the background.
* **Fractional Indexing ($O(1)$ Reordering)**: Uses `fractional-indexing` to calculate lexicographical keys between adjacent items. Inserting or reordering a card never triggers bulk updates of other cards in the column.
* **Ticket Detail Drawer**:
  * Markdown preview for ticket specifications and requirements.
  * Real-time comments thread for team discussion.
  * Audit history stream showing who created, moved, or updated the ticket.
* **Instant Filtering**: Filter board cards by search text, assignee, label tags, or priority level.

### B. Agile Metrics Dashboard (`/dashboard`)
* **KPI Cards**:
  * **Open Tickets**: Total tickets currently active.
  * **Completed**: Total tickets finished (`done`).
  * **Overdue**: Tickets past their deadline that are not done (alert state highlighted in red).
  * **Active Sprint**: Current sprint name and countdown of remaining days.
* **Distribution Analytics**: Visual proportional bars illustrating ticket breakdown across all 5 statuses and 4 priority tiers (`low`, `medium`, `high`, `critical`).
* **Team Workload Overview**: Real-time breakdown per developer showing total, active (`in_progress`), and overdue counts.
* **Recent Activity Feed**: Global audit trail showing the latest 15 actions with user avatars, human-readable action phrases, and relative timestamps (e.g., *"Alex moved 'FE-01' to In Progress 5 minutes ago"*).

### C. Member Management (`/members`)
* **Access Restricted**: Only users with the `is-manager` policy (`scrum_master` or `lead_dev`) can access this page. Developers and viewers receive a clean restricted view.
* **Direct Invite with Temporary Password**: Managers can create team members on demand without relying on external SMTP mail servers. A secure, one-time temporary password is generated and presented in a copyable modal.
* **Anti-Escalation Safeguard**: Lead Developers cannot invite users as Scrum Masters, nor can they promote existing members to Scrum Master.
* **Deactivation**: Deactivating a member flags them as inactive and blocks their Strapi authentication, safely retaining their past ticket history and activity logs.

### D. Deadline Management
* **Timezone Safety**: Deadlines are saved in PostgreSQL as standard **UTC ISO-8601** strings.
* **Local Presentation**: Rendered in the user's local browser timezone (never raw UTC).
* **Visual Status Indicators**:
  * 🔴 **Overdue**: Past deadline and status is not `done`.
  * 🟡 **Due Soon**: Due within the next 48 hours.
  * ⚪ **On Track / Done**: Deadline is comfortably in the future or ticket is finished.

### E. Theme Customization (Dark / Light Mode)
* **Theme Switcher**: Integrated in the top navigation bar powered by `next-themes`.
* **Modes Supported**: **Light**, **Dark**, and **System** (matches OS preferences).
* **Tuned Contrast**: Seamlessly themes cards, badges, modal dialogs, and Kanban drag shadows without flickering.

### F. User Settings & Profile Management (`/settings`)
* **Profile Settings (`/settings/profile`)**: Update your Display Name and Job Title.
* **Security & Password**: Change your account password safely.
* **Dedicated Backend API (`/api/account`)**: Ensures users can modify only their own account credentials and profile details without accessing sensitive administrative permissions.

---

## 4. Technical Usage & Operational Guide

### Prerequisites
* **Node.js**: `v20.x` or higher
* **PostgreSQL**: Running natively (e.g. via Postgres.app on port `5432`)
  * Database name: `appardas_strapi`
  * User: `strapi` / Password: `strapi`

---

### Starting the Application

#### 1. Backend (Strapi v5)
Open a terminal in `backend/`:
```bash
cd backend
npm run develop
```
* **API Server:** `http://localhost:1337`
* **Admin Panel:** `http://localhost:1337/admin`

#### 2. Frontend (Next.js 14)
Open a separate terminal in `frontend/`:
```bash
cd frontend
npm run dev
```
* **Frontend Application:** `http://localhost:3000`

---

### Database Management & Reset Scripts

The repository includes two maintenance scripts:

#### Option A: Clean Reset (Empty Board, 0 Tickets)
Wipes all previous tickets, comments, and activity logs, clears stray test users, and provisions **exactly 5 core team members**, 1 active sprint, and 4 standard labels:
```bash
cd backend
npx tsx ./scripts/reset-clean.ts
```

#### Option B: Populate Demo Data (10 Tickets with History)
Populates 10 sample tickets across all columns, comments, deadlines, and activity logs:
```bash
cd backend
npm run seed
```

---

### Demo Accounts

> **Password for all accounts:** `Password123`

| Role | Name | Email | Purpose / Testing Focus |
|---|---|---|---|
| **1. Scrum Master** | Sarah Master | `scrum.master@appardas.local` | Full administrative authority across tickets, sprints, labels, and all members. |
| **2. Dev Lead** | Leo Dev | `lead.dev@appardas.local` | Full ticket CRUD; manage developers; anti-escalation restricted. |
| **3. Developer 1** | Alex Kim | `dev.alex@appardas.local` | Contributor; status-only on assigned tickets; `/members` is restricted. |
| **4. Developer 2** | Maria Lopez | `dev.maria@appardas.local` | Contributor peer; verify that Alex cannot move Maria's tickets. |
| **5. Viewer** | Sam Stakeholder | `stakeholder@appardas.local` | Read-only inspection of board and dashboard. |

---

### Automated RBAC Verification

To mathematically assert that all row-level, field-level, and anti-escalation security policies hold against the live Strapi API:

1. Ensure the Strapi backend is running (`npm run develop` or `npm run start`).
2. Run the test suite from `backend/`:
```bash
npm run test:rbac
```

**Expected Output:**
```text
ALL PASS  15/15 assertions passed
```
*Checks performed include: Scrum Master CRUD, Lead Dev invite restrictions, Lead Dev anti-escalation 403, Developer status update 200, Developer title field-stripping, Developer peer ticket update 403, Developer delete 403, and Viewer mutation 403s.*

---

### Building for Production

To verify TypeScript compilation, linting, and bundle generation:

```bash
# Verify Frontend Production Build
cd frontend
npm run build

# Verify Backend Production Build
cd backend
npm run build
```

For production deployment instructions on Vercel (Frontend) and Render/Railway/VPS (Backend + PostgreSQL), refer to [DEPLOYMENT.md](file:///Users/sebastianrafaellachica/codingprojects/Appardas/Appardas-Ticketing-Module/DEPLOYMENT.md).
