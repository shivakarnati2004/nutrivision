import { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../services/api';

export default function Chatbot() {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hey there! 👋 I'm Raju Danger 🙂123, your personal health coach. I'm here to help you with nutrition advice, meal planning, exercise tips, and any health-related questions. What's on your mind today?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const quickPrompts = [
        '🥗 Suggest a healthy meal plan',
        '💪 Best exercises for weight loss',
        '🍎 How to count calories?',
        '💧 How much water should I drink?',
    ];

    const handleSend = async (text = input) => {
        if (!text.trim() || loading) return;

        const userMessage = { role: 'user', content: text.trim() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const history = messages.map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                content: m.content,
            }));

            const result = await sendChatMessage(text.trim(), history);

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: result.message,
            }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "Sorry, I couldn't process that. Please try again. 😔",
            }]);
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-180px)] animate-fade-in">
            {/* Header */}
            <div className="glass-card p-4 mb-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-lg">
                    🤖
                </div>
                <div>
                    <h2 className="text-dark-900 dark:text-white font-bold">Raju Danger 🙂123</h2>
                    <p className="text-dark-500 text-xs">Energetic health & nutrition assistant</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-xs text-green-400">Online</span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4 scrollbar-thin">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    >
                        <div className={`max-w-[85%] p-4 rounded-2xl ${msg.role === 'user'
                            ? 'bg-primary-500/20 border border-primary-500/30 text-dark-900 dark:text-white rounded-br-md'
                            : 'glass-card text-dark-200 rounded-bl-md'
                            }`}>
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start animate-fade-in">
                        <div className="glass-card p-4 rounded-2xl rounded-bl-md">
                            <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                                <span className="text-dark-500 text-xs">Thinking...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts */}
            {messages.length <= 1 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {quickPrompts.map((prompt, i) => (
                        <button
                            key={i}
                            onClick={() => handleSend(prompt)}
                            className="bg-white/5 border border-white/10 text-xs text-dark-300 px-3 py-2 rounded-lg
                                     hover:bg-primary-500/10 hover:border-primary-500/30 hover:text-dark-900 dark:hover:text-white transition-all"
                        >
                            {prompt}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <div className="glass-card p-3 flex items-end gap-3">
                <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent text-dark-900 dark:text-white placeholder-dark-500 resize-none outline-none text-sm min-h-[40px] max-h-[120px]"
                    placeholder="Ask me anything about health & nutrition..."
                    rows={1}
                    id="chat-input"
                />
                <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || loading}
                    className={`p-2.5 rounded-xl transition-all duration-200 ${input.trim() && !loading
                        ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:scale-105'
                        : 'bg-white/5 text-dark-500'
                        }`}
                    id="chat-send-btn"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
