import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      logout: () => {
        set({ user: null, token: null });
        localStorage.removeItem('token');
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    },
  ),
);

interface Assignment {
  id: string;
  title: string;
  instructions: string;
  minWords: number;
  markingMode: 'strict' | 'loose';
  totalMarks: number;
  createdAt: string;
  isProcessing: boolean;
  submissions?: any[];
}

interface AssignmentState {
  assignments: Assignment[];
  currentAssignment: Assignment | null;
  setAssignments: (assignments: Assignment[]) => void;
  setCurrentAssignment: (assignment: Assignment | null) => void;
  addAssignment: (assignment: Assignment) => void;
}

export const useAssignmentStore = create<AssignmentState>((set) => ({
  assignments: [],
  currentAssignment: null,
  setAssignments: (assignments) => set({ assignments }),
  setCurrentAssignment: (currentAssignment) => set({ currentAssignment }),
  addAssignment: (assignment) =>
    set((state) => ({
      assignments: [assignment, ...state.assignments],
    })),
}));