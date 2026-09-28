# Deployment Guide

Production deployment for the Appardas Ticketing Module.

## Architecture

```
Browser ──HTTPS──▶ Next.js (Vercel)            Strapi v5 (Render/Railway/VPS)
                   ├─ UI (App Router)   server   ├─ REST API + custom RBAC
                   └─ /api/* BFF proxy ──fetch──▶ ├─ Document Service
                      (attaches Bearer,          └─ PostgreSQL
                       httpOnly cookie)
```

The browser **never** talks to Strapi directly. All API traffic is proxied
server-side through the Next.js BFF (`app/api/[...proxy]`), which reads the JWT
from an httpOnly cookie and attaches `Authorization: Bearer`. This means:

- **No browser↔Strapi CORS is required** (the proxy call is server-to-server).
- The JWT is never exposed to client JS (XSS-resistant).

---

## 1. PostgreSQL

Provision a managed Postgres (Render/Railway/Neon/RDS). Note the connection
string. Enable SSL for managed providers (`DATABASE_SSL=true`).

---

## 2. Backend — Strapi v5

Deploy on any Node host (Render Web Service, Railway, or a VPS/container).

**Build & run**

```bash
npm ci
npm run build          # compiles admin + TS
npm run start          # strapi start  (production)
```

- Node: `>=20 <=26`.
- Health/URL: exposes the API at e.g. `https://api.your-domain.com`.
- First boot seeds the four roles + permission matrix automatically
  (`src/index.ts` bootstrap). Optionally run `npm run seed` once for demo data.
- Create the first admin via the Strapi admin panel (`/admin`).

**Required environment variables**

| Variable | Notes |
|---|---|
| `HOST` | `0.0.0.0` |
| `PORT` | Platform-provided (e.g. `1337`) |
| `APP_KEYS` | Comma-separated random keys |
| `API_TOKEN_SALT` | Random |
| `ADMIN_JWT_SECRET` | Random |
| `TRANSFER_TOKEN_SALT` | Random |
| `JWT_SECRET` | Random — signs user JWTs |
| `ENCRYPTION_KEY` | Random |
| `DATABASE_CLIENT` | `postgres` |
| `DATABASE_URL` | Full connection string (preferred), **or** the discrete vars below |
| `DATABASE_HOST` / `DATABASE_PORT` / `DATABASE_NAME` / `DATABASE_USERNAME` / `DATABASE_PASSWORD` | Discrete DB config |
| `DATABASE_SSL` | `true` for managed Postgres |

Generate secrets with `openssl rand -base64 16` (one per key). See
`backend/.env.example`.

> JWT lifetime is set to `7d` (`config/plugins.ts`). Adjust for your session policy.

---

## 3. Frontend — Next.js 14 (Vercel)

**Project settings**

- Framework preset: Next.js. Build: `next build` (default). Root: `frontend/`.
- Node 20+.

**Required environment variables**

| Variable | Value | Notes |
|---|---|---|
| `STRAPI_URL` | `https://api.your-domain.com` | Backend base URL. **Server-only** (no `NEXT_PUBLIC_` prefix) — read inside route handlers/middleware. |

Vercel sets `NODE_ENV=production` automatically, which enables the `secure`
flag on the auth cookie (`lib/config.ts` → `AUTH_COOKIE_OPTIONS`). Both
`app/api/auth/login/route.ts` and `app/api/auth/logout/route.ts` use this shared
config, so cookies are `HttpOnly; Secure; SameSite=Lax; Path=/` in production.

---

## 4. CORS & Proxy Notes

- Because every request is proxied server-side, you generally do **not** need to
  add the frontend origin to Strapi CORS. Keep Strapi's default CORS locked down.
- If you later add any direct browser→Strapi calls (e.g. serving uploaded media
  from Strapi), allow the frontend origin in `backend/config/middlewares.ts`
  (`strapi::cors` `origin: ['https://app.your-domain.com']`).
- Serve both apps over **HTTPS** in production; the `Secure` cookie will not be
  sent over plain HTTP.
- Cookies are `SameSite=Lax`. This works because the browser only ever sets the
  cookie against the Next.js origin (the UI and the `/api` proxy share it).

---

## 5. Environment Variable Checklist

**Backend**

- [ ] `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `JWT_SECRET`, `ENCRYPTION_KEY` (all strong & unique)
- [ ] `DATABASE_CLIENT=postgres`
- [ ] `DATABASE_URL` (or discrete `DATABASE_*` vars) + `DATABASE_SSL=true`
- [ ] `HOST=0.0.0.0`, `PORT`

**Frontend**

- [ ] `STRAPI_URL` pointing at the deployed backend

---

## 6. Post-Deploy Verification

1. `curl https://api.your-domain.com/_health` → `204`.
2. Log in through the frontend; confirm the `token` cookie is `HttpOnly; Secure`.
3. (Optional, staging) run `npm run test:rbac` against the backend to confirm
   role boundaries hold in the deployed environment.
4. Confirm the board loads, drag persists, and `/dashboard` shows metrics.

---

## 7. Operational Scripts

| Command | Location | Purpose |
|---|---|---|
| `npm run seed` | `backend/` | Idempotently (re)populate demo users, sprints, labels, tickets, comments, activity. |
| `npm run test:rbac` | `backend/` | Assert role/field/row-level security against a running instance. |

> Do **not** run `npm run seed` against production data — it clears tickets,
> comments, activity, sprints, and labels before repopulating.
