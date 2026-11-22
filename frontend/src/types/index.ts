export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  isActive?: boolean;
  isSuperAdmin?: boolean;
  role?: WorkspaceRole | string;
}

export interface TeamMember {
  id: string;
  teamId?: string;
  userId: string;
  role?: string;
  canManage?: boolean;
  user: User;
}

export interface Team {
  id: string;
  workspaceId: string;
  name: string;
  description?: string | null;
  color: string;
  createdById?: string | null;
  creator?: User | null;
  members?: TeamMember[];
  userCanManage?: boolean;
  _count?: {
    members: number;
    projects: number;
  };
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  role?: WorkspaceRole;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  key: string;
  description?: string | null;
  startDate?: string | null;
  targetDate?: string | null;
  boards?: Board[];
  _count?: {
    boards: number;
    members: number;
  };
}

export interface Board {
  id: string;
  projectId: string;
  name: string;
  description?: string | null;
  isFavorite: boolean;
  project?: {
    id: string;
    name: string;
    key: string;
    workspaceId: string;
    workspace?: {
      id: string;
      name: string;
      slug: string;
    };
  };
  columns?: Column[];
}

export interface Column {
  id: string;
  boardId: string;
  name: string;
  color: string;
  position: number;
  wipLimit?: number | null;
  isDone: boolean;
  tasks: Task[];
}

export interface Task {
  id: string;
  columnId: string;
  title: string;
  description?: string | null;
  position: number;
  priority: TaskPriority;
  startDate?: string | null;
  dueDate?: string | null;
  isCompleted: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: User;
  column?: {
    id: string;
    name: string;
    color: string;
    boardId: string;
  };
  assignees?: {
    id: string;
    user: User;
  }[];
  labels?: {
    label: {
      id: string;
      name: string;
      color: string;
    };
  }[];
  subtasks?: Subtask[];
  comments?: Comment[];
  attachments?: Attachment[];
  activity?: ActivityLog[];
  _count?: {
    comments: number;
    attachments: number;
  };
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  position: number;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: User;
}

export interface Attachment {
  id: string;
  taskId: string;
  fileName: string;
  fileUrl: string;
  publicId: string;
  fileSize: number;
  mimeType: string;
  format: string;
  createdAt: string;
  uploadedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  details?: any;
  createdAt: string;
  user: User;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}
