import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { forgotPasswordRequest, resetPasswordRequest } from '../services/api';

export default function ForgotPassword() {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const result = await forgotPasswordRequest(email);
            if (result.success) {
                setStep(2);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const result = await resetPasswordRequest(email, otp, newPassword);
            if (result.success) {
                setSuccess('Password updated! Redirecting to login...');
                setTimeout(() => navigate('/login'), 2000);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reset password');
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
                            🔐
                        </div>
                        <h1 className="text-3xl font-black text-dark-900 dark:text-white">Reset Password</h1>
                    </div>
                    <p className="text-dark-400 text-sm">We'll send a code to your email to reset your password</p>
                </div>

                <div className="glass-card p-8">
                    {step === 1 && (
                        <form onSubmit={handleSendOTP} className="space-y-5">
                            <div>
                                <label className="text-sm text-dark-600 dark:text-dark-300 mb-1.5 block">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-field"
                                    placeholder="your@email.com"
                                    required
                                    id="forgot-email"
                                />
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                                    <p className="text-red-400 text-sm">{error}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || !email}
                                className={`btn-primary w-full flex items-center justify-center gap-2 ${loading ? 'opacity-50' : ''}`}
                            >
                                {loading ? (
                                    <><div className="spinner w-5 h-5 !border-2"></div> Sending...</>
                                ) : (
                                    '📧 Send Reset Code'
                                )}
                            </button>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleReset} className="space-y-5">
                            <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-3 text-center">
                                <p className="text-primary-400 text-sm">Code sent to <strong>{email}</strong></p>
                            </div>

                            <div>
                                <label className="text-sm text-dark-600 dark:text-dark-300 mb-1.5 block">Verification Code</label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="input-field text-center text-2xl tracking-[0.5em] font-bold"
                                    placeholder="000000"
                                    maxLength={6}
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-sm text-dark-600 dark:text-dark-300 mb-1.5 block">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="input-field"
                                    placeholder="Min. 6 characters"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-sm text-dark-600 dark:text-dark-300 mb-1.5 block">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="input-field"
                                    placeholder="Confirm password"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                                    <p className="text-red-400 text-sm">{error}</p>
                                </div>
                            )}

                            {success && (
                                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
                                    <p className="text-green-400 text-sm">{success}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className={`btn-primary w-full flex items-center justify-center gap-2 ${loading ? 'opacity-50' : ''}`}
                            >
                                {loading ? (
                                    <><div className="spinner w-5 h-5 !border-2"></div> Resetting...</>
                                ) : (
                                    '🔒 Reset Password'
                                )}
                            </button>
                        </form>
                    )}

                    <div className="mt-6 text-center">
                        <Link to="/login" className="text-primary-400 text-sm hover:text-primary-300 transition-colors">
                            ← Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
