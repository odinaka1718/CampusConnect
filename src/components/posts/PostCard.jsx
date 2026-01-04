import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePosts } from '../../contexts/PostsContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from '../../utils/dateUtils';
import {
    Heart,
    MessageCircle,
    Flag,
    MoreHorizontal,
    Loader2,
    AlertTriangle,
    X,
    Share2,
    Trash2,
    Check
} from 'lucide-react';

const PostCard = ({ post }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { likePost, reportPost, hasLikedPost, deletePost } = usePosts();

    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(post.likes_count || 0);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportLoading, setReportLoading] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [copied, setCopied] = useState(false);

    // Check if current user is the post author
    const isOwnPost = user?.uid === post.author_id;

    // Check if user has liked the post
    useEffect(() => {
        const checkLiked = async () => {
            if (user) {
                const hasLiked = await hasLikedPost(post.id);
                setLiked(hasLiked);
            }
        };
        checkLiked();
    }, [user, post.id, hasLikedPost]);

    const handleLike = async () => {
        if (!user) return;

        // Optimistic update
        setLiked(!liked);
        setLikesCount(prev => liked ? prev - 1 : prev + 1);

        try {
            await likePost(post.id);
        } catch (err) {
            // Revert on error
            setLiked(liked);
            setLikesCount(post.likes_count || 0);
        }
    };

    const handleReport = async () => {
        if (!reportReason.trim()) return;

        setReportLoading(true);
        try {
            await reportPost(post.id, reportReason);
            setShowReportModal(false);
            setReportReason('');
        } catch (err) {
            console.error('Error reporting post:', err);
        } finally {
            setReportLoading(false);
        }
    };

    const handleDelete = async () => {
        setDeleteLoading(true);
        try {
            await deletePost(post.id);
            setShowDeleteConfirm(false);
        } catch (err) {
            console.error('Error deleting post:', err);
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleShare = async () => {
        const postUrl = `${window.location.origin}/p/${post.id}`;

        // Try native share first (mobile)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${post.author?.full_name || 'Someone'} on CampusConnect`,
                    url: postUrl
                });
                return;
            } catch (err) {
                // User cancelled or share failed, fall back to copy
                if (err.name !== 'AbortError') {
                    console.error('Share failed:', err);
                }
            }
        }

        // Fall back to copying to clipboard
        try {
            await navigator.clipboard.writeText(postUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Parse hashtags in content
    const renderContent = (content) => {
        const parts = content.split(/(#\w+)/g);
        return parts.map((part, index) => {
            if (part.startsWith('#')) {
                return (
                    <span
                        key={index}
                        className="text-violet-600 hover:underline cursor-pointer font-medium"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/hashtag/${part.slice(1)}`);
                        }}
                    >
                        {part}
                    </span>
                );
            }
            return part;
        });
    };

    const handleCardClick = (e) => {
        // Don't navigate if clicking on interactive elements
        if (e.target.closest('button') || e.target.closest('a') || e.target.closest('textarea') || e.target.closest('input')) {
            return;
        }
        navigate(`/post/${post.id}`);
    };

    return (
        <div
            onClick={handleCardClick}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
        >
            {/* Post Header */}
            <div className="p-3 sm:p-4 pb-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        {post.author?.profile_photo ? (
                            <img
                                src={post.author.profile_photo}
                                alt={post.author.full_name}
                                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0"
                            />
                        ) : (
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-sm sm:text-base flex-shrink-0">
                                {post.author?.full_name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        )}
                        <div className="min-w-0">
                            <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                                {post.author?.full_name || 'Unknown User'}
                            </h4>
                            <p className="text-xs sm:text-sm text-gray-500 truncate">
                                @{post.author?.username || 'unknown'} · {formatDistanceToNow(post.timestamp?.toDate?.() || new Date())}
                            </p>
                        </div>
                    </div>

                    {/* Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <MoreHorizontal className="w-5 h-5 text-gray-500" />
                        </button>

                        {showMenu && (
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                                {isOwnPost ? (
                                    <button
                                        onClick={() => {
                                            setShowMenu(false);
                                            setShowDeleteConfirm(true);
                                        }}
                                        className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete Post
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setShowMenu(false);
                                            setShowReportModal(true);
                                        }}
                                        className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                        <Flag className="w-4 h-4" />
                                        Report Post
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Post Content */}
            <div className="p-3 sm:p-4">
                <p className="text-gray-900 whitespace-pre-wrap text-sm sm:text-base">
                    {renderContent(post.content)}
                </p>
            </div>

            {/* Post Image */}
            {post.image_url && (
                <div className="px-3 sm:px-4 pb-2">
                    <img
                        src={post.image_url}
                        alt="Post image"
                        className="w-full rounded-lg object-cover max-h-72 sm:max-h-96"
                    />
                </div>
            )}

            {/* Post Meta (Faculty/Department badge) */}
            <div className="px-3 sm:px-4 pb-2">
                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    {post.dept_id || post.faculty_id || 'Campus'}
                </span>
            </div>

            {/* Actions */}
            <div className="px-3 sm:px-4 py-2 sm:py-3 border-t border-gray-100 flex items-center gap-4 sm:gap-6">
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-1.5 sm:gap-2 transition-colors ${liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                        }`}
                >
                    <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                    <span className="text-sm">{likesCount}</span>
                </button>

                <div className="flex items-center gap-1.5 sm:gap-2 text-gray-500">
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm">{post.comments_count || 0}</span>
                </div>

                <button
                    onClick={handleShare}
                    className="flex items-center gap-2 text-gray-500 hover:text-primary-600 transition-colors"
                    title={copied ? 'Link copied!' : 'Share post'}
                >
                    {copied ? (
                        <Check className="w-5 h-5 text-green-500" />
                    ) : (
                        <Share2 className="w-5 h-5" />
                    )}
                </button>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6">
                        <div className="flex items-center justify-center mb-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <Trash2 className="w-6 h-6 text-red-600" />
                            </div>
                        </div>

                        <h3 className="text-lg font-semibold text-center text-gray-900 mb-2">
                            Delete Post?
                        </h3>
                        <p className="text-gray-600 text-center mb-6">
                            This action cannot be undone. The post will be permanently deleted.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 btn-secondary"
                                disabled={deleteLoading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleteLoading}
                                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {deleteLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Report Modal */}
            {showReportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2 text-red-600">
                                <AlertTriangle className="w-5 h-5" />
                                Report Post
                            </h3>
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-gray-600 mb-4">
                            Help us understand what's wrong with this post. Your report will be reviewed by our moderation team.
                        </p>

                        <textarea
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            placeholder="Describe why you're reporting this post..."
                            className="input-field min-h-[100px] resize-none mb-4"
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowReportModal(false)}
                                className="flex-1 btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReport}
                                disabled={reportLoading || !reportReason.trim()}
                                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {reportLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Flag className="w-4 h-4" />
                                )}
                                Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PostCard;
