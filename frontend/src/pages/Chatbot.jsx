import { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../services/api';
import { SplineScene } from '../components/ui/SplineScene';
import { Spotlight } from '../components/ui/spotlight';
import { IoChatbubblesOutline } from 'react-icons/io5';

export default function Chatbot() {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hey there! I'm Raju Danger, your personal health coach. I'm here to help you with nutrition advice, meal planning, exercise tips, and any health-related questions. What's on your mind today?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const quickPrompts = [
        'Suggest a healthy meal plan',
        'Best exercises for weight loss',
        'How to count calories?',
        'How much water should I drink?',
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
                content: "Sorry, I couldn't process that. Please try again.",
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
        <>
            {/* Absolute Full Window Background */}
            <div className="fixed inset-0 w-screen h-screen z-0 bg-black pointer-events-auto">
                <SplineScene 
                    scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                    className="w-full h-full pointer-events-auto"
                />
                <Spotlight
                    className="-top-40 left-0 md:left-60 md:-top-20 pointer-events-none"
                    fill="rgba(16, 185, 129, 0.4)" 
                />
            </div>

            <div className="w-full h-[calc(100vh-140px)] relative z-10 flex flex-col pointer-events-none max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pointer-events-auto px-4 z-20">
                    <div className="glass-card p-3 flex items-center gap-3 backdrop-blur-md bg-dark-950/60 border border-white/10 rounded-2xl">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-xl text-white shadow-lg shadow-primary-500/20">
                            <IoChatbubblesOutline />
                        </div>
                        <div>
                            <h2 className="text-white font-bold tracking-wide text-sm md:text-base">Raju Danger</h2>
                            <p className="text-gray-300 text-[10px] md:text-xs">Energetic health & nutrition assistant</p>
                        </div>
                        <div className="ml-2 flex items-center gap-1.5 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                            <span className="text-[10px] uppercase font-bold text-green-400 tracking-wider">Online</span>
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto space-y-6 pr-2 pb-4 scrollbar-thin mt-2 px-4 pointer-events-none">
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in pointer-events-none`}
                        >
                            <div className={`pointer-events-auto max-w-[90%] md:max-w-[70%] p-4 rounded-3xl shadow-2xl backdrop-blur-xl transition-all ${msg.role === 'user'
                                ? 'bg-primary-500/40 border border-primary-400/30 text-white rounded-tr-sm'
                                : 'bg-black/60 border border-white/10 text-white rounded-tl-sm'
                                }`}>
                                <p className="text-sm whitespace-pre-wrap leading-relaxed tracking-wide text-shadow-sm">{msg.content}</p>
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex justify-start animate-fade-in pointer-events-none">
                            <div className="pointer-events-auto bg-black/60 border border-white/10 p-4 rounded-3xl rounded-tl-sm backdrop-blur-xl shadow-2xl">
                                <div className="flex items-center gap-3 text-white">
                                    <div className="flex gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </div>
                                    <span className="text-xs font-bold tracking-widest uppercase">Thinking</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Quick Prompts */}
                {messages.length <= 1 && (
                    <div className="flex flex-wrap gap-2 mb-4 mt-2 animate-fade-in pointer-events-auto justify-center opacity-90 px-4">
                        {quickPrompts.map((prompt, i) => (
                            <button
                                key={i}
                                onClick={() => handleSend(prompt)}
                                className="bg-black/50 backdrop-blur-xl border border-white/20 text-xs text-white px-4 py-2.5 rounded-2xl
                                         hover:bg-primary-500/40 hover:border-primary-400/60 hover:scale-105 transition-all duration-300 shadow-xl font-medium tracking-wide"
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input Area */}
                <div className="px-4 w-full pointer-events-none z-20">
                    <div className="bg-black/80 backdrop-blur-3xl border border-white/10 p-3 rounded-3xl flex items-end gap-3 shadow-[0_10px_50px_rgba(0,0,0,0.8)] pointer-events-auto shrink-0 mt-auto w-full">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="flex-1 bg-transparent text-white placeholder-gray-400 resize-none outline-none text-sm min-h-[44px] max-h-[120px] p-3 font-medium leading-relaxed"
                            placeholder="Ask me anything about health & nutrition..."
                            rows={1}
                            id="chat-input"
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || loading}
                            className={`p-3.5 rounded-2xl transition-all duration-300 shadow-xl flex-shrink-0 ${input.trim() && !loading
                                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white hover:shadow-emerald-500/40 hover:scale-105 border border-emerald-400/50'
                                : 'bg-white/5 text-gray-500 border border-transparent'
                                }`}
                            id="chat-send-btn"
                        >
                            <svg className="w-5 h-5 translate-x-px" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
