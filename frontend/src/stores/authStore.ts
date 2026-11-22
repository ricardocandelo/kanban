import { create } from 'zustand';
import { User, Workspace } from '../types/index.js';
import { api } from '../api/client.js';

interface AuthState {
  user: User | null;
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isLoading: boolean;
  setAuth: (user: User, token: string, workspaces?: Workspace[]) => void;
  setCurrentWorkspace: (workspace: Workspace) => void;
  addWorkspace: (workspace: Workspace) => void;
  removeWorkspace: (workspaceId: string) => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: JSON.parse(localStorage.getItem('flowboard_user') || 'null'),
  workspaces: [],
  currentWorkspace: JSON.parse(localStorage.getItem('flowboard_current_workspace') || 'null'),
  isLoading: true,

  setAuth: (user, token, workspaces = []) => {
    localStorage.setItem('flowboard_user', JSON.stringify(user));
    localStorage.setItem('flowboard_access_token', token);
    const activeWs = workspaces[0] || null;
    if (activeWs) {
      localStorage.setItem('flowboard_current_workspace', JSON.stringify(activeWs));
    }
    set({ user, workspaces, currentWorkspace: activeWs, isLoading: false });
  },

  setCurrentWorkspace: (workspace) => {
    localStorage.setItem('flowboard_current_workspace', JSON.stringify(workspace));
    set({ currentWorkspace: workspace });
  },

  addWorkspace: (workspace) => {
    const workspaces = [workspace, ...get().workspaces.filter((item) => item.id !== workspace.id)];
    localStorage.setItem('flowboard_current_workspace', JSON.stringify(workspace));
    set({ workspaces, currentWorkspace: workspace });
  },

  removeWorkspace: (workspaceId) => {
    const workspaces = get().workspaces.filter((workspace) => workspace.id !== workspaceId);
    const currentWorkspace =
      get().currentWorkspace?.id === workspaceId
        ? workspaces[0] || null
        : get().currentWorkspace;

    if (currentWorkspace) {
      localStorage.setItem('flowboard_current_workspace', JSON.stringify(currentWorkspace));
    } else {
      localStorage.removeItem('flowboard_current_workspace');
    }

    set({ workspaces, currentWorkspace });
  },

  checkAuth: async () => {
    try {
      const token = localStorage.getItem('flowboard_access_token');
      if (!token) {
        set({ user: null, isLoading: false });
        return;
      }
      const { data } = await api.get('/auth/me');
      const user = data.data;
      const workspaces = user.workspaces?.map((w: any) => ({
        ...w.workspace,
        role: w.role,
      })) || [];

      let currentWs = get().currentWorkspace;
      if (!currentWs || !workspaces.some((w: any) => w.id === currentWs?.id)) {
        currentWs = workspaces[0] || null;
        if (currentWs) {
          localStorage.setItem('flowboard_current_workspace', JSON.stringify(currentWs));
        } else {
          localStorage.removeItem('flowboard_current_workspace');
        }
      }

      set({ user, workspaces, currentWorkspace: currentWs, isLoading: false });
    } catch {
      localStorage.removeItem('flowboard_access_token');
      localStorage.removeItem('flowboard_user');
      set({ user: null, workspaces: [], currentWorkspace: null, isLoading: false });
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignorar error al salir
    } finally {
      localStorage.removeItem('flowboard_access_token');
      localStorage.removeItem('flowboard_user');
      localStorage.removeItem('flowboard_current_workspace');
      set({ user: null, workspaces: [], currentWorkspace: null });
      window.location.href = '/login';
    }
  },
}));
