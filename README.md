# Appardas Ticketing Module

An enterprise-ready internal agile project management and ticketing platform designed for Scrum Masters, Tech Leads, and Developers. Built with **Next.js 14 (App Router)**, **Strapi v5 (Headless CMS)**, and **PostgreSQL**.

---

## 🚀 Quick Navigation

* 📖 **[DOCUMENTATION.md](file:///Users/sebastianrafaellachica/codingprojects/Appardas/Appardas-Ticketing-Module/DOCUMENTATION.md)** — Complete feature overview, visual role hierarchy, security model, and technical usage guide.
* 🚢 **[DEPLOYMENT.md](file:///Users/sebastianrafaellachica/codingprojects/Appardas/Appardas-Ticketing-Module/DEPLOYMENT.md)** — Production deployment runbook for Next.js (Vercel) and Strapi (Render/Railway/VPS) with PostgreSQL.
* 📋 **[IMPLEMENTATION_PLAN.md](file:///Users/sebastianrafaellachica/codingprojects/Appardas/Appardas-Ticketing-Module/IMPLEMENTATION_PLAN.md)** — Comprehensive architecture specification, database schemas, and verified phase checklists.

---

## ⚡ Quick Start

### 1. Prerequisites
* **Node.js** `v20+`
* **PostgreSQL** running on `127.0.0.1:5432` (database `appardas_strapi`, user/password: `strapi`/`strapi`)

### 2. Seed Demo Data
Ensure the database is running, then run from `backend/`:
```bash
cd backend
npm run seed
```
*Seeds 5 demo accounts, 2 sprints, 4 labels, 10 tickets, and activity logs.*

### 3. Launch Development Servers

**Backend (Strapi v5):**
```bash
cd backend
npm run develop
# Exposes API at http://localhost:1337 and Admin Panel at http://localhost:1337/admin
```

**Frontend (Next.js 14):**
```bash
cd frontend
npm run dev
# Accessible at http://localhost:3000
```

---

## 🔑 Demo Accounts

> **Default password for all accounts:** `Password123`

| Role | Username / Email | Key Capabilities |
|---|---|---|
| **Scrum Master** | `scrum.master@appardas.local` | Full CRUD on tickets, sprints, labels; full access to `/members`. |
| **Lead Dev** | `lead.dev@appardas.local` | Full ticket CRUD; manage developers; anti-escalation bound (cannot manage Scrum Masters). |
| **Developer 1** | `dev.alex@appardas.local` | Update **status only** on assigned tickets; `/members` is restricted. |
| **Developer 2** | `dev.maria@appardas.local` | Peer developer used to test cross-assignee permission isolation. |
| **Viewer** | `stakeholder@appardas.local` | Read-only access across the board, tickets, and dashboard. |

---

## 🧪 Automated Security Verification

To verify all 15 RBAC, field-level, and row-level authorization rules against the live Strapi API:
```bash
cd backend
npm run test:rbac
```