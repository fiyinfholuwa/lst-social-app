import httpClient from './httpClient';

const apiService = {
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
  getUserProfile: async () => (await httpClient.get('/user')).user,
  updateUserProfile: updates => httpClient.patch('/user', updates),
  getUser: userId => httpClient.get(`/users/${userId}`),
  getPosts: () => httpClient.get('/posts'),
  getPostsPage: page => httpClient.get(`/posts?page=${page}`),
  getPost: postId => httpClient.get(`/posts/${postId}`),
  createPost: (content, images = []) => {
    const form = new FormData();
    form.append('content', content);
    images.forEach((asset, index) => form.append('images[]', {
      uri: asset.uri,
      name: asset.fileName || `post-image-${index + 1}.jpg`,
      type: asset.mimeType || 'image/jpeg',
    }));
    return httpClient.postForm('/posts', form);
  },
  updatePost: (postId, content, postImages = []) => {
    const form = new FormData();
    form.append('_method', 'PATCH');
    form.append('content', content);
    postImages.filter(image => image.existing).forEach(image => form.append('existing_images[]', image.uri));
    postImages.filter(image => !image.existing).forEach((image, index) => form.append('images[]', {
      uri: image.uri,
      name: image.fileName || `post-image-${index + 1}.jpg`,
      type: image.mimeType || 'image/jpeg',
    }));
    return httpClient.postForm(`/posts/${postId}`, form);
  },
  deletePost: postId => httpClient.delete(`/posts/${postId}`),
  likePost: postId => httpClient.post(`/posts/${postId}/like`),
  addComment: (postId, text, parentId = null) => httpClient.post(`/posts/${postId}/comments`, { text, parent_id: parentId }),
  getComments: (postId, page = 1) => httpClient.get(`/posts/${postId}/comments?page=${page}`),
  getCommentReplies: (postId, commentId, page = 1) => httpClient.get(`/posts/${postId}/comments/${commentId}/replies?page=${page}`),
  likeComment: commentId => httpClient.post(`/comments/${commentId}/like`),
  getSavedPostIds: async () => (await httpClient.get('/saved-posts')).savedPostIds,
  toggleSavedPost: postId => httpClient.post(`/posts/${postId}/save`),
  getCommunities: () => httpClient.get('/communities'),
  getCommunity: communityId => httpClient.get(`/communities/${communityId}`),
  getCommunityPosts: (communityId, page = 1) => httpClient.get(`/communities/${communityId}/posts?page=${page}`),
  getCommunityMembers: async communityId => (await httpClient.get(`/communities/${communityId}/members`)).data,
  getCommunityMemberDirectory: (communityId, query = '', page = 1) => httpClient.get(`/communities/${communityId}/member-directory?q=${encodeURIComponent(query)}&page=${page}`),
  joinCommunity: communityId => httpClient.post(`/communities/${communityId}/join`),
  leaveCommunity: communityId => httpClient.delete(`/communities/${communityId}/leave`),
  createCommunityPost: (communityId, content, images = []) => {
    const form = new FormData();
    form.append('content', content);
    images.forEach((asset, index) => form.append('images[]', {
      uri: asset.uri,
      name: asset.fileName || `community-post-image-${index + 1}.jpg`,
      type: asset.mimeType || 'image/jpeg',
    }));
    return httpClient.postForm(`/communities/${communityId}/posts`, form);
  },
  getApplications: async () => (await httpClient.get('/community-applications')).applications,
  submitApplication: (communityId, answers) => httpClient.post(`/communities/${communityId}/applications`, { answers }),
  withdrawApplication: communityId => httpClient.delete(`/communities/${communityId}/applications`),
  getFriendships: () => httpClient.get('/friendships'),
  searchUsers: async query => (await httpClient.get(`/users/search?q=${encodeURIComponent(query)}`)).data,
  sendFriendRequest: userId => httpClient.post(`/users/${userId}/friend-request`),
  updateRelationship: (userId, action) => httpClient.post(`/users/${userId}/relationship`, { action }),
  getChats: () => httpClient.get('/chats'),
  getChat: chatId => httpClient.get(`/chats/${chatId}`),
  getOrCreateChat: otherUser => httpClient.post(`/chats/with/${otherUser.id}`),
  getMessages: chatId => httpClient.get(`/chats/${chatId}/messages`),
  sendMessage: (chatId, text) => httpClient.post(`/chats/${chatId}/messages`, { text }),
  sendVoiceMessage: (chatId, audioUri, duration) => httpClient.post(`/chats/${chatId}/messages`, { type: 'voice', audioUri, duration }),
  getNotifications: () => httpClient.get('/notifications'),
  markNotificationRead: id => httpClient.post(`/notifications/${id}/read`),
  markAllNotificationsRead: () => httpClient.post('/notifications/read-all'),
};

export default apiService;
