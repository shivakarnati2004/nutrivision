import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signupRequest, verifyOTP } from '../services/api';
import { useAuth } from '../context/AuthContext';

const exerciseLevels = [
    { id: 'never', label: 'Never', icon: '🛋️', desc: 'No regular exercise' },
    { id: 'low', label: 'Low', icon: '🚶', desc: '1-2 times per week' },
    { id: 'moderate', label: 'Moderate', icon: '🏃', desc: '3-4 times per week' },
    { id: 'high', label: 'High', icon: '💪', desc: '5+ times per week' },
];

const goalOptions = [
    { id: 'lose_weight', label: 'Lose Weight', icon: '⬇️', desc: 'Burn fat, reduce body weight' },
    { id: 'gain_muscle', label: 'Gain Muscle', icon: '💪', desc: 'Build strength and mass' },
    { id: 'maintain', label: 'Maintain Weight', icon: '⚖️', desc: 'Stay at current weight' },
    { id: 'eat_healthier', label: 'Eat Healthier', icon: '🥗', desc: 'Improve diet quality' },
    { id: 'increase_energy', label: 'Increase Energy', icon: '⚡', desc: 'Feel more energetic' },
    { id: 'lose_fat', label: 'Lose Body Fat', icon: '🔥', desc: 'Reduce fat percentage' },
];

export default function Signup() {
    const [step, setStep] = useState(1); // 1: name/gender, 2: body, 3: exercise, 4: goals, 5: email+OTP, 6: password
    const [formData, setFormData] = useState({
        name: '', gender: '',
        height_cm: '', weight_kg: '', age: '',
        exercise_level: '',
        health_goals: [], health_conditions: '',
        email: '', otp: '', password: '', confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const calculateBMI = () => {
        const { weight_kg, height_cm } = formData;
        if (!weight_kg || !height_cm) return null;
        const h = height_cm / 100;
        return (weight_kg / (h * h)).toFixed(1);
    };

    const calculateBMR = () => {
        const { weight_kg, height_cm, age, gender } = formData;
        if (!weight_kg || !height_cm || !age) return null;
        // Mifflin-St Jeor Equation
        if (gender === 'female') {
            return Math.round(10 * weight_kg + 6.25 * height_cm - 5 * age - 161);
        }
        return Math.round(10 * weight_kg + 6.25 * height_cm - 5 * age + 5);
    };

    const calculateTDEE = () => {
        const bmr = calculateBMR();
        if (!bmr) return null;
        const multipliers = { never: 1.2, low: 1.375, moderate: 1.55, high: 1.725 };
        return Math.round(bmr * (multipliers[formData.exercise_level] || 1.2));
    };

    const getBMICategory = (bmi) => {
        if (!bmi) return { label: '', color: '', advice: '' };
        const b = parseFloat(bmi);
        if (b < 18.5) return { label: 'Underweight', color: 'text-yellow-400', advice: 'Consider increasing calorie intake' };
        if (b < 25) return { label: 'Normal', color: 'text-green-400', advice: 'Great! Maintain your healthy lifestyle' };
        if (b < 30) return { label: 'Overweight', color: 'text-orange-400', advice: 'A moderate calorie deficit may help' };
        return { label: 'Obese', color: 'text-red-400', advice: 'Consult a healthcare professional' };
    };

    const toggleGoal = (id) => {
        setFormData(prev => ({
            ...prev,
            health_goals: prev.health_goals.includes(id)
                ? prev.health_goals.filter(g => g !== id)
                : [...prev.health_goals, id]
        }));
    };

    const handleSendOTP = async () => {
        if (!formData.email) { setError('Email is required'); return; }
        setLoading(true);
        setError('');
        try {
            const result = await signupRequest(formData.email);
            if (result.success) { setOtpSent(true); setStep(6); }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAccount = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
        if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return; }
        setLoading(true);
        setError('');
        try {
            const result = await verifyOTP(formData.email, formData.otp, formData.password, {
                name: formData.name,
                gender: formData.gender,
                height_cm: parseFloat(formData.height_cm) || null,
                weight_kg: parseFloat(formData.weight_kg) || null,
                age: parseInt(formData.age) || null,
                exercise_level: formData.exercise_level,
                health_goals: formData.health_goals.map(id => goalOptions.find(g => g.id === id)?.label || id).join(', '),
                health_conditions: formData.health_conditions,
            });
            if (result.success) {
                login(result.token, result.user);
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Account creation failed');
        } finally {
            setLoading(false);
        }
    };

    const bmi = calculateBMI();
    const bmiInfo = getBMICategory(bmi);
    const bmr = calculateBMR();
    const tdee = calculateTDEE();

    const canProceed = {
        1: formData.name.trim().length > 0,
        2: true,
        3: true,
        4: true,
        5: formData.email.trim().length > 0,
    };

    const totalSteps = 6;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-950 bg-grid-pattern flex items-center justify-center px-4 py-6">
            <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative w-full max-w-lg animate-fade-in">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-xl shadow-lg shadow-primary-500/20">🥗</div>
                        <h1 className="text-3xl font-black bg-gradient-to-r from-primary-400 via-emerald-400 to-accent-400 bg-clip-text text-transparent">NutriVision</h1>
                    </div>
                    <p className="text-dark-400 text-sm">
                        {step <= 4 ? "Let's personalize your experience" : step === 5 ? 'Verify your email' : 'Set your password'}
                    </p>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-1.5 mb-6">
                    {Array.from({ length: totalSteps }, (_, i) => (
                        <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/10">
                            <div className={`h-full rounded-full transition-all duration-500 ${step > i ? 'bg-gradient-to-r from-primary-500 to-accent-500 w-full' : step === i + 1 ? 'bg-primary-500/50 w-1/2' : 'w-0'}`}></div>
                        </div>
                    ))}
                    <span className="text-dark-500 text-xs ml-2">{step}/{totalSteps}</span>
                </div>

                <div className="glass-card p-6 sm:p-8">
                    {/* Step 1: Name & Gender */}
                    {step === 1 && (
                        <div className="space-y-5 animate-fade-in">
                            <div className="text-center"><span className="text-3xl">👋</span><h2 className="text-lg font-bold text-dark-900 dark:text-white mt-2">What's your name?</h2></div>
                            <div>
                                <label className="text-sm text-dark-600 dark:text-dark-300 mb-1.5 block">Full Name</label>
                                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" placeholder="Enter your name" autoFocus />
                            </div>
                            <div>
                                <label className="text-sm text-dark-600 dark:text-dark-300 mb-2 block">Gender</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['Male', 'Female', 'Other'].map(g => (
                                        <button key={g} onClick={() => setFormData({ ...formData, gender: g.toLowerCase() })}
                                            className={`p-3 rounded-xl border text-sm font-medium transition-all ${formData.gender === g.toLowerCase() ? 'bg-primary-500/20 border-primary-500 text-primary-400' : 'bg-black/5 dark:bg-white/5 border-dark-900/10 dark:border-white/10 text-dark-600 dark:text-dark-400 hover:bg-black/10 dark:hover:bg-white/10'}`}>
                                            {g === 'Male' ? '👨' : g === 'Female' ? '👩' : '🧑'} {g}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Body Measurements */}
                    {step === 2 && (
                        <div className="space-y-5 animate-fade-in">
                            <div className="text-center"><span className="text-3xl">📏</span><h2 className="text-lg font-bold text-dark-900 dark:text-white mt-2">Body Measurements</h2></div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-sm text-dark-600 dark:text-dark-300 mb-1 block">Height (cm)</label>
                                    <input type="number" value={formData.height_cm} onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })} className="input-field text-center" placeholder="170" />
                                </div>
                                <div>
                                    <label className="text-sm text-dark-600 dark:text-dark-300 mb-1 block">Weight (kg)</label>
                                    <input type="number" value={formData.weight_kg} onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })} className="input-field text-center" placeholder="70" />
                                </div>
                                <div>
                                    <label className="text-sm text-dark-600 dark:text-dark-300 mb-1 block">Age</label>
                                    <input type="number" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} className="input-field text-center" placeholder="25" />
                                </div>
                            </div>

                            {bmi && (
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center animate-fade-in">
                                    <p className="text-dark-400 text-xs uppercase tracking-wider mb-1">Your BMI</p>
                                    <p className={`text-4xl font-black ${bmiInfo.color}`}>{bmi}</p>
                                    <p className={`text-sm font-medium ${bmiInfo.color}`}>{bmiInfo.label}</p>
                                    <p className="text-dark-500 text-xs mt-2">{bmiInfo.advice}</p>
                                    <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                                        <div className="h-full rounded-full bg-gradient-to-r from-yellow-500 via-green-500 to-red-500 transition-all duration-500"
                                            style={{ width: `${Math.min((parseFloat(bmi) / 40) * 100, 100)}%` }}></div>
                                    </div>
                                </div>
                            )}

                            {bmr && tdee && (
                                <div className="grid grid-cols-2 gap-3 animate-fade-in">
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                                        <p className="text-dark-500 text-xs uppercase">BMR</p>
                                        <p className="text-xl font-bold text-accent-400">{bmr}</p>
                                        <p className="text-dark-500 text-xs">cal/day at rest</p>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                                        <p className="text-dark-500 text-xs uppercase">TDEE</p>
                                        <p className="text-xl font-bold text-primary-400">{tdee || '—'}</p>
                                        <p className="text-dark-500 text-xs">cal/day active</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Exercise Level */}
                    {step === 3 && (
                        <div className="space-y-5 animate-fade-in">
                            <div className="text-center"><span className="text-3xl">🏋️</span><h2 className="text-lg font-bold text-dark-900 dark:text-white mt-2">How often do you exercise?</h2></div>
                            <div className="space-y-2">
                                {exerciseLevels.map(level => (
                                    <button key={level.id} onClick={() => setFormData({ ...formData, exercise_level: level.id })}
                                        className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all ${formData.exercise_level === level.id ? 'bg-primary-500/20 border-primary-500 text-primary-700 dark:text-white' : 'bg-black/5 dark:bg-white/5 border-dark-900/10 dark:border-white/10 text-dark-600 dark:text-dark-400 hover:bg-black/10 dark:hover:bg-white/10'}`}>
                                        <span className="text-2xl">{level.icon}</span>
                                        <div className="text-left"><p className="font-semibold">{level.label}</p><p className="text-xs text-dark-500">{level.desc}</p></div>
                                    </button>
                                ))}
                            </div>
                            {tdee && (
                                <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-3 text-center">
                                    <p className="text-primary-400 text-sm">Your daily calorie need: <strong>{tdee} kcal</strong></p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 4: Health Goals */}
                    {step === 4 && (
                        <div className="space-y-5 animate-fade-in">
                            <div className="text-center"><span className="text-3xl">🎯</span><h2 className="text-lg font-bold text-dark-900 dark:text-white mt-2">What are your goals?</h2></div>
                            <div className="grid grid-cols-2 gap-2">
                                {goalOptions.map(goal => (
                                    <button key={goal.id} onClick={() => toggleGoal(goal.id)}
                                        className={`p-3 rounded-xl border text-left transition-all ${formData.health_goals.includes(goal.id) ? 'bg-primary-500/20 border-primary-500 text-primary-700 dark:text-white' : 'bg-black/5 dark:bg-white/5 border-dark-900/10 dark:border-white/10 text-dark-600 dark:text-dark-400 hover:bg-black/10 dark:hover:bg-white/10'}`}>
                                        <span className="text-lg">{goal.icon}</span>
                                        <p className="text-sm font-medium mt-1">{goal.label}</p>
                                        <p className="text-xs text-dark-500 mt-0.5">{goal.desc}</p>
                                    </button>
                                ))}
                            </div>
                            <div>
                                <label className="text-sm text-dark-600 dark:text-dark-300 mb-1 block">Health conditions (optional)</label>
                                <textarea value={formData.health_conditions} onChange={(e) => setFormData({ ...formData, health_conditions: e.target.value })}
                                    className="input-field min-h-[60px] resize-none" placeholder="e.g., diabetes, allergies..." />
                            </div>

                            {/* Calorie recommendation based on goals */}
                            {tdee && formData.health_goals.length > 0 && (
                                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                                    <p className="text-dark-400 text-xs uppercase tracking-wider">Recommended Daily Intake</p>
                                    {formData.health_goals.includes('lose_weight') || formData.health_goals.includes('lose_fat') ? (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-dark-300">For weight/fat loss</span>
                                            <span className="text-lg font-bold text-orange-400">{tdee - 500} kcal</span>
                                        </div>
                                    ) : null}
                                    {formData.health_goals.includes('gain_muscle') ? (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-dark-300">For muscle gain</span>
                                            <span className="text-lg font-bold text-blue-400">{tdee + 300} kcal</span>
                                        </div>
                                    ) : null}
                                    {formData.health_goals.includes('maintain') ? (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-dark-300">To maintain weight</span>
                                            <span className="text-lg font-bold text-green-400">{tdee} kcal</span>
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 5: Email + Send OTP */}
                    {step === 5 && (
                        <div className="space-y-5 animate-fade-in">
                            <div className="text-center"><span className="text-3xl">📧</span><h2 className="text-lg font-bold text-dark-900 dark:text-white mt-2">Create Your Account</h2></div>
                            <div>
                                <label className="text-sm text-dark-600 dark:text-dark-300 mb-1 block">Email Address</label>
                                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="input-field" placeholder="your@email.com" autoFocus />
                                <p className="text-dark-500 text-xs mt-2">We'll send a verification code to this email</p>
                            </div>
                        </div>
                    )}

                    {/* Step 6: OTP + Password */}
                    {step === 6 && (
                        <form onSubmit={handleCreateAccount} className="space-y-5 animate-fade-in">
                            <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-3 text-center">
                                <p className="text-primary-400 text-sm">OTP sent to <strong>{formData.email}</strong></p>
                            </div>
                            <div>
                                <label className="text-sm text-dark-600 dark:text-dark-300 mb-1 block">Verification Code</label>
                                <input type="text" value={formData.otp} onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                                    className="input-field text-center text-2xl tracking-[0.5em] font-bold" placeholder="000000" maxLength={6} autoFocus />
                            </div>
                            <div>
                                <label className="text-sm text-dark-600 dark:text-dark-300 mb-1 block">Create Password</label>
                                <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="input-field" placeholder="Min. 6 characters" />
                            </div>
                            <div>
                                <label className="text-sm text-dark-600 dark:text-dark-300 mb-1 block">Confirm Password</label>
                                <input type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="input-field" placeholder="Confirm password" />
                            </div>

                            {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3"><p className="text-red-400 text-sm">{error}</p></div>}

                            <button type="submit" disabled={loading || !formData.otp || !formData.password}
                                className={`btn-primary w-full flex items-center justify-center gap-2 ${loading ? 'opacity-50' : ''}`}>
                                {loading ? <><div className="spinner w-5 h-5 !border-2"></div> Creating...</> : '🚀 Create Account'}
                            </button>
                            <button type="button" onClick={handleSendOTP} disabled={loading}
                                className="w-full text-center text-primary-400 text-sm hover:text-primary-300">Resend OTP</button>
                        </form>
                    )}

                    {/* Error */}
                    {step !== 6 && error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mt-4"><p className="text-red-400 text-sm">{error}</p></div>}

                    {/* Navigation */}
                    {step !== 6 && (
                        <div className="flex gap-3 mt-6">
                            {step > 1 && <button onClick={() => { setStep(step - 1); setError(''); }} className="btn-secondary flex-1">← Back</button>}
                            {step < 5 && (
                                <button onClick={() => { if (canProceed[step]) { setStep(step + 1); setError(''); } else setError('Please fill in required fields'); }}
                                    disabled={!canProceed[step]} className={`btn-primary flex-1 ${!canProceed[step] ? 'opacity-50' : ''}`}>
                                    Continue →
                                </button>
                            )}
                            {step === 5 && (
                                <button onClick={handleSendOTP} disabled={loading || !formData.email}
                                    className={`btn-primary flex-1 flex items-center justify-center gap-2 ${loading ? 'opacity-50' : ''}`}>
                                    {loading ? <><div className="spinner w-5 h-5 !border-2"></div> Sending...</> : '📧 Send OTP'}
                                </button>
                            )}
                        </div>
                    )}

                    <div className="mt-5 text-center">
                        <p className="text-dark-500 text-sm">Already have an account? <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign in</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
}
