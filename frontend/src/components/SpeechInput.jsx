import { useState, useEffect, useRef } from 'react';

export default function SpeechInput({ onAnalyze, isLoading }) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isSupported, setIsSupported] = useState(true);
    const recognitionRef = useRef(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setIsSupported(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const t = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += t;
                } else {
                    interimTranscript += t;
                }
            }

            setTranscript(finalTranscript || interimTranscript);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            setTranscript('');
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    const handleAnalyze = () => {
        if (transcript.trim()) {
            onAnalyze(transcript.trim());
        }
    };

    if (!isSupported) {
        return (
            <div className="animate-fade-in glass-card p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-2">Speech Not Supported</h3>
                <p className="text-dark-400 text-sm">
                    Your browser doesn't support speech recognition. Try using Chrome or Edge.
                </p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-6">
            {/* Microphone Button */}
            <div className="flex flex-col items-center gap-6">
                <button
                    onClick={toggleListening}
                    disabled={isLoading}
                    className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500 
            ${isListening
                            ? 'bg-red-500/20 border-2 border-red-500 animate-pulse-glow shadow-[0_0_40px_rgba(239,68,68,0.3)]'
                            : 'bg-primary-500/10 border-2 border-primary-500/50 hover:bg-primary-500/20 hover:border-primary-500 hover:shadow-[0_0_30px_rgba(34,197,94,0.2)]'
                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    id="speech-toggle-btn"
                >
                    {/* Animated rings */}
                    {isListening && (
                        <>
                            <span className="absolute inset-0 rounded-full border-2 border-red-500/30 animate-ping"></span>
                            <span className="absolute inset-[-8px] rounded-full border border-red-500/20 animate-pulse"></span>
                        </>
                    )}

                    <svg className={`w-10 h-10 relative z-10 transition-colors ${isListening ? 'text-red-400' : 'text-primary-400'}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                </button>

                <p className={`text-sm font-medium ${isListening ? 'text-red-400' : 'text-dark-400'}`}>
                    {isListening ? '🔴 Listening... Tap to stop' : 'Tap to start speaking'}
                </p>
            </div>

            {/* Transcript Display */}
            {transcript && (
                <div className="glass-card p-4 space-y-4 animate-slide-up">
                    <div className="flex items-center gap-2 text-xs text-dark-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                        Transcript
                    </div>
                    <p className="text-dark-900 dark:text-white text-lg leading-relaxed">"{transcript}"</p>

                    <button
                        onClick={handleAnalyze}
                        disabled={isLoading}
                        className={`btn-primary w-full flex items-center justify-center gap-2
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        id="analyze-speech-btn"
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
                </div>
            )}

            {/* Tips */}
            <div className="glass-card p-4">
                <p className="text-xs text-dark-400 mb-2 uppercase tracking-wider font-medium">Tips</p>
                <ul className="space-y-1.5 text-sm text-dark-300">
                    <li className="flex items-start gap-2">
                        <span className="text-primary-400 mt-0.5">•</span>
                        Say the food name clearly, e.g., "Two eggs and a banana"
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-primary-400 mt-0.5">•</span>
                        Include quantities for more accurate results
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-primary-400 mt-0.5">•</span>
                        Works best in Chrome or Edge browsers
                    </li>
                </ul>
            </div>
        </div>
    );
}
