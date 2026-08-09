import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppIcon from '../components/AppIcon';
import { useTheme } from './ThemeContext';

const AppAlertContext = createContext({ alert: () => {} });

export function AppAlertProvider({ children }) {
  const { theme } = useTheme();
  const [current, setCurrent] = useState(null);
  const queue = useRef([]);

  const showNext = useCallback(() => {
    setCurrent(queue.current.shift() || null);
  }, []);

  const alert = useCallback((title, message, buttons, options = {}) => {
    const normalizedButtons = buttons?.length ? buttons : [{ text: 'Got it' }];
    queue.current.push({
      title: title || 'Notice',
      message,
      buttons: normalizedButtons,
      cancelable: options.cancelable !== false,
      onDismiss: options.onDismiss,
    });
    setCurrent(value => value || queue.current.shift());
  }, []);

  useEffect(() => {
    const nativeAlert = Alert.alert;
    Alert.alert = alert;
    return () => {
      Alert.alert = nativeAlert;
    };
  }, [alert]);

  const close = useCallback((button) => {
    setCurrent(null);
    button?.onPress?.();
    setTimeout(showNext, 180);
  }, [showNext]);

  const dismiss = useCallback(() => {
    if (!current?.cancelable) return;
    setCurrent(null);
    current?.onDismiss?.();
    setTimeout(showNext, 180);
  }, [current, showNext]);

  const value = useMemo(() => ({ alert }), [alert]);
  const destructive = current?.buttons.some(button => button.style === 'destructive');
  const accent = destructive ? theme.danger : theme.primary;
  const softAccent = destructive ? theme.accentSoft : theme.primarySoft;

  return (
    <AppAlertContext.Provider value={value}>
      {children}
      <Modal
        visible={Boolean(current)}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={dismiss}
      >
        <Pressable style={styles.backdrop} onPress={dismiss}>
          <Pressable
            accessibilityRole="alert"
            style={[styles.dialog, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => {}}
          >
            <View style={[styles.icon, { backgroundColor: softAccent }]}> 
              <AppIcon
                name={destructive ? 'warning-outline' : 'information-circle-outline'}
                size={28}
                color={accent}
              />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>{current?.title}</Text>
            {Boolean(current?.message) && (
              <Text style={[styles.message, { color: theme.secondaryText }]}>{current.message}</Text>
            )}
            <View style={[styles.actions, current?.buttons.length > 2 && styles.stackedActions]}>
              {current?.buttons.map((button, index) => {
                const isCancel = button.style === 'cancel';
                const isDestructive = button.style === 'destructive';
                const buttonColor = isDestructive ? theme.danger : theme.primary;
                return (
                  <TouchableOpacity
                    key={`${button.text}-${index}`}
                    accessibilityRole="button"
                    style={[
                      styles.button,
                      current.buttons.length <= 2 && styles.flexButton,
                      isCancel
                        ? [styles.secondaryButton, { borderColor: theme.border }]
                        : { backgroundColor: buttonColor },
                    ]}
                    onPress={() => close(button)}
                  >
                    <Text style={[styles.buttonText, isCancel && { color: theme.text }]}>
                      {button.text || 'OK'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </AppAlertContext.Provider>
  );
}

export const useAppAlert = () => useContext(AppAlertContext);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(28,17,24,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderRadius: 26,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.22,
    shadowRadius: 30,
    elevation: 24,
  },
  icon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 21, fontWeight: '800', letterSpacing: -0.4, textAlign: 'center' },
  message: { fontSize: 13.5, lineHeight: 20, textAlign: 'center', marginTop: 8, paddingHorizontal: 8 },
  actions: { width: '100%', flexDirection: 'row', gap: 10, marginTop: 22 },
  stackedActions: { flexDirection: 'column-reverse' },
  button: { minHeight: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  flexButton: { flex: 1 },
  secondaryButton: { backgroundColor: 'transparent', borderWidth: 1 },
  buttonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', textAlign: 'center' },
});
