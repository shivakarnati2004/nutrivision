import { useState } from 'react';

export default function TextInput({ onAnalyze, isLoading }) {
    const [text, setText] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (text.trim() && !isLoading) {
            onAnalyze(text.trim());
        }
    };

    const suggestions = [
        '🍎 1 Apple',
        '🍚 1 Cup Rice',
        '🥗 Caesar Salad',
        '🍕 2 Slices Pizza',
        '🥑 1 Avocado',
        '🍳 2 Boiled Eggs',
    ];

    return (
        <div className="animate-fade-in space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Describe your food... e.g., '2 chapatis with dal and a bowl of rice'"
                        className="input-field min-h-[120px] resize-none pr-12"
                        id="food-text-input"
                        rows={4}
                    />
                    <div className="absolute bottom-3 right-3">
                        <span className={`text-xs ${text.length > 0 ? 'text-primary-400' : 'text-dark-500'}`}>
                            {text.length}/500
                        </span>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={!text.trim() || isLoading}
                    className={`btn-primary w-full flex items-center justify-center gap-2 
            ${(!text.trim() || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    id="analyze-text-btn"
                >
                    {isLoading ? (
                        <>
                            <div className="spinner w-5 h-5 !border-2"></div>
                            <span>Analyzing...</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            <span>Analyze Nutrition</span>
                        </>
                    )}
                </button>
            </form>

            {/* Quick Suggestions */}
            <div className="space-y-3">
                <p className="text-xs text-dark-400 uppercase tracking-wider font-medium">Quick suggestions</p>
                <div className="flex flex-wrap gap-2">
                    {suggestions.map((suggestion) => (
                        <button
                            key={suggestion}
                            onClick={() => { setText(suggestion); }}
                            className="bg-white/5 border border-white/10 text-sm text-dark-300 px-3 py-1.5 rounded-lg
                       hover:bg-primary-500/10 hover:border-primary-500/30 hover:text-white
                       transition-all duration-200"
                            id={`suggestion-${suggestion.split(' ').pop().toLowerCase()}`}
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
