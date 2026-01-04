import { useNavigate } from 'react-router-dom';
import { useTrending } from '../../contexts/TrendingContext';
import { useAuth } from '../../contexts/AuthContext';
import { TrendingUp, Loader2, Hash } from 'lucide-react';

const TrendingSidebar = () => {
    const navigate = useNavigate();
    const trendingContext = useTrending();
    const { userProfile } = useAuth();

    // Safely destructure with defaults
    const currentTrends = trendingContext?.currentTrends || [];
    const loading = trendingContext?.loading ?? true;
    const activeScope = trendingContext?.activeScope || 'campus';
    const setActiveScope = trendingContext?.setActiveScope || (() => { });

    const scopeOptions = [
        { value: 'campus', label: 'Campus' },
        { value: 'faculty', label: userProfile?.faculty?.split(' ')[0] || 'Faculty' },
        { value: 'department', label: userProfile?.department?.split(' ')[0] || 'Dept' }
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-20">
            {/* Header */}
            <div className="p-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary-600" />
                    Trending Now
                </h2>
            </div>

            {/* Scope Tabs */}
            <div className="p-2 border-b border-gray-100">
                <div className="flex gap-1">
                    {scopeOptions.map(option => (
                        <button
                            key={option.value}
                            onClick={() => setActiveScope(option.value)}
                            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${activeScope === option.value
                                ? 'bg-primary-100 text-primary-700'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Trends List */}
            <div className="p-4">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
                    </div>
                ) : !currentTrends || currentTrends.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Hash className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-sm">No trending topics yet</p>
                        <p className="text-gray-400 text-xs mt-1">Start a conversation with #hashtags!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {currentTrends.map((trend, index) => (
                            <div
                                key={trend.tag}
                                onClick={() => navigate(`/hashtag/${trend.tag.replace('#', '')}`)}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                                <span className="text-sm font-bold text-gray-400 w-4">{index + 1}</span>
                                <div className="flex-1">
                                    <p className="font-semibold text-violet-600">{trend.tag}</p>
                                    <p className="text-xs text-gray-500">{trend.count} posts</p>
                                </div>
                                {index === 0 && (
                                    <span className="text-orange-500 text-xl">🔥</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-500 text-center">
                    Trends update based on recent posts
                </p>
            </div>
        </div>
    );
};

export default TrendingSidebar;
