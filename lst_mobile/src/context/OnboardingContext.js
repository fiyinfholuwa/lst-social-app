import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@lst_onboarding_complete';
const OnboardingContext = createContext(null);

export function OnboardingProvider({ children }) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then(value => setHasCompletedOnboarding(value === 'true'))
      .catch(() => setHasCompletedOnboarding(false));
  }, []);

  const completeOnboarding = async () => {
    setHasCompletedOnboarding(true);
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  };

  const replayOnboarding = async () => {
    setHasCompletedOnboarding(false);
    await AsyncStorage.removeItem(ONBOARDING_KEY);
  };

  return (
    <OnboardingContext.Provider value={{ hasCompletedOnboarding, completeOnboarding, replayOnboarding }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export const useOnboarding = () => useContext(OnboardingContext);
