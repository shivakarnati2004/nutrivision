import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import NutriScrollCanvas from '../components/NutriScrollCanvas';
import ThemeToggle from '../components/ThemeToggle';
import GlobeScrollDemo from '../components/ui/landing-page';

export default function Landing() {
    return (
        <div className="relative min-h-screen overflow-x-hidden bg-gray-50 dark:bg-dark-950 transition-colors duration-500">
            <header className="fixed top-0 left-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-white/5 backdrop-blur-md border-b border-white/10">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary-500/30">N</div>
                    <span className="text-xl font-black tracking-tighter text-dark-900 dark:text-white">NUTRIVISION</span>
                </div>
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <Link to="/login" className="hidden sm:block text-sm font-bold text-dark-700 dark:text-dark-300 hover:text-primary-500 transition-colors uppercase tracking-widest">Login</Link>
                    <Link to="/signup">
                        <button className="px-6 py-2.5 bg-primary-500 text-white rounded-lg text-xs font-bold tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary-500/20 active:scale-95">
                            SIGN UP
                        </button>
                    </Link>
                </div>
            </header>

            {/* ── 1. Hero 3D Scroll Section ── */}
            <div className="relative w-full h-[250vh]">
                <NutriScrollCanvas />
                
                {/* Hero Overlay Content */}
                <div className="sticky top-0 w-full h-screen flex items-center justify-center pointer-events-none">
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="text-center px-4 max-w-4xl"
                    >
                        <h1 className="text-6xl md:text-9xl font-black tracking-tighter text-dark-900 dark:text-white mb-6">
                            FUTURE OF <span className="text-primary-500">HEALTH</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-dark-500 dark:text-dark-400 font-medium mb-10">
                            The world's most advanced AI nutrition companion.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center pointer-events-auto">
                            <Link to="/signup">
                                <button className="px-10 py-5 bg-primary-500 text-white rounded-full text-sm font-bold tracking-widest hover:scale-105 shadow-2xl active:scale-95">
                                    START NOW
                                </button>
                            </Link>
                            <Link to="/try">
                                <button className="px-10 py-5 rounded-full text-sm font-bold tracking-widest hover:scale-105 border-2 border-dark-900/10 dark:border-white/10 text-dark-700 dark:text-white hover:border-primary-500 transition-all">
                                    TRY IT OUT
                                </button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ── 2. Global ScrollGlobe Section ── */}
            <div className="relative z-20">
                <GlobeScrollDemo />
            </div>

            {/* ── 3. Developer Profile & Footer ── */}
            <section className="relative z-20 py-24 px-6 bg-white dark:bg-dark-900/50">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-4xl md:text-6xl font-black text-dark-900 dark:text-white mb-6">
                                THE <span className="text-primary-500">AUTHOR</span>
                            </h2>
                            <p className="text-xl text-dark-500 dark:text-dark-400 mb-8">
                                Built with passion for technology and health by a full-stack visionary.
                            </p>
                        </div>
                        
                        <motion.div 
                            whileHover={{ y: -5 }}
                            className="glass-card p-8 border-primary-500/20 bg-primary-500/5 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 blur-3xl rounded-full" />
                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="w-24 h-24 bg-primary-500 rounded-full flex items-center justify-center text-white text-4xl font-black mb-6 shadow-2xl">
                                    SK
                                </div>
                                <h3 className="text-3xl font-black text-dark-900 dark:text-white mb-1">Shiva Karnati</h3>
                                <p className="text-primary-500 font-bold tracking-widest text-sm uppercase mb-6">Full-Stack Developer</p>
                                
                                <div className="space-y-3 w-full">
                                    <a href="mailto:shivakarnati2004@gmail.com" className="flex items-center justify-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-dark-700 dark:text-dark-300">
                                        <span>📧</span> shivakarnati2004@gmail.com
                                    </a>
                                    <div className="flex gap-3">
                                        <a href="https://github.com/shivakarnati2004" target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-dark-700 dark:text-dark-300">
                                            GitHub
                                        </a>
                                        <a href="https://www.linkedin.com/in/shiva-karnati123/" target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-dark-700 dark:text-dark-300">
                                            LinkedIn
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                    
                    <footer className="mt-24 pt-8 border-t border-dark-900/10 dark:border-white/10 text-center">
                        <p className="text-dark-400 text-sm font-medium">© 2026 NutriVision. All rights reserved. Precision Nutrition for the Modern Age.</p>
                        <p className="text-dark-400 text-xs mt-2 uppercase tracking-widest opacity-50">
                            Deployed at <a href="https://nutrivision-wnts.onrender.com" className="text-primary-500 hover:underline">nutrivision-wnts.onrender.com</a>
                        </p>
                    </footer>
                </div>
            </section>
        </div>
    );
}
