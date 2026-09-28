import { factories } from '@strapi/strapi';

const USER_FIELDS = ['id', 'documentId', 'username', 'displayName', 'title'];

/**
 * Activity Log controller.
 *
 * `find` is overridden so the `actor` (users-permissions user) relation is
 * returned — the core output sanitizer strips user relations, which would
 * leave the global activity feed without actor names/avatars. We populate a
 * field-limited actor plus the parent ticket's title via the Document Service
 * (Strapi v5), matching the ticket controller's approach.
 *
 * Read-only: all writes are server-side (ticket lifecycles) — never client.
 */
export default factories.createCoreController(
  'api::activity-log.activity-log',
  ({ strapi }) => ({
    async find(ctx) {
      const query = (ctx.query ?? {}) as {
        sort?: unknown;
        filters?: unknown;
        pagination?: { pageSize?: number | string; limit?: number | string };
        limit?: number | string;
      };

      const rawLimit =
        query.pagination?.pageSize ?? query.pagination?.limit ?? query.limit;
      const limit = Math.min(Number(rawLimit) || 15, 100);

      const logs = await strapi.documents('api::activity-log.activity-log').findMany({
        sort: (query.sort as any) ?? ['createdAt:desc'],
        filters: query.filters as any,
        populate: {
          actor: { fields: USER_FIELDS },
          ticket: { fields: ['id', 'documentId', 'title', 'status'] },
        } as any,
        limit,
      });

      ctx.body = { data: logs, meta: { count: logs.length } };
    },
  })
);
