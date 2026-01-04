import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { usePosts } from '../contexts/PostsContext';
import { subscribeToComments, addComment } from '../services/commentsService';
import { formatDistanceToNow } from '../utils/dateUtils';
import {
    ArrowLeft,
    Loader2,
    Heart,
    MessageCircle,
    Share2,
    Check,
    MoreHorizontal,
    Trash2,
    Flag,
    AlertTriangle,
    X,
    Send
} from 'lucide-react';

const PostView = () => {
    const { postId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { likePost, reportPost, hasLikedPost, deletePost } = usePosts();

    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Post interactions
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [copied, setCopied] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportLoading, setReportLoading] = useState(false);

    // Comments
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [commentLoading, setCommentLoading] = useState(false);

    const isOwnPost = user?.uid === post?.author_id;

    // Fetch post data
    useEffect(() => {
        const fetchPost = async () => {
            setLoading(true);
            setError(null);

            try {
                const postRef = doc(db, 'posts', postId);
                const postDoc = await getDoc(postRef);

                if (!postDoc.exists()) {
                    setError('Post not found');
                    return;
                }

                const postData = { id: postDoc.id, ...postDoc.data() };

                if (!postData.is_visible) {
                    setError('This post is no longer available');
                    return;
                }

                // Fetch author info
                try {
                    const authorDoc = await getDoc(doc(db, 'users', postData.author_id));
                    if (authorDoc.exists()) {
                        postData.author = authorDoc.data();
                    }
                } catch (err) {
                    console.error('Error fetching author:', err);
                }

                setPost(postData);
                setLikesCount(postData.likes_count || 0);
            } catch (err) {
                console.error('Error fetching post:', err);
                setError('Failed to load post');
            } finally {
                setLoading(false);
            }
        };

        if (postId) {
            fetchPost();
        }
    }, [postId]);

    // Check if user has liked the post
    useEffect(() => {
        const checkLiked = async () => {
            if (user && post) {
                const hasLiked = await hasLikedPost(post.id);
                setLiked(hasLiked);
            }
        };
        checkLiked();
    }, [user, post, hasLikedPost]);

    // Subscribe to comments
    useEffect(() => {
        if (!postId) return;

        const unsubscribe = subscribeToComments(postId, (newComments) => {
            setComments(newComments);
        });

        return () => unsubscribe();
    }, [postId]);

    const handleLike = async () => {
        if (!user || !post) return;

        setLiked(!liked);
        setLikesCount(prev => liked ? prev - 1 : prev + 1);

        try {
            await likePost(post.id);
        } catch (err) {
            setLiked(liked);
            setLikesCount(post.likes_count || 0);
        }
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !user) return;

        setCommentLoading(true);
        try {
            await addComment(postId, user.uid, newComment.trim());
            setNewComment('');
        } catch (err) {
            console.error('Error adding comment:', err);
        } finally {
            setCommentLoading(false);
        }
    };

    const handleShare = async () => {
        const postUrl = `${window.location.origin}/p/${id}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${post?.author?.full_name || 'Someone'} on CampusConnect`,
                    url: postUrl
                });
                return;
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Share failed:', err);
                }
            }
        }

        try {
            await navigator.clipboard.writeText(postUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleDelete = async () => {
        setDeleteLoading(true);
        try {
            await deletePost(post.id);
            navigate('/');
        } catch (err) {
            console.error('Error deleting post:', err);
        } finally {
            setDeleteLoading(false);
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

    // Parse hashtags in content
    const renderContent = (content) => {
        if (!content) return null;
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

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-6">
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-6">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Feed
                </button>

                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">😕</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{error}</h3>
                    <p className="text-gray-500 mb-4">
                        The post you're looking for might have been deleted or is no longer available.
                    </p>
                    <button onClick={() => navigate('/')} className="btn-primary">
                        Go to Feed
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            {/* Header */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
            >
                <ArrowLeft className="w-5 h-5" />
                Back
            </button>

            {/* Post Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Post Header */}
                <div className="p-4 pb-0">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            {post?.author?.profile_photo ? (
                                <img
                                    src={post.author.profile_photo}
                                    alt={post.author.full_name}
                                    className="w-12 h-12 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-lg">
                                    {post?.author?.full_name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            )}
                            <div>
                                <h4 className="font-semibold text-gray-900 text-lg">
                                    {post?.author?.full_name || 'Unknown User'}
                                </h4>
                                <p className="text-sm text-gray-500">
                                    @{post?.author?.username || 'unknown'} · {formatDistanceToNow(post?.timestamp)}
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
                <div className="p-4">
                    <p className="text-gray-900 whitespace-pre-wrap text-lg leading-relaxed">
                        {renderContent(post?.content)}
                    </p>
                </div>

                {/* Post Image */}
                {post?.image_url && (
                    <div className="px-4 pb-2">
                        <img
                            src={post.image_url}
                            alt="Post image"
                            className="w-full rounded-lg object-cover max-h-[500px]"
                        />
                    </div>
                )}

                {/* Post Meta */}
                <div className="px-4 pb-2">
                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        {post?.dept_id || post?.faculty_id || 'Campus'}
                    </span>
                </div>

                {/* Actions */}
                <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-6">
                    <button
                        onClick={handleLike}
                        className={`flex items-center gap-2 transition-colors ${liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                    >
                        <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                        <span className="text-sm">{likesCount}</span>
                    </button>

                    <div className="flex items-center gap-2 text-gray-500">
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm">{comments.length}</span>
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
            </div>

            {/* Comments Section */}
            <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">
                        Comments ({comments.length})
                    </h3>
                </div>

                {/* Comment Input */}
                <form onSubmit={handleComment} className="p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                            {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <button
                            type="submit"
                            disabled={!newComment.trim() || commentLoading}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-full transition-colors disabled:opacity-50"
                        >
                            {commentLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </form>

                {/* Comments List */}
                <div className="divide-y divide-gray-100">
                    {comments.length === 0 ? (
                        <div className="p-8 text-center">
                            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No comments yet</p>
                            <p className="text-gray-400 text-sm">Be the first to share your thoughts!</p>
                        </div>
                    ) : (
                        comments.map(comment => (
                            <div key={comment.id} className="p-4">
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white font-medium flex-shrink-0">
                                        {comment.author?.full_name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900">
                                                {comment.author?.full_name || 'Unknown'}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {formatDistanceToNow(comment.timestamp)}
                                            </span>
                                        </div>
                                        <p className="text-gray-700 mt-1">{comment.content}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
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

export default PostView;
