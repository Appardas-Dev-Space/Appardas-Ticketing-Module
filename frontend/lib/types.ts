/** Shared domain types for the frontend. */

export type RoleType =
  | "scrum_master"
  | "lead_dev"
  | "developer"
  | "viewer"
  | "authenticated"
  | "public";

export interface Role {
  id: number;
  name: string;
  type: RoleType | string;
}

export interface MediaFile {
  id: number;
  url: string;
  name?: string;
}

export interface SessionUser {
  id: number;
  documentId?: string;
  username: string;
  email: string;
  displayName: string | null;
  title?: string | null;
  isActive?: boolean;
  role: Role | null;
  avatar?: MediaFile | null;
}

/** Roles allowed to manage members (see IMPLEMENTATION_PLAN §3). */
export const MANAGER_ROLE_TYPES = ["scrum_master", "lead_dev"] as const;

/** Roles that can be assigned to a member via the management UI (§11.B). */
export const ASSIGNABLE_ROLES: RoleType[] = [
  "scrum_master",
  "lead_dev",
  "developer",
  "viewer",
];

export function isManager(user?: SessionUser | null): boolean {
  const type = user?.role?.type;
  return type === "scrum_master" || type === "lead_dev";
}

/** Human-readable role labels. */
export const ROLE_LABELS: Record<string, string> = {
  scrum_master: "Scrum Master",
  lead_dev: "Lead Dev",
  developer: "Developer",
  viewer: "Viewer",
};

/* -------------------------------------------------------------------------- */
/*  Ticketing domain (Phase 5)                                                */
/* -------------------------------------------------------------------------- */

export type TicketStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "in_review"
  | "done";

export type TicketPriority = "low" | "medium" | "high" | "critical";

export type TicketType = "bug" | "feature" | "task" | "story";

export type SprintStatus = "planned" | "active" | "completed";

export type ActivityAction =
  | "created"
  | "status_changed"
  | "assigned"
  | "deadline_changed"
  | "priority_changed";

/** Ordered board columns (see IMPLEMENTATION_PLAN §5.1). */
export const TICKET_STATUSES: TicketStatus[] = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "done",
];

export const STATUS_LABELS: Record<TicketStatus, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const PRIORITIES: TicketPriority[] = ["low", "medium", "high", "critical"];

export const TYPE_LABELS: Record<TicketType, string> = {
  bug: "Bug",
  feature: "Feature",
  task: "Task",
  story: "Story",
};

export const TICKET_TYPES: TicketType[] = ["bug", "feature", "task", "story"];

/** Minimal user shape returned inside populated ticket relations. */
export interface UserRef {
  id: number;
  documentId?: string;
  username: string;
  displayName?: string | null;
  title?: string | null;
}

/** A member row from GET /api/members (same shape as SessionUser). */
export type Member = SessionUser;

export interface Sprint {
  id: number;
  documentId: string;
  name: string;
  goal?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: SprintStatus;
}

export interface Label {
  id: number;
  documentId: string;
  name: string;
  color?: string | null;
}

export interface Comment {
  id: number;
  documentId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author?: UserRef | null;
}

export interface ActivityLog {
  id: number;
  documentId: string;
  action: ActivityAction;
  fromValue?: string | null;
  toValue?: string | null;
  createdAt: string;
  actor?: UserRef | null;
  ticket?: {
    id: number;
    documentId: string;
    title: string;
    status?: TicketStatus;
  } | null;
}

export interface Ticket {
  id: number;
  documentId: string;
  title: string;
  description?: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  type: TicketType;
  deadline?: string | null;
  rank: string;
  createdAt: string;
  updatedAt: string;
  assignee?: UserRef | null;
  reporter?: UserRef | null;
  sprint?: Sprint | null;
  labels?: Label[];
  comments?: Comment[];
  activities?: ActivityLog[];
  attachments?: MediaFile[];
}

/** Fields a manager may submit when creating/editing a ticket. */
export interface TicketFormValues {
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  type: TicketType;
  deadline: string | null;
  assignee: number | null;
  sprint: number | null;
}
