import React from 'react';
import { Ionicons } from '@expo/vector-icons';

/**
 * One lightweight Ionicons entry point for the app.
 * Legacy semantic names are mapped here so screens never depend on a
 * particular icon library or accidentally render an unsupported glyph.
 */
const OUTLINE_ICONS = {
  add: 'add-outline',
  'arrow-forward': 'arrow-forward',
  'arrow-right': 'arrow-forward',
  'arrow-up': 'arrow-up',
  ban: 'remove-circle-outline',
  bell: 'notifications-outline',
  'book-open': 'book-outline',
  bookmark: 'bookmark-outline',
  'bookmark-outline': 'bookmark-outline',
  'chatbubble-outline': 'chatbubble-outline',
  'chatbubbles-outline': 'chatbubbles-outline',
  check: 'checkmark',
  'check-circle': 'checkmark-circle-outline',
  'chevron-forward': 'chevron-forward',
  'chevron-right': 'chevron-forward',
  clock: 'time-outline',
  comment: 'chatbubble-outline',
  comments: 'chatbubbles-outline',
  'create-outline': 'pencil-outline',
  'ellipsis-h': 'ellipsis-horizontal',
  'file-alt': 'document-text-outline',
  heart: 'heart-outline',
  happy: 'happy-outline',
  'heart-outline': 'heart-outline',
  'image-outline': 'image-outline',
  'leaf-outline': 'home-outline',
  lock: 'lock-closed-outline',
  magic: 'star-outline',
  microphone: 'mic-outline',
  'notifications-outline': 'notifications-outline',
  'paper-plane': 'send-outline',
  pause: 'pause',
  'people-outline': 'people-outline',
  'person-outline': 'person-outline',
  play: 'play',
  'play-circle-outline': 'play-circle-outline',
  search: 'search-outline',
  'search-outline': 'search-outline',
  seedling: 'leaf-outline',
  'settings-outline': 'settings-outline',
  'share-alt': 'share-social-outline',
  'shield-alt': 'shield-outline',
  'shield-checkmark-outline': 'shield-checkmark-outline',
  'sparkles-outline': 'star-outline',
  times: 'close',
  'times-circle': 'close-circle-outline',
  trash: 'trash-outline',
  'user-check': 'person-add-outline',
  'user-minus': 'person-remove-outline',
  'user-plus': 'person-add-outline',
  users: 'people-outline',
};

const FILLED_ICONS = {
  bookmark: 'bookmark',
  'check-circle': 'checkmark-circle',
  heart: 'heart',
  users: 'people',
  'arrow-up': 'arrow-up',
};

export default function AppIcon({ name, solid = false, strokeWidth, ...props }) {
  const iconName = solid
    ? FILLED_ICONS[name] || OUTLINE_ICONS[name] || name
    : OUTLINE_ICONS[name] || name;

  return <Ionicons name={iconName} {...props} />;
}
