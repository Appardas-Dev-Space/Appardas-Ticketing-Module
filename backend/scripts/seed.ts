/**
 * Demo seed script — idempotent.
 *
 * Populates a realistic, demo-ready board: users (one per role), two sprints,
 * labels, ~10 tickets spread across all statuses (with valid fractional ranks,
 * mixed priorities, and overdue / due-soon / on-track deadlines), sample
 * comments, and a curated activity-log history so /dashboard and ticket detail
 * views have immediate content.
 *
 * Run:  npm run seed   (from backend/)
 *
 * Idempotency: demo content (tickets, comments, activity logs, sprints, labels)
 * is cleared and rebuilt on every run; demo users are upserted by email.
 */
import { createStrapi, compileStrapi } from '@strapi/strapi';
import { generateKeyBetween } from 'fractional-indexing';

const USER_UID = 'plugin::users-permissions.user';
const ROLE_UID = 'plugin::users-permissions.role';
const TICKET_UID = 'api::ticket.ticket';
const SPRINT_UID = 'api::sprint.sprint';
const LABEL_UID = 'api::label.label';
const COMMENT_UID = 'api::comment.comment';
const ACTIVITY_UID = 'api::activity-log.activity-log';

const PASSWORD = 'Password123';

interface SeedUser {
  key: string;
  username: string;
  email: string;
  role: string;
  title: string;
  displayName: string;
}

const USERS: SeedUser[] = [
  {
    key: 'scrum',
    username: 'scrum.master',
    email: 'scrum.master@appardas.local',
    role: 'scrum_master',
    title: 'Scrum Master',
    displayName: 'Sarah Master',
  },
  {
    key: 'lead',
    username: 'lead.dev',
    email: 'lead.dev@appardas.local',
    role: 'lead_dev',
    title: 'Tech Lead',
    displayName: 'Leo Dev',
  },
  {
    key: 'alex',
    username: 'dev.alex',
    email: 'dev.alex@appardas.local',
    role: 'developer',
    title: 'Frontend Engineer',
    displayName: 'Alex Kim',
  },
  {
    key: 'viewer',
    username: 'stakeholder',
    email: 'stakeholder@appardas.local',
    role: 'viewer',
    title: 'Product Observer',
    displayName: 'Sam Stakeholder',
  },
  {
    key: 'maria',
    username: 'dev.maria',
    email: 'dev.maria@appardas.local',
    role: 'developer',
    title: 'Backend Engineer',
    displayName: 'Maria Lopez',
  },
];

const LABELS = [
  { name: 'Bug', color: '#EF4444' },
  { name: 'Feature', color: '#3B82F6' },
  { name: 'Tech Debt', color: '#F59E0B' },
  { name: 'UI/UX', color: '#8B5CF6' },
];

function daysFromNow(n: number): Date {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}
function hoursFromNow(n: number): Date {
  return new Date(Date.now() + n * 60 * 60 * 1000);
}
function dateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function run() {
  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();
  app.log.level = 'error';

  const strapi = app;
  /* eslint-disable no-console */
  const log = (msg: string) => console.log(`  ${msg}`);

  try {
    console.log('\nSeeding Appardas demo data…\n');

    // 1. Roles (bootstrap already seeds these; map type -> id).
    const roles = await strapi.db.query(ROLE_UID).findMany({});
    const roleIdByType = new Map<string, number>(
      roles.map((r: any) => [r.type, r.id])
    );

    // 2. Upsert demo users.
    const userIdByKey = new Map<string, number>();
    for (const u of USERS) {
      const roleId = roleIdByType.get(u.role);
      if (!roleId) throw new Error(`Role "${u.role}" not found — is bootstrap seeding roles?`);

      const existing = await strapi.db
        .query(USER_UID)
        .findOne({ where: { email: u.email } });

      const data = {
        username: u.username,
        email: u.email,
        password: PASSWORD,
        role: roleId,
        displayName: u.displayName,
        title: u.title,
        isActive: true,
        confirmed: true,
        blocked: false,
        provider: 'local',
      };

      let record: any;
      if (existing) {
        record = await strapi
          .plugin('users-permissions')
          .service('user')
          .edit(existing.id, data);
      } else {
        record = await strapi
          .plugin('users-permissions')
          .service('user')
          .add(data);
      }
      userIdByKey.set(u.key, record.id);
      log(`user ${u.email} (${u.role})`);
    }

    // 3. Clear demo content (order respects FKs).
    await strapi.db.query(ACTIVITY_UID).deleteMany({});
    await strapi.db.query(COMMENT_UID).deleteMany({});
    await strapi.db.query(TICKET_UID).deleteMany({});
    await strapi.db.query(SPRINT_UID).deleteMany({});
    await strapi.db.query(LABEL_UID).deleteMany({});
    log('cleared existing tickets / comments / activity / sprints / labels');

    // 4. Labels.
    const labelIdByName = new Map<string, number>();
    for (const l of LABELS) {
      const created = await strapi.documents(LABEL_UID).create({ data: l });
      labelIdByName.set(l.name, created.id);
    }
    log(`${LABELS.length} labels`);

    // 5. Sprints.
    const sprint1 = await strapi.documents(SPRINT_UID).create({
      data: {
        name: 'Sprint 1 — Core Ticketing',
        goal: 'Ship the core ticketing engine and Kanban board.',
        startDate: dateOnly(daysFromNow(-3)),
        endDate: dateOnly(daysFromNow(4)),
        status: 'active',
      },
    });
    const sprint2 = await strapi.documents(SPRINT_UID).create({
      data: {
        name: 'Sprint 2 — Mobile & Integrations',
        goal: 'Responsive board and third-party integrations.',
        startDate: dateOnly(daysFromNow(7)),
        endDate: dateOnly(daysFromNow(21)),
        status: 'planned',
      },
    });
    log('2 sprints (Sprint 1 active, Sprint 2 planned)');

    // 6. Tickets. Priority uses the schema enum (low|medium|high|critical).
    const uid = (k: string) => userIdByKey.get(k)!;
    const lid = (n: string) => labelIdByName.get(n)!;

    interface SeedTicket {
      title: string;
      description: string;
      status: string;
      priority: string;
      type: string;
      assignee: string;
      deadline: Date | null;
      labels: string[];
      sprint: number | null;
    }

    const TICKETS: SeedTicket[] = [
      {
        title: 'Set up CI/CD pipeline',
        description:
          '## Goal\nAutomate build, test, and deploy.\n\n- [ ] GitHub Actions\n- [ ] Preview deploys',
        status: 'backlog',
        priority: 'medium',
        type: 'task',
        assignee: 'maria',
        deadline: null,
        labels: ['Tech Debt'],
        sprint: sprint2.id,
      },
      {
        title: 'Dark mode support',
        description: 'Add a theme toggle with persisted preference.',
        status: 'backlog',
        priority: 'low',
        type: 'feature',
        assignee: 'alex',
        deadline: daysFromNow(10),
        labels: ['Feature', 'UI/UX'],
        sprint: sprint2.id,
      },
      {
        title: 'Login rate limiting',
        description: 'Throttle repeated failed logins to mitigate brute force.',
        status: 'todo',
        priority: 'high',
        type: 'task',
        assignee: 'maria',
        deadline: hoursFromNow(30), // due soon (< 48h)
        labels: ['Feature'],
        sprint: sprint1.id,
      },
      {
        title: 'Fix avatar upload crash',
        description: 'Uploading large avatars throws a 500. **Reproducible.**',
        status: 'todo',
        priority: 'critical',
        type: 'bug',
        assignee: 'alex',
        deadline: daysFromNow(-2), // overdue
        labels: ['Bug'],
        sprint: sprint1.id,
      },
      {
        title: 'Kanban drag performance',
        description: 'Dragging is janky with many cards; profile re-renders.',
        status: 'in_progress',
        priority: 'high',
        type: 'bug',
        assignee: 'alex',
        deadline: daysFromNow(3),
        labels: ['Bug', 'Tech Debt'],
        sprint: sprint1.id,
      },
      {
        title: 'Sprint burndown widget',
        description: 'Dashboard widget showing remaining work over time.',
        status: 'in_progress',
        priority: 'medium',
        type: 'feature',
        assignee: 'maria',
        deadline: hoursFromNow(40), // due soon (< 48h)
        labels: ['Feature'],
        sprint: sprint1.id,
      },
      {
        title: 'Ticket detail markdown render',
        description: 'Render description markdown safely in the detail view.',
        status: 'in_review',
        priority: 'medium',
        type: 'feature',
        assignee: 'alex',
        deadline: daysFromNow(5),
        labels: ['Feature', 'UI/UX'],
        sprint: sprint1.id,
      },
      {
        title: 'Role-based access polish',
        description: 'Tighten field-level rules and add regression coverage.',
        status: 'in_review',
        priority: 'high',
        type: 'task',
        assignee: 'maria',
        deadline: daysFromNow(6),
        labels: ['Tech Debt'],
        sprint: sprint1.id,
      },
      {
        title: 'Project scaffolding & auth',
        description: 'Initial Strapi + Next.js scaffold with BFF auth.',
        status: 'done',
        priority: 'high',
        type: 'task',
        assignee: 'lead',
        deadline: null,
        labels: ['Feature'],
        sprint: sprint1.id,
      },
      {
        title: 'Database schema design',
        description: 'Model tickets, sprints, labels, comments, activity logs.',
        status: 'done',
        priority: 'medium',
        type: 'task',
        assignee: 'maria',
        deadline: null,
        labels: ['Tech Debt'],
        sprint: sprint1.id,
      },
    ];

    // Assign valid fractional ranks per column.
    const rankByStatus = new Map<string, string | null>();
    const ticketIdByTitle = new Map<string, number>();
    const reporterId = uid('scrum');

    for (const t of TICKETS) {
      const prev = rankByStatus.get(t.status) ?? null;
      const rank = generateKeyBetween(prev, null);
      rankByStatus.set(t.status, rank);

      const created = await strapi.documents(TICKET_UID).create({
        data: {
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          type: t.type,
          rank,
          deadline: t.deadline ? t.deadline.toISOString() : null,
          assignee: uid(t.assignee),
          reporter: reporterId,
          sprint: t.sprint,
          labels: t.labels.map(lid),
        } as any,
      });
      ticketIdByTitle.set(t.title, created.id);
    }
    log(`${TICKETS.length} tickets across all statuses`);

    // The ticket afterCreate lifecycle wrote actor-less `created` logs; replace
    // the activity history with a curated, actor-attributed set for the demo.
    await strapi.db.query(ACTIVITY_UID).deleteMany({});

    const tid = (title: string) => ticketIdByTitle.get(title)!;
    const activity = (
      action: string,
      title: string,
      actorKey: string,
      fromValue: string | null,
      toValue: string | null
    ) =>
      strapi.db.query(ACTIVITY_UID).create({
        data: {
          action,
          fromValue,
          toValue,
          ticket: tid(title),
          actor: uid(actorKey),
        },
      });

    await activity('created', 'Project scaffolding & auth', 'lead', null, null);
    await activity('status_changed', 'Project scaffolding & auth', 'lead', 'in_review', 'done');
    await activity('created', 'Kanban drag performance', 'scrum', null, null);
    await activity('assigned', 'Kanban drag performance', 'scrum', null, String(uid('alex')));
    await activity('status_changed', 'Kanban drag performance', 'alex', 'todo', 'in_progress');
    await activity('created', 'Fix avatar upload crash', 'scrum', null, null);
    await activity('priority_changed', 'Fix avatar upload crash', 'lead', 'high', 'critical');
    await activity('created', 'Login rate limiting', 'scrum', null, null);
    await activity('assigned', 'Sprint burndown widget', 'scrum', null, String(uid('maria')));
    await activity('status_changed', 'Ticket detail markdown render', 'alex', 'in_progress', 'in_review');
    log('10 curated activity-log entries');

    // 7. Comments on active work.
    const comment = (title: string, authorKey: string, body: string) =>
      strapi.db.query(COMMENT_UID).create({
        data: { body, ticket: tid(title), author: uid(authorKey) },
      });

    await comment(
      'Kanban drag performance',
      'lead',
      'Profiling shows excessive re-renders on drag. Investigating memoization.'
    );
    await comment(
      'Kanban drag performance',
      'alex',
      'Switching to transform-only updates during drag should help a lot.'
    );
    await comment(
      'Login rate limiting',
      'scrum',
      'Please coordinate with security on the lockout thresholds.'
    );
    log('3 comments');

    console.log('\nSeed complete.\n');
    console.log('Demo logins (password for all: ' + PASSWORD + '):');
    for (const u of USERS) console.log(`  ${u.role.padEnd(13)} ${u.email}`);
    console.log('');
  } catch (err) {
    console.error('\nSeed failed:', err instanceof Error ? err.message : err);
    await app.destroy();
    process.exit(1);
  }

  await app.destroy();
  process.exit(0);
}

run();
