import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth.slice';
import onboardingReducer from './onboarding.slice';
import themeReducer from './theme.slice';
import teamReducer from './team.slice';
import sessionReducer from './session.slice';
import activityReducer from './activity.slice';
import organizationReducer from './organization.slice';
import sidebarReducer from './sidebar.slice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    onboarding: onboardingReducer,
    theme: themeReducer,
    team: teamReducer,
    session: sessionReducer,
    activity: activityReducer,
    organization: organizationReducer,
    sidebar: sidebarReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
