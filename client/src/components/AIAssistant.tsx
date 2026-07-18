import React, { useEffect, useRef, useState } from 'react';
import { Bot, X, Send, Sparkles, Loader } from 'lucide-react';
import { api } from '../shared/api/client';
import { useAppState } from '../shared/store/AppStateContext';

interface AIAssistantProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface Message {
  text: string;
  isUser: boolean;
  imageUrl?: string;
  suggestions?: string[];
  productRecommendations?: string[];
}

const WELCOME_TEXT =
  "Hello! I'm your agricultural assistant 🌱. Ask me anything about farming, plants, soil, irrigation, pests, fertilizers, or crops.";

const suggestedQuestions = [
  'How to grow date palms?',
  'Best irrigation for Lebanese climate',
  'Organic pest control tips',
];

function buildHistoryPayload(messages: Message[]) {
  // This chat only — skip the welcome bubble; last ~16 turns for the API.
  return messages
    .filter((m) => m.text !== WELCOME_TEXT)
    .map((m) => {
      const parts: string[] = [];
      if (m.imageUrl) parts.push('[User uploaded a plant leaf/photo in this chat]');
      if (m.text && m.text !== 'Uploaded image') parts.push(m.text);
      else if (m.imageUrl && (!m.text || m.text === 'Uploaded image')) {
        parts.push('Please analyze this plant image.');
      }
      const content = parts.join('\n').trim();
      if (!content) return null;
      return {
        role: m.isUser ? ('user' as const) : ('assistant' as const),
        content,
      };
    })
    .filter(Boolean)
    .slice(-16);
}

export function AIAssistant({ isOpen, onToggle }: AIAssistantProps) {
  const { navigate } = useAppState();
  const [messages, setMessages] = useState<Message[]>([
    {
      text: WELCOME_TEXT,
      isUser: false,
      suggestions: suggestedQuestions,
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [photo, setPhoto] = useState<{
    file: File;
    filename: string;
    mimeType: string;
    previewUrl: string;
  } | null>(null);

  const handlePhotoChange = (file: File | null) => {
    if (!file) {
      setPhoto(null);
      return;
    }
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPhoto({
        file,
        filename: file.name,
        mimeType: file.type || 'image/jpeg',
        previewUrl: String(reader.result || ''),
      });
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, isLoading, isOpen]);

  const suggestedFollowUps = (lastQuestion: string) => {
    const q = lastQuestion.toLowerCase();
    const suggestions: string[] = [];
    if (q.includes('date palm') || q.includes('palm')) suggestions.push('How to fertilize date palms?');
    if (q.includes('irrigation') || q.includes('water')) suggestions.push('Best irrigation method for vegetables?');
    if (q.includes('pest')) suggestions.push('Organic pest control methods?');
    if (q.includes('fertilizer') || q.includes('npk')) suggestions.push('Optimal fertilization schedule?');
    if (q.includes('soil')) suggestions.push('How to improve soil quality?');
    return suggestions.length ? suggestions : undefined;
  };

  const handleSuggestedQuestion = (question: string) => setInput(question);

  const handleRecommendationClick = (recommendation: string) => {
    try {
      sessionStorage.setItem('mashtal_shop_search', recommendation);
    } catch {
      // ignore storage errors
    }
    navigate('shopping');
    onToggle();
  };

  const handleSend = async () => {
    if (isLoading) return;
    if (!input.trim() && !photo) return;

    const pendingPhoto = photo;
    const userText = input.trim() || (pendingPhoto ? 'Uploaded image' : '');
    setInput('');
    // Move image into the chat bubble immediately (do not keep it in the composer).
    setPhoto(null);

    const userMessage: Message = {
      text: userText,
      isUser: true,
      imageUrl: pendingPhoto?.previewUrl,
    };

    const historyForApi = buildHistoryPayload(messages);
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('message', userText === 'Uploaded image' ? 'Please analyze this plant image for disease.' : userText);
      formData.append('history', JSON.stringify(historyForApi));
      if (pendingPhoto?.file) formData.append('image', pendingPhoto.file);

      const data = await api.post('/ai/assistant', formData);

      let aiText = '';
      if (data?.kind === 'disease_detection') {
        aiText = data?.formattedText || '';
      } else {
        aiText = data?.text || '';
      }

      if (!aiText.trim()) aiText = 'I could not generate a response. Please try again.';

      const aiMessage: Message = {
        text: aiText,
        isUser: false,
        suggestions: suggestedFollowUps(userText),
        productRecommendations: Array.isArray(data?.recommendations)
          ? data.recommendations.filter((v: unknown) => typeof v === 'string')
          : undefined,
      };

      setMessages([...newMessages, aiMessage]);
    } catch (err) {
      console.error(err);
      setMessages([
        ...newMessages,
        {
          text:
            err instanceof Error && err.message
              ? `I had trouble connecting: ${err.message}`
              : 'I had trouble connecting. Can you try again?',
          isUser: false,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed bottom-6 right-6 bg-green-600 text-white p-4 rounded-full shadow-2xl hover:bg-green-700 transition-all hover:scale-110 z-50"
          aria-label="Open AI Assistant"
        >
          <Bot className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-pulse"></span>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6">
          <div className="w-full max-w-[calc(100vw-1.5rem)] sm:max-w-xl md:max-w-3xl lg:max-w-4xl h-[78vh] md:h-[82vh] max-h-[900px] bg-white rounded-2xl shadow-2xl flex flex-col border border-neutral-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 md:p-5 rounded-t-2xl flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2 text-base md:text-lg font-medium">
                    <span>Agricultural AI</span>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="text-xs md:text-sm text-green-100">
                    Local leaf photos · HF answers this chat
                  </div>
                </div>
              </div>
              <button onClick={onToggle} className="p-2 hover:bg-white/20 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] md:max-w-[75%] p-3 md:p-4 rounded-2xl whitespace-pre-wrap text-sm md:text-[15px] leading-relaxed ${
                      msg.isUser
                        ? 'bg-green-600 text-white'
                        : 'bg-neutral-100 text-neutral-900'
                    }`}
                  >
                    {msg.imageUrl && (
                      <img
                        src={msg.imageUrl}
                        alt="Uploaded plant"
                        className={`mb-2 max-h-56 w-auto max-w-full rounded-xl object-cover border ${
                          msg.isUser ? 'border-white/30' : 'border-neutral-200'
                        }`}
                      />
                    )}
                    {msg.text && msg.text !== 'Uploaded image' ? msg.text : null}
                    {msg.text === 'Uploaded image' && !msg.imageUrl ? msg.text : null}
                    {msg.suggestions && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {msg.suggestions.map((s, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSuggestedQuestion(s)}
                            className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                    {msg.productRecommendations && msg.productRecommendations.length > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {msg.productRecommendations.map((rec, idx) => (
                          <button
                            key={`${rec}-${idx}`}
                            onClick={() => handleRecommendationClick(rec)}
                            className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full hover:bg-emerald-200 transition-colors"
                          >
                            {rec}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-neutral-100 p-3 rounded-2xl flex items-center gap-2">
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 md:p-5 border-t flex-shrink-0">
              <div className="flex gap-2 md:gap-3">
                <label className="flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-xl bg-neutral-100 hover:bg-neutral-200 transition-colors cursor-pointer flex-shrink-0">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
                    disabled={isLoading}
                  />
                  <span className="text-xl leading-none" aria-hidden>
                    +
                  </span>
                </label>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about farming, plants, agriculture..."
                  className="flex-1 border p-2.5 md:p-3 rounded-xl text-sm md:text-base"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || (!input.trim() && !photo)}
                  className="flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-xl text-green-700 hover:bg-green-50 disabled:opacity-40 flex-shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>

              {photo && (
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={photo.previewUrl}
                    alt={photo.filename}
                    className="w-14 h-14 rounded-xl object-cover border border-neutral-200"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-neutral-800 truncate">
                      {photo.filename}
                    </div>
                    <div className="text-[11px] text-neutral-500 truncate">
                      Ready to send — it will appear in the chat
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPhoto(null)}
                    disabled={isLoading}
                    className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-xs font-medium text-neutral-700 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
