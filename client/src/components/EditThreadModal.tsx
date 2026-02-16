import React, { useState, useRef, useEffect } from 'react';
import { X, Eye, Hash } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

interface EditThreadModalProps {
  thread: {
    id: string;
    title?: string;
    content: string;
    tags?: string[];
  };
  isOpen: boolean;
  onClose: () => void;
  onSave: (threadId: string, updatedData: { title?: string; content: string; tags?: string[] }) => void;
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

export function EditThreadModal({ thread, isOpen, onClose, onSave }: EditThreadModalProps) {
  const [title, setTitle] = useState(thread.title || '');
  const [content, setContent] = useState(thread.content || '');
  const [showPreview, setShowPreview] = useState(false);
  const [hashtags, setHashtags] = useState<string[]>(thread.tags || []);
  const [hashtagInput, setHashtagInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mention functionality
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const [filteredMentions, setFilteredMentions] = useState<MentionUser[]>([]);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

  // Reset form when thread changes
  useEffect(() => {
    setTitle(thread.title || '');
    setContent(thread.content || '');
    setHashtags(thread.tags || []);
  }, [thread]);

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
    const tag = hashtagInput.trim().replace(/^#/, '');
    if (tag && !hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
      setHashtagInput('');
    }
  };

  const removeHashtag = (tagToRemove: string) => {
    setHashtags(hashtags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = () => {
    if (!content.trim()) {
      return;
    }

    onSave(thread.id, {
      title: title.trim(),
      content: content.trim(),
      tags: hashtags,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-neutral-900">Edit Thread</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Preview/Edit Toggle */}
          <div className="flex gap-2 mb-6">
            <Button
              onClick={() => setShowPreview(false)}
              variant={!showPreview ? "default" : "outline"}
              className={!showPreview ? "bg-green-600 text-white" : ""}
            >
              Edit
            </Button>
            <Button
              onClick={() => setShowPreview(true)}
              variant={showPreview ? "default" : "outline"}
              className={showPreview ? "bg-green-600 text-white" : ""}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
          </div>

          {!showPreview ? (
            <>
              {/* Title Input */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Title (Optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your thread a title..."
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Content Input */}
              <div className="mb-4 relative">
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Content
                </label>
                <Textarea
                  ref={textareaRef}
                  value={content}
                  onChange={handleContentChange}
                  onKeyDown={handleMentionKeyDown}
                  placeholder="Share your discussion... Use @ to mention someone"
                  className="min-h-[200px] resize-none"
                />
                
                {/* Mentions Dropdown */}
                {showMentions && filteredMentions.length > 0 && (
                  <div className="absolute z-20 bg-white border border-neutral-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto w-64">
                    {filteredMentions.map((mentionUser, index) => (
                      <button
                        key={mentionUser.id}
                        onClick={() => insertMention(mentionUser)}
                        className={`w-full px-4 py-2 flex items-center gap-3 hover:bg-neutral-50 transition-colors ${
                          index === selectedMentionIndex ? 'bg-green-50' : ''
                        }`}
                      >
                        <img
                          src={mentionUser.avatar}
                          alt={mentionUser.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div className="flex-1 text-left">
                          <div className="font-medium text-sm text-neutral-900">{mentionUser.name}</div>
                          <div className="text-xs text-neutral-500 capitalize">{mentionUser.type}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Hashtags */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Tags (Optional)
                </label>
                <div className="flex gap-2 mb-2">
                  <div className="relative flex-1">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      value={hashtagInput}
                      onChange={(e) => setHashtagInput(e.target.value)}
                      onKeyDown={handleHashtagInputKeyDown}
                      placeholder="Add a tag..."
                      className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <Button onClick={addHashtag} variant="outline" disabled={!hashtagInput.trim()}>
                    Add
                  </Button>
                </div>
                {hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {hashtags.map(tag => (
                      <span
                        key={tag}
                        className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                      >
                        #{tag}
                        <button
                          onClick={() => removeHashtag(tag)}
                          className="hover:bg-green-100 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-neutral-50 rounded-lg p-6">
              {title && <h3 className="text-2xl font-bold text-neutral-900 mb-4">{title}</h3>}
              <p className="text-neutral-700 whitespace-pre-wrap mb-4">{content}</p>
              {hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {hashtags.map(tag => (
                    <span key={tag} className="text-green-600 text-sm">#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleSave}
              disabled={!content.trim()}
              className="flex-1 bg-green-600 text-white hover:bg-green-700 disabled:bg-neutral-300 disabled:cursor-not-allowed"
            >
              Save Changes
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
