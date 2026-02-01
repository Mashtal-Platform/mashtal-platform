import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Search, ArrowLeft, Circle } from 'lucide-react';

interface ChatsPageProps {
  onViewBusiness: (businessId: string) => void;
  selectedBusinessId?: string | null;
}

interface Chat {
  id: string;
  businessId: string;
  businessName: string;
  businessAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  online: boolean;
}

interface Message {
  id: string;
  chatId: string;
  text: string;
  sender: 'user' | 'business';
  timestamp: Date;
}

export function ChatsPage({ onViewBusiness, selectedBusinessId }: ChatsPageProps) {
  const [chats, setChats] = useState<Chat[]>(mockChats);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  
  // Auto-select chat if coming from business page
  const initialChat = selectedBusinessId 
    ? chats.find(c => c.businessId === selectedBusinessId) || null
    : null;
    
  const [selectedChat, setSelectedChat] = useState<Chat | null>(initialChat);
  const [inputMessage, setInputMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-open chat if selectedBusinessId changes
  useEffect(() => {
    if (selectedBusinessId) {
      const chat = chats.find(c => c.businessId === selectedBusinessId);
      if (chat) {
        setSelectedChat(chat);
        setChats(chats.map(c => c.id === chat.id ? { ...c, unread: 0 } : c));
      }
    }
  }, [selectedBusinessId]);

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
            sender: 'business',
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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    chat.businessName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentMessages = selectedChat 
    ? messages.filter(m => m.chatId === selectedChat.id)
    : [];

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
          <div className="grid md:grid-cols-3 h-full">
            {/* Chat List */}
            <div className={`border-r border-neutral-200 flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-4 border-b border-neutral-200">
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

              <div className="flex-1 overflow-y-auto">
                {filteredChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => handleSelectChat(chat)}
                    className={`w-full p-4 flex items-start gap-3 hover:bg-neutral-50 transition-colors border-b border-neutral-100 ${
                      selectedChat?.id === chat.id ? 'bg-green-50' : ''
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={chat.businessAvatar}
                        alt={chat.businessName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      {chat.online && (
                        <Circle className="absolute bottom-0 right-0 w-3 h-3 text-green-500 fill-current" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="text-neutral-900">{chat.businessName}</h3>
                        <span className="text-xs text-neutral-500">{chat.lastMessageTime}</span>
                      </div>
                      <p className="text-sm text-neutral-600 truncate">{chat.lastMessage}</p>
                    </div>
                    {chat.unread > 0 && (
                      <div className="bg-green-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {chat.unread}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Window */}
            <div className={`md:col-span-2 flex flex-col ${selectedChat ? 'flex' : 'hidden md:flex'}`}>
              {selectedChat ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-neutral-200 flex items-center gap-3">
                    <button
                      onClick={() => setSelectedChat(null)}
                      className="md:hidden p-2 hover:bg-neutral-100 rounded-lg"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <img
                      src={selectedChat.businessAvatar}
                      alt={selectedChat.businessName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="text-neutral-900">{selectedChat.businessName}</h3>
                      <div className="flex items-center gap-1 text-xs text-neutral-600">
                        <Circle className={`w-2 h-2 ${selectedChat.online ? 'text-green-500 fill-current' : 'text-neutral-400 fill-current'}`} />
                        <span>{selectedChat.online ? 'Online' : 'Offline'}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onViewBusiness(selectedChat.businessId)}
                      className="px-4 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      View Profile
                    </button>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50">
                    {currentMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-2xl ${
                            message.sender === 'user'
                              ? 'bg-green-600 text-white rounded-br-sm'
                              : 'bg-white text-neutral-900 rounded-bl-sm shadow-sm'
                          }`}
                        >
                          <p>{message.text}</p>
                          <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-green-100' : 'text-neutral-500'}`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-neutral-200 bg-white">
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
                        className="bg-green-600 text-white p-3 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
}

const mockChats: Chat[] = [
  {
    id: '1',
    businessId: '1',
    businessName: 'Green Valley Nursery',
    businessAvatar: 'https://images.unsplash.com/photo-1619077130450-baea09efa355?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbGFudCUyMG51cnNlcnklMjBncmVlbmhvdXNlfGVufDF8fHx8MTc2NTc0MjUzNHww&ixlib=rb-4.1.0&q=80&w=300',
    lastMessage: 'Thank you for your inquiry about the date palms!',
    lastMessageTime: '10 min ago',
    unread: 2,
    online: true,
  },
  {
    id: '2',
    businessId: '2',
    businessName: 'AgriTools Pro',
    businessAvatar: 'https://images.unsplash.com/photo-1690986469727-1ed8bcdf6384?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZ3JpY3VsdHVyZSUyMHRvb2xzJTIwZXF1aXBtZW50fGVufDF8fHx8MTc2NTY1NDY4NHww&ixlib=rb-4.1.0&q=80&w=300',
    lastMessage: 'We have the irrigation system in stock.',
    lastMessageTime: '2 hours ago',
    unread: 0,
    online: true,
  },
  {
    id: '3',
    businessId: '3',
    businessName: 'Fresh Harvest Farm',
    businessAvatar: 'https://images.unsplash.com/photo-1631337902392-b4bb679fbfdb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbmljJTIwdmVnZXRhYmxlcyUyMGZhcm1pbmd8ZW58MXx8fHwxNzY1NzQyNTM0fDA&ixlib=rb-4.1.0&q=80&w=300',
    lastMessage: 'Your order is ready for pickup!',
    lastMessageTime: '1 day ago',
    unread: 0,
    online: false,
  },
];

const mockMessages: Message[] = [
  {
    id: '1',
    chatId: '1',
    text: 'Hello, I\'m interested in your date palm seedlings.',
    sender: 'user',
    timestamp: new Date(Date.now() - 3600000),
  },
  {
    id: '2',
    chatId: '1',
    text: 'Hello! Thank you for your interest. We have premium organic date palm seedlings available.',
    sender: 'business',
    timestamp: new Date(Date.now() - 3000000),
  },
  {
    id: '3',
    chatId: '1',
    text: 'What\'s the price and do you offer delivery?',
    sender: 'user',
    timestamp: new Date(Date.now() - 2400000),
  },
  {
    id: '4',
    chatId: '1',
    text: 'They\'re SR 150 each, and yes, we offer free delivery for orders over SR 200!',
    sender: 'business',
    timestamp: new Date(Date.now() - 600000),
  },
];