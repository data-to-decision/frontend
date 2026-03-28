import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeState {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
}

const initialState: ThemeState = {
  theme: 'system',
  resolvedTheme: 'light',
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
    },
    setResolvedTheme: (state, action: PayloadAction<ResolvedTheme>) => {
      state.resolvedTheme = action.payload;
    },
  },
});

export const { setTheme, setResolvedTheme } = themeSlice.actions;

export default themeSlice.reducer;
