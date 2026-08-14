import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

export default function KeyboardSafeView({ children, style, keyboardVerticalOffset = 0 }) {
  return (
    <KeyboardAvoidingView
      style={[styles.container, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });
