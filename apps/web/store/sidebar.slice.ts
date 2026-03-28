import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { SidebarState } from '@d2d/types';

const SIDEBAR_STORAGE_KEY = 'd2d_sidebar_collapsed';

// Get initial state from localStorage if available
const getInitialState = (): SidebarState => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored !== null) {
      return { isCollapsed: stored === 'true' };
    }
  }
  return { isCollapsed: false };
};

const initialState: SidebarState = {
  isCollapsed: false,
};

const sidebarSlice = createSlice({
  name: 'sidebar',
  initialState,
  reducers: {
    setCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isCollapsed = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(action.payload));
      }
    },
    toggleCollapsed: (state) => {
      state.isCollapsed = !state.isCollapsed;
      if (typeof window !== 'undefined') {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(state.isCollapsed));
      }
    },
    initializeSidebar: (state) => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
        if (stored !== null) {
          state.isCollapsed = stored === 'true';
        }
      }
    },
  },
});

export const { setCollapsed, toggleCollapsed, initializeSidebar } = sidebarSlice.actions;

export default sidebarSlice.reducer;
