import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
        import apiService from '../api/apiService';
        import { setUnauthorizedHandler } from '../api/httpClient';
        import { unregisterCurrentPushToken } from '../services/pushNotifications';
        import { getAuthToken, removeAuthToken, setAuthToken } from '../utils/authTokenStorage';

        const AuthContext = createContext();

        export const AuthProvider = ({ children }) => {
          const [user, setUser] = useState(null);
          const [loading, setLoading] = useState(true);

          const refreshUser = useCallback(async () => {
            const profile = await apiService.getUserProfile();
            setUser(profile);
            return profile;
          }, []);

          useEffect(() => {
            const loadUser = async () => {
              const token = await getAuthToken();
              if (token) {
                try {
                  await refreshUser();
                } catch (e) {
                  await removeAuthToken();
                  setUser(null);
                }
              }
              setLoading(false);
            };
            loadUser();
          }, [refreshUser]);

          useEffect(() => setUnauthorizedHandler(() => setUser(null)), []);

          const login = async (email, password) => {
            const data = await apiService.login(email, password);
            await setAuthToken(data.token);
            setUser(data.user);
            return data;
          };

          const register = async (firstName, lastName, email, password, passwordConfirmation) => {
            const data = await apiService.register(firstName, lastName, email, password, passwordConfirmation);
            await setAuthToken(data.token);
            setUser(data.user);
            return data;
          };

          const logout = async () => {
            try {
              await unregisterCurrentPushToken();
              await apiService.logout();
            } catch (e) {
              // token may already be invalid/expired server-side; proceed with local logout regardless
            }
            await removeAuthToken();
            setUser(null);
          };

          return (
            <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
              {children}
            </AuthContext.Provider>
          );
        };

        export const useAuth = () => useContext(AuthContext);
      
