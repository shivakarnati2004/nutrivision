import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveOnboarding } from '../services/api';
import { useAuth } from '../context/AuthContext';

const exerciseLevels = [
    { id: 'never', label: 'Never', icon: '🛋️', desc: 'No regular exercise' },
    { id: 'low', label: 'Low', icon: '🚶', desc: '1-2 times per week' },
    { id: 'moderate', label: 'Moderate', icon: '🏃', desc: '3-4 times per week' },
    { id: 'high', label: 'High', icon: '💪', desc: '5+ times per week' },
];

const healthGoalOptions = [
    'Lose weight', 'Gain muscle', 'Maintain weight', 'Eat healthier',
    'Increase energy', 'Better sleep', 'Reduce stress', 'Build endurance',
];

export default function Onboarding() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '', gender: '',
        height_cm: '', weight_kg: '', age: '',
        exercise_level: '',
        health_conditions: '', health_goals: [],
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { updateUser } = useAuth();

    const calculateBMI = () => {
        const { weight_kg, height_cm } = formData;
        if (!weight_kg || !height_cm || height_cm === 0) return null;
        const h = height_cm / 100;
        return (weight_kg / (h * h)).toFixed(1);
    };

    const getBMICategory = (bmi) => {
        if (!bmi) return { label: '', color: '' };
        const b = parseFloat(bmi);
        if (b < 18.5) return { label: 'Underweight', color: 'text-yellow-400' };
        if (b < 25) return { label: 'Normal', color: 'text-green-400' };
        if (b < 30) return { label: 'Overweight', color: 'text-orange-400' };
        return { label: 'Obese', color: 'text-red-400' };
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError('');
        try {
            const data = {
                ...formData,
                height_cm: parseFloat(formData.height_cm) || null,
                weight_kg: parseFloat(formData.weight_kg) || null,
                age: parseInt(formData.age) || null,
                health_goals: formData.health_goals.join(', '),
            };
            const result = await saveOnboarding(data);
            if (result.success) {
                updateUser(result.user);
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save profile');
        } finally {
            setLoading(false);
        }
    };

    const toggleGoal = (goal) => {
        setFormData(prev => ({
            ...prev,
            health_goals: prev.health_goals.includes(goal)
                ? prev.health_goals.filter(g => g !== goal)
                : [...prev.health_goals, goal]
        }));
    };

    const bmi = calculateBMI();
    const bmiInfo = getBMICategory(bmi);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-950 bg-grid-pattern flex items-center justify-center px-4 py-8">
            <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative w-full max-w-lg animate-fade-in">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-black text-dark-900 dark:text-white mb-2">Let's Set Up Your Profile</h1>
                    <p className="text-dark-400 text-sm">Help us personalize your nutrition experience</p>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-2 mb-8">
                    {[1, 2, 3, 4].map(s => (
                        <div key={s} className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/10">
                            <div className={`h-full rounded-full transition-all duration-500 ${step >= s ? 'bg-gradient-to-r from-primary-500 to-accent-500 w-full' : 'w-0'}`}></div>
                        </div>
                    ))}
                </div>

                <div className="glass-card p-8">
                    {/* Step 1: Name & Gender */}
                    {step === 1 && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="text-center mb-4">
                                <span className="text-4xl">👋</span>
                                <h2 className="text-lg font-bold text-dark-900 dark:text-white mt-2">What's your name?</h2>
                            </div>
                            <div>
                                <label className="text-sm text-dark-600 dark:text-dark-300 mb-1.5 block">Full Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input-field"
                                    placeholder="Enter your name"
                                    id="onboard-name"
                                />
                            </div>
                            <div>
                                <label className="text-sm text-dark-600 dark:text-dark-300 mb-3 block">Gender</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['Male', 'Female', 'Other'].map(g => (
                                        <button
                                            key={g}
                                            onClick={() => setFormData({ ...formData, gender: g.toLowerCase() })}
                                            className={`p-3 rounded-xl border text-sm font-medium transition-all duration-200 ${formData.gender === g.toLowerCase()
                                                ? 'bg-primary-500/20 border-primary-500 text-primary-400'
                                                : 'bg-black/5 dark:bg-white/5 border-dark-900/10 dark:border-white/10 text-dark-600 dark:text-dark-400 hover:bg-black/10 dark:hover:bg-white/10'}`}
                                        >
                                            {g === 'Male' ? '👨' : g === 'Female' ? '👩' : '🧑'} {g}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button
                                onClick={() => setStep(2)}
                                disabled={!formData.name}
                                className={`btn-primary w-full ${!formData.name ? 'opacity-50' : ''}`}
                            >
                                Continue →
                            </button>
                        </div>
                    )}

                    {/* Step 2: Height, Weight, Age + BMI */}
                    {step === 2 && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="text-center mb-4">
                                <span className="text-4xl">📏</span>
                                <h2 className="text-lg font-bold text-dark-900 dark:text-white mt-2">Body Measurements</h2>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-sm text-dark-600 dark:text-dark-300 mb-1.5 block">Height (cm)</label>
                                    <input
                                        type="number"
                                        value={formData.height_cm}
                                        onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                                        className="input-field text-center"
                                        placeholder="170"
                                        id="onboard-height"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-dark-600 dark:text-dark-300 mb-1.5 block">Weight (kg)</label>
                                    <input
                                        type="number"
                                        value={formData.weight_kg}
                                        onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                                        className="input-field text-center"
                                        placeholder="70"
                                        id="onboard-weight"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-dark-600 dark:text-dark-300 mb-1.5 block">Age</label>
                                    <input
                                        type="number"
                                        value={formData.age}
                                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                        className="input-field text-center"
                                        placeholder="25"
                                        id="onboard-age"
                                    />
                                </div>
                            </div>

                            {/* Real-time BMI Display */}
                            {bmi && (
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center animate-fade-in">
                                    <p className="text-dark-400 text-xs uppercase tracking-wider mb-2">Your BMI</p>
                                    <p className={`text-4xl font-black ${bmiInfo.color}`}>{bmi}</p>
                                    <p className={`text-sm font-medium mt-1 ${bmiInfo.color}`}>{bmiInfo.label}</p>
                                    <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-yellow-500 via-green-500 to-red-500 transition-all duration-500"
                                            style={{ width: `${Math.min((parseFloat(bmi) / 40) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between text-xs text-dark-500 mt-1">
                                        <span>15</span>
                                        <span>18.5</span>
                                        <span>25</span>
                                        <span>30</span>
                                        <span>40</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button onClick={() => setStep(1)} className="btn-secondary flex-1">← Back</button>
                                <button onClick={() => setStep(3)} className="btn-primary flex-1">Continue →</button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Exercise Level */}
                    {step === 3 && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="text-center mb-4">
                                <span className="text-4xl">🏋️</span>
                                <h2 className="text-lg font-bold text-dark-900 dark:text-white mt-2">How often do you exercise?</h2>
                            </div>
                            <div className="space-y-3">
                                {exerciseLevels.map(level => (
                                    <button
                                        key={level.id}
                                        onClick={() => setFormData({ ...formData, exercise_level: level.id })}
                                        className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all duration-200 ${formData.exercise_level === level.id
                                            ? 'bg-primary-500/20 border-primary-500 text-primary-700 dark:text-white'
                                            : 'bg-black/5 dark:bg-white/5 border-dark-900/10 dark:border-white/10 text-dark-600 dark:text-dark-400 hover:bg-black/10 dark:hover:bg-white/10'}`}
                                    >
                                        <span className="text-2xl">{level.icon}</span>
                                        <div className="text-left">
                                            <p className="font-semibold">{level.label}</p>
                                            <p className="text-xs text-dark-500">{level.desc}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setStep(2)} className="btn-secondary flex-1">← Back</button>
                                <button onClick={() => setStep(4)} className="btn-primary flex-1">Continue →</button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Health Goals */}
                    {step === 4 && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="text-center mb-4">
                                <span className="text-4xl">🎯</span>
                                <h2 className="text-lg font-bold text-dark-900 dark:text-white mt-2">What are your health goals?</h2>
                                <p className="text-dark-400 text-sm mt-1">Select all that apply</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {healthGoalOptions.map(goal => (
                                    <button
                                        key={goal}
                                        onClick={() => toggleGoal(goal)}
                                        className={`p-3 rounded-xl border text-sm transition-all duration-200 ${formData.health_goals.includes(goal)
                                            ? 'bg-primary-500/20 border-primary-500 text-primary-400'
                                            : 'bg-black/5 dark:bg-white/5 border-dark-900/10 dark:border-white/10 text-dark-600 dark:text-dark-400 hover:bg-black/10 dark:hover:bg-white/10'}`}
                                    >
                                        {formData.health_goals.includes(goal) ? '✓ ' : ''}{goal}
                                    </button>
                                ))}
                            </div>

                            <div>
                                <label className="text-sm text-dark-600 dark:text-dark-300 mb-1.5 block">Any health conditions? (optional)</label>
                                <textarea
                                    value={formData.health_conditions}
                                    onChange={(e) => setFormData({ ...formData, health_conditions: e.target.value })}
                                    className="input-field min-h-[80px] resize-none"
                                    placeholder="e.g., diabetes, allergies, etc."
                                />
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                                    <p className="text-red-400 text-sm">{error}</p>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button onClick={() => setStep(3)} className="btn-secondary flex-1">← Back</button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className={`btn-primary flex-1 flex items-center justify-center gap-2 ${loading ? 'opacity-50' : ''}`}
                                >
                                    {loading ? (
                                        <><div className="spinner w-5 h-5 !border-2"></div> Saving...</>
                                    ) : (
                                        '🚀 Get Started!'
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
