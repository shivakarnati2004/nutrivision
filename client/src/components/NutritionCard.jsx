import { useState, useEffect } from 'react';

export default function NutritionCard({ data, onSave, onDiscard }) {
    const [weight, setWeight] = useState(100);
    const [saved, setSaved] = useState(false);

    // Calculate default weight from serving_size if available
    useEffect(() => {
        if (data?.serving_size) {
            const match = data.serving_size.match(/(\d+)\s*g/);
            if (match) {
                setWeight(parseInt(match[1]));
            }
        }
    }, [data]);

    if (!data) return null;

    const {
        food_name,
        serving_size,
        calories,
        macronutrients,
        vitamins,
        minerals,
        health_score,
        health_notes,
        allergens,
        diet_tags,
    } = data;

    // Weight ratio for real-time recalculation
    const ratio = weight / 100;

    const scale = (val) => val ? Math.round(val * ratio * 10) / 10 : 0;

    const getHealthColor = (score) => {
        if (score >= 80) return { bg: 'bg-green-500', text: 'text-green-400', label: 'Excellent' };
        if (score >= 60) return { bg: 'bg-yellow-500', text: 'text-yellow-400', label: 'Good' };
        if (score >= 40) return { bg: 'bg-orange-500', text: 'text-orange-400', label: 'Moderate' };
        return { bg: 'bg-red-500', text: 'text-red-400', label: 'Low' };
    };

    const healthInfo = getHealthColor(health_score || 50);

    const macros = [
        { name: 'Protein', data: macronutrients?.protein, color: 'from-blue-500 to-blue-400', bg: 'bg-blue-500' },
        { name: 'Carbs', data: macronutrients?.carbohydrates, color: 'from-amber-500 to-amber-400', bg: 'bg-amber-500' },
        { name: 'Fat', data: macronutrients?.total_fat, color: 'from-pink-500 to-pink-400', bg: 'bg-pink-500' },
        { name: 'Fiber', data: macronutrients?.fiber, color: 'from-green-500 to-green-400', bg: 'bg-green-500' },
    ];

    const handleSave = () => {
        if (onSave) {
            onSave(data, weight);
            setSaved(true);
        }
    };

    const handleDiscard = () => {
        if (onDiscard) onDiscard();
    };

    return (
        <div className="animate-slide-up space-y-4">
            {/* Header Card */}
            <div className="glass-card p-6 glow-green">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-dark-900 dark:text-white mb-1">{food_name || 'Food Item'}</h2>
                        <p className="text-dark-400 text-sm">{serving_size || 'Standard serving'}</p>
                    </div>
                    <div className="flex flex-col items-center ml-4">
                        <div className={`relative w-16 h-16 rounded-full flex items-center justify-center 
              border-2 ${healthInfo.bg.replace('bg-', 'border-')}`}>
                            <span className={`text-xl font-bold ${healthInfo.text}`}>{health_score || '—'}</span>
                        </div>
                        <span className={`text-xs mt-1 ${healthInfo.text} font-medium`}>{healthInfo.label}</span>
                    </div>
                </div>

                {/* Calories (scaled) */}
                <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-4xl font-black bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                        {scale(calories)}
                    </span>
                    <span className="text-dark-400 text-sm">kcal</span>
                </div>
            </div>

            {/* Weight Input */}
            <div className="glass-card p-4">
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <label className="text-xs text-dark-400 uppercase tracking-wider mb-1.5 block">Food Weight</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="range"
                                min="10"
                                max="1000"
                                step="10"
                                value={weight}
                                onChange={(e) => setWeight(parseInt(e.target.value))}
                                className="flex-1 h-2 rounded-full appearance-none bg-white/10 cursor-pointer accent-primary-500"
                            />
                            <div className="flex items-center gap-1">
                                <input
                                    type="number"
                                    value={weight}
                                    onChange={(e) => setWeight(Math.max(1, parseInt(e.target.value) || 0))}
                                    className="w-16 bg-white/5 border border-dark-900/10 dark:border-white/10 rounded-lg px-2 py-1 text-center text-dark-900 dark:text-white text-sm font-bold focus:outline-none focus:border-primary-500"
                                    id="food-weight-input"
                                />
                                <span className="text-dark-400 text-sm">g</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Macros Grid (scaled) */}
            <div className="grid grid-cols-2 gap-3">
                {macros.map((macro, index) => (
                    <div key={macro.name} className="glass-card p-4 animate-count" style={{ animationDelay: `${index * 100}ms` }}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-dark-400">{macro.name}</span>
                            <span className="text-xs text-dark-500">{macro.data?.daily_value_percent || 0}% DV</span>
                        </div>
                        <p className="text-xl font-bold text-dark-900 dark:text-white">
                            {scale(macro.data?.amount)}<span className="text-sm text-dark-400 ml-1">{macro.data?.unit || 'g'}</span>
                        </p>
                        <div className="progress-bar mt-2">
                            <div
                                className={`progress-fill bg-gradient-to-r ${macro.color}`}
                                style={{ width: `${Math.min(macro.data?.daily_value_percent || 0, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Extra Macros */}
            {macronutrients && (
                <div className="glass-card p-4">
                    <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-3">Additional</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: 'Saturated Fat', val: macronutrients.saturated_fat },
                            { label: 'Trans Fat', val: macronutrients.trans_fat },
                            { label: 'Sugar', val: macronutrients.sugar },
                            { label: 'Cholesterol', val: macronutrients.cholesterol },
                            { label: 'Sodium', val: macronutrients.sodium },
                        ].map((item) => (
                            <div key={item.label} className="text-center p-2">
                                <p className="text-xs text-dark-500 mb-1">{item.label}</p>
                                <p className="text-sm font-semibold text-dark-900 dark:text-white">
                                    {scale(item.val?.amount)}{item.val?.unit || 'g'}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Vitamins */}
            {vitamins && vitamins.length > 0 && (
                <div className="glass-card p-4">
                    <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                        Vitamins
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                        {vitamins.map((v, i) => (
                            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                                <span className="text-sm text-dark-300">{v.name}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-dark-900 dark:text-white">{scale(v.amount)}{v.unit}</span>
                                    <span className="text-xs text-dark-500">{v.daily_value_percent}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Minerals */}
            {minerals && minerals.length > 0 && (
                <div className="glass-card p-4">
                    <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                        Minerals
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                        {minerals.map((m, i) => (
                            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                                <span className="text-sm text-dark-300">{m.name}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-dark-900 dark:text-white">{scale(m.amount)}{m.unit}</span>
                                    <span className="text-xs text-dark-500">{m.daily_value_percent}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Health Notes, Tags, Allergens */}
            <div className="glass-card p-4 space-y-4">
                {health_notes && health_notes.length > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Health Notes
                        </h3>
                        <ul className="space-y-1">
                            {health_notes.map((note, i) => (
                                <li key={i} className="text-sm text-dark-300 flex items-start gap-2">
                                    <span className="text-primary-400 mt-0.5">✓</span>
                                    {note}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {diet_tags && diet_tags.length > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-2">Diet Tags</h3>
                        <div className="flex flex-wrap gap-2">
                            {diet_tags.map((tag, i) => (
                                <span key={i} className="bg-primary-500/10 text-primary-400 text-xs px-3 py-1 rounded-full border border-primary-500/20">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {allergens && allergens.length > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            Allergens
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {allergens.map((a, i) => (
                                <span key={i} className="bg-red-500/10 text-red-400 text-xs px-3 py-1 rounded-full border border-red-500/20">
                                    ⚠ {a}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Save / Discard Buttons */}
            {!saved && (
                <div className="flex gap-3">
                    <button
                        onClick={handleDiscard}
                        className="btn-secondary flex-1 flex items-center justify-center gap-2"
                        id="discard-btn"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Discard
                    </button>
                    <button
                        onClick={handleSave}
                        className="btn-primary flex-1 flex items-center justify-center gap-2"
                        id="save-btn"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save to History
                    </button>
                </div>
            )}

            {saved && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center animate-fade-in">
                    <p className="text-green-400 font-medium">✓ Saved to your history!</p>
                </div>
            )}
        </div>
    );
}
