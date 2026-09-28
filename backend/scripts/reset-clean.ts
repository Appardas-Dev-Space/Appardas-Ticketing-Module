/**
 * Clean Database Reset Script.
 *
 * Clears all existing tickets, comments, activity logs, sprints, and labels.
 * Removes any stray/test users and provisions EXACTLY:
 *   - 1 Scrum Master:  scrum.master@appardas.local
 *   - 1 Dev Lead:      lead.dev@appardas.local
 *   - 2 Developers:    dev.alex@appardas.local & dev.maria@appardas.local
 *   - 1 Viewer:        stakeholder@appardas.local
 *
 * Sets up 1 active sprint ("Sprint 1") and the 4 standard agile labels,
 * leaving the Kanban board completely empty (0 tickets) for testing.
 *
 * Run:  npx tsx ./scripts/reset-clean.ts   (from backend/)
 */
import { createStrapi, compileStrapi } from '@strapi/strapi';

const USER_UID = 'plugin::users-permissions.user';
const ROLE_UID = 'plugin::users-permissions.role';
const TICKET_UID = 'api::ticket.ticket';
const SPRINT_UID = 'api::sprint.sprint';
const LABEL_UID = 'api::label.label';
const COMMENT_UID = 'api::comment.comment';
const ACTIVITY_UID = 'api::activity-log.activity-log';

const PASSWORD = 'Password123';

const USERS = [
  {
    username: 'scrum.master',
    email: 'scrum.master@appardas.local',
    role: 'scrum_master',
    title: 'Scrum Master',
    displayName: 'Sarah Master',
  },
  {
    username: 'lead.dev',
    email: 'lead.dev@appardas.local',
    role: 'lead_dev',
    title: 'Tech Lead',
    displayName: 'Leo Dev',
  },
  {
    username: 'dev.alex',
    email: 'dev.alex@appardas.local',
    role: 'developer',
    title: 'Frontend Engineer',
    displayName: 'Alex Kim',
  },
  {
    username: 'dev.maria',
    email: 'dev.maria@appardas.local',
    role: 'developer',
    title: 'Backend Engineer',
    displayName: 'Maria Lopez',
  },
  {
    username: 'stakeholder',
    email: 'stakeholder@appardas.local',
    role: 'viewer',
    title: 'Product Observer',
    displayName: 'Sam Stakeholder',
  },
];

const LABELS = [
  { name: 'Bug', color: '#EF4444' },
  { name: 'Feature', color: '#3B82F6' },
  { name: 'Tech Debt', color: '#F59E0B' },
  { name: 'UI/UX', color: '#8B5CF6' },
];

function daysFromNow(n: number): string {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

async function run() {
  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();
  app.log.level = 'error';
  const strapi = app;

  console.log('\n--- Resetting Database to Clean State ---\n');

  try {
    // 1. Roles
    const roles = await strapi.db.query(ROLE_UID).findMany({});
    const roleIdByType = new Map<string, number>(roles.map((r: any) => [r.type, r.id]));

    // 2. Clear all tickets, comments, activity logs, sprints, labels
    await strapi.db.query(ACTIVITY_UID).deleteMany({});
    await strapi.db.query(COMMENT_UID).deleteMany({});
    await strapi.db.query(TICKET_UID).deleteMany({});
    await strapi.db.query(SPRINT_UID).deleteMany({});
    await strapi.db.query(LABEL_UID).deleteMany({});
    console.log('✓ Cleared all tickets, comments, activity logs, sprints, and labels.');

    // 3. Remove any extra users that are not among our 5 target emails
    const targetEmails = new Set(USERS.map((u) => u.email));
    const allUsers = await strapi.db.query(USER_UID).findMany({});
    for (const u of allUsers) {
      if (!targetEmails.has(u.email)) {
        await strapi.db.query(USER_UID).delete({ where: { id: u.id } });
        console.log(`✓ Removed extra user: ${u.email} (id: ${u.id})`);
      }
    }

    // 4. Upsert the 5 target users
    for (const u of USERS) {
      const roleId = roleIdByType.get(u.role);
      if (!roleId) throw new Error(`Role "${u.role}" not found in database.`);

      const existing = await strapi.db.query(USER_UID).findOne({ where: { email: u.email } });
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

      if (existing) {
        await strapi.plugin('users-permissions').service('user').edit(existing.id, data);
        console.log(`✓ Reset user: ${u.email} [${u.role}]`);
      } else {
        await strapi.plugin('users-permissions').service('user').add(data);
        console.log(`✓ Created user: ${u.email} [${u.role}]`);
      }
    }

    // 5. Seed the 4 standard labels
    for (const l of LABELS) {
      await strapi.documents(LABEL_UID).create({ data: l });
    }
    console.log(`✓ Created 4 standard labels (${LABELS.map((l) => l.name).join(', ')}).`);

    // 6. Seed 1 clean Active Sprint
    await strapi.documents(SPRINT_UID).create({
      data: {
        name: 'Sprint 1 — Core Ticketing',
        goal: 'Complete initial sprint deliverables and test workflows.',
        startDate: daysFromNow(-1),
        endDate: daysFromNow(13),
        status: 'active',
      },
    });
    console.log('✓ Created 1 active sprint: "Sprint 1 — Core Ticketing".');

    console.log('\n--- Clean Reset Complete ---');
    console.log('Kanban Board is now empty (0 tickets) ready for testing.');
    console.log('\nAccounts (Password: Password123):');
    console.log('  1. Scrum Master:  scrum.master@appardas.local');
    console.log('  2. Lead Dev:      lead.dev@appardas.local');
    console.log('  3. Developer 1:   dev.alex@appardas.local');
    console.log('  4. Developer 2:   dev.maria@appardas.local');
    console.log('  5. Viewer:        stakeholder@appardas.local\n');
  } catch (err) {
    console.error('Reset failed:', err);
    process.exitCode = 1;
  } finally {
    await app.destroy();
  }
}

run();
