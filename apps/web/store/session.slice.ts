import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { SessionState, Session } from '@d2d/types';

const initialState: SessionState = {
  sessions: [],
  isLoading: false,
  error: null,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setSessions: (state, action: PayloadAction<Session[]>) => {
      state.sessions = action.payload;
    },
    revokeSession: (state, action: PayloadAction<string>) => {
      state.sessions = state.sessions.filter((s) => s.id !== action.payload);
    },
    revokeAllSessions: (state) => {
      // Keep only the current session
      state.sessions = state.sessions.filter((s) => s.isCurrent);
    },
    resetSessions: () => initialState,
  },
});

export const {
  setLoading,
  setError,
  setSessions,
  revokeSession,
  revokeAllSessions,
  resetSessions,
} = sessionSlice.actions;

export default sessionSlice.reducer;
