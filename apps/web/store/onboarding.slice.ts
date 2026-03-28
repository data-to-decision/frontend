import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { OnboardingState, OnboardingStep, ProfileData, OrganizationData } from '@d2d/types';

const initialState: OnboardingState = {
  currentStep: 'profile',
  profileData: {},
  organizationData: {},
  isComplete: false,
};

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    setCurrentStep: (state, action: PayloadAction<OnboardingStep>) => {
      state.currentStep = action.payload;
    },
    updateProfileData: (state, action: PayloadAction<Partial<ProfileData>>) => {
      state.profileData = { ...state.profileData, ...action.payload };
    },
    updateOrganizationData: (state, action: PayloadAction<Partial<OrganizationData>>) => {
      state.organizationData = { ...state.organizationData, ...action.payload };
    },
    completeOnboarding: (state) => {
      state.currentStep = 'complete';
      state.isComplete = true;
    },
    resetOnboarding: () => initialState,
  },
});

export const {
  setCurrentStep,
  updateProfileData,
  updateOrganizationData,
  completeOnboarding,
  resetOnboarding,
} = onboardingSlice.actions;

export default onboardingSlice.reducer;
