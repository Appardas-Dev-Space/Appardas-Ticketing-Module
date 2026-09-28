import { generateKeyBetween } from 'fractional-indexing';

const TICKET_UID = 'api::ticket.ticket';
const ACTIVITY_UID = 'api::activity-log.activity-log';

type PrevSnapshot = {
  status: string | null;
  priority: string | null;
  deadline: Date | string | null;
  assigneeId: number | null;
} | null;

/** The current request user, when the operation originates from an HTTP request. */
function currentActorId(): number | null {
  const ctx = (strapi as any).requestContext?.get?.();
  return ctx?.state?.user?.id ?? null;
}

function toStr(v: unknown): string | null {
  return v === undefined || v === null ? null : String(v);
}

function toIso(v: Date | string | null | undefined): string | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

async function writeActivity(data: {
  action: string;
  fromValue?: string | null;
  toValue?: string | null;
  ticketId: number;
  actorId: number | null;
}) {
  await strapi.db.query(ACTIVITY_UID).create({
    data: {
      action: data.action,
      fromValue: data.fromValue ?? null,
      toValue: data.toValue ?? null,
      ticket: data.ticketId,
      ...(data.actorId ? { actor: data.actorId } : {}),
    },
  });
}

/** Resolve the numeric id being updated from an update event's `where`. */
async function resolveIdFromWhere(where: any): Promise<number | null> {
  if (!where) return null;
  if (where.id != null && typeof where.id !== 'object') return Number(where.id);
  if (where.documentId) {
    const row = await strapi.db
      .query(TICKET_UID)
      .findOne({ where: { documentId: where.documentId }, select: ['id'] });
    return row?.id ?? null;
  }
  return null;
}

export default {
  /**
   * Assign a fractional `rank` so the ticket lands at the bottom of its column
   * (O(1) write). Only computed when a rank was not explicitly supplied.
   */
  async beforeCreate(event: any) {
    const { data } = event.params;
    if (data.rank) return;

    const status = data.status || 'backlog';
    const last = await strapi.db.query(TICKET_UID).findMany({
      where: { status, rank: { $notNull: true } },
      orderBy: { rank: 'desc' },
      limit: 1,
      select: ['rank'],
    });

    const lastRank = last.length ? last[0].rank : null;
    try {
      data.rank = generateKeyBetween(lastRank ?? null, null);
    } catch {
      // The column contains a legacy/non-fractional rank (e.g. an imported
      // LexoRank like "0|hzzzzz:"). Fall back to a fresh key so ticket
      // creation never fails; the new card lands at the bottom of the column.
      data.rank = generateKeyBetween(null, null);
    }
  },

  /**
   * Record the `created` audit event server-side.
   */
  async afterCreate(event: any) {
    const { result } = event;
    if (!result?.id) return;

    await writeActivity({
      action: 'created',
      ticketId: result.id,
      actorId: currentActorId(),
    });
  },

  /**
   * Snapshot the previous state so afterUpdate can diff it. Shared via
   * `event.state`, which the DB lifecycle provider persists between the
   * before/after hooks of the same operation.
   */
  async beforeUpdate(event: any) {
    const id = await resolveIdFromWhere(event.params?.where);
    if (!id) {
      event.state.prev = null;
      return;
    }

    const prev = await strapi.db.query(TICKET_UID).findOne({
      where: { id },
      select: ['id', 'status', 'priority', 'deadline'],
      populate: { assignee: true },
    });

    event.state.prev = prev
      ? ({
          status: prev.status ?? null,
          priority: prev.priority ?? null,
          deadline: prev.deadline ?? null,
          assigneeId: prev.assignee?.id ?? null,
        } as PrevSnapshot)
      : null;
  },

  /**
   * Diff previous vs current state and write one ActivityLog row per changed
   * field. Runs exclusively server-side, so audit records cannot be spoofed.
   */
  async afterUpdate(event: any) {
    const prev: PrevSnapshot = event.state?.prev ?? null;
    const { result } = event;
    if (!prev || !result?.id) return;

    const current = await strapi.db.query(TICKET_UID).findOne({
      where: { id: result.id },
      select: ['id', 'status', 'priority', 'deadline'],
      populate: { assignee: true },
    });
    if (!current) return;

    const actorId = currentActorId();
    const currentAssigneeId = current.assignee?.id ?? null;

    if (prev.status !== current.status) {
      await writeActivity({
        action: 'status_changed',
        fromValue: toStr(prev.status),
        toValue: toStr(current.status),
        ticketId: result.id,
        actorId,
      });
    }

    if (prev.assigneeId !== currentAssigneeId) {
      await writeActivity({
        action: 'assigned',
        fromValue: toStr(prev.assigneeId),
        toValue: toStr(currentAssigneeId),
        ticketId: result.id,
        actorId,
      });
    }

    if (toIso(prev.deadline) !== toIso(current.deadline)) {
      await writeActivity({
        action: 'deadline_changed',
        fromValue: toIso(prev.deadline),
        toValue: toIso(current.deadline),
        ticketId: result.id,
        actorId,
      });
    }

    if (prev.priority !== current.priority) {
      await writeActivity({
        action: 'priority_changed',
        fromValue: toStr(prev.priority),
        toValue: toStr(current.priority),
        ticketId: result.id,
        actorId,
      });
    }
  },
};
