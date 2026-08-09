import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import AppIcon from './AppIcon';

export default function PasswordInput({ theme, containerStyle, inputStyle, ...inputProps }) {
  const [hidden, setHidden] = useState(true);
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: focused ? theme.primary : theme.border }, containerStyle]}>
      <TextInput
        {...inputProps}
        secureTextEntry={hidden}
        placeholderTextColor={theme.secondaryText}
        style={[styles.input, { color: theme.text }, inputStyle]}
        onFocus={event => { setFocused(true); inputProps.onFocus?.(event); }}
        onBlur={event => { setFocused(false); inputProps.onBlur?.(event); }}
      />
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
        style={styles.eye}
        onPress={() => setHidden(value => !value)}
      >
        <AppIcon name={hidden ? 'eye-outline' : 'eye-off-outline'} size={19} color={theme.secondaryText} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { minHeight: 51, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  input: { flex: 1, minHeight: 49, paddingLeft: 14, paddingRight: 4, fontSize: 14 },
  eye: { width: 46, minHeight: 49, alignItems: 'center', justifyContent: 'center' },
});
