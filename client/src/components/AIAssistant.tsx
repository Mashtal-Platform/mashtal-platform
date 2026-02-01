import React, { useState } from 'react';
import { Bot, X, Send, Sparkles, Loader } from 'lucide-react';

interface AIAssistantProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface Message {
  text: string;
  isUser: boolean;
  suggestions?: string[];
}

export function AIAssistant({ isOpen, onToggle }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hello! I'm your agricultural engineer 🌱. Ask me anything about farming, plants, soil, irrigation, pests, fertilizers, or crops.",
      isUser: false,
      suggestions: suggestedQuestions,
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // This keeps the full chat history for the API
  const [chatHistory, setChatHistory] = useState<any[]>([]);

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

  const handleSend = async () => {
  if (!input.trim() || isLoading) return;
  const userText = input.trim();
  setInput('');

  // Add user's message to UI
  const newMessages = [...messages, { text: userText, isUser: true }];
  setMessages(newMessages);
  setIsLoading(true);

  try {
    const API_KEY = "AIzaSyBW6j7A04ec2WHCM4jHgPTWFXYndGu9Scc";
    const MODEL = "models/gemini-2.5-flash";

    // Build chat history for API request: include all previous messages + this one
    const newHistory = [
      ...chatHistory,
      { role: 'user', parts: [{ text: userText }] },
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${MODEL}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: newHistory,
          generationConfig: { temperature: 0.7, maxOutputTokens: 2000 },
        }),
      }
    );

    const data = await response.json();
    console.log("API response:", data);

    // Get the raw AI text
    let aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

    // CLEAN-UP AND FORMAT:
    aiText = aiText.replace(/(\*\*|\*)/g, '');           // Remove Markdown symbols
    aiText = aiText.replace(/\. /g, '.\n\n');            // Add line breaks after sentences
    aiText = aiText.replace(/(Nitrogen Fertilizer|Dermatology|Animal Feed|Diesel Exhaust Fluid|Industrial Applications)/gi, '\n\n$1\n'); // Optional headings

    const aiMessage: Message = {
      text: aiText,
      isUser: false,
      suggestions: suggestedFollowUps(userText),
    };

    // Update UI messages
    setMessages([...newMessages, aiMessage]);

    // Update chat history with the AI reply
    setChatHistory([...newHistory, { role: 'model', parts: [{ text: aiText }] }]);
  } catch (err) {
    console.error(err);
    setMessages([...newMessages, { text: "I had trouble connecting. Can you try again?", isUser: false }]);
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
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-neutral-200">
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span>Agricultural AI</span>
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-xs text-green-100">Powered by Google Gemini</div>
              </div>
            </div>
            <button onClick={onToggle} className="p-2 hover:bg-white/20 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl ${msg.isUser ? 'bg-green-600 text-white' : 'bg-neutral-100 text-neutral-900'}`}>
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

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about farming, plants, agriculture..."
                className="flex-1 border p-2 rounded-xl"
              />
              <button onClick={handleSend} disabled={isLoading || !input.trim()}>
                <Send className="w-5 h-5" />
              </button>
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
