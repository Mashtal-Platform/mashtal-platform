import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Clock, Bookmark, X, Send } from 'lucide-react';

interface PostsFeedProps {
  onSavePost?: (post: any) => void;
}

interface Comment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  timeAgo: string;
}

export function PostsFeed({ onSavePost }: PostsFeedProps) {
  const [posts, setPosts] = useState(mockPosts);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [commentsModalPost, setCommentsModalPost] = useState<string | null>(null);
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>(mockComments);
  const [newComment, setNewComment] = useState('');

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1,
        };
      }
      return post;
    }));
  };

  const handleSave = (post: any) => {
    setPosts(posts.map(p => {
      if (p.id === post.id) {
        return { ...p, isSaved: !p.isSaved };
      }
      return p;
    }));

    if (onSavePost && !post.isSaved) {
      onSavePost({
        id: Date.now().toString(),
        type: 'post',
        itemId: post.id,
        title: post.title,
        image: post.image || post.author.avatar,
        description: post.content,
        savedAt: new Date(),
      });
    }
  };

  const handleAddComment = (postId: string) => {
    if (!newComment.trim()) return;

    const newCommentObj: Comment = {
      id: Date.now().toString(),
      author: 'You',
      avatar: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=300',
      text: newComment,
      timeAgo: 'Just now',
    };

    setComments({
      ...comments,
      [postId]: [newCommentObj, ...(comments[postId] || [])],
    });

    setPosts(posts.map(post => 
      post.id === postId ? { ...post, comments: post.comments + 1 } : post
    ));

    setNewComment('');
  };

  const toggleReadMore = (postId: string) => {
    setExpandedPost(expandedPost === postId ? null : postId);
  };

  return (
    <section id="posts" className="py-16 bg-neutral-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-neutral-900 mb-4">
            Latest Updates & Posts
          </h2>
          <p className="text-lg text-neutral-600">
            Stay informed with news, tips, and announcements from agricultural businesses
          </p>
        </div>

        {/* Posts List */}
        <div className="space-y-6">
          {posts.map((post) => (
            <article key={post.id} className="bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-lg transition-shadow">
              {/* Post Header */}
              <div className="p-6 pb-4">
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-900">{post.author.name}</span>
                      {post.author.verified && (
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">
                          Verified
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <Clock className="w-4 h-4" />
                      <span>{post.timeAgo}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSave(post)}
                    className={`transition-colors ${
                      post.isSaved ? 'text-green-600' : 'text-neutral-400 hover:text-neutral-600'
                    }`}
                  >
                    <Bookmark className={`w-5 h-5 ${post.isSaved ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Post Content */}
                <h3 className="text-xl text-neutral-900 mb-3">{post.title}</h3>
                <p className={`text-neutral-600 mb-4 ${expandedPost === post.id ? '' : 'line-clamp-3'}`}>
                  {post.content}
                </p>

                {/* Post Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Post Image */}
              {post.image && (
                <div className="relative h-80">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Post Actions */}
              <div className="p-6 pt-4 border-t border-neutral-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-2 transition-colors ${
                        post.isLiked ? 'text-red-600' : 'text-neutral-600 hover:text-red-600'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                      <span>{post.likes}</span>
                    </button>
                    <button
                      onClick={() => setCommentsModalPost(post.id)}
                      className="flex items-center gap-2 text-neutral-600 hover:text-green-600 transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>{post.comments}</span>
                    </button>
                    <button className="flex items-center gap-2 text-neutral-600 hover:text-blue-600 transition-colors">
                      <Share2 className="w-5 h-5" />
                      <span>{post.shares}</span>
                    </button>
                  </div>
                  <button
                    onClick={() => toggleReadMore(post.id)}
                    className="text-green-600 hover:text-green-700 transition-colors"
                  >
                    {expandedPost === post.id ? 'Show Less ←' : 'Read More →'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-8">
          <button className="px-8 py-3 bg-white border-2 border-neutral-200 text-neutral-700 rounded-lg hover:border-green-600 hover:text-green-600 transition-colors">
            Load More Posts
          </button>
        </div>
      </div>

      {/* Comments Modal */}
      {commentsModalPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
              <h3 className="text-xl text-neutral-900">Comments</h3>
              <button
                onClick={() => setCommentsModalPost(null)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {(comments[commentsModalPost] || []).map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <img
                    src={comment.avatar}
                    alt={comment.author}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="bg-neutral-100 rounded-2xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-neutral-900">{comment.author}</span>
                        <span className="text-xs text-neutral-500">{comment.timeAgo}</span>
                      </div>
                      <p className="text-neutral-700">{comment.text}</p>
                    </div>
                  </div>
                </div>
              ))}

              {(!comments[commentsModalPost] || comments[commentsModalPost].length === 0) && (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-600">No comments yet. Be the first to comment!</p>
                </div>
              )}
            </div>

            {/* Add Comment */}
            <div className="p-6 border-t border-neutral-200">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment(commentsModalPost)}
                  placeholder="Write a comment..."
                  className="flex-1 px-4 py-3 border border-neutral-200 rounded-xl outline-none focus:border-green-600"
                />
                <button
                  onClick={() => handleAddComment(commentsModalPost)}
                  className="bg-green-600 text-white p-3 rounded-xl hover:bg-green-700 transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

const mockPosts = [
  {
    id: '1',
    author: {
      name: 'Green Valley Nursery',
      avatar: 'https://images.unsplash.com/photo-1619077130450-baea09efa355?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbGFudCUyMG51cnNlcnklMjBncmVlbmhvdXNlfGVufDF8fHx8MTc2NTc0MjUzNHww&ixlib=rb-4.1.0&q=80&w=300',
      verified: true,
    },
    timeAgo: '2 hours ago',
    title: 'New Arrival: Organic Date Palm Seedlings',
    content: 'We\'re excited to announce the arrival of premium organic date palm seedlings, grown using sustainable practices. These hardy seedlings are perfect for the local climate and come with full growing instructions. Each seedling is carefully selected and tested for quality. We offer free consultation on planting and care.',
    image: 'https://images.unsplash.com/photo-1697788189761-d954ed91cdb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVlbiUyMHBsYW50cyUyMG5hdHVyZXxlbnwxfHx8fDE3NjU2NTE5Nzd8MA&ixlib=rb-4.1.0&q=80&w=1080',
    tags: ['DatePalm', 'OrganicGrowing', 'NewArrival'],
    likes: 142,
    comments: 28,
    shares: 15,
    isLiked: false,
    isSaved: false,
  },
  {
    id: '2',
    author: {
      name: 'AgriTools Pro',
      avatar: 'https://images.unsplash.com/photo-1690986469727-1ed8bcdf6384?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZ3JpY3VsdHVyZSUyMHRvb2xzJTIwZXF1aXBtZW50fGVufDF8fHx8MTc2NTY1NDY4NHww&ixlib=rb-4.1.0&q=80&w=300',
      verified: true,
    },
    timeAgo: '5 hours ago',
    title: 'Essential Tools for Winter Planting Season',
    content: 'As we approach the winter planting season, here are the must-have tools every farmer needs. From soil preparation to irrigation systems, we have everything in stock with special seasonal discounts. Our expert team can help you choose the right equipment for your specific farming needs.',
    image: 'https://images.unsplash.com/photo-1690986469727-1ed8bcdf6384?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZ3JpY3VsdHVyZSUyMHRvb2xzJTIwZXF1aXBtZW50fGVufDF8fHx8MTc2NTY1NDY4NHww&ixlib=rb-4.1.0&q=80&w=1080',
    tags: ['WinterPlanting', 'FarmTools', 'SeasonalGuide'],
    likes: 98,
    comments: 15,
    shares: 22,
    isLiked: false,
    isSaved: false,
  },
  {
    id: '3',
    author: {
      name: 'Eco Farm Solutions',
      avatar: 'https://images.unsplash.com/photo-1636089167961-4964523e6c3f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXJtaW5nJTIwc3Vuc2V0JTIwbGFuZHNjYXBlfGVufDF8fHx8MTc2NTc0MjUzNnww&ixlib=rb-4.1.0&q=80&w=300',
      verified: true,
    },
    timeAgo: '1 day ago',
    title: 'Sustainable Farming Workshop - Free Registration',
    content: 'Join us for a comprehensive workshop on sustainable farming practices. Learn about water conservation, organic pest control, and soil health management from industry experts. Limited seats available, register now to secure your spot!',
    image: 'https://images.unsplash.com/photo-1631337902392-b4bb679fbfdb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbmljJTIwdmVnZXRhYmxlcyUyMGZhcm1pbmd8ZW58MXx8fHwxNzY1NzQyNTM0fDA&ixlib=rb-4.1.0&q=80&w=1080',
    tags: ['Workshop', 'SustainableFarming', 'Education'],
    likes: 256,
    comments: 42,
    shares: 38,
    isLiked: false,
    isSaved: false,
  },
];

const mockComments: { [key: string]: Comment[] } = {
  '1': [
    {
      id: '1',
      author: 'Farmer Ali',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
      text: 'Great quality! I bought some last month and they\'re growing beautifully.',
      timeAgo: '1 hour ago',
    },
    {
      id: '2',
      author: 'Sarah Ahmed',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
      text: 'Do you offer delivery to Jeddah?',
      timeAgo: '45 minutes ago',
    },
  ],
  '2': [
    {
      id: '3',
      author: 'Mohammed Hassan',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
      text: 'Very informative! Looking forward to the winter season.',
      timeAgo: '3 hours ago',
    },
  ],
  '3': [
    {
      id: '4',
      author: 'Fatima Al-Zahrani',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300',
      text: 'Just registered! Can\'t wait for the workshop.',
      timeAgo: '12 hours ago',
    },
  ],
};
