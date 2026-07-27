import {
          mockPosts,
          mockCommunities,
          mockChats,
          mockMessages,
          mockUser,
        } from './mockData';

        const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

        const apiService = {
          login: async (email, password) => {
            await delay(600);
            return { user: mockUser, token: 'fake-jwt-token' };
          },
          register: async (name, email, password) => {
            await delay(600);
            return { user: { ...mockUser, name, email }, token: 'fake-jwt-token' };
          },
          getPosts: async () => {
            await delay(400);
            return mockPosts;
          },
          getPost: async (postId) => {
            await delay(300);
            return mockPosts.find(p => p.id === postId) || null;
          },
          createPost: async (content, image = null, communityId = null) => {
            await delay(500);
            const newPost = {
              id: Date.now().toString(),
              userId: mockUser.id,
              userName: mockUser.name,
              userAvatar: mockUser.avatar,
              content,
              image,
              likes: 0,
              comments: [],
              timestamp: 'Just now',
              communityId,
            };
            mockPosts.unshift(newPost);
            return newPost;
          },
          likePost: async (postId) => {
            await delay(200);
            const post = mockPosts.find(p => p.id === postId);
            if (post) post.likes += 1;
            return post;
          },
          addComment: async (postId, text) => {
            await delay(300);
            const post = mockPosts.find(p => p.id === postId);
            if (!post) throw new Error('Post not found');
            const newComment = {
              id: 'c' + Date.now(),
              userId: mockUser.id,
              userName: mockUser.name,
              text,
              timestamp: 'Just now',
            };
            post.comments.push(newComment);
            return newComment;
          },
          getCommunities: async () => {
            await delay(400);
            return mockCommunities;
          },
          getCommunity: async (communityId) => {
            await delay(300);
            return mockCommunities.find(c => c.id === communityId) || null;
          },
          joinCommunity: async (communityId) => {
            await delay(500);
            const community = mockCommunities.find(c => c.id === communityId);
            if (community) community.memberCount += 1;
            return { success: true };
          },
          getChats: async () => {
            await delay(400);
            return mockChats;
          },
          getMessages: async (chatId) => {
            await delay(300);
            return mockMessages[chatId] || [];
          },
          sendMessage: async (chatId, text) => {
            await delay(300);
            const msg = { id: 'm' + Date.now(), senderId: mockUser.id, text, timestamp: 'Just now' };
            if (!mockMessages[chatId]) mockMessages[chatId] = [];
            mockMessages[chatId].push(msg);
            return msg;
          },
          getUserProfile: async () => {
            await delay(300);
            return mockUser;
          },
          updateUserProfile: async (updates) => {
            await delay(400);
            Object.assign(mockUser, updates);
            return mockUser;
          },
        };

        export default apiService;
      