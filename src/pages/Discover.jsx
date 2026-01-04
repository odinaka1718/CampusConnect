import { useNavigate } from 'react-router-dom';
import { useTrending } from '../contexts/TrendingContext';
import { useAuth } from '../contexts/AuthContext';
import { TrendingUp, Hash, Loader2, Users, Building, BookOpen } from 'lucide-react';

const Discover = () => {
    const navigate = useNavigate();
    const { campusTrends, facultyTrends, departmentTrends, loading } = useTrending();
    const { userProfile } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            </div>
        );
    }

    const TrendSection = ({ title, icon: Icon, trends = [], color }) => (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className={`p-4 border-b border-gray-100 ${color}`}>
                <h3 className="font-semibold text-white flex items-center gap-2">
                    <Icon className="w-5 h-5" />
                    {title}
                </h3>
            </div>
            <div className="p-4">
                {!trends || trends.length === 0 ? (
                    <div className="text-center py-6">
                        <Hash className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No trends yet</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {trends.map((trend, index) => (
                            <div
                                key={trend.tag}
                                onClick={() => navigate(`/hashtag/${trend.tag.replace('#', '')}`)}
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                                <span className="text-lg font-bold text-gray-400 w-6">{index + 1}</span>
                                <div className="flex-1">
                                    <p className="font-semibold text-violet-600">{trend.tag}</p>
                                    <p className="text-sm text-gray-500">{trend.count} posts</p>
                                </div>
                                {index === 0 && <span className="text-xl">🔥</span>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <TrendingUp className="w-8 h-8 text-primary-600" />
                    Discover
                </h1>
                <p className="text-gray-600 mt-2">
                    Explore what's trending across campus, your faculty, and department
                </p>
            </div>

            {/* Trends Grid */}
            <div className="grid md:grid-cols-3 gap-6">
                <TrendSection
                    title="Campus-Wide"
                    icon={Users}
                    trends={campusTrends}
                    color="bg-gradient-to-r from-primary-500 to-primary-600"
                />

                <TrendSection
                    title={userProfile?.faculty || 'Faculty'}
                    icon={Building}
                    trends={facultyTrends}
                    color="bg-gradient-to-r from-green-500 to-green-600"
                />

                <TrendSection
                    title={userProfile?.department || 'Department'}
                    icon={BookOpen}
                    trends={departmentTrends}
                    color="bg-gradient-to-r from-orange-500 to-orange-600"
                />
            </div>

            {/* How It Works */}
            <div className="mt-8 bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">How Trends Work</h2>
                <div className="grid md:grid-cols-3 gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                            <span className="text-primary-600 font-bold">1</span>
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">Use #hashtags</p>
                            <p className="text-sm text-gray-600">Add hashtags to your posts to join conversations</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                            <span className="text-primary-600 font-bold">2</span>
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">We track activity</p>
                            <p className="text-sm text-gray-600">Popular hashtags from recent posts rise up</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                            <span className="text-primary-600 font-bold">3</span>
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">Stay updated</p>
                            <p className="text-sm text-gray-600">Trends refresh based on the latest 100 posts</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Discover;
