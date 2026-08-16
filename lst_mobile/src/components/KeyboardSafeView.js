import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

export default function KeyboardSafeView({ children, style, keyboardVerticalOffset = 0, androidBehavior = 'height' }) {
  return (
    <KeyboardAvoidingView
      style={[styles.container, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : androidBehavior === 'none' ? undefined : androidBehavior}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });
