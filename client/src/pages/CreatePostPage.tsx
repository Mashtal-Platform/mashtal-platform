import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, Eye, AlertCircle, Heart, MessageCircle, Send, Hash } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../contexts/AuthContext';
import { fetchMentionableProfiles } from '../shared/api/users';
import { getAvatarUrl } from '../shared/api/client';
import { useTranslation } from 'react-i18next';

interface CreatePostPageProps {
  onCreatePost: (post: { title: string; content: string; image: string; tags?: string[] }, imageFile?: File) => void;
  onBack: () => void;
}

interface MentionUser {
  id: string;
  name: string;
  avatar: string;
  type: string;
  verified?: boolean;
}

export function CreatePostPage({ onCreatePost, onBack }: CreatePostPageProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const displayName =
    user?.role === 'business'
      ? (user.companyName || user.fullName || t('common.business'))
      : (user?.fullName || t('common.you'));
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const postImageFileRef = useRef<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mention functionality
  const [mentionableUsers, setMentionableUsers] = useState<MentionUser[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const [filteredMentions, setFilteredMentions] = useState<MentionUser[]>([]);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    fetchMentionableProfiles()
      .then((profiles) => {
        if (!mounted) return;
        const mapped: MentionUser[] = (Array.isArray(profiles) ? profiles : [])
          .map((u: any) => ({
            id: u.id,
            name: (u.type === 'business' || u.role === 'business'
              ? (u.companyName || u.fullName)
              : (u.fullName || u.companyName) || ''
            ).trim(),
            avatar: getAvatarUrl(
              u.avatar,
              u.type === 'business' || u.role === 'business'
                ? (u.companyName || u.fullName)
                : (u.fullName || u.companyName)
            ),
            type: u.role || 'visitor',
            verified: !!u.verified,
          }))
          .filter((u) => u.name.length > 0);
        setMentionableUsers(mapped);
      })
      .catch(() => {
        if (mounted) setMentionableUsers([]);
      });
    return () => { mounted = false; };
  }, []);

  // Handle mention search
  useEffect(() => {
    if (mentionSearch) {
      const filtered = mentionableUsers.filter(u =>
        u.name.toLowerCase().includes(mentionSearch.toLowerCase())
      );
      setFilteredMentions(filtered);
      setSelectedMentionIndex(0);
    } else {
      setFilteredMentions([]);
    }
  }, [mentionSearch, mentionableUsers]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      postImageFileRef.current = file;
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    postImageFileRef.current = null;
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
      alert('Please provide a description for your post');
      return;
    }

    onCreatePost(
      {
        title: title.trim(),
        content: content.trim(),
        image: image || '',
        tags: hashtags,
      },
      postImageFileRef.current || undefined
    );
  };

  const isValid = !!content.trim();

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl text-neutral-900 mb-2">{t('createPost.title')}</h1>
            <p className="text-neutral-600">{t('createPost.placeholder')}</p>
          </div>
          <button
            onClick={onBack}
            className="p-2 hover:bg-neutral-200 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-neutral-700" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Form */}
          <div className="bg-white rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                {t('createPost.titleOptional')}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('createPost.titleOptional')}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                maxLength={100}
              />
              <p className="text-xs text-neutral-500 mt-1">{title.length}/100 characters</p>
            </div>
            
            <div className="relative">
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                {t('common.description')} *
              </label>
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                onKeyDown={handleMentionKeyDown}
                placeholder={t('createPost.placeholder')}
                className="min-h-[200px] resize-none"
                maxLength={2000}
              />
              <p className="text-xs text-neutral-500 mt-1">{content.length}/2000 characters</p>
              
              {/* Mention Dropdown */}
              {showMentions && filteredMentions.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-neutral-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
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
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-neutral-900">{mentionUser.name}</span>
                          {mentionUser.verified && (
                            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                              {t('common.verified')}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-neutral-500 capitalize">
                          {mentionUser.type === 'business' ? t('common.business') :
                           mentionUser.type === 'admin' ? t('common.administrator') : t('common.visitor')}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                <Hash className="w-4 h-4 inline mr-1" />
                {t('createPost.hashtagsOptional')}
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

            <div>
              <label className="block text-sm font-medium text-neutral-900 mb-2">
                {t('common.image')} *
              </label>
              
              {!image ? (
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                    className="w-full border-2 border-dashed border-neutral-300 rounded-lg p-8 hover:border-green-500 hover:bg-green-50/50 transition-all group"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center group-hover:bg-green-100 transition-colors">
                        <Upload className="w-8 h-8 text-neutral-400 group-hover:text-green-600 transition-colors" />
                      </div>
                      <div className="text-center">
                        <p className="text-neutral-700 font-medium">{t('createPost.addImage')} *</p>
                      </div>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="relative rounded-lg overflow-hidden border border-neutral-200">
                  <img
                    src={image}
                    alt="Upload preview"
                    className="w-full h-48 object-cover"
                  />
                  <button
                    onClick={handleRemoveImage}
                    type="button"
                    className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSubmit}
                disabled={!isValid}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {t('createPost.publish')}
              </Button>
              <Button
                onClick={() => setShowPreview(!showPreview)}
                variant="outline"
                className="lg:hidden"
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Right: Preview */}
          <div className={`bg-white rounded-2xl p-6 shadow-sm ${showPreview ? 'block' : 'hidden lg:block'}`}>
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-neutral-200">
              <Eye className="w-5 h-5 text-green-600" />
              <h2 className="font-semibold text-neutral-900">{t('common.preview')}</h2>
            </div>

            {!content && !image ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                  <ImageIcon className="w-8 h-8 text-neutral-400" />
                </div>
                <p className="text-neutral-500">Your post preview will appear here</p>
                <p className="text-sm text-neutral-400 mt-1">Start typing to see the preview</p>
              </div>
            ) : (
              <div className="border border-neutral-200 rounded-xl overflow-hidden">
                {/* Author Info */}
                <div className="p-4 pb-3">
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={getAvatarUrl(user?.avatar, displayName)}
                      alt={displayName}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                    <div>
                      <div className="font-semibold text-neutral-900">{displayName}</div>
                      <div className="text-sm text-neutral-500">Just now</div>
                    </div>
                  </div>

                  {/* Post Title & Description */}
                  <div className="space-y-2">
                    {title && (
                      <h3 className="text-xl text-neutral-900">{title}</h3>
                    )}
                    {content && (
                      <p className="text-neutral-700 whitespace-pre-wrap">{content}</p>
                    )}
                    {hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
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
                  </div>
                </div>

                {/* Post Image */}
                {image && (
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={image}
                      alt="Post preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Interaction Buttons */}
                <div className="p-4 pt-3 border-t border-neutral-100">
                  <div className="flex items-center gap-6">
                    <button className="flex items-center gap-2 text-neutral-600">
                      <Heart className="w-5 h-5" />
                      <span className="font-medium">0</span>
                    </button>
                    <button className="flex items-center gap-2 text-neutral-600">
                      <MessageCircle className="w-5 h-5" />
                      <span className="font-medium">0</span>
                    </button>
                    <button className="flex items-center gap-2 text-neutral-600">
                      <Send className="w-5 h-5" />
                      <span className="font-medium">0</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
          <h3 className="font-medium text-green-900 mb-2">Tips for creating engaging posts:</h3>
          <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
            <li>Use clear, descriptive titles to grab attention</li>
            <li>Share valuable agricultural insights or tips</li>
            <li>Add relevant images to make your post more engaging</li>
            <li>Use hashtags to increase discoverability</li>
            <li>Keep your content concise and easy to read</li>
            <li>Use proper grammar and formatting</li>
          </ul>
        </div>
      </div>
    </div>
  );
}