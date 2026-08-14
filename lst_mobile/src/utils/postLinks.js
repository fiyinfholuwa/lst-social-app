import { Alert, Share } from 'react-native';

export const postUrl = postId => `https://social.lovestraighttalks.com/posts/${postId}`;

export const copyPostLink = async postId => {
  const url = postUrl(postId);
  try {
    const Clipboard = require('expo-clipboard');
    await Clipboard.setStringAsync(url);
    Alert.alert('Link copied', 'The post link is ready to paste anywhere.');
  } catch (error) {
    await Share.share({ title: 'Copy post link', message: url, url });
  }
};

export const sharePostLink = postId => {
  const url = postUrl(postId);
  return Share.share({ title: 'LST Social post', message: `View this post on LST Social: ${url}`, url });
};
