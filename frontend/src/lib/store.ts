import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'shift_manager' | 'production_lead' | 'operations_head' | 'finance' | 'owner';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  site_id: number | null;
  site?: { id: number; name: string };
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        localStorage.setItem('palato_token', token);
        set({ user, token });
      },
      clearAuth: () => {
        localStorage.removeItem('palato_token');
        set({ user: null, token: null });
      },
    }),
    { name: 'palato-auth', partialize: (s) => ({ user: s.user, token: s.token }) }
  )
);

// ── Role helpers ──────────────────────────────────────────────────
export const isManagement = (role?: UserRole) =>
  ['operations_head', 'finance', 'owner'].includes(role ?? '');

export const canApproveOverride = (role?: UserRole) =>
  ['operations_head', 'owner'].includes(role ?? '');

export const canResolveIncident = (role?: UserRole) =>
  ['operations_head', 'owner'].includes(role ?? '');

export const ROLE_LABELS: Record<UserRole, string> = {
  shift_manager:   'Shift Manager',
  production_lead: 'Production Lead',
  operations_head: 'Operations Head',
  finance:         'Finance',
  owner:           'Owner',
};
