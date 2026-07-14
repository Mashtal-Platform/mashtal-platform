import React, { useEffect, useState } from 'react';
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
  suggestions?: string[];
  productRecommendations?: string[];
}

export function AIAssistant({ isOpen, onToggle }: AIAssistantProps) {
  const { navigate } = useAppState();
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hello! I'm your agricultural assistant 🌱. Ask me anything about farming, plants, soil, irrigation, pests, fertilizers, or crops.",
      isUser: false,
      suggestions: suggestedQuestions,
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

    const userText = input.trim() || (photo ? 'Uploaded image' : '');
    setInput('');

    // Add user's message to UI
    const newMessages = [...messages, { text: userText, isUser: true }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('message', userText);
      if (photo?.file) formData.append('image', photo.file);

      const data = await api.post('/ai/assistant', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

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
        { text: 'I had trouble connecting. Can you try again?', isUser: false },
      ]);
    } finally {
      setIsLoading(false);
      setPhoto(null);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-[520px] max-w-[calc(100vw-2rem)] h-[430px] max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col border border-neutral-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-t-2xl flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span>Agricultural AI</span>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="text-xs text-green-100">Powered by HuggingFace + local rules</div>
                </div>
              </div>
              <button onClick={onToggle} className="p-2 hover:bg-white/20 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl whitespace-pre-wrap ${
                      msg.isUser
                        ? 'bg-green-600 text-white'
                        : 'bg-neutral-100 text-neutral-900'
                    }`}
                  >
                    {msg.text}
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

            <div className="p-4 border-t flex-shrink-0">
              <div className="flex gap-2">
                <label className="flex items-center justify-center w-10 h-10 rounded-xl bg-neutral-100 hover:bg-neutral-200 transition-colors cursor-pointer">
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
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about farming, plants, agriculture..."
                  className="flex-1 border p-2 rounded-xl"
                />
                <button onClick={handleSend} disabled={isLoading || (!input.trim() && !photo)}>
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
                      This image will be sent with your next message
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

const suggestedQuestions = [
  'How to grow date palms?',
  'Best irrigation for Lebanese climate',
  'Organic pest control tips',
];
