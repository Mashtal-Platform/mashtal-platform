import React, { useState, useEffect } from 'react';
import { X, Link as LinkIcon, Download, Check, Share2, MessageCircle, Send, Mail, Linkedin, Twitter, Facebook } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  postUrl?: string;
  postTitle?: string;
  postImage?: string;
}

interface ChatContact {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  lastActive?: string;
}

// Mock recent contacts - in real app, this would come from chat history
const mockContacts: ChatContact[] = [
  { id: '1', name: 'Ahmed Al-Saudi', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', lastMessage: 'Thanks for the info!', lastActive: '2m ago' },
  { id: '2', name: 'Fatima Hassan', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', lastMessage: 'See you tomorrow', lastActive: '5m ago' },
  { id: '3', name: 'Mohammed Ali', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', lastMessage: 'Perfect!', lastActive: '10m ago' },
  { id: '4', name: 'Sara Abdullah', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100', lastMessage: 'Got it', lastActive: '15m ago' },
  { id: '5', name: 'Khalid Ibrahim', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', lastMessage: 'Will do', lastActive: '20m ago' },
  { id: '6', name: 'Nora Hassan', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100', lastMessage: 'Thanks!', lastActive: '25m ago' },
  { id: '7', name: 'Omar Saleh', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100', lastMessage: 'See you soon', lastActive: '30m ago' },
  { id: '8', name: 'Layla Ahmed', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100', lastMessage: 'Great!', lastActive: '35m ago' },
  { id: '9', name: 'Youssef Ali', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100', lastMessage: 'Understood', lastActive: '40m ago' },
];

export function ShareModal({ isOpen, onClose, postUrl, postTitle, postImage }: ShareModalProps) {
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [copiedLink, setCopiedLink] = useState(false);

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

  if (!isOpen) return null;

  const currentUrl = postUrl || window.location.href;
  const shareText = postTitle ? `${postTitle} - Check this out on Mashtal!` : 'Check this out on Mashtal!';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
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
      const response = await fetch(postImage);
      const blob = await response.blob();
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

  const handleSend = () => {
    if (selectedContacts.size === 0) {
      alert('Please select at least one contact');
      return;
    }
    
    const contactNames = Array.from(selectedContacts)
      .map(id => mockContacts.find(c => c.id === id)?.name)
      .filter(Boolean)
      .join(', ');
    
    alert(`Post shared with: ${contactNames}`);
    setSelectedContacts(new Set());
    onClose();
  };

  // External share handlers
  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + currentUrl)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`;
    window.open(twitterUrl, '_blank');
  };

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`;
    window.open(facebookUrl, '_blank');
  };

  const handleLinkedInShare = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`;
    window.open(linkedInUrl, '_blank');
  };

  const handleEmailShare = () => {
    const emailSubject = encodeURIComponent(postTitle || 'Check this out on Mashtal');
    const emailBody = encodeURIComponent(`${shareText}\n\n${currentUrl}`);
    window.location.href = `mailto:?subject=${emailSubject}&body=${emailBody}`;
  };

  const handleTelegramShare = () => {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(telegramUrl, '_blank');
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between flex-shrink-0">
          <h3 className="text-lg font-semibold text-neutral-900">Share</h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* External Share Options - Prominent at top */}
        <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex-shrink-0">
          <h4 className="text-sm font-semibold text-neutral-900 mb-3">Share outside Mashtal</h4>
          
          <div className="grid grid-cols-4 gap-3">
            {/* WhatsApp */}
            <button
              onClick={handleWhatsAppShare}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white transition-colors group"
            >
              <div className="w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageCircle className="w-6 h-6 text-white" fill="currentColor" />
              </div>
              <span className="text-xs text-neutral-700 text-center">WhatsApp</span>
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
              <span className="text-xs text-neutral-700 text-center">Twitter</span>
            </button>

            {/* Facebook */}
            <button
              onClick={handleFacebookShare}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white transition-colors group"
            >
              <div className="w-12 h-12 bg-[#1877F2] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Facebook className="w-5 h-5 text-white" fill="currentColor" />
              </div>
              <span className="text-xs text-neutral-700 text-center">Facebook</span>
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
              <span className="text-xs text-neutral-700 text-center">Email</span>
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
                {copiedLink ? 'Copied!' : 'Copy Link'}
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

        {/* Send to Contacts - Scrollable */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4">
            <h4 className="text-sm font-semibold text-neutral-900 mb-3">Send to Mashtal users</h4>
            
            {/* Contacts Grid - 3 per row */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {mockContacts.map((contact) => {
                const isSelected = selectedContacts.has(contact.id);
                
                return (
                  <button
                    key={contact.id}
                    onClick={() => toggleContactSelection(contact.id)}
                    className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-neutral-50 transition-colors relative"
                  >
                    <div className="relative">
                      <div className={`w-16 h-16 rounded-full overflow-hidden border-2 transition-colors ${
                        isSelected ? 'border-green-600' : 'border-transparent'
                      }`}>
                        {contact.avatar ? (
                          <img 
                            src={contact.avatar} 
                            alt={contact.name} 
                            draggable="false"
                            className="w-full h-full object-cover select-none" 
                          />
                        ) : (
                          <div className="w-full h-full bg-neutral-200 flex items-center justify-center">
                            <span className="text-neutral-600 font-medium text-lg">
                              {contact.name[0]}
                            </span>
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-600 rounded-full flex items-center justify-center border-2 border-white">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-neutral-700 text-center line-clamp-1 max-w-full">
                      {contact.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Actions - Fixed */}
        <div className="border-t border-neutral-200 flex-shrink-0 bg-white">
          {/* Selected Counter & Send Button */}
          {selectedContacts.size > 0 && (
            <div className="px-4 py-3 bg-green-50 border-b border-green-100">
              <button
                onClick={handleSend}
                className="w-full bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Send to {selectedContacts.size} {selectedContacts.size === 1 ? 'person' : 'people'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}