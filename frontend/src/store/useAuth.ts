import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Role = 'admin' | 'editor' | 'viewer';

interface AuthState {
  role: Role;
  displayName: string;
  isAuthenticated: boolean;
  setRole: (role: Role) => void;
  setDisplayName: (name: string) => void;
  setAuthenticated: (auth: boolean) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      role: 'admin',
      displayName: 'Admin',
      isAuthenticated: true,
      setRole: (role) => set({ role }),
      setDisplayName: (displayName) => set({ displayName }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      logout: () =>
        set({
          role: 'viewer',
          displayName: '',
          isAuthenticated: false,
        }),
    }),
    {
      name: 'socialautopro-auth',
    }
  )
);
