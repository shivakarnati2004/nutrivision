import { useState, useEffect } from 'react';
import { getHistory } from '../services/api';

export default function History() {
    const [analyses, setAnalyses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const result = await getHistory();
            setAnalyses(result.data || []);
        } catch (error) {
            console.error('Failed to fetch history:', error);
        } finally {
            setLoading(false);
        }
    };

    const getInputIcon = (type) => {
        switch (type) {
            case 'image': return '📷';
            case 'speech': return '🎙️';
            default: return '📝';
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="spinner"></div>
            </div>
        );
    }

    if (analyses.length === 0) {
        return (
            <div className="text-center py-12 animate-fade-in">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                    <svg className="w-8 h-8 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <p className="text-dark-400 text-sm">No analyses yet. Start by analyzing some food!</p>
            </div>
        );
    }

    return (
        <div className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wider">Recent Analyses</h3>
                <span className="text-xs text-dark-500">{analyses.length} items</span>
            </div>
            {analyses.map((item, index) => {
                const nutrition = typeof item.nutrition_data === 'string'
                    ? JSON.parse(item.nutrition_data)
                    : item.nutrition_data;

                return (
                    <div
                        key={item.id || index}
                        className="glass-card-hover p-4 animate-count"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{getInputIcon(item.input_type)}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-dark-900 dark:text-white font-medium truncate">{item.food_name || nutrition?.food_name || 'Unknown'}</p>
                                <p className="text-dark-500 text-xs truncate">{item.input_text}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-primary-400 font-bold text-lg">{nutrition?.calories || '—'}</p>
                                <p className="text-dark-500 text-xs">kcal</p>
                            </div>
                        </div>
                        {item.created_at && (
                            <p className="text-dark-600 text-xs mt-2">{formatDate(item.created_at)}</p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
