import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    doc,
    increment,
    serverTimestamp,
    getDocs,
    getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

const PostsContext = createContext(null);

export const PostsProvider = ({ children }) => {
    const { user, userProfile } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('campus'); // 'campus', 'faculty', 'department'
    const [error, setError] = useState(null);

    // Build query based on filter
    const getPostsQuery = useCallback(() => {
        // Campus filter: show all posts (campus scope) + posts from user's faculty/department
        if (filter === 'campus') {
            return query(
                collection(db, 'posts'),
                where('is_visible', '==', true),
                orderBy('timestamp', 'desc'),
                limit(50)
            );
        }

        // Faculty filter: show posts with scope='faculty' or 'department' from user's faculty
        if (filter === 'faculty' && userProfile?.faculty) {
            return query(
                collection(db, 'posts'),
                where('is_visible', '==', true),
                where('faculty_id', '==', userProfile.faculty),
                where('scope', 'in', ['faculty', 'department']),
                orderBy('timestamp', 'desc'),
                limit(50)
            );
        }

        // Department filter: show posts with scope='department' from user's department
        if (filter === 'department' && userProfile?.department) {
            return query(
                collection(db, 'posts'),
                where('is_visible', '==', true),
                where('dept_id', '==', userProfile.department),
                where('scope', '==', 'department'),
                orderBy('timestamp', 'desc'),
                limit(50)
            );
        }

        // Default fallback
        return query(
            collection(db, 'posts'),
            where('is_visible', '==', true),
            orderBy('timestamp', 'desc'),
            limit(50)
        );
    }, [filter, userProfile]);

    // Real-time posts listener
    useEffect(() => {
        if (!user) {
            setPosts([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const q = getPostsQuery();

        const unsubscribe = onSnapshot(
            q,
            async (snapshot) => {
                const postsData = [];

                for (const docSnapshot of snapshot.docs) {
                    const postData = { id: docSnapshot.id, ...docSnapshot.data() };

                    // Fetch author info
                    try {
                        const authorDoc = await getDoc(doc(db, 'users', postData.author_id));
                        if (authorDoc.exists()) {
                            postData.author = authorDoc.data();
                        }
                    } catch (err) {
                        console.error('Error fetching author:', err);
                    }

                    postsData.push(postData);
                }

                setPosts(postsData);
                setLoading(false);
            },
            (err) => {
                console.error('Error fetching posts:', err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user, getPostsQuery]);

    // Create a new post
    const createPost = useCallback(async (content, scope = 'campus', imageUrl = null) => {
        if (!user || !userProfile) {
            throw new Error('Must be logged in to create a post');
        }

        try {
            const postData = {
                author_id: user.uid,
                author_name: userProfile.full_name || user.displayName || 'Anonymous',
                content,
                scope,
                faculty_id: userProfile.faculty,
                dept_id: userProfile.department,
                likes_count: 0,
                comments_count: 0,
                report_count: 0,
                is_visible: true,
                timestamp: serverTimestamp()
            };

            // Add image URL if provided
            if (imageUrl) {
                postData.image_url = imageUrl;
            }

            const docRef = await addDoc(collection(db, 'posts'), postData);
            return docRef.id;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [user, userProfile]);

    // Like a post
    const likePost = useCallback(async (postId) => {
        if (!user) return;

        try {
            // Use user.uid as the document ID for easy lookup
            const likeRef = doc(db, 'posts', postId, 'likes', user.uid);
            const likeDoc = await getDoc(likeRef);

            if (likeDoc.exists()) {
                // Unlike - delete the like document
                await deleteDoc(likeRef);
                await updateDoc(doc(db, 'posts', postId), {
                    likes_count: increment(-1)
                });
            } else {
                // Like - create document with user.uid as ID
                await setDoc(likeRef, {
                    user_id: user.uid,
                    timestamp: serverTimestamp()
                });
                await updateDoc(doc(db, 'posts', postId), {
                    likes_count: increment(1)
                });
            }
        } catch (err) {
            console.error('Error toggling like:', err);
            throw err;
        }
    }, [user]);

    // Report a post
    const reportPost = useCallback(async (postId, reason) => {
        if (!user) return;

        try {
            // Add report
            await addDoc(collection(db, 'reports'), {
                post_id: postId,
                reporter_id: user.uid,
                reason,
                timestamp: serverTimestamp()
            });

            // Increment report count on post
            await updateDoc(doc(db, 'posts', postId), {
                report_count: increment(1)
            });
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [user]);

    // Check if user has liked a post
    const hasLikedPost = useCallback(async (postId) => {
        if (!user) return false;

        try {
            // Directly check document with user.uid as ID
            const likeRef = doc(db, 'posts', postId, 'likes', user.uid);
            const likeDoc = await getDoc(likeRef);
            return likeDoc.exists();
        } catch (err) {
            return false;
        }
    }, [user]);

    // Delete a post (only by author)
    const deletePost = useCallback(async (postId) => {
        if (!user) return;

        try {
            const postRef = doc(db, 'posts', postId);
            const postDoc = await getDoc(postRef);

            if (!postDoc.exists()) {
                throw new Error('Post not found');
            }

            // Verify user is the author
            if (postDoc.data().author_id !== user.uid) {
                throw new Error('You can only delete your own posts');
            }

            await deleteDoc(postRef);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }, [user]);

    const value = useMemo(() => ({
        posts,
        loading,
        error,
        filter,
        setFilter,
        createPost,
        likePost,
        reportPost,
        hasLikedPost,
        deletePost
    }), [posts, loading, error, filter, createPost, likePost, reportPost, hasLikedPost, deletePost]);

    return (
        <PostsContext.Provider value={value}>
            {children}
        </PostsContext.Provider>
    );
};

export const usePosts = () => {
    const context = useContext(PostsContext);
    if (!context) {
        throw new Error('usePosts must be used within a PostsProvider');
    }
    return context;
};

export default PostsContext;
