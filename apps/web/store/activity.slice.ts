import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ActivityLogState, ActivityLogEntry } from '@d2d/types';

const initialState: ActivityLogState = {
  entries: [],
  hasMore: true,
  isLoading: false,
  error: null,
};

const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setEntries: (state, action: PayloadAction<ActivityLogEntry[]>) => {
      state.entries = action.payload;
    },
    appendEntries: (state, action: PayloadAction<ActivityLogEntry[]>) => {
      state.entries = [...state.entries, ...action.payload];
    },
    setHasMore: (state, action: PayloadAction<boolean>) => {
      state.hasMore = action.payload;
    },
    resetActivity: () => initialState,
  },
});

export const {
  setLoading,
  setError,
  setEntries,
  appendEntries,
  setHasMore,
  resetActivity,
} = activitySlice.actions;

export default activitySlice.reducer;
