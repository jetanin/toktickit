export interface Requester {
  id: number;
  name: string;
  email: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'REQUESTER' | 'IT_STAFF' | 'ADMINISTRATOR';
  mustChangePassword?: boolean;
}

export interface ActionTakenItem {
  id: number;
  ticketId: number;
  actionDateTime: string;
  description: string;
  result: string;
  performedById: number;
  performedBy: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  assigneeId: number | null;
  assignee: {
    id: number;
    name: string;
    email: string;
    role: string;
  } | null;
  status: string;
  isFollowUpRequired: boolean;
  followUpNote: string | null;
  attachmentNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

