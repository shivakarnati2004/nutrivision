import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile, getStats } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
    const { user, logout, updateUser } = useAuth();
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const [formData, setFormData] = useState({});
    const [allTimeStats, setAllTimeStats] = useState(null);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        try {
            const [profileRes, statsRes] = await Promise.all([
                getProfile(),
                getStats(''),
            ]);
            if (profileRes.success) { setProfileData(profileRes.user); setFormData(profileRes.user); }
            if (statsRes.success) setAllTimeStats(statsRes.data);
        } catch (err) { console.error('Profile fetch error:', err); }
    };

    const handleSave = async () => {
        setLoading(true); setError(''); setSuccess('');
        try {
            const result = await updateProfile({
                name: formData.name, gender: formData.gender,
                height_cm: parseFloat(formData.height_cm) || null,
                weight_kg: parseFloat(formData.weight_kg) || null,
                age: parseInt(formData.age) || null,
                exercise_level: formData.exercise_level,
                health_conditions: formData.health_conditions,
                health_goals: formData.health_goals,
            });
            if (result.success) {
                setProfileData(result.user); updateUser(result.user);
                setEditing(false); setSuccess('Profile updated!');
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update profile');
        } finally { setLoading(false); }
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    // Calculations
    const calcBMR = (p) => {
        if (!p?.weight_kg || !p?.height_cm || !p?.age) return null;
        return p.gender === 'female'
            ? Math.round(10 * p.weight_kg + 6.25 * p.height_cm - 5 * p.age - 161)
            : Math.round(10 * p.weight_kg + 6.25 * p.height_cm - 5 * p.age + 5);
    };

    const calcTDEE = (p) => {
        const bmr = calcBMR(p);
        if (!bmr) return null;
        const m = { never: 1.2, low: 1.375, moderate: 1.55, high: 1.725 };
        return Math.round(bmr * (m[p.exercise_level] || 1.2));
    };

    const getCalTarget = (p, tdee) => {
        if (!tdee) return null;
        const g = (p?.health_goals || '').toLowerCase();
        if (g.includes('lose') || g.includes('fat')) return tdee - 500;
        if (g.includes('muscle') || g.includes('gain')) return tdee + 300;
        return tdee;
    };

    if (!profileData) return <div className="flex items-center justify-center py-16"><div className="spinner"></div></div>;

    const bmr = calcBMR(profileData);
    const tdee = calcTDEE(profileData);
    const calorieTarget = getCalTarget(profileData, tdee);
    const bmiVal = parseFloat(profileData.bmi);

    // Body fat estimation (Navy method simplified)
    const estBodyFat = (() => {
        if (!profileData.bmi || !profileData.age || !profileData.gender) return null;
        const bmi = parseFloat(profileData.bmi);
        if (profileData.gender === 'female') return Math.round((1.20 * bmi + 0.23 * profileData.age - 5.4) * 10) / 10;
        return Math.round((1.20 * bmi + 0.23 * profileData.age - 16.2) * 10) / 10;
    })();

    const leanMass = estBodyFat && profileData.weight_kg ? Math.round(profileData.weight_kg * (1 - estBodyFat / 100) * 10) / 10 : null;
    const fatMass = estBodyFat && profileData.weight_kg ? Math.round(profileData.weight_kg * (estBodyFat / 100) * 10) / 10 : null;

    // Weight projections
    const weeklyDeficit = calorieTarget && tdee ? (tdee - calorieTarget) * 7 : 0;
    const weeklyWeightChange = weeklyDeficit / 7700; // 7700 cal = 1 kg
    const monthlyWeightChange = weeklyWeightChange * 4.3;
    const targetWeight = (() => {
        if (!profileData.height_cm) return null;
        const h = profileData.height_cm / 100;
        return Math.round(22 * h * h * 10) / 10; // BMI 22 = ideal
    })();

    const weeksToTarget = targetWeight && weeklyWeightChange !== 0
        ? Math.abs(Math.round((targetWeight - profileData.weight_kg) / weeklyWeightChange))
        : null;

    // Ideal macros based on goals
    const macroSplit = (() => {
        const g = (profileData.health_goals || '').toLowerCase();
        if (g.includes('muscle') || g.includes('gain')) return { protein: 35, carbs: 40, fat: 25 };
        if (g.includes('lose') || g.includes('fat')) return { protein: 40, carbs: 30, fat: 30 };
        return { protein: 30, carbs: 45, fat: 25 };
    })();

    const proteinNeeded = calorieTarget ? Math.round((calorieTarget * macroSplit.protein / 100) / 4) : null;
    const carbsNeeded = calorieTarget ? Math.round((calorieTarget * macroSplit.carbs / 100) / 4) : null;
    const fatNeeded = calorieTarget ? Math.round((calorieTarget * macroSplit.fat / 100) / 9) : null;

    // Water intake recommendation
    const waterIntake = profileData.weight_kg ? Math.round(profileData.weight_kg * 0.033 * 10) / 10 : null;

    const fields = [
        { label: 'Name', key: 'name', type: 'text', icon: '👤' },
        { label: 'Email', key: 'email', type: 'email', icon: '📧', readonly: true },
        { label: 'Gender', key: 'gender', type: 'select', icon: '⚧', options: ['male', 'female', 'other'] },
        { label: 'Height (cm)', key: 'height_cm', type: 'number', icon: '📏' },
        { label: 'Weight (kg)', key: 'weight_kg', type: 'number', icon: '⚖️' },
        { label: 'Age', key: 'age', type: 'number', icon: '🎂' },
        { label: 'Exercise Level', key: 'exercise_level', type: 'select', icon: '🏋️', options: ['never', 'low', 'moderate', 'high'] },
    ];

    return (
        <div className="space-y-5 animate-fade-in pb-24">
            {/* Profile Header */}
            <div className="glass-card p-6 text-center glow-green">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-3xl mb-3 shadow-lg shadow-primary-500/20">
                    {profileData.gender === 'female' ? '👩' : profileData.gender === 'male' ? '👨' : '🧑'}
                </div>
                <h1 className="text-2xl font-bold text-dark-900 dark:text-white">{profileData.name || 'User'}</h1>
                <p className="text-dark-400 text-sm">{profileData.email}</p>
                <p className="text-dark-500 text-xs mt-1">Member since {new Date(profileData.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            </div>

            {/* Body Composition Card */}
            <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                    Body Composition
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-center p-3 bg-white/5 rounded-xl">
                        <p className="text-dark-500 text-xs">BMI</p>
                        <p className={`text-2xl font-black ${bmiVal < 18.5 ? 'text-yellow-400' : bmiVal < 25 ? 'text-green-400' : bmiVal < 30 ? 'text-orange-400' : 'text-red-400'}`}>
                            {profileData.bmi || '—'}
                        </p>
                        <p className={`text-xs ${bmiVal < 18.5 ? 'text-yellow-400' : bmiVal < 25 ? 'text-green-400' : bmiVal < 30 ? 'text-orange-400' : 'text-red-400'}`}>
                            {bmiVal < 18.5 ? 'Underweight' : bmiVal < 25 ? 'Normal' : bmiVal < 30 ? 'Overweight' : 'Obese'}
                        </p>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-xl">
                        <p className="text-dark-500 text-xs">Body Fat</p>
                        <p className="text-2xl font-black text-orange-400">{estBodyFat || '—'}%</p>
                        <p className="text-dark-600 text-xs">{fatMass ? `${fatMass} kg fat` : ''}</p>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-xl">
                        <p className="text-dark-500 text-xs">Lean Mass</p>
                        <p className="text-2xl font-black text-blue-400">{leanMass || '—'}</p>
                        <p className="text-dark-600 text-xs">kg</p>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-xl">
                        <p className="text-dark-500 text-xs">Ideal Weight</p>
                        <p className="text-2xl font-black text-green-400">{targetWeight || '—'}</p>
                        <p className="text-dark-600 text-xs">kg (BMI 22)</p>
                    </div>
                </div>
            </div>

            {/* Energy & Calories Card */}
            <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent-500"></span>
                    Energy & Calorie Needs
                </h3>
                <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-3 bg-white/5 rounded-xl">
                        <p className="text-dark-500 text-xs">BMR</p>
                        <p className="text-xl font-bold text-accent-400">{bmr || '—'}</p>
                        <p className="text-dark-600 text-xs">cal at rest</p>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-xl">
                        <p className="text-dark-500 text-xs">TDEE</p>
                        <p className="text-xl font-bold text-primary-400">{tdee || '—'}</p>
                        <p className="text-dark-600 text-xs">cal active</p>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-xl">
                        <p className="text-dark-500 text-xs">Target</p>
                        <p className="text-xl font-bold text-dark-900 dark:text-white">{calorieTarget || '—'}</p>
                        <p className="text-dark-600 text-xs">cal/day</p>
                    </div>
                </div>

                {/* Daily Macro Targets */}
                {proteinNeeded && (
                    <div className="space-y-2 pt-3 border-t border-white/5">
                        <p className="text-dark-400 text-xs uppercase tracking-wider">Daily Macro Targets</p>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="flex items-center gap-2 p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                <span className="text-sm">🥩</span>
                                <div>
                                    <p className="text-blue-400 font-bold text-sm">{proteinNeeded}g</p>
                                    <p className="text-dark-500 text-xs">Protein</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                <span className="text-sm">🍞</span>
                                <div>
                                    <p className="text-amber-400 font-bold text-sm">{carbsNeeded}g</p>
                                    <p className="text-dark-500 text-xs">Carbs</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                                <span className="text-sm">🧈</span>
                                <div>
                                    <p className="text-red-400 font-bold text-sm">{fatNeeded}g</p>
                                    <p className="text-dark-500 text-xs">Fat</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Weight Loss / Gain Projection */}
            {weeklyWeightChange !== 0 && (
                <div className="glass-card p-5">
                    <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Weight Projection
                    </h3>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="p-3 bg-white/5 rounded-xl">
                            <p className="text-dark-500 text-xs">Weekly Change</p>
                            <p className={`text-xl font-bold ${weeklyWeightChange < 0 ? 'text-green-400' : 'text-orange-400'}`}>
                                {weeklyWeightChange > 0 ? '+' : ''}{weeklyWeightChange.toFixed(2)} kg
                            </p>
                            <p className="text-dark-600 text-xs">{weeklyWeightChange < 0 ? '↓ Losing weight' : '↑ Gaining weight'}</p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-xl">
                            <p className="text-dark-500 text-xs">Monthly Change</p>
                            <p className={`text-xl font-bold ${monthlyWeightChange < 0 ? 'text-green-400' : 'text-orange-400'}`}>
                                {monthlyWeightChange > 0 ? '+' : ''}{monthlyWeightChange.toFixed(1)} kg
                            </p>
                            <p className="text-dark-600 text-xs">~{Math.abs(monthlyWeightChange * 2.2).toFixed(1)} lbs/month</p>
                        </div>
                    </div>

                    {/* Time to target */}
                    {weeksToTarget && weeksToTarget > 0 && (
                        <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-4 mt-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-primary-400 text-sm font-medium">
                                        {profileData.weight_kg > targetWeight ? '⬇️ Weight Loss' : '⬆️ Weight Gain'} Plan
                                    </p>
                                    <p className="text-dark-400 text-xs mt-1">
                                        {profileData.weight_kg}kg → {targetWeight}kg ({Math.abs(profileData.weight_kg - targetWeight).toFixed(1)}kg {profileData.weight_kg > targetWeight ? 'to lose' : 'to gain'})
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-dark-900 dark:text-white font-bold">{weeksToTarget} weeks</p>
                                    <p className="text-dark-500 text-xs">~{Math.round(weeksToTarget / 4.3)} months</p>
                                </div>
                            </div>
                            {/* Progress to target */}
                            <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                                <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all"
                                    style={{ width: '0%' }}></div>
                            </div>
                        </div>
                    )}

                    <div className="mt-3 p-3 bg-white/5 rounded-xl">
                        <p className="text-dark-500 text-xs">Daily Calorie Deficit/Surplus</p>
                        <p className={`text-lg font-bold ${calorieTarget < tdee ? 'text-green-400' : 'text-orange-400'}`}>
                            {calorieTarget < tdee ? `-${tdee - calorieTarget}` : `+${calorieTarget - tdee}`} kcal/day
                        </p>
                    </div>
                </div>
            )}

            {/* Recommendations */}
            <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                    Recommendations
                </h3>
                <div className="space-y-2">
                    {waterIntake && (
                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                            <span className="text-lg">💧</span>
                            <div className="flex-1"><p className="text-dark-900 dark:text-white text-sm font-medium">Water Intake</p><p className="text-dark-500 text-xs">Drink at least {waterIntake}L/day</p></div>
                            <span className="text-primary-400 font-bold text-sm">{waterIntake}L</span>
                        </div>
                    )}
                    {profileData.exercise_level && (
                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                            <span className="text-lg">🏃</span>
                            <div className="flex-1"><p className="text-dark-900 dark:text-white text-sm font-medium">Exercise</p><p className="text-dark-500 text-xs">{profileData.exercise_level === 'never' ? 'Start with 20 min walks daily' : profileData.exercise_level === 'low' ? 'Increase to 3-4 sessions/week' : profileData.exercise_level === 'moderate' ? 'Great routine! Consider HIIT' : 'Excellent! Ensure recovery days'}</p></div>
                        </div>
                    )}
                    {proteinNeeded && (
                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                            <span className="text-lg">🥩</span>
                            <div className="flex-1"><p className="text-dark-900 dark:text-white text-sm font-medium">Protein Target</p><p className="text-dark-500 text-xs">{profileData.weight_kg ? `Aim for ${Math.round(profileData.weight_kg * 1.6)}g-${Math.round(profileData.weight_kg * 2.2)}g for optimal results` : 'Track your protein intake'}</p></div>
                        </div>
                    )}
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                        <span className="text-lg">😴</span>
                        <div className="flex-1"><p className="text-dark-900 dark:text-white text-sm font-medium">Sleep</p><p className="text-dark-500 text-xs">Aim for 7-9 hours for optimal recovery</p></div>
                    </div>
                </div>
            </div>

            {/* All-Time Stats */}
            {allTimeStats && (
                <div className="glass-card p-5">
                    <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-3">All-Time Stats</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-white/5 rounded-xl text-center">
                            <p className="text-dark-500 text-xs">Total Meals</p>
                            <p className="text-xl font-bold text-dark-900 dark:text-white">{allTimeStats.totalEntries}</p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-xl text-center">
                            <p className="text-dark-500 text-xs">Total Calories</p>
                            <p className="text-xl font-bold text-primary-400">{allTimeStats.totalCalories}</p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-xl text-center">
                            <p className="text-dark-500 text-xs">Total Protein</p>
                            <p className="text-xl font-bold text-blue-400">{allTimeStats.totalProtein}g</p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-xl text-center">
                            <p className="text-dark-500 text-xs">Avg Cal/Meal</p>
                            <p className="text-xl font-bold text-accent-400">{allTimeStats.totalEntries > 0 ? Math.round(allTimeStats.totalCalories / allTimeStats.totalEntries) : 0}</p>
                        </div>
                    </div>
                </div>
            )}

            {success && <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3"><p className="text-green-400 text-sm text-center">✓ {success}</p></div>}
            {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3"><p className="text-red-400 text-sm text-center">{error}</p></div>}

            {/* Profile Details */}
            <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-sm font-semibold text-dark-300 uppercase tracking-wider">Profile Details</h2>
                    {!editing ? (
                        <button onClick={() => setEditing(true)} className="text-primary-400 text-sm hover:text-primary-300">✏️ Edit</button>
                    ) : (
                        <div className="flex gap-2">
                            <button onClick={() => { setEditing(false); setFormData(profileData); }} className="text-dark-400 text-sm hover:text-dark-900 dark:hover:text-white">Cancel</button>
                            <button onClick={handleSave} disabled={loading} className="text-primary-400 text-sm hover:text-primary-300 font-medium">{loading ? 'Saving...' : '✓ Save'}</button>
                        </div>
                    )}
                </div>
                <div className="space-y-3">
                    {fields.map(field => (
                        <div key={field.key} className="flex items-center gap-3">
                            <span className="text-lg w-8 text-center">{field.icon}</span>
                            <div className="flex-1">
                                <p className="text-dark-500 text-xs">{field.label}</p>
                                {editing && !field.readonly ? (
                                    field.type === 'select' ? (
                                        <select value={formData[field.key] || ''} onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                                            className="input-field py-1.5 text-sm capitalize">
                                            <option value="">Select</option>
                                            {field.options.map(opt => <option key={opt} value={opt} className="bg-dark-900 capitalize">{opt}</option>)}
                                        </select>
                                    ) : (
                                        <input type={field.type} value={formData[field.key] || ''} onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                                            className="input-field py-1.5 text-sm" />
                                    )
                                ) : (
                                    <p className="text-dark-900 dark:text-white font-medium text-sm capitalize">{profileData[field.key] || '—'}</p>
                                )}
                            </div>
                        </div>
                    ))}
                    <div className="flex items-start gap-3 pt-2 border-t border-white/5">
                        <span className="text-lg w-8 text-center mt-1">🎯</span>
                        <div className="flex-1">
                            <p className="text-dark-500 text-xs">Health Goals</p>
                            {editing ? <textarea value={formData.health_goals || ''} onChange={(e) => setFormData({ ...formData, health_goals: e.target.value })} className="input-field py-1.5 text-sm min-h-[50px] resize-none" /> : <p className="text-dark-900 dark:text-white text-sm">{profileData.health_goals || '—'}</p>}
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="text-lg w-8 text-center mt-1">🏥</span>
                        <div className="flex-1">
                            <p className="text-dark-500 text-xs">Health Conditions</p>
                            {editing ? <textarea value={formData.health_conditions || ''} onChange={(e) => setFormData({ ...formData, health_conditions: e.target.value })} className="input-field py-1.5 text-sm min-h-[50px] resize-none" /> : <p className="text-dark-900 dark:text-white text-sm">{profileData.health_conditions || '—'}</p>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Logout */}
            <button onClick={handleLogout} className="w-full glass-card p-4 text-center text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Sign Out
            </button>
        </div>
    );
}
