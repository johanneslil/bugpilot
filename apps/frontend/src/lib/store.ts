import { create } from 'zustand';

type ChatStore = {
  chatOpen: boolean;
  toggleChat: () => void;
  setChatOpen: (open: boolean) => void;
};

export const useChatStore = create<ChatStore>((set) => ({
  chatOpen: false,
  toggleChat: () => set((state) => ({ chatOpen: !state.chatOpen })),
  setChatOpen: (open) => set({ chatOpen: open }),
}));

type BugFilters = {
  severity: string | undefined;
  area: string | undefined;
  status: string | undefined;
};

type BugFilterStore = {
  filters: BugFilters;
  setFilters: (filters: BugFilters) => void;
  clearFilters: () => void;
};

export const useBugFilterStore = create<BugFilterStore>((set) => ({
  filters: {
    severity: undefined,
    area: undefined,
    status: undefined,
  },
  setFilters: (filters) => set({ filters }),
  clearFilters: () => set({ filters: { severity: undefined, area: undefined, status: undefined } }),
}));

