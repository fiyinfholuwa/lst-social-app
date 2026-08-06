import React, { createContext, useState, useContext, useEffect } from 'react';
        import AsyncStorage from '@react-native-async-storage/async-storage';
        import apiService from '../api/apiService';

        const AuthContext = createContext();

        export const AuthProvider = ({ children }) => {
          const [user, setUser] = useState(null);
          const [loading, setLoading] = useState(true);

          useEffect(() => {
            const loadUser = async () => {
              const token = await AsyncStorage.getItem('@auth_token');
              if (token) {
                try {
                  const profile = await apiService.getUserProfile();
                  setUser(profile);
                } catch (e) {
                  await AsyncStorage.removeItem('@auth_token');
                  setUser(null);
                }
              }
              setLoading(false);
            };
            loadUser();
          }, []);

          const login = async (email, password) => {
            const data = await apiService.login(email, password);
            await AsyncStorage.setItem('@auth_token', data.token);
            setUser(data.user);
            return data;
          };

          const register = async (firstName, lastName, email, password, passwordConfirmation) => {
            const data = await apiService.register(firstName, lastName, email, password, passwordConfirmation);
            await AsyncStorage.setItem('@auth_token', data.token);
            setUser(data.user);
            return data;
          };

          const logout = async () => {
            try {
              await apiService.logout();
            } catch (e) {
              // token may already be invalid/expired server-side; proceed with local logout regardless
            }
            await AsyncStorage.removeItem('@auth_token');
            setUser(null);
          };

          return (
            <AuthContext.Provider value={{ user, loading, login, register, logout }}>
              {children}
            </AuthContext.Provider>
          );
        };

        export const useAuth = () => useContext(AuthContext);
      
