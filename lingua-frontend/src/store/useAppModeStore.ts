import { create } from 'zustand';

interface AppModeState {
  isBeautyMode: boolean;
  toggleBeautyMode: () => void;
  setBeautyMode: (val: boolean) => void;
}

export const useAppModeStore = create<AppModeState>((set) => ({
  isBeautyMode: false,
  toggleBeautyMode: () => set((state) => {
    const newVal = !state.isBeautyMode;
    if (typeof window !== 'undefined') {
      localStorage.setItem('isBeautyMode', String(newVal));
    }
    return { isBeautyMode: newVal };
  }),
  setBeautyMode: (val) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('isBeautyMode', String(val));
    }
    set({ isBeautyMode: val });
  },
}));

// Initialize store from localStorage on client-side
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('isBeautyMode');
  if (saved === 'true') {
    useAppModeStore.getState().setBeautyMode(true);
  }
}
