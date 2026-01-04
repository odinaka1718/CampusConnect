import { useState, useCallback, useMemo } from 'react';
import { usePosts } from '../contexts/PostsContext';
import { useAuth } from '../contexts/AuthContext';
import PostCard from '../components/posts/PostCard';
import CreatePost from '../components/posts/CreatePost';
import TrendingSidebar from '../components/trending/TrendingSidebar';
import { Filter, Loader2, RefreshCw } from 'lucide-react';

const Feed = () => {
    const { posts, loading, filter, setFilter } = usePosts();
    const { userProfile } = useAuth();
    const [refreshing, setRefreshing] = useState(false);

    const filterOptions = useMemo(() => [
        { value: 'campus', label: 'Campus-wide' },
        { value: 'faculty', label: userProfile?.faculty || 'Faculty' },
        { value: 'department', label: userProfile?.department || 'Department' }
    ], [userProfile]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        // Small delay to show refresh animation
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    return (
        <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
            <div className="flex gap-6">
                {/* Main Feed */}
                <div className="flex-1 min-w-0">
                    {/* Create Post */}
                    <CreatePost />

                    {/* Filter Bar */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 mb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Filter className="w-5 h-5 text-gray-500" />
                                    <span className="text-sm font-medium text-gray-700">Filter:</span>
                                </div>
                                <button
                                    onClick={handleRefresh}
                                    className={`sm:hidden p-2 rounded-full hover:bg-gray-100 transition-colors ${refreshing ? 'animate-spin' : ''}`}
                                    disabled={refreshing}
                                >
                                    <RefreshCw className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 -mx-1 px-1 sm:mx-0 sm:px-0">
                                {filterOptions.map(option => (
                                    <button
                                        key={option.value}
                                        onClick={() => setFilter(option.value)}
                                        className={`px-3 py-1.5 text-sm rounded-full transition-colors whitespace-nowrap flex-shrink-0 ${filter === option.value
                                            ? 'bg-primary-100 text-primary-700 font-medium'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                                <button
                                    onClick={handleRefresh}
                                    className={`hidden sm:flex p-2 rounded-full hover:bg-gray-100 transition-colors ml-auto ${refreshing ? 'animate-spin' : ''}`}
                                    disabled={refreshing}
                                >
                                    <RefreshCw className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Posts List */}
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">📝</span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
                            <p className="text-gray-600">
                                Be the first to share something with your campus community!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {posts.map(post => (
                                <PostCard key={post.id} post={post} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="hidden lg:block w-80">
                    <TrendingSidebar />
                </div>
            </div>
        </div>
    );
};

export default Feed;
