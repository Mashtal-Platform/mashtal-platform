import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Send, Search, ArrowLeft, Circle, HardHat, Building2, User, Leaf, Shield, MoreVertical, Pencil, Trash2, X, Ban } from 'lucide-react';
import { motion } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import { getConversations, createOrGetConversation, getMessages, editMessage as apiEditMessage, deleteMessage as apiDeleteMessage, getBlockStatus, blockUser, unblockUser, type ChatConversation, type ChatMessageDto } from '../shared/api/chat';
import { getImageUrl, getAvatarUrl, SOCKET_URL } from '../shared/api/client';
import { notifyError, notifyContentBlocked, isContentBlockedError } from '../shared/utils/notify';

interface ChatsPageProps {
  onNavigateToProfile: (profileId: string) => void;
  selectedProfileId?: string | null;
  /** Navigate in-app to a post, thread, or product by ID (used when clicking shared links). */
  onNavigateWithParams?: (page: string, params: Record<string, string | undefined>) => void;
}

/** Normalized shape for shared post in chat (backend returns postId, postTitle, postImage, postUrl, postOwnerName, postOwnerAvatar). */
interface SharedPostData {
  postId?: string;
  postTitle?: string;
  postImage?: string;
  postUrl?: string;
  postOwnerName?: string;
  postOwnerAvatar?: string;
  title?: string;
  image?: string;
  url?: string;
  authorName?: string;
}

interface Message {
  id: string;
  chatId: string;
  text: string;
  sender: 'user' | 'other';
  timestamp: Date | string;
  senderId?: string;
  senderRole?: string;
  sharedPost?: SharedPostData;
}

const EDIT_DELETE_WINDOW_MS = 20 * 60 * 1000; // 20 minutes

/** Support inbox: admins see every admin message as their own (right/green). */
function resolveSenderSide(params: {
  senderId?: string;
  senderRole?: string;
  myId?: string | null;
  myRole?: string | null;
  isSupport?: boolean;
  fallback?: 'user' | 'other';
}): 'user' | 'other' {
  const { senderId, senderRole, myId, myRole, isSupport, fallback = 'other' } = params;
  if (isSupport && myRole === 'admin') {
    return senderRole === 'admin' ? 'user' : 'other';
  }
  if (senderId && myId) {
    return senderId === myId ? 'user' : 'other';
  }
  return fallback;
}

function canEditOrDeleteMessage(message: Message, myId?: string | null): boolean {
  if (myId && message.senderId) {
    if (message.senderId !== myId) return false;
  } else if (message.sender !== 'user') {
    return false;
  }
  const ts = typeof message.timestamp === 'string' ? new Date(message.timestamp).getTime() : new Date(message.timestamp).getTime();
  return Date.now() - ts <= EDIT_DELETE_WINDOW_MS;
}

/** Capitalize the first letter in the message and the first letter after each . ? or ! */
function capitalizeMessageText(text: string): string {
  if (!text || typeof text !== 'string') return text;
  let out = text;
  const firstLower = out.search(/[a-z]/);
  if (firstLower >= 0) {
    out = out.slice(0, firstLower) + out[firstLower].toUpperCase() + out.slice(firstLower + 1);
  }
  return out.replace(/[.!?](\s*)([a-z])/g, (match, space, letter) => match[0] + space + letter.toUpperCase());
}

/** Parse shared URL to get post or thread ID for in-app navigation (by path only, so it works across origins). */
function parseSharedLinkUrl(url: string): { type: 'post' | 'thread' | 'product'; id: string } | null {
  if (!url || typeof url !== 'string') return null;
  try {
    const path = url.startsWith('http') ? new URL(url).pathname : url.startsWith('/') ? url : `/${url}`;
    const postMatch = path.match(/\/post\/([^/]+)/);
    if (postMatch) return { type: 'post', id: postMatch[1] };
    const threadMatch = path.match(/\/threads?\/([^/]+)/);
    if (threadMatch) return { type: 'thread', id: threadMatch[1] };
    const productMatch = path.match(/\/product\/([^/]+)/);
    if (productMatch) return { type: 'product', id: productMatch[1] };
    return null;
  } catch {
    return null;
  }
}

function SharedLink({
  url,
  onNavigateWithParams,
  className,
  children,
  linkClassName,
}: {
  url?: string;
  onNavigateWithParams?: (page: string, params: Record<string, string | undefined>) => void;
  className?: string;
  linkClassName?: string;
  children: React.ReactNode;
}) {
  const href = (url && url.trim()) || '#';
  const parsed = href !== '#' ? parseSharedLinkUrl(href) : null;
  const handleClick = (e: React.MouseEvent) => {
    if (parsed && onNavigateWithParams) {
      e.preventDefault();
      if (parsed.type === 'post') onNavigateWithParams('posts', { highlightPostId: parsed.id });
      else onNavigateWithParams('threads', { highlightThreadId: parsed.id });
    }
  };
  const isExternal = href !== '#' && !parsed;
  const colorClass = linkClassName ?? 'text-blue-500 hover:underline cursor-pointer';
  const combinedClass = [className, colorClass].filter(Boolean).join(' ');
  return (
    <a
      href={href}
      onClick={handleClick}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className={combinedClass}
      style={{ cursor: 'pointer' }}
    >
      {children}
    </a>
  );
}

/**
 * Rich preview card for shared post/thread in chat.
 * Displays POST OWNER (uploader) name, NOT the chat sender.
 * Clicking the card navigates to the post with highlight.
 */
function SharedPostPreviewCard({
  sharedPost,
  isOwnMessage,
  onNavigateWithParams,
}: {
  sharedPost: SharedPostData;
  isOwnMessage: boolean;
  onNavigateWithParams?: (page: string, params: Record<string, string | undefined>) => void;
}) {
  const { t } = useTranslation();
  const postTitle = sharedPost.postTitle ?? sharedPost.title ?? '';
  const postImage = sharedPost.postImage ?? sharedPost.image;
  const postUrl = sharedPost.postUrl ?? sharedPost.url ?? '#';
  const postOwnerName = sharedPost.postOwnerName ?? sharedPost.authorName ?? 'Unknown';
  const postOwnerAvatar = sharedPost.postOwnerAvatar;

  const parsed = postUrl && postUrl !== '#' ? parseSharedLinkUrl(postUrl) : null;
  const handleNavigate = (e: React.MouseEvent) => {
    e.preventDefault();
    if (parsed && onNavigateWithParams) {
      if (parsed.type === 'post') onNavigateWithParams('posts', { highlightPostId: parsed.id });
      else if (parsed.type === 'thread') onNavigateWithParams('threads', { highlightThreadId: parsed.id });
      else onNavigateWithParams('shopping', { highlightProductId: parsed.id });
    }
  };

  const cardClassName = 'rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition overflow-hidden bg-white text-neutral-900 cursor-pointer';

  const content = (
    <>
      {postImage && (
        <img
          src={getImageUrl(postImage) || ''}
          alt={postTitle || 'Shared post'}
          className="w-full h-48 object-cover bg-neutral-100"
        />
      )}
      <div className="p-4">
        <p className="font-semibold text-gray-900 text-base mt-0 line-clamp-2">
          {t('chats.sharedWithYou', { title: postTitle || t('search.post') })}
        </p>
        <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-2">
          {postOwnerAvatar && (
            <img src={getImageUrl(postOwnerAvatar)} alt="" className="w-4 h-4 rounded-full object-cover" />
          )}
          {t('chats.uploadedBy', { name: postOwnerName })}
        </p>
        {postUrl && postUrl !== '#' && (
          <span className="text-blue-500 hover:text-blue-600 hover:underline font-medium cursor-pointer inline-flex items-center gap-1">
            {t('chats.viewPost')}
          </span>
        )}
      </div>
    </>
  );

  if (parsed && onNavigateWithParams) {
    return (
      <div
        className={cardClassName}
        onClick={handleNavigate}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleNavigate(e as unknown as React.MouseEvent); } }}
        aria-label={`View shared post: ${postTitle || 'Post'}`}
      >
        {content}
      </div>
    );
  }

  return (
    <SharedLink url={postUrl} onNavigateWithParams={onNavigateWithParams} className={cardClassName}>
      {content}
    </SharedLink>
  );
}

export function ChatsPage({ onNavigateToProfile, selectedProfileId, onNavigateWithParams }: ChatsPageProps) {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const userIdRef = useRef<string | null>(null);
  const userRoleRef = useRef<string | null>(null);
  userIdRef.current = user?.id ?? null;
  userRoleRef.current = user?.role ?? null;
  const [chats, setChats] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatConversation | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedByMe, setBlockedByMe] = useState(false);
  const [canBlock, setCanBlock] = useState(false);
  const [supportLock, setSupportLock] = useState<{ by: string; name: string; until: string } | null>(null);
  const selectedChatRef = useRef<ChatConversation | null>(null);
  selectedChatRef.current = selectedChat;
  const lockRenewRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const getLastMessageForChat = (chatId: string) => {
    const chatMessages = messages.filter((m) => m.chatId === chatId);
    if (chatMessages.length === 0) return null;
    return chatMessages[chatMessages.length - 1];
  };

  /** Preview for list: prefer loaded messages (real-time), else conversation's lastMessage from API. */
  const getLastMessagePreview = (chat: ChatConversation) => {
    const fromState = getLastMessageForChat(chat.id);
    const text = (fromState?.text ?? chat.lastMessage ?? '').trim();
    if (!text) return null;
    const maxLen = 50;
    if (text.length <= maxLen) return text;
    const truncated = text.slice(0, maxLen).trim();
    const lastSpace = truncated.lastIndexOf(' ');
    return lastSpace > 25 ? truncated.slice(0, lastSpace) + '…' : truncated + '…';
  };

  const toDate = (t: Date | string) => (t instanceof Date ? t : new Date(t));

  const formatTimestamp = (timestamp: Date | string) => {
    const ts = toDate(timestamp);
    const now = new Date(currentTime);
    const diffMs = now.getTime() - ts.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return t('chats.justNow');
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  // Fetch conversations when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setChats([]);
      setSelectedChat(null);
      setChatsLoading(false);
      return;
    }
    let cancelled = false;
    setChatsLoading(true);
    getConversations()
      .then((list) => {
        if (!cancelled) setChats(list);
      })
      .catch(() => {
        if (!cancelled) setChats([]);
      })
      .finally(() => {
        if (!cancelled) setChatsLoading(false);
      });
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  // When conversations loaded and selectedProfileId, select or create that chat
  useEffect(() => {
    if (!selectedProfileId || !isAuthenticated || chatsLoading) return;
    const existing = chats.find((c) => c.profileId === selectedProfileId);
    if (existing) {
      setSelectedChat(existing);
      return;
    }
    createOrGetConversation(selectedProfileId)
      .then((chat) => {
        setChats((prev) => {
          const has = prev.some((c) => c.id === chat.id);
          if (has) return prev;
          return [...prev, chat];
        });
        setSelectedChat(chat);
      })
      .catch(() => {});
  }, [selectedProfileId, isAuthenticated, chatsLoading]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  // Socket.io: connect when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setWsConnected(false);
      return;
    }
    const token = localStorage.getItem('mashtal_token');
    if (!token) return;
    const socket = io(SOCKET_URL, {
      auth: { token },
      path: '/socket.io',
    });
    socketRef.current = socket;
    socket.on('connect', () => setWsConnected(true));
    socket.on('disconnect', () => setWsConnected(false));
    socket.on('message', (msg: ChatMessageDto) => {
      const myId = userIdRef.current;
      const myRole = userRoleRef.current;
      const isSupport =
        !!(msg as any).isSupport ||
        (selectedChatRef.current?.id === msg.chatId && !!selectedChatRef.current?.isSupport);
      const senderLabel = resolveSenderSide({
        senderId: (msg as any).senderId,
        senderRole: (msg as any).senderRole,
        myId,
        myRole,
        isSupport,
        fallback: msg.sender || 'other',
      });
      setMessages((prev) => [...prev, {
        id: msg.id,
        chatId: msg.chatId,
        text: msg.text,
        sender: senderLabel,
        timestamp: msg.timestamp,
        senderId: (msg as any).senderId,
        senderRole: (msg as any).senderRole,
        sharedPost: (msg as ChatMessageDto).sharedPost,
      }]);
      setChats((prev) => prev.map((c) =>
        c.id === msg.chatId ? { ...c, lastMessage: msg.text, lastMessageTime: typeof msg.timestamp === 'string' ? msg.timestamp : new Date(msg.timestamp).toISOString() } : c
      ));
    });
    socket.on('support_lock', (payload: { conversationId?: string; lock?: { by: string; name: string; until: string } | null }) => {
      if (!payload?.conversationId) return;
      if (selectedChatRef.current?.id !== payload.conversationId) return;
      setSupportLock(payload.lock || null);
    });
    socket.on('message_edited', (msg: ChatMessageDto) => {
      setMessages((prev) => prev.map((m) =>
        m.id === msg.id ? { ...m, text: msg.text } : m
      ));
      setChats((prev) => prev.map((c) =>
        c.id === msg.chatId ? { ...c, lastMessage: msg.text } : c
      ));
    });
    socket.on('message_deleted', (payload: { conversationId: string; messageId: string }) => {
      setMessages((prev) => {
        const next = prev.filter((m) => m.id !== payload.messageId);
        const convMessages = next.filter((m) => m.chatId === payload.conversationId);
        const last = convMessages[convMessages.length - 1];
        setChats((cPrev) => cPrev.map((c) =>
          c.id === payload.conversationId
            ? { ...c, lastMessage: last?.text ?? '', lastMessageTime: last?.timestamp ? (typeof last.timestamp === 'string' ? last.timestamp : new Date(last.timestamp).toISOString()) : c.lastMessageTime }
            : c
        ));
        return next;
      });
    });
    socket.on('presence_update', (payload: { userId?: string; online?: boolean }) => {
      if (!payload?.userId) return;
      setChats((prev) =>
        prev.map((c) =>
          c.profileId === payload.userId ? { ...c, online: !!payload.online } : c
        )
      );
      setSelectedChat((prev) =>
        prev && prev.profileId === payload.userId ? { ...prev, online: !!payload.online } : prev
      );
    });
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated]);

  // When selected chat changes: join room, load messages
  useEffect(() => {
    const socket = socketRef.current;
    if (!selectedChat || !socket) return;
    socket.emit('join_conversation', selectedChat.id);
    setMessagesLoading(true);
    setSupportLock(null);
    getBlockStatus(selectedChat.profileId)
      .then((status) => {
        setIsBlocked(!!status.blocked);
        setBlockedByMe(!!status.blockedByMe);
        setCanBlock(!!status.canBlock);
      })
      .catch(() => {
        setIsBlocked(false);
        setBlockedByMe(false);
        setCanBlock(false);
      });
    getMessages(selectedChat.id)
      .then((res) => {
        const list = res.messages || [];
        const isSupport = !!res.isSupport || !!selectedChat.isSupport;
        setSupportLock(res.supportLock || null);
        if (isSupport && !selectedChat.isSupport) {
          setSelectedChat((prev) => (prev ? { ...prev, isSupport: true } : prev));
        }
        setMessages(
          list.map((m) => ({
            id: m.id,
            chatId: m.chatId,
            text: m.text,
            sender: resolveSenderSide({
              senderId: m.senderId,
              senderRole: m.senderRole,
              myId: userIdRef.current,
              myRole: userRoleRef.current,
              isSupport,
              fallback: m.sender,
            }),
            timestamp: m.timestamp,
            senderId: m.senderId,
            senderRole: m.senderRole,
            sharedPost: (m as ChatMessageDto).sharedPost,
          }))
        );
      })
      .finally(() => setMessagesLoading(false));
    return () => {
      if (userRoleRef.current === 'admin' && selectedChat.isSupport) {
        socket.emit('support_lock_release', { conversationId: selectedChat.id });
      }
      socket.emit('leave_conversation', selectedChat.id);
      if (lockRenewRef.current) {
        clearInterval(lockRenewRef.current);
        lockRenewRef.current = null;
      }
    };
  }, [selectedChat?.id]);

  // Scroll to bottom when messages change - scroll only the messages container
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Scroll to bottom when a chat is selected
  useEffect(() => {
    if (selectedChat && messagesContainerRef.current) {
      // Use a slight delay to ensure the DOM is updated
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [selectedChat]);

  const supportLockedByOther =
    !!supportLock &&
    user?.role === 'admin' &&
    !!selectedChat?.isSupport &&
    supportLock.by !== (user?.operatorId || user?.id) &&
    new Date(supportLock.until).getTime() > Date.now();

  const acquireSupportLock = () => {
    if (user?.role !== 'admin' || !selectedChat?.isSupport) return;
    const socket = socketRef.current;
    if (!socket || !wsConnected) return;
    socket.emit(
      'support_lock_acquire',
      { conversationId: selectedChat.id },
      (res: { ok?: boolean; code?: string; message?: string; lock?: { by: string; name: string; until: string } | null }) => {
        if (res?.ok === false && res.code === 'SUPPORT_LOCKED') {
          setSupportLock(res.lock || null);
          if (res.message) notifyError(new Error(res.message));
          return;
        }
        if (res?.lock) setSupportLock(res.lock);
      }
    );
  };

  const handleSendMessage = () => {
    const text = inputMessage.trim();
    if (!text || !selectedChat || isBlocked || supportLockedByOther) return;
    const socket = socketRef.current;
    if (socket && wsConnected) {
      if (user?.role === 'admin' && selectedChat.isSupport) {
        acquireSupportLock();
      }
      socket.emit('send_message', { conversationId: selectedChat.id, text }, (res: { error?: string; code?: string; supportLock?: { by: string; name: string; until: string } }) => {
        if (res?.error) {
          console.error('[ChatsPage] send_message error:', res.error);
          if (res.code === 'CONTENT_NOT_ALLOWED' || isContentBlockedError(res.error)) {
            notifyContentBlocked();
          } else if (res.code === 'BLOCKED') {
            setIsBlocked(true);
            notifyError(new Error(res.error));
          } else if (res.code === 'SUPPORT_LOCKED') {
            setSupportLock(res.supportLock || null);
            notifyError(new Error(res.error));
          } else {
            notifyError(new Error(res.error));
          }
        }
      });
      setInputMessage('');
    } else {
      setInputMessage('');
    }
  };

  const handleSelectChat = (chat: ChatConversation) => {
    setSelectedChat(chat);
    setChats((prev) => prev.map((c) => (c.id === chat.id ? { ...c, unread: 0 } : c)));
    setOpenMenuId(null);
    setEditingMessageId(null);
  };

  const handleStartEdit = (message: Message) => {
    setEditingMessageId(message.id);
    setEditText(message.text);
    setOpenMenuId(null);
  };

  const handleSaveEdit = async () => {
    if (!selectedChat || !editingMessageId || !editText.trim()) return;
    try {
      await apiEditMessage(selectedChat.id, editingMessageId, editText.trim());
      setMessages((prev) => prev.map((m) => m.id === editingMessageId ? { ...m, text: editText.trim() } : m));
      setEditingMessageId(null);
      setEditText('');
    } catch (err) {
      console.error('[ChatsPage] edit message error:', err);
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditText('');
  };

  const handleRequestDelete = (message: Message) => {
    setOpenMenuId(null);
    setMessageToDelete(message);
  };

  const handleConfirmDelete = async () => {
    const message = messageToDelete;
    setMessageToDelete(null);
    if (!selectedChat || !message || message.sender !== 'user') return;
    try {
      await apiDeleteMessage(selectedChat.id, message.id);
      setMessages((prev) => prev.filter((m) => m.id !== message.id));
      const remaining = messages.filter((m) => m.chatId === selectedChat.id && m.id !== message.id);
      const last = remaining[remaining.length - 1];
      setChats((prev) => prev.map((c) =>
        c.id === selectedChat.id ? { ...c, lastMessage: last?.text ?? '', lastMessageTime: last?.timestamp ? (typeof last.timestamp === 'string' ? last.timestamp : new Date(last.timestamp).toISOString()) : c.lastMessageTime } : c
      ));
    } catch (err) {
      console.error('[ChatsPage] delete message error:', err);
    }
  };

  const filteredChats = chats.filter((chat) => {
    const matchesSearch = chat.profileName.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    // Don't list empty conversations until someone has sent a message
    // (keep the currently open chat visible so Support can still be used)
    const hasMessages =
      !!(chat.lastMessage && String(chat.lastMessage).trim()) ||
      !!getLastMessageForChat(chat.id) ||
      selectedChat?.id === chat.id;
    return hasMessages;
  });

  const sortedChats = [...filteredChats].sort((a, b) => {
    const lastA = getLastMessageForChat(a.id);
    const lastB = getLastMessageForChat(b.id);
    const timeA = lastA ? toDate(lastA.timestamp).getTime() : (a.lastMessageTime ? toDate(a.lastMessageTime).getTime() : 0);
    const timeB = lastB ? toDate(lastB.timestamp).getTime() : (b.lastMessageTime ? toDate(b.lastMessageTime).getTime() : 0);
    return timeB - timeA;
  });

  const currentMessages = selectedChat 
    ? messages.filter(m => m.chatId === selectedChat.id)
    : [];

  return (
    <div className="bg-neutral-50 h-[calc(100vh-4rem)] flex flex-col">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden flex-1 flex flex-col">
          <div className="grid md:grid-cols-3 h-full overflow-hidden">
            {/* Chat List */}
            <div className={`border-r border-neutral-200 flex flex-col overflow-hidden ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-4 border-b border-neutral-200 flex-shrink-0">
                <h2 className="text-xl text-neutral-900 mb-4">{t('chats.title')}</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('chats.searchPlaceholder')}
                    className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg outline-none focus:border-green-600"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto chat-list-scroll">
                {chatsLoading && chats.length === 0 ? (
                  <div className="p-4 text-neutral-500 text-sm">{t('chats.loadingConversations')}</div>
                ) : !isAuthenticated ? (
                  <div className="p-4 text-neutral-500 text-sm">{t('chats.signIn')}</div>
                ) : sortedChats.length === 0 ? (
                  <div className="p-4 text-center text-neutral-500 text-sm">
                    <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>{t('chats.empty')}</p>
                    <p className="text-xs mt-1">{t('chats.emptyHint')}</p>
                  </div>
                ) : (
                sortedChats.map((chat) => {
                  const lastMessageFromState = getLastMessageForChat(chat.id);
                  const previewText = getLastMessagePreview(chat);
                  const hasMessages = previewText !== null;
                  const lastTime = lastMessageFromState?.timestamp ?? chat.lastMessageTime;
                  const avatarUrl = getAvatarUrl(chat.profileAvatar, chat.profileName);
                  return (
                    <motion.button
                      key={chat.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{
                        layout: { duration: 0.3, ease: 'easeInOut' },
                        opacity: { duration: 0.2 },
                        y: { duration: 0.2 },
                      }}
                      onClick={() => handleSelectChat(chat)}
                      className={`w-full p-4 flex items-start gap-3 hover:bg-neutral-50 transition-colors border-b border-neutral-100 ${
                        selectedChat?.id === chat.id ? 'bg-green-50' : ''
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <img
                          src={avatarUrl}
                          alt={chat.profileName}
                          className="w-12 h-12 rounded-full object-cover bg-neutral-200"
                        />
                        <div className="absolute -bottom-1 -right-1 p-0.5 bg-white rounded-full">
                          {chat.profileType === 'business' && <Building2 className="w-3.5 h-3.5 text-blue-600" />}
                          {chat.profileType === 'admin' && <Shield className="w-3.5 h-3.5 text-purple-600" />}
                          {chat.online && (
                            <Circle className="w-3 h-3 text-green-500 fill-current absolute -bottom-0.5 -right-0.5" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="text-neutral-900 truncate">{chat.profileName}</h3>
                          {hasMessages && lastTime && (
                            <span className="text-xs text-neutral-500 flex-shrink-0 ml-2">
                              {formatTimestamp(lastTime)}
                            </span>
                          )}
                        </div>
                        {hasMessages ? (
                          <p className="text-sm text-neutral-600 truncate">{previewText}</p>
                        ) : null}
                      </div>
                      {chat.unread > 0 && (
                        <div className="bg-green-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                          {chat.unread}
                        </div>
                      )}
                    </motion.button>
                  );
                })
                )}
              </div>
            </div>

            {/* Chat Window */}
            <div className={`md:col-span-2 flex flex-col overflow-hidden ${selectedChat ? 'flex' : 'hidden md:flex'}`}>
              {selectedChat ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-neutral-200 flex items-center gap-3 flex-shrink-0 bg-white">
                    <button
                      onClick={() => setSelectedChat(null)}
                      className="md:hidden p-2 hover:bg-neutral-100 rounded-lg"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <img
                      src={getAvatarUrl(selectedChat.profileAvatar, selectedChat.profileName)}
                      alt={selectedChat.profileName}
                      className="w-10 h-10 rounded-full object-cover bg-neutral-200"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-neutral-900 truncate">{selectedChat.profileName}</h3>
                      <div className="flex items-center gap-1 text-xs text-neutral-600">
                        <Circle className={`w-2 h-2 ${selectedChat.online ? 'text-green-500 fill-current' : 'text-neutral-400 fill-current'}`} />
                        <span>{selectedChat.online ? t('common.online') : t('common.offline')}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigateToProfile(selectedChat.profileId)}
                      className="px-4 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors flex-shrink-0"
                    >
                      View Profile
                    </button>
                    {(canBlock || blockedByMe) && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          if (blockedByMe) {
                            await unblockUser(selectedChat.profileId);
                            setBlockedByMe(false);
                            setIsBlocked(false);
                          } else {
                            await blockUser(selectedChat.profileId);
                            setBlockedByMe(true);
                            setIsBlocked(true);
                          }
                        } catch {
                          notifyError(null, blockedByMe ? 'Failed to unblock user' : 'Failed to block user');
                        }
                      }}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors flex-shrink-0 flex items-center gap-1.5 ${
                        blockedByMe
                          ? 'text-neutral-700 hover:bg-neutral-100'
                          : 'text-red-600 hover:bg-red-50'
                      }`}
                    >
                      <Ban className="w-4 h-4" />
                      {blockedByMe ? t('chats.unblock', { defaultValue: 'Unblock' }) : t('chats.block', { defaultValue: 'Block' })}
                    </button>
                    )}
                  </div>

                  {isBlocked && (
                    <div className="px-4 py-2 bg-red-50 border-b border-red-100 text-sm text-red-700">
                      {t('chats.messagingBlocked', { defaultValue: 'Messaging is blocked between these accounts.' })}
                    </div>
                  )}

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50 chat-messages-scroll" ref={messagesContainerRef}>
                    {messagesLoading ? (
                      <div className="flex justify-center py-8 text-neutral-500">{t('chats.loading')}</div>
                    ) : (
                      currentMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[70%] relative group ${message.sender === 'user' ? 'flex flex-col items-end' : ''}`}>
                            {editingMessageId === message.id ? (
                              <div className="w-full p-3 rounded-2xl bg-green-600 text-white rounded-br-sm space-y-2">
                                <textarea
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="w-full min-h-[60px] px-3 py-2 rounded-lg bg-white/10 text-white placeholder-green-200 border border-white/20 resize-none text-sm"
                                  placeholder={t('chats.editPlaceholder')}
                                  autoFocus
                                />
                                <div className="flex gap-2 justify-end">
                                  <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="px-3 py-1 text-xs rounded-lg bg-white/20 hover:bg-white/30"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleSaveEdit}
                                    disabled={!editText.trim()}
                                    className="px-3 py-1 text-xs rounded-lg bg-white text-green-600 hover:bg-green-50 disabled:opacity-50"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div
                                  className={`p-3 rounded-2xl break-words ${
                                    message.sender === 'user'
                                      ? 'bg-green-600 text-white rounded-br-sm'
                                      : 'bg-white text-neutral-900 rounded-bl-sm shadow-sm'
                                  }`}
                                >
                                  {message.sharedPost && (message.sharedPost.postTitle ?? message.sharedPost.title ?? message.sharedPost.postImage ?? message.sharedPost.image ?? message.sharedPost.postUrl ?? message.sharedPost.url) ? (
                                    <div className="text-neutral-900 bg-transparent min-w-0">
                                      <SharedPostPreviewCard
                                        sharedPost={message.sharedPost}
                                        isOwnMessage={message.sender === 'user'}
                                        onNavigateWithParams={onNavigateWithParams}
                                      />
                                    </div>
                                  ) : (
                                    <p className="break-words whitespace-pre-wrap">{capitalizeMessageText(message.text)}</p>
                                  )}
                                  <div className="flex items-center justify-between gap-2 mt-1">
                                    <p className={`text-xs ${message.sender === 'user' ? 'text-green-100' : 'text-neutral-500'}`}>
                                      {toDate(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    {canEditOrDeleteMessage(message, user?.id) && (
                                      <div className="relative">
                                        <button
                                          type="button"
                                          onClick={() => setOpenMenuId(openMenuId === message.id ? null : message.id)}
                                          className="p-0.5 rounded hover:bg-white/20 text-green-100"
                                          aria-label={t('chats.messageOptions')}
                                        >
                                          <MoreVertical className="w-3.5 h-3.5" />
                                        </button>
                                        {openMenuId === message.id && (
                                          <>
                                            <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} aria-hidden="true" />
                                            <div className="absolute right-0 bottom-full mb-1 py-1 bg-white rounded-lg shadow-lg border border-neutral-200 z-20 min-w-[110px]">
                                              <button
                                                type="button"
                                                onClick={() => handleStartEdit(message)}
                                                className="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 rounded-t-lg"
                                              >
                                                <Pencil className="w-3.5 h-3.5 flex-shrink-0" />
                                                Edit
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleRequestDelete(message)}
                                                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-b-lg"
                                              >
                                                <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
                                                Delete
                                              </button>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input: Enter sends, Shift+Enter new line */}
                  <div className="p-4 border-t border-neutral-200 bg-white flex-shrink-0">
                    {supportLockedByOther && (
                      <div className="mb-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
                        {t('chats.adminResponding', {
                          defaultValue: `${supportLock?.name || 'Another admin'} is responding. Please wait until they finish.`,
                          name: supportLock?.name || 'Another admin',
                        })}
                      </div>
                    )}
                    <div className="flex gap-2 items-end">
                      <textarea
                        value={inputMessage}
                        onChange={(e) => {
                          setInputMessage(e.target.value);
                          if (user?.role === 'admin' && selectedChat?.isSupport && e.target.value.trim()) {
                            acquireSupportLock();
                          }
                        }}
                        onFocus={() => {
                          if (user?.role === 'admin' && selectedChat?.isSupport) {
                            acquireSupportLock();
                            if (lockRenewRef.current) clearInterval(lockRenewRef.current);
                            lockRenewRef.current = setInterval(() => acquireSupportLock(), 20000);
                          }
                        }}
                        onBlur={() => {
                          if (lockRenewRef.current) {
                            clearInterval(lockRenewRef.current);
                            lockRenewRef.current = null;
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder={
                          supportLockedByOther
                            ? t('chats.waitForAdmin', { defaultValue: 'Wait for the other admin to finish…' })
                            : isBlocked
                              ? t('chats.messagingBlocked', { defaultValue: 'Messaging is blocked' })
                              : t('chats.typeMessageHint')
                        }
                        rows={1}
                        disabled={isBlocked || supportLockedByOther}
                        className="flex-1 min-h-[44px] max-h-32 px-4 py-3 border border-neutral-200 rounded-xl outline-none focus:border-green-600 resize-y disabled:bg-neutral-100 disabled:cursor-not-allowed"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || isBlocked || supportLockedByOther}
                        className="bg-green-600 text-white p-3 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Circle className={`w-2 h-2 ${wsConnected ? 'text-green-500' : 'text-red-500'} fill-current`} />
                      <p className="text-xs text-neutral-500">
                        {wsConnected ? t('chats.connected') : t('chats.connecting')}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                    <h3 className="text-xl text-neutral-900 mb-2">{t('chats.noSelected')}</h3>
                    <p className="text-neutral-600">{t('chats.chooseConversation')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Delete message confirmation modal */}
      {messageToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setMessageToDelete(null)}>
          <div
            className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <h3 className="text-lg font-semibold text-neutral-900">{t('chats.deleteMessage')}</h3>
              <button
                type="button"
                onClick={() => setMessageToDelete(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
                aria-label={t('common.close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-neutral-600 text-sm mb-6">
              {t('chats.deleteMessageBody')}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setMessageToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}