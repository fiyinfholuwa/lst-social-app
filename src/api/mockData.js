export const mockPosts = [
          {
            id: '1',
            userId: 'u1',
            userName: 'Grace Johnson',
            userAvatar: 'https://i.pravatar.cc/100?img=1',
            content: '"Trust in the Lord with all your heart…" – Proverbs 3:5. This verse has carried me through tough times. Share your favourite verse below! 🙏',
            image: 'https://picsum.photos/400/200?random=1',
            likes: 24,
            comments: [
              { id: 'c1', userId: 'u2', userName: 'David', text: 'Amen! That’s my anchor verse.', timestamp: '2h ago' },
              { id: 'c2', userId: 'u3', userName: 'Sarah', text: 'I love that one too. ❤️', timestamp: '1h ago' },
            ],
            timestamp: '3h ago',
            communityId: null,
          },
          {
            id: '2',
            userId: 'u4',
            userName: 'Pastor Michael',
            userAvatar: 'https://i.pravatar.cc/100?img=4',
            content: 'Join our community "Sexual Puritans and Virgins" – a safe space to pursue purity together. Rules: single and committed to abstinence. Click to join!',
            image: null,
            likes: 42,
            comments: [],
            timestamp: '5h ago',
            communityId: 'comm1',
          },
        ];

        export const mockCommunities = [
          {
            id: 'comm1',
            name: 'Sexual Puritans & Virgins',
            description: 'For singles pursuing purity and holiness.',
            rules: 'Must be single and committed to abstinence.',
            memberCount: 128,
            image: 'https://picsum.photos/200/200?random=10',
            admin: 'Pastor Michael',
            posts: [
              { id: 'p1', content: 'Weekly purity challenge: spend 30 minutes in prayer daily.', timestamp: '1d ago' },
            ],
          },
          {
            id: 'comm2',
            name: 'Addiction Recovery',
            description: 'Support for those overcoming addictions.',
            rules: 'Active in recovery and sober ≥30 days.',
            memberCount: 93,
            image: 'https://picsum.photos/200/200?random=11',
            admin: 'Brother James',
            posts: [
              { id: 'p2', content: 'Celebrate your milestones! Share your testimony.', timestamp: '2d ago' },
            ],
          },
          {
            id: 'comm3',
            name: 'Maritally Challenged (Healing)',
            description: 'Restoration for marriages in crisis.',
            rules: 'Married and seeking healing.',
            memberCount: 76,
            image: 'https://picsum.photos/200/200?random=12',
            admin: 'Sister Ruth',
            posts: [],
          },
          {
            id: 'comm4',
            name: 'Quick Marital Settlement',
            description: 'Engaged or planning to marry within 6 months.',
            rules: 'Engaged or with a clear wedding date.',
            memberCount: 45,
            image: 'https://picsum.photos/200/200?random=13',
            admin: 'Elder Peter',
            posts: [],
          },
          {
            id: 'comm5',
            name: 'Couples in Courtship',
            description: 'Mentorship for courting couples.',
            rules: 'In courtship and need mentorship.',
            memberCount: 62,
            image: 'https://picsum.photos/200/200?random=14',
            admin: 'Pastor David',
            posts: [],
          },
          {
            id: 'comm6',
            name: 'Special Disciples',
            description: 'Invitation-only leadership group.',
            rules: 'Invitation-only / leadership approval.',
            memberCount: 18,
            image: 'https://picsum.photos/200/200?random=15',
            admin: 'Apostle John',
            posts: [],
          },
          {
            id: 'comm7',
            name: 'All-Round Whole Singles',
            description: 'Single and on a mission for God.',
            rules: 'Single and actively serving.',
            memberCount: 210,
            image: 'https://picsum.photos/200/200?random=16',
            admin: 'Sister Mary',
            posts: [],
          },
        ];

        export const mockChats = [
          {
            id: 'chat1',
            withUser: { id: 'u2', name: 'David', avatar: 'https://i.pravatar.cc/100?img=2' },
            lastMessage: 'See you at the prayer meeting!',
            timestamp: '12:30 PM',
          },
          {
            id: 'chat2',
            withUser: { id: 'u3', name: 'Sarah', avatar: 'https://i.pravatar.cc/100?img=3' },
            lastMessage: 'Could you pray for my family?',
            timestamp: 'Yesterday',
          },
        ];

        export const mockMessages = {
          chat1: [
            { id: 'm1', senderId: 'u1', text: 'Hey David, how are you?', timestamp: '11:00 AM' },
            { id: 'm2', senderId: 'u2', text: 'I’m blessed! How about you?', timestamp: '11:05 AM' },
            { id: 'm3', senderId: 'u1', text: 'See you at the prayer meeting!', timestamp: '12:30 PM' },
          ],
          chat2: [
            { id: 'm4', senderId: 'u3', text: 'Could you pray for my family?', timestamp: 'Yesterday' },
            { id: 'm5', senderId: 'u1', text: 'Of course, I will.', timestamp: 'Yesterday' },
          ],
        };

        export const mockUser = {
          id: 'u1',
          name: 'Grace Johnson',
          email: 'grace@example.com',
          avatar: 'https://i.pravatar.cc/200?img=1',
          bio: 'Lover of Jesus. Wife. Mom. Worship leader.',
          joinedCommunities: ['comm1', 'comm7'],
        };
      