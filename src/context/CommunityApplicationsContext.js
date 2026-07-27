import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const APPLICATIONS_KEY = '@lst_community_applications';
const CommunityApplicationsContext = createContext(null);

export function CommunityApplicationsProvider({ children }) {
  const [applications, setApplications] = useState({});
  const [applicationsLoading, setApplicationsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(APPLICATIONS_KEY)
      .then(value => setApplications(value ? JSON.parse(value) : {}))
      .catch(() => setApplications({}))
      .finally(() => setApplicationsLoading(false));
  }, []);

  const submitApplication = async (communityId, answers) => {
    const application = {
      communityId,
      answers,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };
    const next = { ...applications, [communityId]: application };
    setApplications(next);
    await AsyncStorage.setItem(APPLICATIONS_KEY, JSON.stringify(next));
    return application;
  };

  const withdrawApplication = async communityId => {
    const next = { ...applications };
    delete next[communityId];
    setApplications(next);
    await AsyncStorage.setItem(APPLICATIONS_KEY, JSON.stringify(next));
  };

  const value = useMemo(() => ({
    applications,
    applicationsLoading,
    getApplication: communityId => applications[communityId] || null,
    submitApplication,
    withdrawApplication,
  }), [applications, applicationsLoading]);

  return <CommunityApplicationsContext.Provider value={value}>{children}</CommunityApplicationsContext.Provider>;
}

export const useCommunityApplications = () => useContext(CommunityApplicationsContext);
