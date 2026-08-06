import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AppIcon from './AppIcon';

export default function AuthField({ label, icon, secureTextEntry, theme, style, ...inputProps }) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));

  return (
    <View style={style}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <View
        style={[
          styles.field,
          { backgroundColor: theme.background, borderColor: focused ? theme.accent : theme.border },
          focused && { shadowColor: theme.accent },
        ]}
      >
        <View style={[styles.icon, { backgroundColor: focused ? theme.accentSoft : theme.primarySoft }]}>
          <AppIcon name={icon} size={17} color={focused ? theme.accent : theme.primary} />
        </View>
        <TextInput
          {...inputProps}
          style={[styles.input, { color: theme.text }]}
          placeholderTextColor={theme.secondaryText}
          secureTextEntry={secureTextEntry ? hidden : false}
          onFocus={event => {
            setFocused(true);
            inputProps.onFocus?.(event);
          }}
          onBlur={event => {
            setFocused(false);
            inputProps.onBlur?.(event);
          }}
        />
        {secureTextEntry ? (
          <TouchableOpacity
            style={styles.eye}
            onPress={() => setHidden(value => !value)}
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
          >
            <AppIcon name={hidden ? 'eye-outline' : 'eye-off-outline'} size={19} color={theme.secondaryText} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  field: {
    minHeight: 58,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  icon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, minHeight: 56, paddingHorizontal: 12, fontSize: 15 },
  eye: { width: 38, height: 44, alignItems: 'center', justifyContent: 'center' },
});
