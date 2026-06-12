
import { create } from "zustand";
export interface AppState {
    activePage: string;
    setActivePage: (page: string) => void;
}
export const useStore = create<AppState>((set) => ({
    activePage: "dashboard",
    setActivePage: (page) => set({ activePage: page }),
}));
