import React, { useState, useRef, useEffect } from 'react';
import { useApp } from './AppContext';
import { api } from '../services/api';
import { Bot, X, MessageSquare, Send, Sparkles, Loader2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export const AIChatBot: React.FC = () => {
  const { t, trackEvent } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Load welcome message
  useEffect(() => {
    setMessages([
      {
        id: 'welcome-msg',
        role: 'assistant',
        content: t('ai_bot_welcome')
      }
    ]);
  }, [t]);

  // Scroll messages
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typing]);

  const handleSend = async (textToSend?: string) => {
    const activeText = textToSend || message;
    if (!activeText.trim()) return;

    if (!textToSend) setMessage('');

    const userMsgId = 'msg-' + Date.now();
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: activeText
    };

    setMessages(prev => [...prev, newUserMsg]);
    setTyping(true);
    trackEvent('ai_chat_query', { message: activeText });

    try {
      // Compile context history
      const history = messages.filter(m => m.id !== 'welcome-msg').map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        content: m.content
      }));

      const res = await api.askAIChat({ message: activeText, history });
      const responseMsg: ChatMessage = {
        id: 'reply-' + Date.now(),
        role: 'assistant',
        content: res.reply
      };
      setMessages(prev => [...prev, responseMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'assistant',
          content: "I apologize, but my network stream encountered an anomaly. We are dedicated to delivering bespoke solutions! Feel free to mail our coordinator workspace directly at support@grobrav.com."
        }
      ]);
    } finally {
      setTyping(false);
    }
  };

  const chooseSuggestion = (text: string) => {
    handleSend(text);
  };

  return (
    <>
      {/* Floating Toggle Icon */}
      {!isOpen && (
        <button
          id="ai-bot-floating-trigger"
          onClick={() => {
            setIsOpen(true);
            trackEvent('ai_chat_open');
          }}
          className="fixed bottom-6 right-6 z-55 w-14 h-14 bg-brand-900 border border-brand-800 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer"
          title="Grobrav Stylist Assistant"
        >
          <Bot size={26} className="text-white hover:rotate-6 duration-300" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </button>
      )}

      {/* Expand Chat Panel */}
      {isOpen && (
        <div
          id="ai-chat-panel-sidebar"
          className="fixed bottom-6 right-6 z-55 w-[380px] h-[550px] bg-white border border-neutral-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up"
        >
          {/* Header */}
          <div className="bg-brand-900 text-white p-4 flex items-center justify-between border-b border-brand-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-brand-800 border border-brand-700 text-white rounded-full flex items-center justify-center">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <h4 className="font-bold text-sm tracking-wide flex items-center gap-1">
                  Grobrav Studio AI
                  <Sparkles size={11} className="text-emerald-400" />
                </h4>
                <div className="flex items-center gap-1.2 text-[10px] text-emerald-400 font-mono font-bold uppercase">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                  Gifting Expert Live
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-brand-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages block */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-neutral-50/50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 max-w-[85%] ${m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 bg-brand-50 text-brand-700 border rounded-full flex items-center justify-center flex-shrink-0 text-xs">
                    <Bot size={14} />
                  </div>
                )}
                <div className={`p-3 rounded-2xl text-xs leading-relaxed border ${
                  m.role === 'user'
                    ? 'bg-neutral-900 text-white border-neutral-800 rounded-tr-none'
                    : 'bg-white text-neutral-800 border-neutral-150 rounded-tl-none shadow-xs'
                }`}>
                  <p className="whitespace-pre-line font-medium">{m.content}</p>
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex gap-2.5 max-w-[85%]">
                <div className="w-7 h-7 bg-brand-50 text-brand-700 border rounded-full flex items-center justify-center flex-shrink-0 text-xs">
                  <Bot size={14} />
                </div>
                <div className="p-3 bg-white text-neutral-400 border border-neutral-150 rounded-2xl rounded-tl-none shadow-xs text-xs flex items-center gap-1.5">
                  <Loader2 size={12} className="animate-spin" />
                  Grobrav is drafting replies...
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Suggestions chips */}
          {messages.length === 1 && (
            <div className="px-4 py-2 border-t border-neutral-100 flex flex-wrap gap-1.5 bg-white">
              <button
                onClick={() => chooseSuggestion("Couple Hoodies colors and sizes")}
                className="text-[10px] bg-neutral-50 hover:bg-brand-50 hover:text-brand-700 border border-neutral-200 hover:border-brand-200 rounded-lg px-2.5 py-1.5 font-semibold text-neutral-600 transition-colors cursor-pointer"
              >
                👕 Hoodie Options
              </button>
              <button
                onClick={() => chooseSuggestion("How long does customizable printing take?")}
                className="text-[10px] bg-neutral-50 hover:bg-brand-50 hover:text-brand-700 border border-neutral-200 hover:border-brand-200 rounded-lg px-2.5 py-1.5 font-semibold text-neutral-600 transition-colors cursor-pointer"
              >
                ⏱️ Delivery Timelines
              </button>
              <button
                onClick={() => chooseSuggestion("Can I return a printed product?")}
                className="text-[10px] bg-neutral-50 hover:bg-brand-50 hover:text-brand-700 border border-neutral-200 hover:border-brand-200 rounded-lg px-2.5 py-1.5 font-semibold text-neutral-600 transition-colors cursor-pointer"
              >
                🛡️ Return Policy
              </button>
            </div>
          )}

          {/* Input Panel footer */}
          <div className="p-3 bg-white border-t border-neutral-150 flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t('ai_bot_placeholder')}
              className="flex-1 px-3 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500 bg-neutral-50 focus:bg-white text-xs"
            />
            <button
              onClick={() => handleSend()}
              className="p-2 bg-brand-900 border border-brand-800 text-white rounded-xl hover:bg-brand-800 active:scale-95 transition-all text-xs flex items-center gap-1 shadow cursor-pointer font-bold"
            >
              <Send size={14} />
            </button>
          </div>

        </div>
      )}
    </>
  );
};
export default AIChatBot;
