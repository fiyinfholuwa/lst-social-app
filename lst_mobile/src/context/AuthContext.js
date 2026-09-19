import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
        import AsyncStorage from '@react-native-async-storage/async-storage';
        import apiService from '../api/apiService';
        import { setUnauthorizedHandler } from '../api/httpClient';
        import { unregisterCurrentPushToken } from '../services/pushNotifications';
        import { getAuthToken, removeAuthToken, setAuthToken } from '../utils/authTokenStorage';

        const AuthContext = createContext();
        const AUTH_USER_KEY = '@lst_auth_user';

        export const AuthProvider = ({ children }) => {
          const [user, setUser] = useState(null);
          const [loading, setLoading] = useState(true);

          const refreshUser = useCallback(async () => {
            const profile = await apiService.getUserProfile();
            await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(profile));
            setUser(profile);
            return profile;
          }, []);

          useEffect(() => {
            const loadUser = async () => {
              const token = await getAuthToken();
              if (token) {
                const cachedUser = await AsyncStorage.getItem(AUTH_USER_KEY);
                if (cachedUser) {
                  try { setUser(JSON.parse(cachedUser)); } catch (e) { /* ignore malformed cache */ }
                }
                try {
                  await refreshUser();
                } catch (e) {
                  // A network/timeout/server error must not turn into a logout.
                  // Only an explicit 401 means the saved session is invalid.
                  if (e?.status === 401) {
                    await removeAuthToken();
                    await AsyncStorage.removeItem(AUTH_USER_KEY);
                    setUser(null);
                  }
                }
              }
              setLoading(false);
            };
            loadUser();
          }, [refreshUser]);

          useEffect(() => setUnauthorizedHandler(() => {
            setUser(null);
            AsyncStorage.removeItem(AUTH_USER_KEY);
          }), []);

          const login = async (email, password) => {
            const data = await apiService.login(email, password);
            await setAuthToken(data.token);
            await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
            setUser(data.user);
            return data;
          };

          const register = async (firstName, lastName, email, password, passwordConfirmation) => {
            const data = await apiService.register(firstName, lastName, email, password, passwordConfirmation);
            await setAuthToken(data.token);
            await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
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
            await AsyncStorage.removeItem(AUTH_USER_KEY);
            setUser(null);
          };

          return (
            <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
              {children}
            </AuthContext.Provider>
          );
        };

        export const useAuth = () => useContext(AuthContext);
      
