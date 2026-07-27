import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVED_POSTS_KEY = '@lst_saved_post_ids';
const SavedPostsContext = createContext(null);

export function SavedPostsProvider({ children }) {
  const [savedPostIds, setSavedPostIds] = useState([]);
  const [savedPostsLoading, setSavedPostsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(SAVED_POSTS_KEY)
      .then(value => setSavedPostIds(value ? JSON.parse(value) : []))
      .catch(() => setSavedPostIds([]))
      .finally(() => setSavedPostsLoading(false));
  }, []);

  const toggleSavedPost = async postId => {
    const id = String(postId);
    const nextIds = savedPostIds.includes(id)
      ? savedPostIds.filter(savedId => savedId !== id)
      : [id, ...savedPostIds];

    setSavedPostIds(nextIds);
    await AsyncStorage.setItem(SAVED_POSTS_KEY, JSON.stringify(nextIds));
    return nextIds.includes(id);
  };

  const value = useMemo(() => ({
    savedPostIds,
    savedPostsLoading,
    isPostSaved: postId => savedPostIds.includes(String(postId)),
    toggleSavedPost,
  }), [savedPostIds, savedPostsLoading]);

  return <SavedPostsContext.Provider value={value}>{children}</SavedPostsContext.Provider>;
}

export const useSavedPosts = () => useContext(SavedPostsContext);
