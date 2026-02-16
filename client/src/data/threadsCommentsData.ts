export interface Reply {
  id: string;
  author: {
    id?: string;
    name: string;
    avatar: string;
    verified: boolean;
    type: 'engineer' | 'business' | 'user' | 'agronomist';
    businessId?: string;
  };
  content: string;
  timeAgo: string;
  likes: number;
  isLiked: boolean;
  edited?: boolean;
}

export interface Comment {
  id: string;
  author: {
    id?: string;
    name: string;
    avatar: string;
    verified: boolean;
    type: 'engineer' | 'business' | 'user' | 'agronomist';
    businessId?: string;
  };
  content: string;
  timeAgo: string;
  likes: number;
  isLiked: boolean;
  replies: Reply[];
  edited?: boolean;
}

export const threadComments: { [key: string]: Comment[] } = {
  't1': [
    {
      id: 'c1',
      author: {
        id: 'user1',
        name: 'Farmer Ali',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
        verified: false,
        type: 'user',
      },
      content: 'Great advice! I planted my date palms in October last year and they\'re doing amazing now.',
      timeAgo: '2h ago',
      likes: 12,
      isLiked: false,
      replies: [
        {
          id: 'r1',
          author: {
            id: '1',
            name: 'Green Valley Nursery',
            avatar: 'https://images.unsplash.com/photo-1619077130450-baea09efa355?w=100',
            verified: true,
            type: 'business',
            businessId: '1',
          },
          content: 'That\'s wonderful to hear! October is indeed perfect timing. Make sure to maintain consistent watering during the first year.',
          timeAgo: '1h ago',
          likes: 5,
          isLiked: false,
        },
      ],
    },
    {
      id: 'c2',
      author: {
        id: 'eng1',
        name: 'Engineer Hassan',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
        verified: true,
        type: 'engineer',
      },
      content: 'Don\'t forget about soil preparation! Date palms prefer well-draining soil with proper pH levels.',
      timeAgo: '3h ago',
      likes: 18,
      isLiked: false,
      replies: [],
    },
    {
      id: 'c1_3',
      author: {
        id: 'user5',
        name: 'Ahmad',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100',
        verified: false,
        type: 'user',
      },
      content: 'What\'s the best spacing between date palm trees? My farm is 2 hectares.',
      timeAgo: '4h ago',
      likes: 10,
      isLiked: false,
      replies: [
        {
          id: 'r1_3',
          author: {
            id: 'eng3',
            name: 'Engineer Mohammed',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
            verified: true,
            type: 'engineer',
          },
          content: '@Ahmad For date palms, I recommend 8-10 meters spacing to allow proper canopy development and air circulation.',
          timeAgo: '3h ago',
          likes: 7,
          isLiked: false,
        },
      ],
    },
    {
      id: 'c1_4',
      author: {
        id: 'user6',
        name: 'Layla Ibrahim',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
        verified: false,
        type: 'user',
      },
      content: 'How long does it take for date palms to start producing fruit?',
      timeAgo: '5h ago',
      likes: 14,
      isLiked: false,
      replies: [
        {
          id: 'r1_4',
          author: {
            id: '1',
            name: 'Green Valley Nursery',
            avatar: 'https://images.unsplash.com/photo-1619077130450-baea09efa355?w=100',
            verified: true,
            type: 'business',
            businessId: '1',
          },
          content: '@Layla Ibrahim Typically 4-5 years from planting, but our certified seedlings may produce sooner with proper care.',
          timeAgo: '4h ago',
          likes: 9,
          isLiked: false,
        },
        {
          id: 'r1_4_2',
          author: {
            id: 'eng2',
            name: 'Engineer Sara',
            avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
            verified: true,
            type: 'engineer',
          },
          content: '@Layla Ibrahim Proper fertilization and irrigation can accelerate maturity. I can help design a care plan.',
          timeAgo: '3h ago',
          likes: 6,
          isLiked: false,
        },
      ],
    },
    {
      id: 'c1_5',
      author: {
        id: 'user7',
        name: 'Omar Abdullah',
        avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=100',
        verified: false,
        type: 'user',
      },
      content: 'I\'m planning a date farm near Madinah. Any specific variety recommendations?',
      timeAgo: '6h ago',
      likes: 16,
      isLiked: false,
      replies: [],
    },
  ],
  't2': [
    {
      id: 'c3',
      author: {
        id: 'user2',
        name: 'Sarah Ahmed',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
        verified: false,
        type: 'user',
      },
      content: 'This is so helpful! I\'ve been wasting a lot of water with traditional irrigation. How do I get started with drip irrigation?',
      timeAgo: '1h ago',
      likes: 8,
      isLiked: false,
      replies: [
        {
          id: 'r2',
          author: {
            id: 'eng1',
            name: 'Engineer Hassan',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
            verified: true,
            type: 'engineer',
          },
          content: 'Start with a professional assessment of your farm layout. I can help you design a customized system. DM me!',
          timeAgo: '45m ago',
          likes: 6,
          isLiked: false,
        },
      ],
    },
    {
      id: 'c3_2',
      author: {
        id: 'user8',
        name: 'Mohammed Al-Rashid',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
        verified: false,
        type: 'user',
      },
      content: 'I switched to drip irrigation last year and my water bill dropped by 50%! Best decision ever.',
      timeAgo: '2h ago',
      likes: 15,
      isLiked: false,
      replies: [
        {
          id: 'r2_2',
          author: {
            id: 'user2',
            name: 'Sarah Ahmed',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
            verified: false,
            type: 'user',
          },
          content: '@Mohammed Al-Rashid That\'s amazing! Which brand did you go with?',
          timeAgo: '1h ago',
          likes: 3,
          isLiked: false,
        },
      ],
    },
  ],
  't3': [
    {
      id: 'c39',
      author: {
        id: 'agr2',
        name: 'Agronomist Khalid',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
        verified: true,
        type: 'agronomist',
      },
      content: 'For Qassim, I recommend Yecora Rojo or Sakha 93 varieties. Both have excellent drought tolerance and yield well in that climate.',
      timeAgo: '4h ago',
      likes: 38,
      isLiked: true,
      replies: [
        {
          id: 'r39',
          author: {
            id: 'user2',
            name: 'Sarah Ahmed',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
            verified: false,
            type: 'user',
          },
          content: '@Agronomist Khalid Thank you! Where can I source these seeds?',
          timeAgo: '3h ago',
          likes: 12,
          isLiked: false,
        },
      ],
    },
    {
      id: 'c40',
      author: {
        id: 'user12',
        name: 'Abdullah Fahad',
        avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=100',
        verified: false,
        type: 'user',
      },
      content: 'I\'ve had great success with Sakha 93 in Hail region. Similar climate to Qassim. The yields are consistent even in dry years.',
      timeAgo: '3h ago',
      likes: 24,
      isLiked: false,
      replies: [
        {
          id: 'r40',
          author: {
            id: '1',
            name: 'Green Valley Nursery',
            avatar: 'https://images.unsplash.com/photo-1619077130450-baea09efa355?w=100',
            verified: true,
            type: 'business',
            businessId: '1',
          },
          content: '@Abdullah Fahad We stock both Yecora Rojo and Sakha 93 seeds. DM us for pricing and bulk orders!',
          timeAgo: '2h ago',
          likes: 8,
          isLiked: false,
        },
      ],
    },
    {
      id: 'c40_2',
      author: {
        id: 'eng3',
        name: 'Engineer Mohammed',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
        verified: true,
        type: 'engineer',
      },
      content: 'Don\'t forget to test your soil first. Wheat varieties perform differently based on soil type and nutrient availability.',
      timeAgo: '5h ago',
      likes: 21,
      isLiked: false,
      replies: [],
    },
  ],
  'thread5': [
    {
      id: 'c4',
      author: {
        id: '1',
        name: 'Green Valley Nursery',
        avatar: 'https://images.unsplash.com/photo-1619077130450-baea09efa355?w=100',
        verified: true,
        type: 'business',
        businessId: '1',
      },
      content: 'Composting is excellent! We use chicken manure mixed with plant residues. The key is maintaining the right carbon-to-nitrogen ratio (about 30:1).',
      timeAgo: '5h ago',
      likes: 24,
      isLiked: false,
      replies: [
        {
          id: 'r3',
          author: {
            id: 'user1',
            name: 'Farmer Ali',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
            verified: false,
            type: 'user',
          },
          content: 'Thank you! Where can I get chicken manure from? Do you sell it?',
          timeAgo: '4h ago',
          likes: 3,
          isLiked: false,
        },
        {
          id: 'r4',
          author: {
            id: '1',
            name: 'Green Valley Nursery',
            avatar: 'https://images.unsplash.com/photo-1619077130450-baea09efa355?w=100',
            verified: true,
            type: 'business',
            businessId: '1',
          },
          content: 'Yes, we do! Check our products page or message us for bulk orders.',
          timeAgo: '3h ago',
          likes: 2,
          isLiked: false,
        },
      ],
    },
    {
      id: 'c5',
      author: {
        id: 'eng2',
        name: 'Engineer Sara',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
        verified: true,
        type: 'engineer',
      },
      content: 'Don\'t forget to test your soil regularly when transitioning to organic. It helps you track nutrient levels and adjust your fertilization strategy.',
      timeAgo: '6h ago',
      likes: 15,
      isLiked: false,
      replies: [],
    },
  ],
  't4': [
    {
      id: 'c41',
      author: {
        id: 'eng2',
        name: 'Engineer Sara',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
        verified: true,
        type: 'engineer',
      },
      content: 'Indoor growing gives you more control over conditions, but outdoor herbs often have stronger flavor. In Jeddah\'s heat, indoor might be easier for delicate herbs.',
      timeAgo: '7h ago',
      likes: 42,
      isLiked: true,
      replies: [
        {
          id: 'r41',
          author: {
            id: 'user1',
            name: 'Farmer Ali',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
            verified: false,
            type: 'user',
          },
          content: '@Engineer Sara What about basil? I\'ve tried both and outdoor basil always bolts too fast.',
          timeAgo: '6h ago',
          likes: 18,
          isLiked: false,
        },
      ],
    },
    {
      id: 'c42',
      author: {
        id: 'user9',
        name: 'Nora Al-Hassan',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
        verified: false,
        type: 'user',
      },
      content: 'I do both! Mint and parsley outdoor in partial shade, basil and cilantro indoor under grow lights.',
      timeAgo: '8h ago',
      likes: 28,
      isLiked: false,
      replies: [],
    },
  ],
  't5': [
    {
      id: 'c43',
      author: {
        id: 'agr2',
        name: 'Agronomist Khalid',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
        verified: true,
        type: 'agronomist',
      },
      content: 'Cover cropping is crucial for soil health. I\'ve seen amazing results with clover and vetch as cover crops in winter. They fix nitrogen naturally.',
      timeAgo: '1d ago',
      likes: 67,
      isLiked: true,
      replies: [
        {
          id: 'r43',
          author: {
            id: 'user4',
            name: 'Fatima',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
            verified: false,
            type: 'user',
          },
          content: '@Agronomist Khalid Thank you! Where can I source cover crop seeds locally?',
          timeAgo: '23h ago',
          likes: 14,
          isLiked: false,
        },
      ],
    },
    {
      id: 'c44',
      author: {
        id: 'eng1',
        name: 'Engineer Hassan',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
        verified: true,
        type: 'engineer',
      },
      content: 'Drip irrigation combined with mulching reduces water use by 60-70%. This is essential for sustainable farming in our climate.',
      timeAgo: '1d ago',
      likes: 54,
      isLiked: false,
      replies: [],
    },
    {
      id: 'c45',
      author: {
        id: '1',
        name: 'Green Valley Nursery',
        avatar: 'https://images.unsplash.com/photo-1619077130450-baea09efa355?w=100',
        verified: true,
        type: 'business',
        businessId: '1',
      },
      content: 'We\'ve implemented solar-powered irrigation systems. Initial cost is high but long-term savings and sustainability make it worthwhile.',
      timeAgo: '1d ago',
      likes: 48,
      isLiked: false,
      replies: [
        {
          id: 'r45',
          author: {
            id: 'user12',
            name: 'Abdullah Fahad',
            avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=100',
            verified: false,
            type: 'user',
          },
          content: '@Green Valley Nursery What was the payback period for your solar system?',
          timeAgo: '22h ago',
          likes: 19,
          isLiked: false,
        },
      ],
    },
  ],
};

export function getTotalCommentCount(comments: Comment[]): number {
  return comments.reduce((total, comment) => {
    return total + 1 + comment.replies.length;
  }, 0);
}