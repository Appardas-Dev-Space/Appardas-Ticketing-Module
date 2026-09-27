import { factories } from '@strapi/strapi';

const MANAGER_ROLES = ['scrum_master', 'lead_dev'];

const USER_FIELDS = ['id', 'documentId', 'username', 'displayName', 'title'];

// Field-limited populate for the user relations so responses never leak
// sensitive account fields (password hash, tokens, etc.).
const TICKET_POPULATE = {
  assignee: { fields: USER_FIELDS },
  reporter: { fields: USER_FIELDS },
  labels: true,
  sprint: true,
} as const;

// Full populate for the ticket detail view (comments + activity stream).
const TICKET_DETAIL_POPULATE = {
  ...TICKET_POPULATE,
  attachments: true,
  comments: {
    populate: { author: { fields: USER_FIELDS } },
    sort: ['createdAt:asc'],
  },
  activities: {
    populate: { actor: { fields: USER_FIELDS } },
    sort: ['createdAt:desc'],
  },
} as const;

/**
 * Custom Ticket controller.
 *
 * Uses the Document Service directly (rather than the core controller's
 * `super.create`/`super.update`) because relations targeting the
 * users-permissions user (`assignee`, `reporter`) are rejected by the
 * content-api input validator ("Invalid key"). The Document Service resolves
 * those relations natively.
 *
 * Authorization:
 *  - `create`/`delete` are gated at the route level by `global::is-manager`.
 *  - `create` forces `reporter = creator` (client value ignored, cannot be forged).
 *  - `update` enforces row + field-level rules:
 *      • Managers: full update.
 *      • Developer: only `status`, and only on tickets assigned to them.
 *      • Everyone else: 403.
 *
 * Fractional `rank` assignment and the ActivityLog audit trail are handled
 * server-side in content-types/ticket/lifecycles.ts.
 *
 * See IMPLEMENTATION_PLAN.md §7 (Phase 3), §8, §11.A.
 */
export default factories.createCoreController('api::ticket.ticket', ({ strapi }) => ({
  /**
   * GET /api/tickets
   *
   * Overridden so the `assignee`/`reporter` user relations are returned. The
   * core controller's output sanitizer strips relations to the
   * users-permissions user, which would break assignee avatars, "my tickets"
   * filtering, and developer drag gating on the board. We populate explicitly
   * with field-limited user data (no secrets) via the Document Service.
   */
  async find(ctx) {
    const { sort, filters } = ctx.query as {
      sort?: unknown;
      filters?: unknown;
    };

    const tickets = await strapi.documents('api::ticket.ticket').findMany({
      sort: (sort as any) ?? ['rank:asc'],
      filters: filters as any,
      populate: TICKET_POPULATE as any,
      limit: 100,
    });

    ctx.body = { data: tickets, meta: { count: tickets.length } };
  },

  /**
   * GET /api/tickets/:documentId
   *
   * Full detail incl. comments (with author) and the activity stream (with
   * actor) — user relations included, same rationale as `find`.
   */
  async findOne(ctx) {
    const documentId = ctx.params.id;

    const ticket = await strapi.documents('api::ticket.ticket').findOne({
      documentId,
      populate: TICKET_DETAIL_POPULATE as any,
    });

    if (!ticket) return ctx.notFound();
    ctx.body = { data: ticket };
  },

  async create(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.forbidden('Authentication required.');
    }

    const body = ctx.request.body?.data ?? {};
    // Force reporter to the creator; drop any client-supplied reporter so it
    // can never be forged.
    const { reporter: _ignoredReporter, ...rest } = body;

    const created = await strapi.documents('api::ticket.ticket').create({
      data: { ...rest, reporter: user.id },
      populate: TICKET_POPULATE as any,
    });

    ctx.body = { data: created };
  },

  async update(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.forbidden('Authentication required.');
    }

    const documentId = ctx.params.id; // Strapi v5: documentId (string)
    const roleType = user.role?.type;
    const isManager = MANAGER_ROLES.includes(roleType);

    const body = ctx.request.body?.data ?? {};

    if (isManager) {
      // Managers may change anything except a forged reporter (immutable).
      const { reporter: _ignoredReporter, ...rest } = body;

      const updated = await strapi.documents('api::ticket.ticket').update({
        documentId,
        data: rest,
        populate: TICKET_POPULATE as any,
      });

      if (!updated) return ctx.notFound();
      ctx.body = { data: updated };
      return;
    }

    // Only developers may proceed with a constrained update.
    if (roleType !== 'developer') {
      return ctx.forbidden('You do not have permission to update tickets.');
    }

    const existing = await strapi.documents('api::ticket.ticket').findOne({
      documentId,
      populate: { assignee: true },
    });
    if (!existing) {
      return ctx.notFound();
    }

    // Row-level authorization: only the assignee may touch this ticket.
    if ((existing as any).assignee?.id !== user.id) {
      return ctx.forbidden('You are not assigned to this ticket.');
    }

    // Field-level authorization: developers may change ONLY `status`.
    const updated = await strapi.documents('api::ticket.ticket').update({
      documentId,
      data: { status: body.status },
      populate: TICKET_POPULATE as any,
    });

    ctx.body = { data: updated };
  },

  /**
   * GET /api/tickets/overdue
   * Returns tickets whose deadline is in the past and are not yet done.
   * (Equivalent standard query: ?filters[deadline][$lt]=<ISO>&filters[status][$ne]=done)
   */
  async overdue(ctx) {
    const nowUTC = new Date().toISOString();

    const tickets = await strapi.documents('api::ticket.ticket').findMany({
      filters: {
        deadline: { $lt: nowUTC },
        status: { $ne: 'done' },
      },
      sort: ['deadline:asc'],
      populate: TICKET_POPULATE as any,
    });

    ctx.body = { data: tickets, meta: { count: tickets.length, now: nowUTC } };
  },
}));
