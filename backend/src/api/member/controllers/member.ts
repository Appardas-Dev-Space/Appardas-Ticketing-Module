import crypto from 'crypto';
import type { Core } from '@strapi/strapi';

const USER_UID = 'plugin::users-permissions.user';
const ROLE_UID = 'plugin::users-permissions.role';

const ASSIGNABLE_ROLES = ['scrum_master', 'lead_dev', 'developer', 'viewer'];

type UserRecord = Record<string, any>;

/** Shape a raw user row into a safe, client-facing member object. */
function toMember(user: UserRecord) {
  if (!user) return null;
  return {
    id: user.id,
    documentId: user.documentId,
    username: user.username,
    email: user.email,
    displayName: user.displayName ?? null,
    title: user.title ?? null,
    isActive: user.isActive ?? true,
    role: user.role
      ? { id: user.role.id, name: user.role.name, type: user.role.type }
      : null,
    avatar: user.avatar
      ? { id: user.avatar.id, url: user.avatar.url, name: user.avatar.name }
      : null,
  };
}

/** Generate a URL-safe temporary password (>= 16 chars). */
function generateTempPassword(): string {
  return crypto.randomBytes(12).toString('base64url');
}

/**
 * Resolve a user by numeric id (legacy) or documentId (v5). Accepts either so
 * the frontend can pass whichever identifier it holds.
 */
async function resolveUser(strapi: Core.Strapi, id: string | number) {
  const numericId = Number(id);
  if (Number.isInteger(numericId) && String(numericId) === String(id)) {
    return strapi.db.query(USER_UID).findOne({
      where: { id: numericId },
      populate: { role: true },
    });
  }
  return strapi.db.query(USER_UID).findOne({
    where: { documentId: id },
    populate: { role: true },
  });
}

/**
 * Guarded Member Management API.
 *
 * Deliberately avoids exposing the default users-permissions user CRUD to
 * client tokens (which would allow role self-escalation). All mutating actions
 * are additionally gated by the `global::is-manager` route policy.
 *
 * See IMPLEMENTATION_PLAN.md §4.1 (2), §7 (Phase 6), §11.B.
 */
export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * GET /api/members
   * List active team members. Available to any authenticated role that holds
   * the api::member.member.find permission.
   */
  async find(ctx: any) {
    const users = await strapi.db.query(USER_UID).findMany({
      where: { isActive: { $ne: false } },
      populate: { role: true, avatar: true },
      orderBy: { username: 'asc' },
    });

    ctx.body = { data: users.map(toMember) };
  },

  /**
   * POST /api/members/invite
   * Direct-add a member with a server-generated temporary password (MVP: no SMTP).
   * Restricted to managers by route policy; also enforces that a lead_dev may
   * not create a scrum_master.
   */
  async invite(ctx: any) {
    const caller = ctx.state.user;
    const { username, email, role, displayName, title } = ctx.request.body ?? {};

    if (!username || !email || !role) {
      return ctx.badRequest('username, email, and role are required.');
    }

    if (!ASSIGNABLE_ROLES.includes(role)) {
      return ctx.badRequest(`role must be one of: ${ASSIGNABLE_ROLES.join(', ')}.`);
    }

    // Privilege-escalation guard: a lead_dev cannot mint a scrum_master.
    if (caller.role?.type === 'lead_dev' && role === 'scrum_master') {
      return ctx.forbidden('A Lead Dev cannot create a Scrum Master.');
    }

    const targetRole = await strapi.db
      .query(ROLE_UID)
      .findOne({ where: { type: role } });

    if (!targetRole) {
      return ctx.badRequest(`Role "${role}" does not exist.`);
    }

    // Reject duplicates up-front for a clean error (unique constraints also apply).
    const existing = await strapi.db.query(USER_UID).findOne({
      where: { $or: [{ email }, { username }] },
    });
    if (existing) {
      return ctx.conflict('A user with that email or username already exists.');
    }

    const temporaryPassword = generateTempPassword();

    // The users-permissions user service hashes password-type fields via the
    // Document Service; never pre-hash here.
    const created = await strapi
      .plugin('users-permissions')
      .service('user')
      .add({
        username,
        email,
        password: temporaryPassword,
        role: targetRole.id,
        displayName: displayName ?? null,
        title: title ?? null,
        isActive: true,
        confirmed: true,
        blocked: false,
        provider: 'local',
      });

    // Re-fetch with relations for a consistent response shape.
    const full = await strapi.db.query(USER_UID).findOne({
      where: { id: created.id },
      populate: { role: true, avatar: true },
    });

    ctx.body = {
      data: toMember(full),
      // Handed over once to the manager for initial login; not stored anywhere.
      temporaryPassword,
    };
  },

  /**
   * PUT /api/members/:id/role
   * Change a member's role with anti-escalation guards.
   */
  async updateRole(ctx: any) {
    const caller = ctx.state.user;
    const { id } = ctx.params;
    const { role } = ctx.request.body ?? {};

    if (!role) {
      return ctx.badRequest('role is required.');
    }
    if (!ASSIGNABLE_ROLES.includes(role)) {
      return ctx.badRequest(`role must be one of: ${ASSIGNABLE_ROLES.join(', ')}.`);
    }

    const target = await resolveUser(strapi, id);
    if (!target) {
      return ctx.notFound('Member not found.');
    }

    // A user cannot change their own role.
    if (target.id === caller.id) {
      return ctx.forbidden('You cannot change your own role.');
    }

    // A lead_dev cannot promote anyone to scrum_master.
    if (caller.role?.type === 'lead_dev' && role === 'scrum_master') {
      return ctx.forbidden('A Lead Dev cannot promote a member to Scrum Master.');
    }

    const targetRole = await strapi.db
      .query(ROLE_UID)
      .findOne({ where: { type: role } });
    if (!targetRole) {
      return ctx.badRequest(`Role "${role}" does not exist.`);
    }

    await strapi
      .plugin('users-permissions')
      .service('user')
      .edit(target.id, { role: targetRole.id });

    const full = await strapi.db.query(USER_UID).findOne({
      where: { id: target.id },
      populate: { role: true, avatar: true },
    });

    ctx.body = { data: toMember(full) };
  },

  /**
   * PUT /api/members/:id/deactivate
   * Soft-deactivate a member. Historical ticket/comment/activity records are
   * preserved (no delete). Sets `isActive: false` and `blocked: true` so the
   * account can no longer authenticate through the users-permissions login.
   */
  async deactivate(ctx: any) {
    const caller = ctx.state.user;
    const { id } = ctx.params;

    const target = await resolveUser(strapi, id);
    if (!target) {
      return ctx.notFound('Member not found.');
    }

    // Prevent accidental self-lockout.
    if (target.id === caller.id) {
      return ctx.forbidden('You cannot deactivate your own account.');
    }

    await strapi
      .plugin('users-permissions')
      .service('user')
      .edit(target.id, { isActive: false, blocked: true });

    const full = await strapi.db.query(USER_UID).findOne({
      where: { id: target.id },
      populate: { role: true, avatar: true },
    });

    ctx.body = { data: toMember(full) };
  },
});
