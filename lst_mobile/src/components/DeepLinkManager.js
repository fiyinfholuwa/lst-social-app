import { useEffect, useRef } from 'react';
import { Linking } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { openPushDestination } from '../navigation/navigationRef';

const postIdFromUrl = url => url?.match(/\/posts\/(\d+)(?:[/?#]|$)/)?.[1] || null;

export default function DeepLinkManager() {
  const { user } = useAuth();
  const pendingPostId = useRef(null);
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    const openUrl = url => {
      const postId = postIdFromUrl(url);
      if (!postId) return;
      if (!userRef.current) {
        pendingPostId.current = postId;
        return;
      }
      openPushDestination({ screen: 'PostDetail', routeParams: { postId } });
    };

    Linking.getInitialURL().then(openUrl).catch(() => {});
    const subscription = Linking.addEventListener('url', event => openUrl(event.url));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!user || !pendingPostId.current) return;
    const postId = pendingPostId.current;
    pendingPostId.current = null;
    openPushDestination({ screen: 'PostDetail', routeParams: { postId } });
  }, [user]);

  return null;
}
