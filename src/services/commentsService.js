import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
    getDoc,
    doc
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Subscribe to comments for a post
 * @param {string} postId - The post ID
 * @param {function} callback - Callback function for updates
 * @returns {function} Unsubscribe function
 */
export const subscribeToComments = (postId, callback) => {
    const q = query(
        collection(db, 'posts', postId, 'comments'),
        orderBy('timestamp', 'asc')
    );

    return onSnapshot(q, async (snapshot) => {
        const comments = [];

        for (const docSnapshot of snapshot.docs) {
            const commentData = { id: docSnapshot.id, ...docSnapshot.data() };

            // Fetch author info
            try {
                const authorDoc = await getDoc(doc(db, 'users', commentData.author_id));
                if (authorDoc.exists()) {
                    commentData.author = authorDoc.data();
                }
            } catch (err) {
                console.error('Error fetching comment author:', err);
            }

            comments.push(commentData);
        }

        callback(comments);
    });
};

/**
 * Add a comment to a post
 * @param {string} postId - The post ID
 * @param {string} authorId - The comment author's user ID
 * @param {string} content - The comment content
 * @returns {Promise<string>} The new comment ID
 */
export const addComment = async (postId, authorId, content) => {
    const commentData = {
        author_id: authorId,
        content,
        timestamp: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'posts', postId, 'comments'), commentData);
    return docRef.id;
};

/**
 * Get comments count for a post
 * @param {string} postId - The post ID
 * @returns {Promise<number>} Comment count
 */
export const getCommentsCount = async (postId) => {
    const q = query(collection(db, 'posts', postId, 'comments'));
    const snapshot = await getDocs(q);
    return snapshot.size;
};

export default {
    subscribeToComments,
    addComment,
    getCommentsCount
};
