import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { X, Link as LinkIcon, Download, Check, Share2, MessageCircle, Send, Mail, Linkedin, Twitter, Facebook, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getConversations, createOrGetConversation, sendMessage as sendChatMessage } from '../shared/api/chat';
import { searchShareRecipients } from '../shared/api/users';
import { getImageUrl } from '../shared/api/client';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId?: string;
  postUrl?: string;
  postTitle?: string;
  postImage?: string;
  /** Display name of the post/thread OWNER (uploader), NOT the person sharing. */
  postOwnerName?: string;
  /** Avatar URL of the post/thread owner. */
  postOwnerAvatar?: string;
  /** @deprecated use postOwnerName */
  postAuthorName?: string;
  /** Called when user performs a share action (copy link, external share, etc.) so the app can record the share. */
  onShare?: () => void;
}

export interface ChatContact {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  lastActive?: string;
  role?: string;
}

function formatLastActive(iso: string): string {
  if (!iso) return '';
  try {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  } catch {
    return '';
  }
}

const RECENT_CONVERSATIONS_LIMIT = 9;

export function ShareModal({ isOpen, onClose, postId, postUrl, postTitle, postImage, postOwnerName, postOwnerAvatar, postAuthorName, onShare }: ShareModalProps) {
  const { t } = useTranslation();
  const ownerName = postOwnerName ?? postAuthorName;
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [copiedLink, setCopiedLink] = useState(false);
  const [recentContacts, setRecentContacts] = useState<ChatContact[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatContact[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [shareCount, setShareCount] = useState(0);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Load last 9 people the user has messaged (from chat conversations)
  useEffect(() => {
    if (!isOpen) return;
    setRecentLoading(true);
    getConversations()
      .then((list) => {
        const recent = list.slice(0, RECENT_CONVERSATIONS_LIMIT).map((c) => ({
          id: c.profileId,
          name: c.profileName || 'User',
          avatar: getImageUrl(c.profileAvatar) || c.profileAvatar,
          lastMessage: c.lastMessage,
          lastActive: formatLastActive(c.lastMessageTime),
          role: c.profileType,
        }));
        setRecentContacts(recent);
      })
      .catch(() => setRecentContacts([]))
      .finally(() => setRecentLoading(false));
  }, [isOpen]);

  // Search for business, agronomist, engineer (debounced)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(() => {
      setSearchLoading(true);
      searchShareRecipients(searchQuery)
        .then((users) => {
          const list: ChatContact[] = users.map((u) => ({
            id: u.id,
            name: u.fullName || '',
            avatar: getImageUrl(u.avatar) || u.avatar,
            role: u.role,
          }));
          setSearchResults(list);
        })
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const allContacts = useCallback(() => {
    const seen = new Set(recentContacts.map((c) => c.id));
    const fromSearch = searchResults.filter((s) => !seen.has(s.id));
    return [...recentContacts, ...fromSearch];
  }, [recentContacts, searchResults]);

  const getContactById = useCallback(
    (id: string) => allContacts().find((c) => c.id === id),
    [allContacts]
  );

  if (!isOpen) return null;

  const currentUrl = postUrl || window.location.href;
  const shareText = postTitle ? `${postTitle} - Check this out on Mashtal!` : 'Check this out on Mashtal!';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      onShare?.();
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = async () => {
    if (!postImage) {
      alert('No image available to download');
      return;
    }

    try {
      const response = await axios.get(postImage, { responseType: 'blob' });
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mashtal-post-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download:', err);
      alert('Failed to download image');
    }
  };

  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(contactId)) {
        newSet.delete(contactId);
      } else {
        newSet.add(contactId);
      }
      return newSet;
    });
  };

  const handleSend = async () => {
    if (selectedContacts.size === 0) return;
    const currentUrl = postUrl || (typeof window !== 'undefined' ? window.location.href : '');
    const shareText = postTitle
      ? `Shared with you: ${postTitle}\n${currentUrl}`
      : `Check this out on Mashtal: ${currentUrl}`;
    const sharedPost =
      (postTitle || postUrl) && currentUrl
        ? {
            postId: postId ?? undefined,
            postTitle: postTitle ?? undefined,
            postImage: postImage ?? undefined,
            postUrl: currentUrl,
            postOwnerName: ownerName ?? undefined,
            postOwnerAvatar: postOwnerAvatar ?? undefined,
          }
        : undefined;
    setSending(true);
    let successCount = 0;
    try {
      const ids = Array.from(selectedContacts);
      for (const recipientId of ids) {
        try {
          const conv = await createOrGetConversation(recipientId);
          await sendChatMessage(conv.id, shareText, sharedPost);
          successCount += 1;
        } catch {
          // Skip failed recipient, continue with others
        }
      }
      setShareSuccess(true);
      setShareCount(successCount);
      setSelectedContacts(new Set());
      onShare?.();
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setShareSuccess(false);
    setShareCount(0);
    onClose();
  };

  // External share handlers – notify parent so share count can be recorded
  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + currentUrl)}`;
    window.open(whatsappUrl, '_blank');
    onShare?.();
  };

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`;
    window.open(twitterUrl, '_blank');
    onShare?.();
  };

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
    window.open(facebookUrl, '_blank');
    onShare?.();
  };

  const handleLinkedInShare = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`;
    window.open(linkedInUrl, '_blank');
    onShare?.();
  };

  const handleEmailShare = () => {
    const emailSubject = encodeURIComponent(postTitle || 'Check this out on Mashtal');
    const emailBody = encodeURIComponent(`${shareText}\n\n${currentUrl}`);
    window.location.href = `mailto:?subject=${emailSubject}&body=${emailBody}`;
    onShare?.();
  };

  const handleTelegramShare = () => {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(telegramUrl, '_blank');
    onShare?.();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between flex-shrink-0">
          <h3 className="text-lg font-semibold text-neutral-900">{t('common.share')}</h3>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-neutral-100 rounded-full transition-colors"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* External Share Options - Prominent at top */}
        <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex-shrink-0">
          <h4 className="text-sm font-semibold text-neutral-900 mb-3">{t('share.title')}</h4>
          
          <div className="grid grid-cols-4 gap-3">
            {/* WhatsApp */}
            <button
              onClick={handleWhatsAppShare}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white transition-colors group"
            >
              <div className="w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageCircle className="w-6 h-6 text-white" fill="currentColor" />
              </div>
              <span className="text-xs text-neutral-700 text-center">{t('share.whatsapp')}</span>
            </button>

            {/* Telegram */}
            <button
              onClick={handleTelegramShare}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white transition-colors group"
            >
              <div className="w-12 h-12 bg-[#0088cc] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Send className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs text-neutral-700 text-center">Telegram</span>
            </button>

            {/* Twitter */}
            <button
              onClick={handleTwitterShare}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white transition-colors group"
            >
              <div className="w-12 h-12 bg-[#1DA1F2] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Twitter className="w-5 h-5 text-white" fill="currentColor" />
              </div>
              <span className="text-xs text-neutral-700 text-center">{t('share.twitter')}</span>
            </button>

            {/* Facebook */}
            <button
              onClick={handleFacebookShare}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white transition-colors group"
            >
              <div className="w-12 h-12 bg-[#1877F2] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Facebook className="w-5 h-5 text-white" fill="currentColor" />
              </div>
              <span className="text-xs text-neutral-700 text-center">{t('share.facebook')}</span>
            </button>

            {/* LinkedIn */}
            <button
              onClick={handleLinkedInShare}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white transition-colors group"
            >
              <div className="w-12 h-12 bg-[#0A66C2] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Linkedin className="w-5 h-5 text-white" fill="currentColor" />
              </div>
              <span className="text-xs text-neutral-700 text-center">LinkedIn</span>
            </button>

            {/* Email */}
            <button
              onClick={handleEmailShare}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white transition-colors group"
            >
              <div className="w-12 h-12 bg-neutral-700 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-neutral-700 text-center">{t('share.email')}</span>
            </button>

            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white transition-colors group"
            >
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                {copiedLink ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <LinkIcon className="w-5 h-5 text-white" />
                )}
              </div>
              <span className="text-xs text-neutral-700 text-center">
                {copiedLink ? t('common.copied') : t('share.copyLink')}
              </span>
            </button>

            {/* Download (if image available) */}
            {postImage && (
              <button
                onClick={handleDownload}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white transition-colors group"
              >
                <div className="w-12 h-12 bg-neutral-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Download className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-neutral-700 text-center">Download</span>
              </button>
            )}
          </div>
        </div>

        {/* Send to Mashtal users - Recent (9 last messaged) + Search (hidden after successful share) */}
        {!shareSuccess && (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4">
            <h4 className="text-sm font-semibold text-neutral-900 mb-3">Send to Mashtal users</h4>

            {/* Recent: last 9 people the user has messaged */}
            <p className="text-xs text-neutral-500 mb-2">Recent conversations</p>
            {recentLoading ? (
              <div className="flex justify-center py-6">
                <span className="inline-block w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 mb-4">
                {recentContacts.map((contact) => {
                  const isSelected = selectedContacts.has(contact.id);
                  return (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => toggleContactSelection(contact.id)}
                      className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-neutral-50 transition-colors relative"
                    >
                      <div className="relative">
                        <div className={`w-16 h-16 rounded-full overflow-hidden border-2 transition-colors ${isSelected ? 'border-green-600' : 'border-transparent'}`}>
                          {contact.avatar ? (
                            <img src={contact.avatar} alt={contact.name} draggable="false" className="w-full h-full object-cover select-none" />
                          ) : (
                            <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
                              <span className="text-neutral-600 font-medium text-lg">{contact.name[0] || '?'}</span>
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-600 rounded-full flex items-center justify-center border-2 border-white">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-neutral-700 text-center line-clamp-1 max-w-full">{contact.name.split(' ')[0] || contact.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {!recentLoading && recentContacts.length === 0 && (
              <p className="text-xs text-neutral-500 mb-4">No recent conversations. Search below to find someone.</p>
            )}

            {/* Search for business, agronomist or engineer */}
            <p className="text-xs text-neutral-500 mb-2 mt-4">Search businesses</p>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name..."
                className="w-full pl-9 pr-4 py-2.5 border border-neutral-200 rounded-lg outline-none focus:border-green-600 text-sm"
              />
            </div>
            {searchLoading && (
              <div className="flex justify-center py-4">
                <span className="inline-block w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {searchQuery.trim() && !searchLoading && (
              <div className="grid grid-cols-3 gap-3">
                {searchResults.filter((s) => !recentContacts.some((r) => r.id === s.id)).map((contact) => {
                  const isSelected = selectedContacts.has(contact.id);
                  return (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => toggleContactSelection(contact.id)}
                      className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-neutral-50 transition-colors relative"
                    >
                      <div className="relative">
                        <div className={`w-16 h-16 rounded-full overflow-hidden border-2 transition-colors ${isSelected ? 'border-green-600' : 'border-transparent'}`}>
                          {contact.avatar ? (
                            <img src={contact.avatar} alt={contact.name} draggable="false" className="w-full h-full object-cover select-none" />
                          ) : (
                            <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
                              <span className="text-neutral-600 font-medium text-lg">{contact.name[0] || '?'}</span>
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-600 rounded-full flex items-center justify-center border-2 border-white">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-neutral-700 text-center line-clamp-1 max-w-full">{contact.name.split(' ')[0] || contact.name}</span>
                      {contact.role && (
                        <span className="text-[10px] text-neutral-400 capitalize">{contact.role}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {searchQuery.trim() && !searchLoading && searchResults.length === 0 && (
              <p className="text-xs text-neutral-500 py-2">{t('common.noResults')}</p>
            )}
          </div>
        </div>
        )}

        {/* Success state: post sent to chats */}
        {shareSuccess && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="text-lg font-semibold text-neutral-900 mb-1">{t('common.done')}</h4>
            <p className="text-sm text-neutral-600 mb-6">
              The post has been sent to {shareCount} {shareCount === 1 ? 'conversation' : 'conversations'}. Recipients will see it in their chats.
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              {t('common.close')}
            </button>
          </div>
        )}

        {/* Bottom Actions - Fixed (only when not in success state) */}
        {!shareSuccess && (
          <div className="border-t border-neutral-200 flex-shrink-0 bg-white">
            {selectedContacts.size > 0 && (
              <div className="px-4 py-3 bg-green-50 border-b border-green-100">
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="w-full bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending…
                    </>
                  ) : (
                    `Send to ${selectedContacts.size} ${selectedContacts.size === 1 ? 'person' : 'people'}`
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}