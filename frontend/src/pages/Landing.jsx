import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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
      <section className="min-h-[80vh] flex items-center justify-center p-8 md:p-20 bg-gray-100 dark:bg-black transition-colors duration-300">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="grid grid-cols-1 gap-10 max-w-5xl text-center"
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
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/signup">
              <button className="px-10 py-5 bg-primary-500 text-white rounded-full text-sm font-bold tracking-widest hover:scale-105 hover:bg-primary-400 transition-all shadow-2xl shadow-primary-500/20 active:scale-95">
                START YOUR TRANSFORMATION
              </button>
            </Link>
            <Link to="/login">
              <button className="px-10 py-5 rounded-full text-sm font-bold tracking-widest hover:scale-105 transition-all active:scale-95 border-2 border-dark-300 dark:border-white/20 text-dark-700 dark:text-white hover:border-primary-500 hover:text-primary-500">
                GO TO HOME
              </button>
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </main>
  );
}
