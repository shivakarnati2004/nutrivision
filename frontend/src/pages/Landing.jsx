import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { IoMailOutline, IoLogoGithub, IoLogoLinkedin } from 'react-icons/io5';
import NutriScrollCanvas from '../components/NutriScrollCanvas';
import ThemeToggle from '../components/ThemeToggle';

export default function Landing() {
  return (
    <main className="min-h-screen font-sans bg-[#ededed] dark:bg-dark-950 transition-colors duration-300 relative">

      {/* ── Fixed Navbar ── */}
      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
        className="fixed top-0 w-full px-5 py-4 md:px-8 md:py-5 flex justify-between items-center z-40"
      >
        <span className="font-black tracking-tighter text-2xl text-dark-900 dark:text-white drop-shadow-md">
          NV.
        </span>
        <div className="flex items-center gap-4 md:gap-8">
          <ThemeToggle />
          <Link
            to="/login"
            className="text-xs tracking-widest uppercase font-bold text-dark-700 dark:text-white/80 hover:text-primary-500 transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="text-xs tracking-widest uppercase font-bold text-primary-600 dark:text-primary-400 hover:text-primary-500 transition-colors"
          >
            Join
          </Link>
        </div>
      </motion.nav>

      {/* ── Scrollytelling Canvas ── */}
      <NutriScrollCanvas />

      {/* ── Footer Section — appears right after animation ── */}
      <section className="min-h-[80vh] flex flex-col items-center justify-center p-8 md:p-20 bg-gray-100 dark:bg-black transition-colors duration-300 relative overflow-hidden">
        
        {/* Abstract Background Glows for Developer Card */}
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="grid grid-cols-1 gap-10 max-w-5xl text-center z-10"
        >
          <p className="text-3xl md:text-5xl lg:text-6xl leading-tight font-black tracking-tighter text-dark-900 dark:text-white">
            We don't just see food.<br />
            <span className="text-dark-600 dark:text-dark-400 font-light block mt-3 text-2xl md:text-4xl lg:text-5xl">
              We see the data that fuels your future.
            </span>
          </p>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center w-full px-4 sm:px-0"
          >
            <Link to="/signup" className="w-full sm:w-auto">
              <button className="w-full px-6 py-4 md:px-10 md:py-5 bg-primary-500 text-white rounded-full text-xs md:text-sm font-bold tracking-widest hover:scale-105 hover:bg-primary-400 transition-all shadow-2xl shadow-primary-500/20 active:scale-95">
                START YOUR TRANSFORMATION
              </button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <button className="w-full px-6 py-4 md:px-10 md:py-5 rounded-full text-xs md:text-sm font-bold tracking-widest hover:scale-105 transition-all active:scale-95 border-2 border-dark-300 dark:border-white/20 text-dark-700 dark:text-white hover:border-primary-500 hover:text-primary-500">
                GO TO HOME
              </button>
            </Link>
          </motion.div>
        </motion.div>

        {/* ── Developer Profile Card ── */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-24 z-10 w-full max-w-md"
        >
          <div className="relative group">
            {/* Animated border gradient */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 rounded-3xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-gradient-x"></div>
            
            {/* Glass Card */}
            <div className="relative flex flex-col items-center bg-white/60 dark:bg-dark-900/60 backdrop-blur-2xl rounded-3xl p-6 md:p-8 mx-4 md:mx-0 border border-white/20 shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-400/10 rounded-full blur-2xl"></div>
              
              <div className="relative mb-5">
                <div className="w-24 h-24 rounded-full border-4 border-white/10 overflow-hidden bg-gradient-to-br from-primary-400/20 to-accent-400/20 flex items-center justify-center p-1 shadow-inner">
                  <div className="w-full h-full bg-dark-900 dark:bg-black rounded-full flex items-center justify-center text-4xl shadow-xl">
                    👨‍💻
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white text-[10px] font-bold px-3 py-1 rounded-full border-2 border-white dark:border-dark-900 shadow-md">
                  DEV
                </div>
              </div>

              <h3 className="text-2xl font-black text-dark-900 dark:text-white tracking-tight mb-1">
                Shiva Karnati
              </h3>
              <p className="text-primary-600 dark:text-primary-400 font-semibold tracking-wider text-sm uppercase mb-6">
                Full-Stack Developer
              </p>

              <div className="flex gap-4">
                <a href="mailto:shivakarnati2004@gmail.com" 
                   className="flex items-center justify-center w-12 h-12 rounded-2xl bg-dark-100 dark:bg-dark-800 text-dark-600 dark:text-dark-300 hover:bg-primary-500 hover:text-white hover:-translate-y-1 transition-all duration-300 shadow-sm">
                  <IoMailOutline className="text-xl" />
                </a>
                <a href="https://github.com/shivakarnati2004" target="_blank" rel="noreferrer"
                   className="flex items-center justify-center w-12 h-12 rounded-2xl bg-dark-100 dark:bg-dark-800 text-dark-600 dark:text-dark-300 hover:bg-dark-900 dark:hover:bg-white dark:hover:text-black hover:text-white hover:-translate-y-1 transition-all duration-300 shadow-sm">
                  <IoLogoGithub className="text-xl" />
                </a>
                <a href="https://www.linkedin.com/in/shiva-karnati123/" target="_blank" rel="noreferrer"
                   className="flex items-center justify-center w-12 h-12 rounded-2xl bg-dark-100 dark:bg-dark-800 text-dark-600 dark:text-dark-300 hover:bg-[#0A66C2] hover:text-white hover:-translate-y-1 transition-all duration-300 shadow-sm">
                  <IoLogoLinkedin className="text-xl" />
                </a>
              </div>
            </div>
          </div>
        </motion.div>

      </section>
    </main>
  );
}
