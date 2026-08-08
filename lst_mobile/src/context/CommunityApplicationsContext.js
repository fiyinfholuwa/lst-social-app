import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import apiService from '../api/apiService';
import { useAuth } from './AuthContext';

const Context = createContext(null);

export function CommunityApplicationsProvider({ children }) {
  const { user } = useAuth();
  const [applications, setApplications] = useState({});
  const [applicationsLoading, setLoading] = useState(true);

  const refreshApplications = useCallback(async () => {
    if (!user) {
      setApplications({});
      setLoading(false);
      return {};
    }

    setLoading(true);
    try {
      const latest = await apiService.getApplications();
      setApplications(latest || {});
      return latest || {};
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { refreshApplications(); }, [refreshApplications]);

  const submitApplication = async (id, answers) => {
    const application = await apiService.submitApplication(id, answers);
    setApplications(current => ({
      ...current,
      [id]: {
        communityId: String(id),
        answers: application.answers,
        status: application.status,
        submittedAt: application.created_at,
      },
    }));
    return application;
  };

  const withdrawApplication = async id => {
    await apiService.withdrawApplication(id);
    setApplications(current => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  };

  const value = useMemo(() => ({
    applications,
    applicationsLoading,
    getApplication: id => applications[id] || null,
    submitApplication,
    withdrawApplication,
    refreshApplications,
  }), [applications, applicationsLoading, refreshApplications]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export const useCommunityApplications = () => useContext(Context);
