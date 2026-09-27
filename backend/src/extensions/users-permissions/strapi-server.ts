/**
 * Extends the users-permissions plugin.
 *
 * Overrides `GET /api/users/me` so it always returns the caller's `role` and
 * `avatar`. The stock controller runs the response through the content-API
 * output sanitizer, which strips the `role` relation (callers lack read
 * permission on it), leaving the frontend unable to determine the user's role.
 *
 * We return an explicitly sanitized object here: role + avatar are included,
 * while password/token/provider fields are removed.
 */
type AnyUser = Record<string, any>;

function sanitizeMe(user: AnyUser | null) {
  if (!user) return user;
  return {
    id: user.id,
    documentId: user.documentId,
    username: user.username,
    email: user.email,
    confirmed: user.confirmed,
    blocked: user.blocked,
    displayName: user.displayName ?? null,
    title: user.title ?? null,
    isActive: user.isActive ?? true,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    role: user.role
      ? {
          id: user.role.id,
          name: user.role.name,
          type: user.role.type,
          description: user.role.description,
        }
      : null,
    avatar: user.avatar
      ? { id: user.avatar.id, url: user.avatar.url, name: user.avatar.name }
      : null,
  };
}

export default (plugin: any) => {
  plugin.controllers.user.me = async (ctx: any) => {
    const authUser = ctx.state.user;
    if (!authUser) {
      return ctx.unauthorized();
    }

    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: authUser.id },
      populate: { role: true, avatar: true },
    });

    ctx.body = sanitizeMe(user);
  };

  return plugin;
};
