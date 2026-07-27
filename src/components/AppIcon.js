import React from 'react';
import { FontAwesome5 } from '@expo/vector-icons';

/**
 * One Font Awesome entry point for the entire app.
 *
 * Components can use meaningful legacy names while this map guarantees that
 * each value resolves to a valid Font Awesome glyph. New icons should be
 * registered here instead of importing another icon family in a screen.
 */
const ICON_ALIASES = {
  'add': 'plus',
  'arrow-forward': 'arrow-right',
  'bookmark-outline': 'bookmark',
  'chatbubble-outline': 'comment',
  'chatbubbles-outline': 'comments',
  'chevron-forward': 'chevron-right',
  'create-outline': 'edit',
  'heart-outline': 'heart',
  'image-outline': 'image',
  'leaf-outline': 'seedling',
  'notifications-outline': 'bell',
  'people-outline': 'users',
  'person-outline': 'user',
  'play-circle-outline': 'play-circle',
  'search-outline': 'search',
  'settings-outline': 'cog',
  'shield-checkmark-outline': 'shield-alt',
  'sparkles-outline': 'magic',
};

export default function AppIcon({ name, solid = true, ...props }) {
  const fontAwesomeName = ICON_ALIASES[name] || name;
  return <FontAwesome5 name={fontAwesomeName} solid={solid} {...props} />;
}
