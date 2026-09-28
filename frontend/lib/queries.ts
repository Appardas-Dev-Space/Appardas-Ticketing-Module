"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { generateKeyBetween } from "fractional-indexing";

import { apiFetch } from "./api-client";
import type {
  ActivityLog,
  Label,
  Member,
  RoleType,
  Sprint,
  Ticket,
  TicketFormValues,
  TicketStatus,
} from "./types";

/* -------------------------------------------------------------------------- */
/*  Query keys                                                                */
/* -------------------------------------------------------------------------- */

export const qk = {
  tickets: ["tickets"] as const,
  ticket: (documentId: string) => ["ticket", documentId] as const,
  members: ["members"] as const,
  sprints: ["sprints"] as const,
  labels: ["labels"] as const,
  activity: ["activity-logs"] as const,
};

/* -------------------------------------------------------------------------- */
/*  Populate query strings (strictParams is ON — keys must be exact)          */
/* -------------------------------------------------------------------------- */

const USER_FIELDS = (rel: string) =>
  [
    `populate[${rel}][fields][0]=id`,
    `populate[${rel}][fields][1]=documentId`,
    `populate[${rel}][fields][2]=username`,
    `populate[${rel}][fields][3]=displayName`,
  ].join("&");

const TICKET_LIST_QUERY = `tickets?${[
  USER_FIELDS("assignee"),
  USER_FIELDS("reporter"),
  "populate[labels]=true",
  "populate[sprint]=true",
  "sort[0]=rank:asc",
  "pagination[pageSize]=100",
].join("&")}`;

const ticketDetailQuery = (documentId: string) =>
  `tickets/${documentId}?${[
    USER_FIELDS("assignee"),
    USER_FIELDS("reporter"),
    "populate[labels]=true",
    "populate[sprint]=true",
    "populate[attachments]=true",
    "populate[comments][populate][author][fields][0]=id",
    "populate[comments][populate][author][fields][1]=username",
    "populate[comments][populate][author][fields][2]=displayName",
    "populate[comments][sort][0]=createdAt:asc",
    "populate[activities][populate][actor][fields][0]=id",
    "populate[activities][populate][actor][fields][1]=username",
    "populate[activities][populate][actor][fields][2]=displayName",
    "populate[activities][sort][0]=createdAt:desc",
  ].join("&")}`;

/* -------------------------------------------------------------------------- */
/*  Reads                                                                     */
/* -------------------------------------------------------------------------- */

export function useTickets() {
  return useQuery({
    queryKey: qk.tickets,
    queryFn: async () => {
      const res = await apiFetch<{ data: Ticket[] }>(TICKET_LIST_QUERY);
      return res.data ?? [];
    },
  });
}

export function useTicket(documentId: string) {
  return useQuery({
    queryKey: qk.ticket(documentId),
    queryFn: async () => {
      const res = await apiFetch<{ data: Ticket }>(ticketDetailQuery(documentId));
      return res.data;
    },
    enabled: Boolean(documentId),
  });
}

export function useMembers() {
  return useQuery({
    queryKey: qk.members,
    queryFn: async () => {
      const res = await apiFetch<{ data: Member[] }>("members");
      return res.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSprints() {
  return useQuery({
    queryKey: qk.sprints,
    queryFn: async () => {
      const res = await apiFetch<{ data: Sprint[] }>(
        "sprints?sort[0]=createdAt:desc&pagination[pageSize]=100"
      );
      return res.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useLabels() {
  return useQuery({
    queryKey: qk.labels,
    queryFn: async () => {
      const res = await apiFetch<{ data: Label[] }>(
        "labels?pagination[pageSize]=100"
      );
      return res.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useActivityLogs(limit = 15) {
  return useQuery({
    queryKey: [...qk.activity, limit] as const,
    queryFn: async () => {
      const res = await apiFetch<{ data: ActivityLog[] }>(
        `activity-logs?sort[0]=createdAt:desc&pagination[pageSize]=${limit}`
      );
      return res.data ?? [];
    },
    refetchInterval: 30 * 1000,
  });
}

/* -------------------------------------------------------------------------- */
/*  Ticket move (status + fractional rank) — optimistic                       */
/* -------------------------------------------------------------------------- */

export interface TicketMove {
  documentId: string;
  status: TicketStatus;
  /** Omitted for developers (server ignores rank for non-managers). */
  rank?: string;
}

/**
 * Optimistic move used by the Kanban board. The caller has already applied the
 * optimistic reorder to the cache; this only persists the change and rolls back
 * on error.
 */
export function useMoveTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (move: TicketMove) => {
      const data: Record<string, unknown> = { status: move.status };
      if (move.rank !== undefined) data.rank = move.rank;
      const res = await apiFetch<{ data: Ticket }>(`tickets/${move.documentId}`, {
        method: "PUT",
        body: JSON.stringify({ data }),
      });
      return res.data;
    },
    onError: () => {
      // Reconcile with the server on failure (undo the optimistic reorder).
      queryClient.invalidateQueries({ queryKey: qk.tickets });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.tickets });
    },
  });
}

/* -------------------------------------------------------------------------- */
/*  Create / edit ticket (managers only — enforced server-side too)           */
/* -------------------------------------------------------------------------- */

function toTicketPayload(values: TicketFormValues) {
  return {
    title: values.title,
    description: values.description || null,
    status: values.status,
    priority: values.priority,
    type: values.type,
    deadline: values.deadline,
    assignee: values.assignee ?? null,
    sprint: values.sprint ?? null,
  };
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: TicketFormValues) => {
      const res = await apiFetch<{ data: Ticket }>("tickets", {
        method: "POST",
        body: JSON.stringify({ data: toTicketPayload(values) }),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.tickets });
    },
  });
}

export function useUpdateTicket(documentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<TicketFormValues>) => {
      const data: Record<string, unknown> = {};
      if (values.title !== undefined) data.title = values.title;
      if (values.description !== undefined)
        data.description = values.description || null;
      if (values.status !== undefined) data.status = values.status;
      if (values.priority !== undefined) data.priority = values.priority;
      if (values.type !== undefined) data.type = values.type;
      if (values.deadline !== undefined) data.deadline = values.deadline;
      if (values.assignee !== undefined) data.assignee = values.assignee ?? null;
      if (values.sprint !== undefined) data.sprint = values.sprint ?? null;

      const res = await apiFetch<{ data: Ticket }>(`tickets/${documentId}`, {
        method: "PUT",
        body: JSON.stringify({ data }),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.tickets });
      queryClient.invalidateQueries({ queryKey: qk.ticket(documentId) });
    },
  });
}

/* -------------------------------------------------------------------------- */
/*  Comments                                                                  */
/* -------------------------------------------------------------------------- */

export function useAddComment(ticketDocumentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) => {
      const res = await apiFetch<{ data: unknown }>("comments", {
        method: "POST",
        // Relation connected by documentId (Strapi v5); author set server-side.
        body: JSON.stringify({ data: { body, ticket: ticketDocumentId } }),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.ticket(ticketDocumentId) });
    },
  });
}

/* -------------------------------------------------------------------------- */
/*  Member management (Phase 6 — guarded controller, manager-only)            */
/* -------------------------------------------------------------------------- */

export interface InviteMemberValues {
  username: string;
  email: string;
  role: RoleType | string;
  displayName?: string;
  title?: string;
}

export interface InviteMemberResult {
  data: Member;
  temporaryPassword: string;
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: InviteMemberValues) =>
      // Member endpoints read the raw body (NOT wrapped in `data`).
      apiFetch<InviteMemberResult>("members/invite", {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.members });
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      role,
    }: {
      id: number | string;
      role: RoleType | string;
    }) =>
      apiFetch<{ data: Member }>(`members/${id}/role`, {
        method: "PUT",
        body: JSON.stringify({ role }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.members });
      // A role change alters what the affected user can see/do.
      queryClient.invalidateQueries({ queryKey: ["session"] });
    },
  });
}

export function useDeactivateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number | string) =>
      apiFetch<{ data: Member }>(`members/${id}/deactivate`, {
        method: "PUT",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.members });
      // Deactivated users drop out of assignee pickers backed by ticket data.
      queryClient.invalidateQueries({ queryKey: qk.tickets });
    },
  });
}

/* -------------------------------------------------------------------------- */
/*  Fractional-rank helpers                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Compute a new fractional rank for a card dropped at `index` within an ordered
 * (rank asc) column list. `list` must NOT include the card being moved.
 */
export function computeRank(list: Ticket[], index: number): string {
  const prev = index > 0 ? list[index - 1]?.rank ?? null : null;
  const next = index < list.length ? list[index]?.rank ?? null : null;
  return generateKeyBetween(prev, next);
}

/** Read the current tickets array from the cache (used for optimistic moves). */
export function readTickets(queryClient: QueryClient): Ticket[] {
  return queryClient.getQueryData<Ticket[]>(qk.tickets) ?? [];
}

export function writeTickets(queryClient: QueryClient, tickets: Ticket[]) {
  queryClient.setQueryData(qk.tickets, tickets);
}
