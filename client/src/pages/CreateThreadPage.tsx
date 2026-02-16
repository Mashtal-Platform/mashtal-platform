import React, { useState, useRef, useEffect } from 'react';
import { X, Eye, AlertCircle, Heart, MessageCircle, Send, Hash } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../contexts/AuthContext';

interface CreateThreadPageProps {
  onCreateThread: (thread: { title: string; content: string; tags?: string[] }) => void;
  onBack: () => void;
}

interface MentionUser {
  id: string;
  name: string;
  avatar: string;
  type: 'engineer' | 'business' | 'user';
  verified?: boolean;
}

// Mock users/businesses for mentions
const mentionableUsers: MentionUser[] = [
  { id: '1', name: 'Green Valley Nursery', avatar: 'https://images.unsplash.com/photo-1619077130450-baea09efa355?w=100', type: 'business', verified: true },
  { id: '2', name: 'AgriTools Pro', avatar: 'https://images.unsplash.com/photo-1690986469727-1ed8bcdf6384?w=100', type: 'business', verified: true },
  { id: '5', name: 'Eco Farm Solutions', avatar: 'https://images.unsplash.com/photo-1636089167961-4964523e6c3f?w=100', type: 'business', verified: true },
  { id: '3', name: 'Fresh Harvest Farm', avatar: 'https://images.unsplash.com/photo-1631337902392-b4bb679fbfdb?w=100', type: 'business', verified: true },
  { id: 'eng1', name: 'Engineer Hassan', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', type: 'engineer', verified: true },
  { id: 'eng2', name: 'Engineer Sara', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100', type: 'engineer', verified: true },
  { id: 'user1', name: 'Farmer Ali', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', type: 'user' },
  { id: 'user2', name: 'Sarah Ahmed', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', type: 'user' },
  { id: 'user3', name: 'Mohammed Hassan', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', type: 'user' },
];

export function CreateThreadPage({ onCreateThread, onBack }: CreateThreadPageProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mention functionality
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const [filteredMentions, setFilteredMentions] = useState<MentionUser[]>([]);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

  // Handle mention search
  useEffect(() => {
    if (mentionSearch) {
      const filtered = mentionableUsers.filter(user =>
        user.name.toLowerCase().includes(mentionSearch.toLowerCase())
      );
      setFilteredMentions(filtered);
      setSelectedMentionIndex(0);
    } else {
      setFilteredMentions([]);
    }
  }, [mentionSearch]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    setContent(value);

    // Check for @ mention
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Check if there's a space after @, if so, don't show mentions
      if (!textAfterAt.includes(' ')) {
        setMentionSearch(textAfterAt);
        setMentionPosition(lastAtIndex);
        setShowMentions(true);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (mentionUser: MentionUser) => {
    const beforeMention = content.substring(0, mentionPosition);
    const afterMention = content.substring(mentionPosition + mentionSearch.length + 1);
    const newValue = `${beforeMention}@${mentionUser.name} ${afterMention}`;
    
    setContent(newValue);
    setShowMentions(false);
    setMentionSearch('');
    
    // Focus back on textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handleMentionKeyDown = (e: React.KeyboardEvent) => {
    if (!showMentions || filteredMentions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedMentionIndex(prev => 
        prev < filteredMentions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedMentionIndex(prev => 
        prev > 0 ? prev - 1 : filteredMentions.length - 1
      );
    } else if (e.key === 'Enter' && showMentions) {
      e.preventDefault();
      insertMention(filteredMentions[selectedMentionIndex]);
    } else if (e.key === 'Escape') {
      setShowMentions(false);
    }
  };

  const handleHashtagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && hashtagInput.trim()) {
      e.preventDefault();
      addHashtag();
    }
  };

  const addHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, ''); // Remove # if user types it
    if (tag && !hashtags.includes(tag) && hashtags.length < 10) {
      setHashtags([...hashtags, tag]);
      setHashtagInput('');
    }
  };

  const removeHashtag = (tagToRemove: string) => {
    setHashtags(hashtags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = () => {
    if (!content.trim()) {
      alert('Please provide content for your thread');
      return;
    }

    onCreateThread({
      title: title || '',
      content: content.trim(),
      tags: hashtags,
    });
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-neutral-700" />
            </button>
            <div>
              <h1 className="text-neutral-900">Create Thread</h1>
              <p className="text-sm text-neutral-600">Share your thoughts with the community</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              {showPreview ? 'Edit' : 'Preview'}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!content.trim()}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Post Thread
            </Button>
          </div>
        </div>

        {!showPreview ? (
          /* Edit Mode */
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="p-6 space-y-4">
              {/* Title Input */}
              <div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Thread title (optional)"
                  className="w-full text-xl font-semibold text-neutral-900 placeholder:text-neutral-400 border-0 outline-none focus:ring-0 p-0"
                />
              </div>

              {/* Content Input */}
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={content}
                  onChange={handleContentChange}
                  onKeyDown={handleMentionKeyDown}
                  placeholder="What's on your mind? Use @ to mention someone..."
                  className="min-h-[200px] resize-none border-0 outline-none focus:ring-0 text-neutral-900 placeholder:text-neutral-400 p-0"
                />

                {/* Mentions Dropdown */}
                {showMentions && filteredMentions.length > 0 && (
                  <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-neutral-200 max-h-60 overflow-y-auto z-50">
                    {filteredMentions.map((mentionUser, index) => (
                      <button
                        key={mentionUser.id}
                        onClick={() => insertMention(mentionUser)}
                        className={`w-full flex items-center gap-3 p-3 hover:bg-neutral-50 transition-colors ${
                          index === selectedMentionIndex ? 'bg-neutral-50' : ''
                        }`}
                      >
                        <img
                          src={mentionUser.avatar}
                          alt={mentionUser.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium text-neutral-900">
                              {mentionUser.name}
                            </span>
                            {mentionUser.verified && (
                              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                              </svg>
                            )}
                          </div>
                          <span className="text-xs text-neutral-500 capitalize">
                            {mentionUser.type}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Hashtags Input */}
              <div className="border-t border-neutral-100 pt-4">
                <label className="block text-sm font-medium text-neutral-900 mb-2">
                  <Hash className="w-4 h-4 inline mr-1" />
                  Hashtags (Optional)
                </label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={hashtagInput}
                      onChange={(e) => setHashtagInput(e.target.value)}
                      onKeyDown={handleHashtagInputKeyDown}
                      placeholder="Add hashtags (e.g., agriculture, farming)"
                      className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                      maxLength={30}
                    />
                    <Button
                      onClick={addHashtag}
                      disabled={!hashtagInput.trim() || hashtags.length >= 10}
                      variant="outline"
                      type="button"
                    >
                      Add
                    </Button>
                  </div>
                  {hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {hashtags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                        >
                          #{tag}
                          <button
                            onClick={() => removeHashtag(tag)}
                            className="hover:bg-green-200 rounded-full p-0.5 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-neutral-500">{hashtags.length}/10 hashtags</p>
                </div>
              </div>

              {/* Character Counter */}
              <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <AlertCircle className="w-4 h-4" />
                  <span>Use @ to mention users and businesses</span>
                </div>
                <span className="text-sm text-neutral-500">
                  {content.length} characters
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Preview Mode */
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="p-6">
              {/* Author Info */}
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={user?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=300'}
                  alt={user?.fullName || 'User'}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-neutral-900">
                      {user?.fullName || 'User'}
                    </span>
                    {user?.verified && (
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                      </svg>
                    )}
                  </div>
                  <p className="text-sm text-neutral-600">Just now</p>
                </div>
              </div>

              {/* Thread Content */}
              {title && (
                <h2 className="text-xl font-semibold text-neutral-900 mb-3">
                  {title}
                </h2>
              )}
              <p className="text-neutral-800 whitespace-pre-wrap">
                {content}
              </p>

              {/* Hashtags Preview */}
              {hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {hashtags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-6 pt-4 border-t border-neutral-100">
                <button className="flex items-center gap-2 text-neutral-600 hover:text-green-600 transition-colors">
                  <Heart className="w-5 h-5" />
                  <span className="text-sm">0</span>
                </button>
                <button className="flex items-center gap-2 text-neutral-600 hover:text-green-600 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm">0</span>
                </button>
                <button className="flex items-center gap-2 text-neutral-600 hover:text-green-600 transition-colors">
                  <Send className="w-5 h-5" />
                  <span className="text-sm">Share</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
          <h3 className="text-sm font-medium text-green-900 mb-2">Tips for creating great threads:</h3>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Be clear and concise in your message</li>
            <li>• Use @ to mention relevant people or businesses</li>
            <li>• Stay respectful and constructive</li>
            <li>• Share valuable insights or ask meaningful questions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}