import React, { forwardRef, useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';
import EmojiText from './EmojiText';

const EmojiInput = forwardRef(function EmojiInput({ value, inputStyle, containerStyle, overlayStyle, overlayTextStyle, textColor, ...props }, ref) {
  const hasEmoji = /\p{Extended_Pictographic}/u.test(String(value || ''));
  const [focused, setFocused] = useState(false);
  const [overlayWidth, setOverlayWidth] = useState(0);
  const fontSize = overlayTextStyle?.fontSize || 14;
  const lineHeight = overlayTextStyle?.lineHeight || fontSize * 1.25;
  const overlayMetrics = StyleSheet.flatten(overlayStyle) || {};
  const overlayPaddingTop = overlayMetrics.paddingTop ?? overlayMetrics.paddingVertical ?? 0;
  const overlayPaddingLeft = overlayMetrics.paddingLeft ?? overlayMetrics.paddingHorizontal ?? 0;

  const handleFocus = event => {
    setFocused(true);
    props.onFocus?.(event);
  };

  const handleBlur = event => {
    setFocused(false);
    props.onBlur?.(event);
  };

  const handleSelectionChange = event => {
    props.onSelectionChange?.(event);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {hasEmoji ? (
        <View pointerEvents="none" style={[styles.overlay, overlayStyle]}>
          <View
            style={styles.overlayContent}
            onLayout={event => setOverlayWidth(event.nativeEvent.layout.width)}
          >
            <EmojiText style={[styles.overlayText, overlayTextStyle, { color: textColor }]}>{value}</EmojiText>
          </View>
          {focused ? <View style={[styles.caret, { left: overlayWidth + overlayPaddingLeft, top: overlayPaddingTop, height: lineHeight, backgroundColor: textColor }]} /> : null}
        </View>
      ) : null}
      <TextInput
        ref={ref}
        {...props}
        value={value}
        style={[inputStyle, hasEmoji ? styles.transparentText : null]}
        caretHidden={hasEmoji}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSelectionChange={handleSelectionChange}
        selectionColor={props.selectionColor || textColor}
      />
    </View>
  );
});

export default EmojiInput;

const styles = StyleSheet.create({
  container: { position: 'relative' },
  overlay: StyleSheet.absoluteFillObject,
  overlayContent: { alignSelf: 'flex-start' },
  overlayText: { fontSize: 14, lineHeight: 20 },
  caret: { position: 'absolute', top: 0, width: 2 },
  transparentText: Platform.select({ ios: { color: 'transparent' }, default: {} }),
});
