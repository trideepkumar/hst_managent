import { create } from 'zustand';

const useUIStore = create((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),

  modal: { open: false, title: '', message: '', onConfirm: null },
  openModal: (title, message, onConfirm) =>
    set({ modal: { open: true, title, message, onConfirm } }),
  closeModal: () =>
    set({ modal: { open: false, title: '', message: '', onConfirm: null } }),
}));

export default useUIStore;
