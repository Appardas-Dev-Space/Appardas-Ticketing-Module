import type { Core } from '@strapi/strapi';

const USER_UID = 'plugin::users-permissions.user';

type UserRecord = Record<string, any>;

/** Safe, client-facing self profile (never leaks password/tokens). */
function toProfile(user: UserRecord) {
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

/**
 * Self-service Account API.
 *
 * Lets an authenticated user edit ONLY their own profile + password. It never
 * exposes `role`, `isActive`, `blocked`, etc. (those are manager-only via the
 * guarded Member API), so it cannot be used for privilege escalation.
 */
export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * PUT /api/account
   * Update the caller's own username / email / displayName / title.
   */
  async updateProfile(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const { username, email, displayName, title } = ctx.request.body ?? {};
    const data: Record<string, unknown> = {};

    if (username !== undefined) {
      const v = String(username).trim();
      if (!v) return ctx.badRequest('Username cannot be empty.');
      data.username = v;
    }
    if (email !== undefined) {
      const v = String(email).trim();
      if (!v) return ctx.badRequest('Email cannot be empty.');
      // Basic shape check; Strapi also validates the email attribute.
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) {
        return ctx.badRequest('Please provide a valid email address.');
      }
      data.email = v;
    }
    if (displayName !== undefined) data.displayName = displayName || null;
    if (title !== undefined) data.title = title || null;

    if (Object.keys(data).length === 0) {
      return ctx.badRequest('No changes provided.');
    }

    // Uniqueness (excluding self) for username/email.
    if (data.username || data.email) {
      const or: any[] = [];
      if (data.username) or.push({ username: data.username });
      if (data.email) or.push({ email: data.email });
      const conflict = await strapi.db.query(USER_UID).findOne({
        where: { $and: [{ id: { $ne: user.id } }, { $or: or }] },
      });
      if (conflict) {
        return ctx.conflict('That username or email is already in use.');
      }
    }

    await strapi.plugin('users-permissions').service('user').edit(user.id, data);

    const full = await strapi.db.query(USER_UID).findOne({
      where: { id: user.id },
      populate: { role: true, avatar: true },
    });

    ctx.body = { data: toProfile(full) };
  },

  /**
   * PUT /api/account/password
   * Change the caller's password after verifying the current one.
   */
  async changePassword(ctx: any) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const { currentPassword, newPassword } = ctx.request.body ?? {};
    if (!currentPassword || !newPassword) {
      return ctx.badRequest('currentPassword and newPassword are required.');
    }
    if (String(newPassword).length < 6) {
      return ctx.badRequest('New password must be at least 6 characters.');
    }
    if (currentPassword === newPassword) {
      return ctx.badRequest('New password must differ from the current one.');
    }

    const full = await strapi.db
      .query(USER_UID)
      .findOne({ where: { id: user.id } });

    const valid = await strapi
      .plugin('users-permissions')
      .service('user')
      .validatePassword(currentPassword, full.password);

    if (!valid) {
      return ctx.badRequest('Current password is incorrect.');
    }

    await strapi
      .plugin('users-permissions')
      .service('user')
      .edit(user.id, { password: newPassword });

    ctx.body = { data: { success: true } };
  },
});
