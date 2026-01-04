import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import PostCard from '../components/posts/PostCard';
import { Hash, ArrowLeft, Loader2 } from 'lucide-react';

const HashtagPosts = () => {
    const { tag } = useParams();
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    const hashtag = tag?.startsWith('#') ? tag : `#${tag}`;

    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            try {
                // Fetch all visible posts and filter by hashtag
                const postsQuery = query(
                    collection(db, 'posts'),
                    where('is_visible', '==', true),
                    orderBy('timestamp', 'desc')
                );

                const snapshot = await getDocs(postsQuery);
                const allPosts = snapshot.docs.map(docSnap => ({
                    id: docSnap.id,
                    ...docSnap.data()
                }));

                // Filter posts containing the hashtag
                const filteredPosts = allPosts.filter(post => {
                    const content = post.content?.toLowerCase() || '';
                    return content.includes(hashtag.toLowerCase());
                });

                // Fetch author data for each post
                const postsWithAuthors = await Promise.all(
                    filteredPosts.map(async (post) => {
                        try {
                            const authorDoc = await getDoc(doc(db, 'users', post.author_id));
                            if (authorDoc.exists()) {
                                return { ...post, author: authorDoc.data() };
                            }
                        } catch (err) {
                            console.error('Error fetching author:', err);
                        }
                        return post;
                    })
                );

                setPosts(postsWithAuthors);
            } catch (err) {
                console.error('Error fetching hashtag posts:', err);
            } finally {
                setLoading(false);
            }
        };

        if (tag) {
            fetchPosts();
        }
    }, [tag, hashtag]);

    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                </button>

                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <Hash className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{hashtag}</h1>
                        <p className="text-gray-500 text-sm">
                            {loading ? 'Loading...' : `${posts.length} post${posts.length !== 1 ? 's' : ''}`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Posts */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
                </div>
            ) : posts.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Hash className="w-8 h-8 text-violet-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts found</h3>
                    <p className="text-gray-500">
                        No posts with {hashtag} yet. Be the first to post!
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
    );
};

export default HashtagPosts;
