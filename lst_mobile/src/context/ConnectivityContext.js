import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, StatusBar, StyleSheet, Text, View } from 'react-native';
import AppIcon from '../components/AppIcon';
import { setConnectivityHandler } from '../api/httpClient';

const ConnectivityContext = createContext({ connectivity: 'online' });

export function ConnectivityProvider({ children }) {
  const [connectivity, setConnectivity] = useState('online');

  useEffect(() => setConnectivityHandler(setConnectivity), []);

  const value = useMemo(() => ({ connectivity }), [connectivity]);
  const offline = connectivity === 'offline';

  return (
    <ConnectivityContext.Provider value={value}>
      {children}
      {connectivity !== 'online' ? (
        <View
          accessibilityRole="alert"
          style={[styles.banner, { paddingTop: Platform.OS === 'ios' ? 50 : Math.max(StatusBar.currentHeight || 0, 10), backgroundColor: offline ? '#9F2D38' : '#8A5A00' }]}
        >
          <AppIcon name={offline ? 'cloud-offline-outline' : 'hourglass-outline'} size={15} color="#FFFFFF" />
          <Text style={styles.text}>
            {offline ? 'No internet connection. Your existing content is safe.' : 'The connection is slow. Still trying…'}
          </Text>
        </View>
      ) : null}
    </ConnectivityContext.Provider>
  );
}

export const useConnectivity = () => useContext(ConnectivityContext);

const styles = StyleSheet.create({
  banner: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10000, elevation: 30,
    minHeight: 38, paddingBottom: 9, paddingHorizontal: 14,
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 8,
  },
  text: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', textAlign: 'center' },
});
