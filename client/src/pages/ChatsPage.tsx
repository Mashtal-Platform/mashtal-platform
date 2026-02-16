import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Search, ArrowLeft, Circle, HardHat, Building2, User, Leaf, Shield } from 'lucide-react';
import { mockChats as centralChats, mockChatMessages as centralChatMessages, currentUser, otherUsers } from '../data/centralMockData';
import { motion } from 'motion/react';

interface ChatsPageProps {
  onNavigateToProfile: (profileId: string) => void;
  selectedProfileId?: string | null;
}

interface Chat {
  id: string;
  profileId: string;
  profileName: string;
  profileAvatar: string;
  profileType: 'business' | 'engineer' | 'visitor';
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  online: boolean;
}

interface Message {
  id: string;
  chatId: string;
  text: string;
  sender: 'user' | 'other';
  timestamp: Date;
}

export function ChatsPage({ onNavigateToProfile, selectedProfileId }: ChatsPageProps) {
  // Initialize chats from mock data and selected profile
  const initializeChats = (): Chat[] => {
    const baseChats = centralChats.map(c => {
      const otherParticipantId = c.participants.find(p => p !== 'me') || '';
      const otherParticipant = otherUsers.find(u => u.id === otherParticipantId) || currentUser;
      return {
        id: c.id,
        profileId: otherParticipant.id,
        profileName: otherParticipant.fullName,
        profileAvatar: otherParticipant.avatar,
        profileType: otherParticipant.role as any,
        lastMessage: c.lastMessage || '',
        lastMessageTime: c.lastMessageTime || '',
        unread: c.unreadCount,
        online: true,
      };
    });
    
    // If a profile is selected and not already in chats, create a new chat
    if (selectedProfileId) {
      const existingChat = baseChats.find(c => c.profileId === selectedProfileId);
      if (!existingChat) {
        const profile = otherUsers.find(u => u.id === selectedProfileId);
        if (profile) {
          const newChat: Chat = {
            id: `chat-${Date.now()}`,
            profileId: profile.id,
            profileName: profile.fullName,
            profileAvatar: profile.avatar,
            profileType: profile.role as any,
            lastMessage: '',
            lastMessageTime: '',
            unread: 0,
            online: true,
          };
          baseChats.unshift(newChat); // Add to beginning of list
        }
      }
    }
    
    return baseChats;
  };

  const [chats, setChats] = useState<Chat[]>(initializeChats());
  const [messages, setMessages] = useState<Message[]>(centralChatMessages.map(m => ({
    id: m.id,
    chatId: m.chatId,
    text: m.text,
    sender: m.senderId === 'me' ? 'user' : 'other',
    timestamp: new Date(m.timestamp)
  })));
  
  // Auto-select chat if coming from a profile page
  const initialChat = selectedProfileId 
    ? chats.find(c => c.profileId === selectedProfileId) || null
    : null;
    
  const [selectedChat, setSelectedChat] = useState<Chat | null>(initialChat);
  const [inputMessage, setInputMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // State to trigger re-renders for dynamic timestamp updates
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Helper function to get the last message for a chat
  const getLastMessageForChat = (chatId: string) => {
    const chatMessages = messages.filter(m => m.chatId === chatId);
    if (chatMessages.length === 0) return null;
    return chatMessages[chatMessages.length - 1];
  };

  // Helper function to format timestamp
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date(currentTime); // Use currentTime state instead of Date.now()
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  // Auto-open chat if selectedProfileId changes
  useEffect(() => {
    if (selectedProfileId) {
      const chat = chats.find(c => c.profileId === selectedProfileId);
      if (chat) {
        setSelectedChat(chat);
        setChats(chats.map(c => c.id === chat.id ? { ...c, unread: 0 } : c));
      }
    }
  }, [selectedProfileId]);

  // Update timestamp every minute for dynamic time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 10000); // Update every 10 seconds for more precise timestamp updates

    return () => clearInterval(interval);
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    // In a real app, replace with your WebSocket server URL
    // const ws = new WebSocket('wss://your-websocket-server.com');
    
    // For demo purposes, we'll simulate WebSocket with setTimeout
    const simulateWebSocket = () => {
      setWsConnected(true);
      
      // Simulate receiving messages
      const interval = setInterval(() => {
        // Randomly receive a message (for demo)
        if (Math.random() > 0.95) {
          const randomChat = chats[Math.floor(Math.random() * chats.length)];
          const newMessage: Message = {
            id: Date.now().toString(),
            chatId: randomChat.id,
            text: 'Thank you for your interest! How can we help you today?',
            sender: 'other',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, newMessage]);
          
          // Update last message in chat list
          setChats(prev => prev.map(chat => 
            chat.id === randomChat.id 
              ? { ...chat, lastMessage: newMessage.text, lastMessageTime: 'Just now', unread: chat.unread + 1 }
              : chat
          ));
        }
      }, 10000);

      return () => clearInterval(interval);
    };

    const cleanup = simulateWebSocket();

    // Real WebSocket implementation would look like this:
    /*
    const ws = new WebSocket('wss://your-server.com/chat');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const newMessage: Message = {
        id: data.id,
        chatId: data.chatId,
        text: data.text,
        sender: 'business',
        timestamp: new Date(data.timestamp),
      };
      setMessages(prev => [...prev, newMessage]);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setWsConnected(false);
    };

    return () => {
      ws.close();
    };
    */

    return cleanup;
  }, []);

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

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !selectedChat) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      chatId: selectedChat.id,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInputMessage('');

    // Update last message in chat list
    setChats(chats.map(chat => 
      chat.id === selectedChat.id 
        ? { ...chat, lastMessage: inputMessage, lastMessageTime: 'Just now' }
        : chat
    ));

    // Scroll to bottom of messages container only
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }, 100);

    // Send via WebSocket (in real implementation)
    /*
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        chatId: selectedChat.id,
        text: inputMessage,
        timestamp: new Date().toISOString(),
      }));
    }
    */
  };

  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
    // Mark as read
    setChats(chats.map(c => c.id === chat.id ? { ...c, unread: 0 } : c));
  };

  const filteredChats = chats.filter(chat =>
    chat.profileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort chats by most recent message timestamp
  const sortedChats = [...filteredChats].sort((a, b) => {
    const lastMessageA = getLastMessageForChat(a.id);
    const lastMessageB = getLastMessageForChat(b.id);
    
    // If both have messages, sort by timestamp
    if (lastMessageA && lastMessageB) {
      return lastMessageB.timestamp.getTime() - lastMessageA.timestamp.getTime();
    }
    
    // If only A has messages, A comes first
    if (lastMessageA && !lastMessageB) return -1;
    
    // If only B has messages, B comes first
    if (!lastMessageA && lastMessageB) return 1;
    
    // If neither has messages, maintain current order
    return 0;
  });

  const currentMessages = selectedChat 
    ? messages.filter(m => m.chatId === selectedChat.id)
    : [];

  return (
    <div className="bg-neutral-50 h-screen flex flex-col">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden flex-1 flex flex-col">
          <div className="grid md:grid-cols-3 h-full overflow-hidden">
            {/* Chat List */}
            <div className={`border-r border-neutral-200 flex flex-col overflow-hidden ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-4 border-b border-neutral-200 flex-shrink-0">
                <h2 className="text-xl text-neutral-900 mb-4">Messages</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg outline-none focus:border-green-600"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto chat-list-scroll">
                {sortedChats.map((chat) => {
                  const lastMessage = getLastMessageForChat(chat.id);
                  const hasMessages = lastMessage !== null;
                  
                  return (
                    <motion.button
                      key={chat.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ 
                        layout: { duration: 0.3, ease: "easeInOut" },
                        opacity: { duration: 0.2 },
                        y: { duration: 0.2 }
                      }}
                      onClick={() => handleSelectChat(chat)}
                      className={`w-full p-4 flex items-start gap-3 hover:bg-neutral-50 transition-colors border-b border-neutral-100 ${
                        selectedChat?.id === chat.id ? 'bg-green-50' : ''
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <img
                          src={chat.profileAvatar}
                          alt={chat.profileName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="absolute -bottom-1 -right-1 p-0.5 bg-white rounded-full">
                          {chat.profileType === 'business' && <Building2 className="w-3.5 h-3.5 text-blue-600" />}
                          {chat.profileType === 'agronomist' && <Leaf className="w-3.5 h-3.5 text-green-600" />}
                          {chat.profileType === 'engineer' && <HardHat className="w-3.5 h-3.5 text-orange-600" />}
                          {chat.profileType === 'admin' && <Shield className="w-3.5 h-3.5 text-purple-600" />}
                          {chat.profileType === 'visitor' && chat.online && <Circle className="w-3 h-3 text-green-500 fill-current" />}
                        </div>
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="text-neutral-900 truncate">{chat.profileName}</h3>
                          {hasMessages && (
                            <span className="text-xs text-neutral-500 flex-shrink-0 ml-2">
                              {formatTimestamp(lastMessage.timestamp)}
                            </span>
                          )}
                        </div>
                        <p className={`text-sm ${hasMessages ? 'text-neutral-600' : 'text-neutral-400 italic'} truncate`}>
                          {hasMessages ? lastMessage.text : 'Start a conversation!'}
                        </p>
                      </div>
                      {chat.unread > 0 && (
                        <div className="bg-green-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">
                          {chat.unread}
                        </div>
                      )}
                    </motion.button>
                  );
                })}
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
                      src={selectedChat.profileAvatar}
                      alt={selectedChat.profileName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-neutral-900 truncate">{selectedChat.profileName}</h3>
                      <div className="flex items-center gap-1 text-xs text-neutral-600">
                        <Circle className={`w-2 h-2 ${selectedChat.online ? 'text-green-500 fill-current' : 'text-neutral-400 fill-current'}`} />
                        <span>{selectedChat.online ? 'Online' : 'Offline'}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigateToProfile(selectedChat.profileId)}
                      className="px-4 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors flex-shrink-0"
                    >
                      View Profile
                    </button>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50 chat-messages-scroll" ref={messagesContainerRef}>
                    {currentMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-2xl break-words ${
                            message.sender === 'user'
                              ? 'bg-green-600 text-white rounded-br-sm'
                              : 'bg-white text-neutral-900 rounded-bl-sm shadow-sm'
                          }`}
                        >
                          <p className="break-words whitespace-pre-wrap">{message.text}</p>
                          <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-green-100' : 'text-neutral-500'}`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-neutral-200 bg-white flex-shrink-0">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-3 border border-neutral-200 rounded-xl outline-none focus:border-green-600"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim()}
                        className="bg-green-600 text-white p-3 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Circle className={`w-2 h-2 ${wsConnected ? 'text-green-500' : 'text-red-500'} fill-current`} />
                      <p className="text-xs text-neutral-500">
                        {wsConnected ? 'Connected' : 'Connecting...'}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                    <h3 className="text-xl text-neutral-900 mb-2">No conversation selected</h3>
                    <p className="text-neutral-600">Choose a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  );
}