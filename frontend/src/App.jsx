import { useState } from 'react';
import GradientMenu from './components/ui/gradient-menu';
import { IoHomeOutline, IoPieChartOutline, IoChatbubblesOutline, IoPersonOutline, IoCompassOutline } from 'react-icons/io5';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';

import Dashboard from './pages/Dashboard';
import Chatbot from './pages/Chatbot';
import Profile from './pages/Profile';
import Landing from './pages/Landing';
import CustomCursor from './components/CustomCursor';
import ThemeToggle from './components/ThemeToggle';
import ImageUpload from './components/ImageUpload';
import TextInput from './components/TextInput';
import SpeechInput from './components/SpeechInput';
import NutritionCard from './components/NutritionCard';
import Home3DAnimation from './components/Home3DAnimation';
import TubesBackground from './components/TubesBackground';
import { analyzeImage, analyzeText, analyzeSpeech, saveAnalysis } from './services/api';

import { IoCameraOutline, IoDocumentTextOutline, IoMicOutline, IoNutritionOutline } from 'react-icons/io5';

const tabs = [
    { id: 'image', label: 'Image', icon: <IoCameraOutline className="text-xl" />, desc: 'Upload a photo' },
    { id: 'text', label: 'Text', icon: <IoDocumentTextOutline className="text-xl" />, desc: 'Type food name' },
    { id: 'speech', label: 'Speech', icon: <IoMicOutline className="text-xl" />, desc: 'Speak it' },
];

function HomePage() {
    const [activeTab, setActiveTab] = useState('text');
    const [nutritionData, setNutritionData] = useState(null);
    const [lastInputType, setLastInputType] = useState('text');
    const [lastInputText, setLastInputText] = useState('');
    const [lastInputFile, setLastInputFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [canRetry, setCanRetry] = useState(false);
    const { isAuthenticated } = useAuth();

    const handleAnalyze = async (type, input) => {
        setIsLoading(true);
        setError('');
        setCanRetry(false);
        setNutritionData(null);
        setLastInputType(type);

        // Store input for retry
        if (type === 'image') {
            setLastInputFile(input);
            setLastInputText(input?.name || 'Image');
        } else {
            setLastInputFile(null);
            setLastInputText(input);
        }

        try {
            let result;
            switch (type) {
                case 'image':
                    result = await analyzeImage(input);
                    break;
                case 'text':
                    result = await analyzeText(input);
                    break;
                case 'speech':
                    result = await analyzeSpeech(input);
                    break;
                default:
                    throw new Error('Invalid analysis type');
            }

            if (result.success) {
                setNutritionData(result.data);
            } else {
                setError(result.error || 'Analysis failed');
                setCanRetry(true);
            }
        } catch (err) {
            console.error('Analysis error:', err);
            const errMsg = err.response?.data?.error || err.message || 'Failed to analyze. Please try again.';
            setError(errMsg);
            setCanRetry(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRetry = () => {
        if (!lastInputType || isLoading) return;
        const input = lastInputType === 'image' ? lastInputFile : lastInputText;
        if (input) handleAnalyze(lastInputType, input);
    };

    const handleSave = async (data, weight) => {
        if (!isAuthenticated) return;
        try {
            await saveAnalysis({
                input_type: lastInputType,
                input_text: lastInputText,
                food_name: data.food_name,
                nutrition_data: data,
                food_weight_grams: weight,
            });
        } catch (err) {
            console.error('Save error:', err);
        }
    };

    const handleDiscard = () => {
        setNutritionData(null);
    };

    return (
        <div className="space-y-6 pb-24">
            {!isAuthenticated && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-4 border-primary-500/30 bg-primary-500/5 mb-6 flex items-center justify-between gap-4"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400">
                            ✨
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white">Trial Mode Active</h4>
                            <p className="text-xs text-dark-400">You can try Text Analysis. Sign up to unlock Image & Speech!</p>
                        </div>
                    </div>
                    <Link to="/signup">
                        <button className="px-4 py-2 bg-primary-500 text-white rounded-lg text-xs font-bold hover:bg-primary-400 transition-all">
                            Sign Up
                        </button>
                    </Link>
                </motion.div>
            )}

            <Home3DAnimation />

            {/* Tab Navigation */}
            <nav className="flex gap-2 p-1.5 glass-card" id="main-tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => { 
                            if (!isAuthenticated && tab.id !== 'text') {
                                setError(`Sign up for a free account to unlock ${tab.label} analysis!`);
                                return;
                            }
                            setActiveTab(tab.id); 
                            setError(''); 
                        }}
                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 
                border flex flex-col items-center gap-1
                ${activeTab === tab.id ? 'tab-active' : 'tab-inactive'}`}
                        id={`tab-${tab.id}`}
                    >
                        <span className="text-lg">{tab.icon}</span>
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Panel */}
                <div className="glass-card p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <span className="text-lg">{tabs.find(t => t.id === activeTab)?.icon}</span>
                        <h2 className="text-lg font-semibold text-white">
                            {tabs.find(t => t.id === activeTab)?.desc}
                        </h2>
                    </div>

                    {activeTab === 'image' && (
                        <ImageUpload onAnalyze={(file) => handleAnalyze('image', file)} isLoading={isLoading} />
                    )}
                    {activeTab === 'text' && (
                        <TextInput onAnalyze={(text) => handleAnalyze('text', text)} isLoading={isLoading} />
                    )}
                    {activeTab === 'speech' && (
                        <SpeechInput onAnalyze={(text) => handleAnalyze('speech', text)} isLoading={isLoading} />
                    )}
                </div>

                {/* Results Panel */}
                <div className="space-y-4">
                    {error && (
                        <div className="glass-card p-4 border-red-500/30 bg-red-500/5 animate-fade-in">
                            <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <div className="flex-1">
                                    <p className="text-red-400 font-medium text-sm">Analysis Failed</p>
                                    {canRetry && (
                                        <button
                                            onClick={handleRetry}
                                            disabled={isLoading}
                                            className="mt-3 px-4 py-1.5 text-xs font-medium rounded-lg 
                                                bg-primary-500/20 text-primary-400 border border-primary-500/30 
                                                hover:bg-primary-500/30 transition-all duration-200"
                                            id="retry-analysis-btn"
                                        >
                                            ↻ Retry Analysis
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {isLoading && !nutritionData && (
                        <div className="glass-card p-12 text-center animate-fade-in">
                            <div className="spinner mx-auto mb-4"></div>
                            <p className="text-primary-400 font-medium">Analyzing nutrition data...</p>
                            <p className="text-dark-500 text-sm mt-1">This may take a few seconds</p>
                        </div>
                    )}

                    {nutritionData && (
                        <NutritionCard
                            data={nutritionData}
                            onSave={isAuthenticated ? handleSave : null}
                            onDiscard={handleDiscard}
                        />
                    )}

                    {!nutritionData && !isLoading && !error && (
                        <div className="glass-card p-12 text-center animate-fade-in">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                                <svg className="w-10 h-10 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-dark-300 mb-1">Nutrition Results</h3>
                            <p className="text-dark-500 text-sm">Upload an image, type, or speak to analyze food nutrition</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-950 flex items-center justify-center transition-colors duration-500">
            <div className="spinner"></div>
        </div>
    );
    return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function BottomNav() {
    const location = useLocation();
    const hideOn = ['/login', '/signup', '/forgot-password', '/onboarding'];
    // Hide bottom nav on landing page for unauthenticated users
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated && (location.pathname === '/' || location.pathname === '/try')) return null;
    if (hideOn.some(path => location.pathname.startsWith(path))) return null;

    const navItems = [
        { title: 'Home', to: '/', icon: <IoHomeOutline />, gradientFrom: '#56CCF2', gradientTo: '#2F80ED' },
        { title: 'Dashboard', to: '/dashboard', icon: <IoPieChartOutline />, gradientFrom: '#80FF72', gradientTo: '#7EE8FA' },
        { title: 'Raju', to: '/chatbot', icon: <IoChatbubblesOutline />, gradientFrom: '#a955ff', gradientTo: '#ea51ff' },
        { title: 'Profile', to: '/profile', icon: <IoPersonOutline />, gradientFrom: '#FF9966', gradientTo: '#FF5E62' },
        { title: 'Entry', to: '/landing', icon: <IoCompassOutline />, gradientFrom: '#ffa9c6', gradientTo: '#f434e2' }
    ];

    return (
        <nav className="fixed bottom-4 left-0 right-0 z-50 pointer-events-none">
            <GradientMenu items={navItems} />
        </nav>
    );
}

function AppContent() {
    const { isAuthenticated } = useAuth();

    return (
        <>
            <CustomCursor />
            <Routes>
                <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
                <Route path="/signup" element={isAuthenticated ? <Navigate to="/" replace /> : <Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                <Route path="/" element={
                     isAuthenticated ? <AppLayout><HomePage /></AppLayout> : <Landing />
                } />
                <Route path="/landing" element={<Landing />} />
                <Route path="/try" element={<AppLayout><HomePage /></AppLayout>} />
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <AppLayout><Dashboard /></AppLayout>
                    </ProtectedRoute>
                } />
                <Route path="/chatbot" element={
                    <ProtectedRoute>
                        <AppLayout><Chatbot /></AppLayout>
                    </ProtectedRoute>
                } />
                <Route path="/profile" element={
                    <ProtectedRoute>
                        <AppLayout><Profile /></AppLayout>
                    </ProtectedRoute>
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <BottomNav />
        </>
    );
}

function AppLayout({ children }) {
    const { user } = useAuth();
    const location = useLocation();

    const layoutContent = (
        <div className="min-h-screen bg-transparent transition-colors duration-500">
                <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative max-w-4xl mx-auto px-4 py-6 z-10 transition-all pointer-events-none">
                    {/* Header */}
                <header className="flex items-center justify-between mb-6 animate-fade-in pointer-events-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 
                                      flex items-center justify-center text-xl shadow-lg shadow-primary-500/20 text-white">
                            <IoNutritionOutline />
                        </div>
                        <div>
                            <h1 className="text-xl font-black bg-gradient-to-r from-primary-400 via-emerald-400 to-accent-400 
                                         bg-clip-text text-transparent">
                                NutriVision
                            </h1>
                            <p className="text-dark-500 dark:text-dark-500 text-xs mt-1 font-medium">
                                {user?.name ? `Hey, ${user.name}!` : 'AI Nutrition Analyzer'}
                            </p>
                        </div>
                    </div>
                    <div>
                        <ThemeToggle />
                    </div>
                </header>

                <main className="pointer-events-auto">
                    {children}
                </main>

                {/* Footer */}
                {location.pathname !== '/chatbot' && (
                <footer className="text-center mt-12 pt-6 pb-20 border-t border-white/5">
                    <p className="text-dark-600 text-xs">
                        NutriVision © 2026 • Made by Shiva Karnati • For informational purposes only
                    </p>
                    </footer>
                )}
            </div>
        </div>
    );

    if (location.pathname === '/chatbot') {
        return layoutContent;
    }

    return <TubesBackground>{layoutContent}</TubesBackground>;
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
