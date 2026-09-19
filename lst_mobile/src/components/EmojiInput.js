import React, { forwardRef } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';
import EmojiText from './EmojiText';

const EmojiInput = forwardRef(function EmojiInput({ value, inputStyle, containerStyle, overlayStyle, overlayTextStyle, textColor, ...props }, ref) {
  return (
    <View style={[styles.container, containerStyle]}>
      {value ? (
        <View pointerEvents="none" style={[styles.overlay, overlayStyle]}>
          <EmojiText style={[styles.overlayText, overlayTextStyle, { color: textColor }]}>{value}</EmojiText>
        </View>
      ) : null}
      <TextInput
        ref={ref}
        {...props}
        value={value}
        style={[inputStyle, value ? styles.transparentText : null]}
        selectionColor={props.selectionColor || textColor}
      />
    </View>
  );
});

export default EmojiInput;

const styles = StyleSheet.create({
  container: { position: 'relative' },
  overlay: StyleSheet.absoluteFillObject,
  overlayText: { fontSize: 14, lineHeight: 20 },
  transparentText: Platform.select({ ios: { color: 'transparent' }, default: {} }),
});
