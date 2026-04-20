import { useState, useEffect, useCallback } from 'react';
import { getHistory, getStats, deleteHistoryItem, getProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    ComposedChart
} from 'recharts';

const periods = [
    { id: 'day', label: 'Today' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: '', label: 'All' },
];

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-dark-900/95 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl">
            <p className="text-white text-xs font-semibold mb-1.5">{label}</p>
            {payload.map((p, i) => (
                <p key={i} className="text-xs flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: p.color }}></span>
                    <span className="text-dark-400">{p.name}:</span>
                    <span className="text-white font-medium">{typeof p.value === 'number' ? Math.round(p.value * 10) / 10 : p.value}</span>
                </p>
            ))}
        </div>
    );
};

export default function Dashboard() {
    const [period, setPeriod] = useState('week');
    const [stats, setStats] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState(null);
    const { user } = useAuth();

    const calcBMR = (p) => {
        if (!p?.weight_kg || !p?.height_cm || !p?.age) return null;
        return p.gender === 'female'
            ? Math.round(10 * p.weight_kg + 6.25 * p.height_cm - 5 * p.age - 161)
            : Math.round(10 * p.weight_kg + 6.25 * p.height_cm - 5 * p.age + 5);
    };
    const calcTDEE = (p) => {
        const bmr = calcBMR(p);
        if (!bmr) return null;
        return Math.round(bmr * ({ never: 1.2, low: 1.375, moderate: 1.55, high: 1.725 }[p.exercise_level] || 1.2));
    };
    const getTarget = (p, tdee) => {
        if (!tdee) return null;
        const g = (p?.health_goals || '').toLowerCase();
        if (g.includes('lose') || g.includes('fat')) return tdee - 500;
        if (g.includes('muscle') || g.includes('gain')) return tdee + 300;
        return tdee;
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [statsRes, historyRes, profileRes] = await Promise.all([
                getStats(period), getHistory(period), getProfile(),
            ]);
            setStats(statsRes.data);
            setHistory(historyRes.data || []);
            if (profileRes.success) setUserProfile(profileRes.user);
        } catch (e) { console.error('Fetch:', e); }
        finally { setLoading(false); }
    }, [period]);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { const i = setInterval(fetchData, 30000); return () => clearInterval(i); }, [fetchData]);

    const handleDelete = async (id) => {
        await deleteHistoryItem(id);
        setHistory(prev => prev.filter(item => item.id !== id));
        fetchData();
    };

    const tdee = calcTDEE(userProfile);
    const calorieTarget = getTarget(userProfile, tdee);
    const consumed = stats?.totalCalories || 0;
    const remaining = calorieTarget ? calorieTarget - consumed : null;
    const pct = calorieTarget ? Math.min(Math.round((consumed / calorieTarget) * 100), 150) : 0;

    // Macro pie data
    const macroData = stats ? [
        { name: 'Protein', value: stats.totalProtein || 0, color: '#3b82f6', cal: ((stats.totalProtein || 0) * 4) },
        { name: 'Carbs', value: stats.totalCarbs || 0, color: '#f59e0b', cal: ((stats.totalCarbs || 0) * 4) },
        { name: 'Fat', value: stats.totalFat || 0, color: '#ef4444', cal: ((stats.totalFat || 0) * 9) },
        { name: 'Fiber', value: stats.totalFiber || 0, color: '#22c55e', cal: 0 },
    ].filter(m => m.value > 0) : [];

    // Calorie from macros for donut
    const calFromMacros = macroData.filter(m => m.cal > 0).map(m => ({
        name: `${m.name} Cal`, value: Math.round(m.cal), color: m.color,
    }));

    // Nutrient detail data
    const nutrientDetail = stats ? [
        { name: 'Protein', value: stats.totalProtein, max: 150, unit: 'g', color: '#3b82f6' },
        { name: 'Carbs', value: stats.totalCarbs, max: 300, unit: 'g', color: '#f59e0b' },
        { name: 'Fat', value: stats.totalFat, max: 80, unit: 'g', color: '#ef4444' },
        { name: 'Fiber', value: stats.totalFiber, max: 35, unit: 'g', color: '#22c55e' },
        { name: 'Sugar', value: stats.totalSugar, max: 50, unit: 'g', color: '#ec4899' },
        { name: 'Sat. Fat', value: stats.totalSatFat, max: 20, unit: 'g', color: '#f97316' },
        { name: 'Sodium', value: stats.totalSodium, max: 2300, unit: 'mg', color: '#8b5cf6' },
        { name: 'Cholesterol', value: stats.totalCholesterol, max: 300, unit: 'mg', color: '#06b6d4' },
    ] : [];

    // Radar chart data for nutrient balance
    const radarData = nutrientDetail.filter(n => n.value > 0).map(n => ({
        subject: n.name, value: Math.min(Math.round((n.value / n.max) * 100), 150), fullMark: 100,
    }));

    return (
        <div className="space-y-5 animate-fade-in pb-24">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-dark-900 dark:text-white">📊 Dashboard</h1>
                <button onClick={fetchData} className="text-dark-500 hover:text-primary-400 transition-colors p-2 rounded-lg hover:bg-white/5">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>

            {/* Period Tabs */}
            <div className="flex gap-1 p-1 glass-card">
                {periods.map(p => (
                    <button key={p.id} onClick={() => setPeriod(p.id)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${period === p.id ? 'tab-active' : 'tab-inactive'}`}>
                        {p.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20"><div className="spinner"></div></div>
            ) : !stats || stats.totalEntries === 0 ? (
                <div className="glass-card p-12 text-center">
                    <span className="text-5xl block mb-4">🍽️</span>
                    <h3 className="text-lg font-semibold text-dark-300 mb-2">No data yet</h3>
                    <p className="text-dark-500 text-sm">Analyze and save food from the Home tab to see your dashboard</p>
                </div>
            ) : (
                <>
                    {/* ── Calorie Budget ───────────────────────────────── */}
                    {calorieTarget && (
                        <div className="glass-card p-5 glow-green">
                            <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                                <span>🔥 Calorie Budget</span>
                                <span className="text-dark-500">{userProfile?.health_goals?.split(',')[0] || ''}</span>
                            </h3>
                            <div className="flex items-center gap-5">
                                <div className="relative w-24 h-24 flex-shrink-0">
                                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
                                        <circle cx="50" cy="50" r="42" fill="none" stroke={pct > 100 ? '#ef4444' : '#22c55e'}
                                            strokeWidth="7" strokeLinecap="round"
                                            strokeDasharray={`${Math.min(pct, 100) * 2.64} 264`} className="transition-all duration-1000" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className={`text-lg font-black ${pct > 100 ? 'text-red-400' : 'text-primary-400'}`}>{pct}%</span>
                                    </div>
                                </div>
                                <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                                    <span className="text-dark-400">Consumed</span><span className="text-dark-900 dark:text-white font-bold text-right">{consumed} kcal</span>
                                    <span className="text-dark-400">Target</span><span className="text-primary-400 font-bold text-right">{calorieTarget} kcal</span>
                                    <span className="text-dark-400">Remaining</span>
                                    <span className={`font-bold text-right ${remaining >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {remaining >= 0 ? remaining : `+${Math.abs(remaining)}`} kcal
                                    </span>
                                    <span className="text-dark-400">TDEE</span><span className="text-accent-400 font-medium text-right">{tdee} kcal</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Summary Cards ────────────────────────────────── */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { label: '🔥 Calories', val: consumed, unit: 'kcal', cls: 'bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent' },
                            { label: '🥩 Protein', val: stats.totalProtein, unit: 'g', cls: 'text-blue-400' },
                            { label: '🍞 Carbs', val: stats.totalCarbs, unit: 'g', cls: 'text-amber-400' },
                            { label: '🧈 Fat', val: stats.totalFat, unit: 'g', cls: 'text-pink-400' },
                        ].map(c => (
                            <div key={c.label} className="glass-card p-3.5 text-center">
                                <p className="text-dark-400 text-xs">{c.label}</p>
                                <p className={`text-2xl font-black mt-0.5 ${c.cls}`}>{c.val}</p>
                                <p className="text-dark-600 text-xs">{c.unit}</p>
                            </div>
                        ))}
                    </div>

                    {/* ── Calorie Trend (Area + Target Line) ──────────── */}
                    {stats.dailyData?.length > 0 && (
                        <div className="glass-card p-5">
                            <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-4">
                                📈 Calorie Trend {period === 'day' ? '(Hourly)' : period === 'week' ? '(Daily)' : period === 'month' ? '(Daily)' : '(All Time)'}
                            </h3>
                            <ResponsiveContainer width="100%" height={220}>
                                <ComposedChart data={stats.dailyData.map(d => ({ ...d, target: calorieTarget || 0 }))}>
                                    <defs>
                                        <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} />
                                    <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                                    <Area type="monotone" dataKey="calories" stroke="#22c55e" strokeWidth={2} fill="url(#calGrad)" name="Calories" />
                                    {calorieTarget > 0 && <Line type="monotone" dataKey="target" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="6 3" dot={false} name="Target" />}
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* ── Macro Stacked Bar Chart ─────────────────────── */}
                    {stats.dailyData?.length > 0 && (
                        <div className="glass-card p-5">
                            <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-4">
                                📊 Macro Distribution {period === 'day' ? '(Hourly)' : '(Per Day)'}
                            </h3>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={stats.dailyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} />
                                    <YAxis stroke="#475569" fontSize={10} tickLine={false} label={{ value: 'grams', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 10 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                                    <Bar dataKey="protein" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} name="Protein" />
                                    <Bar dataKey="carbs" stackId="a" fill="#f59e0b" name="Carbs" />
                                    <Bar dataKey="fat" stackId="a" fill="#ef4444" name="Fat" />
                                    <Bar dataKey="fiber" stackId="a" fill="#22c55e" radius={[3, 3, 0, 0]} name="Fiber" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* ── Macro Pie + Calorie-from-Macro Donut ─────────── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {macroData.length > 0 && (
                            <div className="glass-card p-5">
                                <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-3">🥧 Macro Breakdown (grams)</h3>
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie data={macroData} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: ${value}g`} labelLine={false}>
                                            {macroData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                        {calFromMacros.length > 0 && (
                            <div className="glass-card p-5">
                                <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-3">⚡ Calories from Macros</h3>
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie data={calFromMacros} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value"
                                            label={({ name, value }) => `${value} kcal`} labelLine={false}>
                                            {calFromMacros.map((e, i) => <Cell key={i} fill={e.color} />)}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex flex-wrap justify-center gap-3 mt-1">
                                    {calFromMacros.map(m => (
                                        <span key={m.name} className="flex items-center gap-1 text-xs text-dark-400">
                                            <span className="w-2 h-2 rounded-full" style={{ background: m.color }}></span>
                                            {m.name}: {m.value} kcal
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Nutrient Balance Radar ──────────────────────── */}
                    {radarData.length >= 3 && (
                        <div className="glass-card p-5">
                            <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-3">🎯 Nutrient Balance (% of daily target)</h3>
                            <ResponsiveContainer width="100%" height={260}>
                                <RadarChart data={radarData}>
                                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                                    <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={11} />
                                    <PolarRadiusAxis stroke="#334155" fontSize={9} />
                                    <Radar name="Balance" dataKey="value" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} strokeWidth={2} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* ── Detailed Nutrient Bars ──────────────────────── */}
                    {nutrientDetail.some(n => n.value > 0) && (
                        <div className="glass-card p-5">
                            <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-4">📋 Detailed Nutrients</h3>
                            <div className="space-y-3">
                                {nutrientDetail.filter(n => n.value > 0).map(n => {
                                    const pctVal = Math.min(Math.round((n.value / n.max) * 100), 100);
                                    return (
                                        <div key={n.name}>
                                            <div className="flex items-center justify-between text-xs mb-1">
                                                <span className="text-dark-300 font-medium">{n.name}</span>
                                                <span className="text-dark-500">{n.value}{n.unit} / {n.max}{n.unit} ({pctVal}%)</span>
                                            </div>
                                            <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all duration-700"
                                                    style={{ width: `${pctVal}%`, background: n.color, opacity: 0.85 }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Per-Meal Calorie Bar Chart ──────────────────── */}
                    {stats.mealList?.length > 0 && (
                        <div className="glass-card p-5">
                            <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-4">🍽️ Calories Per Meal</h3>
                            <ResponsiveContainer width="100%" height={Math.max(stats.mealList.length * 35, 120)}>
                                <BarChart data={stats.mealList.slice(-15)} layout="vertical" margin={{ left: 80 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis type="number" stroke="#475569" fontSize={10} tickLine={false} />
                                    <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} width={75} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="calories" fill="#22c55e" radius={[0, 4, 4, 0]} name="Calories" barSize={18}>
                                        {stats.mealList.slice(-15).map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* ── Meals per Time Slot ─────────────────────────── */}
                    {stats.dailyData?.length > 0 && (
                        <div className="glass-card p-5">
                            <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-4">
                                🕐 Meals per {period === 'day' ? 'Hour' : 'Day'}
                            </h3>
                            <ResponsiveContainer width="100%" height={160}>
                                <BarChart data={stats.dailyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" stroke="#475569" fontSize={10} tickLine={false} />
                                    <YAxis stroke="#475569" fontSize={10} tickLine={false} allowDecimals={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="meals" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Meals" barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* ── Meals Count + Stats Row ─────────────────────── */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="glass-card p-3 text-center">
                            <p className="text-dark-500 text-xs">Meals</p>
                            <p className="text-xl font-bold text-dark-900 dark:text-white">{stats.totalEntries}</p>
                        </div>
                        <div className="glass-card p-3 text-center">
                            <p className="text-dark-500 text-xs">Avg Cal/Meal</p>
                            <p className="text-xl font-bold text-primary-400">{stats.totalEntries > 0 ? Math.round(consumed / stats.totalEntries) : 0}</p>
                        </div>
                        <div className="glass-card p-3 text-center">
                            <p className="text-dark-500 text-xs">Avg Protein</p>
                            <p className="text-xl font-bold text-blue-400">{stats.totalEntries > 0 ? Math.round(stats.totalProtein / stats.totalEntries) : 0}g</p>
                        </div>
                    </div>

                    {/* ── History List ─────────────────────────────────── */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider">Recent Meals</h3>
                        {history.length === 0 ? (
                            <div className="glass-card p-6 text-center"><p className="text-dark-500 text-sm">No meals in this period</p></div>
                        ) : (
                            history.slice(0, 20).map((item, i) => {
                                const nd = typeof item.nutrition_data === 'string' ? JSON.parse(item.nutrition_data) : item.nutrition_data;
                                const r = (item.food_weight_grams || 100) / 100;
                                const cal = Math.round((nd?.calories || 0) * r);
                                return (
                                    <div key={item.id || i} className="glass-card-hover p-3 animate-count" style={{ animationDelay: `${i * 25}ms` }}>
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">{item.input_type === 'image' ? '📷' : item.input_type === 'speech' ? '🎙️' : '📝'}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-dark-900 dark:text-white text-sm font-medium truncate">{item.food_name || nd?.food_name || 'Food'}</p>
                                                <p className="text-dark-500 text-xs"><span className="text-primary-400 font-medium">{cal} kcal</span> · {item.food_weight_grams || 100}g</p>
                                            </div>
                                            <button onClick={() => handleDelete(item.id)}
                                                className="text-dark-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
