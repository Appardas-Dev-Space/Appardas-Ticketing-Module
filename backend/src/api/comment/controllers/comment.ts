import { factories } from '@strapi/strapi';

/**
 * Comment controller.
 *
 * `create` is overridden so the comment author is always the authenticated
 * user (server-side) — never trusted from the client body (IMPLEMENTATION_PLAN
 * §5.3 / §11.D). We write via the Document Service (Strapi v5) so the author
 * relation is set server-side without tripping content-API input validation.
 */
export default factories.createCoreController('api::comment.comment', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const data = ctx.request.body?.data ?? {};
    if (!data.body || !data.ticket) {
      return ctx.badRequest('`body` and `ticket` are required.');
    }

    const created = await strapi.documents('api::comment.comment').create({
      data: {
        body: data.body,
        // Relation connect by documentId (string) or id — client sends documentId.
        ticket: data.ticket,
        author: user.id,
      },
      populate: {
        author: { fields: ['id', 'username', 'displayName'] },
      },
    });

    ctx.body = { data: created };
  },
}));
