import type { Core } from '@strapi/strapi';

/**
 * Default application roles seeded on bootstrap.
 * `type` is the machine-readable key used by custom RBAC policies/controllers
 * (see IMPLEMENTATION_PLAN.md §3 and §11).
 */
const DEFAULT_ROLES: Array<{ name: string; description: string; type: string }> = [
  {
    name: 'Scrum Master',
    description: 'Full CRUD on tickets, members, sprints; assign work; manage deadlines.',
    type: 'scrum_master',
  },
  {
    name: 'Lead Dev',
    description: 'Full CRUD on tickets; assign devs; update status; manage deadlines.',
    type: 'lead_dev',
  },
  {
    name: 'Developer',
    description: 'Read tickets; update only status + comments on assigned tickets.',
    type: 'developer',
  },
  {
    name: 'Viewer',
    description: 'Read-only access to boards.',
    type: 'viewer',
  },
];

const CRUD = ['find', 'findOne', 'create', 'update', 'delete'];
const READ = ['find', 'findOne'];

/** Build `api::<name>.<name>.<action>` permission strings. */
const api = (name: string, actions: string[]) =>
  actions.map((a) => `api::${name}.${name}.${a}`);

/**
 * Per-role permission matrix (see IMPLEMENTATION_PLAN.md §3, Phase 2 Step 4).
 * Row + field-level ticket rules live in the custom controller/policy; these
 * are the coarse controller-action grants the Users & Permissions plugin needs.
 */
// Users-permissions plugin action allowing a user to read their own profile
// (`GET /api/users/me`). Required by the BFF session endpoint for every role.
const SELF = ['plugin::users-permissions.user.me'];

const PERMISSION_MATRIX: Record<string, string[]> = {
  scrum_master: [
    ...SELF,
    ...api('ticket', [...CRUD, 'overdue']),
    ...api('sprint', CRUD),
    ...api('label', CRUD),
    ...api('comment', CRUD),
    ...api('activity-log', CRUD),
    'api::member.member.find',
    'api::member.member.invite',
    'api::member.member.updateRole',
    'api::member.member.deactivate',
  ],
  lead_dev: [
    ...SELF,
    ...api('ticket', [...CRUD, 'overdue']),
    ...api('sprint', CRUD),
    ...api('label', CRUD),
    ...api('comment', CRUD),
    ...api('activity-log', CRUD),
    'api::member.member.find',
    'api::member.member.invite',
    'api::member.member.updateRole',
    'api::member.member.deactivate',
  ],
  developer: [
    ...SELF,
    ...api('ticket', ['find', 'findOne', 'update', 'overdue']),
    ...api('comment', ['create', 'find', 'findOne']),
    ...api('sprint', READ),
    ...api('label', READ),
    ...api('activity-log', READ),
    'api::member.member.find',
  ],
  viewer: [
    ...SELF,
    ...api('ticket', [...READ, 'overdue']),
    ...api('sprint', READ),
    ...api('label', READ),
    ...api('comment', READ),
    ...api('activity-log', READ),
  ],
};

async function seedRoles(strapi: Core.Strapi) {
  for (const role of DEFAULT_ROLES) {
    const existing = await strapi.db
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: role.type } });

    if (!existing) {
      await strapi.db.query('plugin::users-permissions.role').create({ data: role });
      strapi.log.info(`[bootstrap] Seeded role "${role.name}" (${role.type}).`);
    }
  }
}

/**
 * Idempotently grant the configured controller-action permissions to each role.
 * Existing permission rows are left untouched; only missing ones are created.
 */
async function seedPermissions(strapi: Core.Strapi) {
  for (const [roleType, actions] of Object.entries(PERMISSION_MATRIX)) {
    const role = await strapi.db
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: roleType } });

    if (!role) {
      strapi.log.warn(`[bootstrap] Role "${roleType}" missing; skipping permissions.`);
      continue;
    }

    for (const action of actions) {
      const existing = await strapi.db
        .query('plugin::users-permissions.permission')
        .findOne({ where: { action, role: role.id } });

      if (!existing) {
        await strapi.db.query('plugin::users-permissions.permission').create({
          data: { action, role: role.id },
        });
      }
    }
    strapi.log.info(
      `[bootstrap] Ensured ${actions.length} permission(s) for role "${roleType}".`
    );
  }
}

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await seedRoles(strapi);
    await seedPermissions(strapi);
  },
};
