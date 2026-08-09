import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import apiService from '../api/apiService';
import { useAuth } from './AuthContext';
const SavedPostsContext = createContext(null);
export function SavedPostsProvider({ children }) {
  const { user } = useAuth(); const [savedPostIds,setSavedPostIds]=useState([]); const [savedPostsLoading,setLoading]=useState(true);
  useEffect(()=>{if(!user){setSavedPostIds([]);setLoading(false);return;} setLoading(true);apiService.getSavedPostIds().then(setSavedPostIds).finally(()=>setLoading(false));},[user]);
  const toggleSavedPost=useCallback(async postId=>{const {saved}=await apiService.toggleSavedPost(postId);setSavedPostIds(ids=>saved?[String(postId),...ids.filter(x=>x!==String(postId))]:ids.filter(x=>x!==String(postId)));return saved;},[]);
  const forgetDeletedPost=useCallback(postId=>setSavedPostIds(ids=>ids.filter(id=>id!==String(postId))),[]);
  const value=useMemo(()=>({savedPostIds,savedPostsLoading,isPostSaved:id=>savedPostIds.includes(String(id)),toggleSavedPost,forgetDeletedPost}),[savedPostIds,savedPostsLoading,toggleSavedPost,forgetDeletedPost]);
  return <SavedPostsContext.Provider value={value}>{children}</SavedPostsContext.Provider>;
}
export const useSavedPosts=()=>useContext(SavedPostsContext);
