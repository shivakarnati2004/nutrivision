import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!email || !password) return;
        setLoading(true);
        setError('');

        try {
            const result = await loginRequest(email, password);
            if (result.success) {
                login(result.token, result.user);
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-950 bg-grid-pattern flex items-center justify-center px-4">
            <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative w-full max-w-md animate-fade-in">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 
                                      flex items-center justify-center text-2xl shadow-lg shadow-primary-500/20">
                            🥗
                        </div>
                        <h1 className="text-4xl font-black bg-gradient-to-r from-primary-400 via-emerald-400 to-accent-400 
                                     bg-clip-text text-transparent">
                            NutriVision
                        </h1>
                    </div>
                    <p className="text-dark-400 text-sm">Welcome back! Sign in to your account</p>
                </div>

                <div className="glass-card p-8">
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="text-sm text-dark-600 dark:text-dark-300 mb-1.5 block">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field"
                                placeholder="your@email.com"
                                required
                                id="login-email"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-dark-600 dark:text-dark-300 mb-1.5 block">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field"
                                placeholder="Enter your password"
                                required
                                id="login-password"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !email || !password}
                            className={`btn-primary w-full flex items-center justify-center gap-2 ${loading ? 'opacity-50' : ''}`}
                            id="login-btn"
                        >
                            {loading ? (
                                <><div className="spinner w-5 h-5 !border-2"></div> Signing in...</>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 space-y-3 text-center">
                        <Link to="/forgot-password" className="text-primary-400 text-sm hover:text-primary-300 transition-colors">
                            Forgot password?
                        </Link>
                        <p className="text-dark-500 text-sm">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
