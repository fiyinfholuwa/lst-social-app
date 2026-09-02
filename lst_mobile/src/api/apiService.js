import httpClient from './httpClient';
import { File } from 'expo-file-system';

const appendFile = (form, field, asset, fallbackName) => {
  const file = new File(asset.uri);
  form.append(field, file, asset.fileName || file.name || fallbackName);
};

const apiService = {
  getAppVersion: platform => httpClient.get(`/app-version?platform=${platform}`, { auth: false }),
  login: (email, password) => httpClient.post('/login', { email, password }, { auth: false }),
  checkEmailAvailability: email => httpClient.post('/register/check-email', { email }, { auth: false }),
  register: (firstName, lastName, email, password, passwordConfirmation) => httpClient.post('/register', {
    first_name: firstName,
    last_name: lastName,
    email,
    password,
    password_confirmation: passwordConfirmation,
  }, { auth: false }),
  logout: () => httpClient.post('/logout'),
  sendForgotPasswordOtp: email => httpClient.post('/forgot-password/otp', { email }, { auth: false }),
  resetForgottenPassword: (email, code, password, passwordConfirmation) => httpClient.post('/forgot-password/reset', { email, code, password, password_confirmation: passwordConfirmation }, { auth: false }),
  sendChangePasswordOtp: currentPassword => httpClient.post('/user/password/otp', { current_password: currentPassword }),
  changePassword: (currentPassword, code, password, passwordConfirmation) => httpClient.patch('/user/password', { current_password: currentPassword, code, password, password_confirmation: passwordConfirmation }),
  getUserProfile: async () => (await httpClient.get('/user')).user,
  updateUserProfile: updates => httpClient.patch('/user', updates),
  updateUserProfileForm: (updates, avatar) => {
    const form = new FormData();
    form.append('_method', 'PATCH');
    Object.entries(updates).forEach(([key, value]) => form.append(key, value == null ? '' : String(value)));
    if (avatar) appendFile(form, 'avatar_image', avatar, 'profile.jpg');
    return httpClient.postForm('/user', form);
  },
  getUser: userId => httpClient.get(`/users/${userId}`),
  getUserPosts: (userId, page = 1) => httpClient.get(`/users/${userId}/posts?page=${page}`),
  getPosts: () => httpClient.get('/posts'),
  getPostsPage: page => httpClient.get(`/posts?page=${page}`),
  getPost: postId => httpClient.get(`/posts/${postId}`),
  createPost: (content, images = []) => {
    const form = new FormData();
    form.append('content', content);
    images.forEach((asset, index) => appendFile(form, 'images[]', asset, `post-image-${index + 1}.jpg`));
    return httpClient.postForm('/posts', form);
  },
  updatePost: (postId, content, postImages = []) => {
    const form = new FormData();
    form.append('_method', 'PATCH');
    form.append('content', content);
    postImages.filter(image => image.existing).forEach(image => form.append('existing_images[]', image.uri));
    postImages.filter(image => !image.existing).forEach((image, index) => appendFile(form, 'images[]', image, `post-image-${index + 1}.jpg`));
    return httpClient.postForm(`/posts/${postId}`, form);
  },
  deletePost: postId => httpClient.delete(`/posts/${postId}`),
  likePost: postId => httpClient.post(`/posts/${postId}/like`),
  getPostLikes: (postId, page = 1) => httpClient.get(`/posts/${postId}/likes?page=${page}`),
  sharePost: (postId, note = '') => httpClient.post(`/posts/${postId}/share`, { note }),
  addComment: (postId, text, parentId = null) => httpClient.post(`/posts/${postId}/comments`, { text, parent_id: parentId }),
  getComments: (postId, page = 1) => httpClient.get(`/posts/${postId}/comments?page=${page}`),
  getCommentReplies: (postId, commentId, page = 1) => httpClient.get(`/posts/${postId}/comments/${commentId}/replies?page=${page}`),
  likeComment: commentId => httpClient.post(`/comments/${commentId}/like`),
  updateComment: (commentId, text) => httpClient.patch(`/comments/${commentId}`, { text }),
  deleteComment: commentId => httpClient.delete(`/comments/${commentId}`),
  getSavedPostIds: async () => (await httpClient.get('/saved-posts')).savedPostIds,
  getSavedPostsPage: (page = 1) => httpClient.get(`/saved-posts?page=${page}`),
  toggleSavedPost: postId => httpClient.post(`/posts/${postId}/save`),
  getCommunities: () => httpClient.get('/communities'),
  getCommunitiesPage: (page = 1, query = '', filter = 'all') => httpClient.get(`/communities?page=${page}&q=${encodeURIComponent(query)}&filter=${encodeURIComponent(filter)}`),
  getCommunity: communityId => httpClient.get(`/communities/${communityId}`),
  getCommunityArticles: async communityId => (await httpClient.get(`/communities/${communityId}/articles`)).articles,
  getCommunityPosts: (communityId, page = 1) => httpClient.get(`/communities/${communityId}/posts?page=${page}`),
  getCommunityMembers: async communityId => (await httpClient.get(`/communities/${communityId}/members`)).data,
  getCommunityMemberDirectory: (communityId, query = '', page = 1) => httpClient.get(`/communities/${communityId}/member-directory?q=${encodeURIComponent(query)}&page=${page}`),
  joinCommunity: communityId => httpClient.post(`/communities/${communityId}/join`),
  leaveCommunity: communityId => httpClient.delete(`/communities/${communityId}/leave`),
  createCommunityPost: (communityId, content, images = []) => {
    const form = new FormData();
    form.append('content', content);
    images.forEach((asset, index) => appendFile(form, 'images[]', asset, `community-post-image-${index + 1}.jpg`));
    return httpClient.postForm(`/communities/${communityId}/posts`, form);
  },
  getApplications: async () => (await httpClient.get('/community-applications')).applications,
  submitApplication: (communityId, answers) => httpClient.post(`/communities/${communityId}/applications`, { answers }),
  withdrawApplication: communityId => httpClient.delete(`/communities/${communityId}/applications`),
  getCommunityModeration: (communityId, type = 'applications', page = 1) => httpClient.get(`/communities/${communityId}/moderation?type=${type}&page=${page}`),
  reviewCommunityApplication: (communityId, applicationId, action) => httpClient.post(`/communities/${communityId}/moderation/applications/${applicationId}`, { action }),
  reviewCommunityPost: (communityId, postId, action) => httpClient.post(`/communities/${communityId}/moderation/posts/${postId}`, { action }),
  getFriendships: () => httpClient.get('/friendships'),
  getFriendsPage: (page = 1) => httpClient.get(`/friends?page=${page}`),
  getFriendSuggestions: (page = 1) => httpClient.get(`/friend-suggestions?page=${page}`),
  searchUsers: (query, page = 1) => httpClient.get(`/users/search?q=${encodeURIComponent(query)}&page=${page}`),
  getFriendRequestsPage: (direction = 'incoming', page = 1) => httpClient.get(`/friend-requests?direction=${direction}&page=${page}`),
  getBlockedUsersPage: (page = 1) => httpClient.get(`/blocked-users?page=${page}`),
  getBirthdayCelebrations: (page = 1) => httpClient.get(`/birthday-celebrations?page=${page}`),
  sendBirthdayWish: userId => httpClient.post(`/users/${userId}/birthday-wish`),
  sendFriendRequest: userId => httpClient.post(`/users/${userId}/friend-request`),
  updateRelationship: (userId, action) => httpClient.post(`/users/${userId}/relationship`, { action }),
  getChatsPage: (page = 1, query = '') => httpClient.get(`/chats?page=${page}&q=${encodeURIComponent(query)}`),
  getUnreadChatCount: async () => {
    const response = await httpClient.get('/chats?page=1');
    return response.unreadTotal ?? (response.data || []).filter(chat => Number(chat.unreadCount) > 0).length;
  },
  getChat: chatId => httpClient.get(`/chats/${chatId}`),
  getOrCreateChat: otherUser => httpClient.post(`/chats/with/${otherUser.id}`),
  getMessages: (chatId, page = 1) => httpClient.get(`/chats/${chatId}/messages?page=${page}`),
  sendMessage: (chatId, text, occasion = null, replyTo = null) => httpClient.post(`/chats/${chatId}/messages`, { text, occasion, reply_to: replyTo?.id || null }),
  editMessage: (chatId, messageId, text) => httpClient.patch(`/chats/${chatId}/messages/${messageId}`, { text }),
  deleteMessage: (chatId, messageId, scope) => httpClient.delete(`/chats/${chatId}/messages/${messageId}`, { body: { scope } }),
  reactToMessage: (chatId, messageId, emoji) => httpClient.post(`/chats/${chatId}/messages/${messageId}/reaction`, { emoji }),
  sendVoiceMessage: (chatId, audioUri, duration) => {
    const form = new FormData();
    const extension = audioUri.split('?')[0].split('.').pop()?.toLowerCase();
    form.append('type', 'voice');
    form.append('duration', String(Math.round(duration)));
    appendFile(form, 'audio', { uri: audioUri, fileName: `voice-note.${extension || 'm4a'}` }, `voice-note.${extension || 'm4a'}`);
    return httpClient.postForm(`/chats/${chatId}/messages`, form);
  },
  getNotifications: (page = 1) => httpClient.get(`/notifications?page=${page}`),
  getFeedBanner: () => httpClient.get('/feed-banner'),
  getSermons: (filters = {}, page = 1) => {
    const params = new URLSearchParams({ q: filters.query || '', title: filters.title || '', speaker: filters.speaker || '', category: filters.category || '', page: String(page) });
    return httpClient.get(`/sermons?${params.toString()}`);
  },
  getSermon: sermonId => httpClient.get(`/sermons/${sermonId}`),
  likeSermon: sermonId => httpClient.post(`/sermons/${sermonId}/like`),
  getSermonLikes: (sermonId, page = 1) => httpClient.get(`/sermons/${sermonId}/likes?page=${page}`),
  getSermonComments: (sermonId, page = 1) => httpClient.get(`/sermons/${sermonId}/comments?page=${page}`),
  createSermonComment: (sermonId, text, parentId = null) => httpClient.post(`/sermons/${sermonId}/comments`, { text, parent_id: parentId }),
  getSermonCommentReplies: (sermonId, commentId, page = 1) => httpClient.get(`/sermons/${sermonId}/comments/${commentId}/replies?page=${page}`),
  likeSermonComment: commentId => httpClient.post(`/sermon-comments/${commentId}/like`),
  editSermonComment: (commentId, text) => httpClient.patch(`/sermon-comments/${commentId}`, { text }),
  deleteSermonComment: commentId => httpClient.delete(`/sermon-comments/${commentId}`),
  markNotificationRead: id => httpClient.post(`/notifications/${id}/read`),
  markAllNotificationsRead: () => httpClient.post('/notifications/read-all'),
  registerPushToken: payload => httpClient.post('/push-tokens', payload),
  removePushToken: token => httpClient.delete('/push-tokens', { body: { token } }),
  sendEmailVerification: () => httpClient.post('/email/verification-notification'),
  verifyEmailOtp: code => httpClient.post('/email/verify-otp', { code }),
  deleteAccount: password => httpClient.delete('/user', { body: { password } }),
  submitSupportRequest: (type, subject, message) => httpClient.post('/support-requests', { type, subject, message }),
  submitReport: (targetType, targetId, reason, details) => httpClient.post('/reports', { targetType, targetId, reason, details: details || undefined }),
};

export default apiService;
