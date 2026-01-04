/**
 * Firebase Cloud Functions for CampusConnect
 * 
 * These functions handle:
 * 1. Automatic post moderation (auto-hide at 5 reports)
 * 2. Trending hashtag aggregation
 * 3. Comments count updates
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onDocumentWritten, onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

/**
 * Auto-moderate posts when report_count reaches 5
 * Triggered when a post document is updated
 */
export const autoModeratePost = onDocumentWritten('posts/{postId}', async (event) => {
    const after = event.data?.after?.data();
    const before = event.data?.before?.data();

    if (!after) return null; // Document was deleted

    // Check if report count just reached 5
    if (after.report_count >= 5 && after.is_visible === true) {
        logger.info(`Auto-hiding post ${event.params.postId} due to ${after.report_count} reports`);

        await event.data.after.ref.update({
            is_visible: false,
            hidden_at: FieldValue.serverTimestamp(),
            hidden_reason: 'auto_moderation'
        });

        return { success: true, action: 'post_hidden' };
    }

    return null;
});

/**
 * Update comments count when a new comment is added
 */
export const updateCommentsCount = onDocumentCreated('posts/{postId}/comments/{commentId}', async (event) => {
    const postRef = db.collection('posts').doc(event.params.postId);

    await postRef.update({
        comments_count: FieldValue.increment(1)
    });

    logger.info(`Updated comments count for post ${event.params.postId}`);
    return { success: true };
});

/**
 * Aggregate trending hashtags (runs every hour)
 * Parses the most recent 100 posts and counts hashtag frequency
 */
export const aggregateTrending = onSchedule('every 60 minutes', async (event) => {
    logger.info('Starting trending hashtag aggregation');

    try {
        // Get the most recent 100 visible posts
        const postsSnapshot = await db.collection('posts')
            .where('is_visible', '==', true)
            .orderBy('timestamp', 'desc')
            .limit(100)
            .get();

        // Hashtag counts by scope
        const campusTags = {};
        const facultyTags = {};
        const departmentTags = {};

        // Extract and count hashtags
        postsSnapshot.docs.forEach(doc => {
            const post = doc.data();
            const content = post.content || '';
            const hashtags = content.match(/#(\w+)/g) || [];

            hashtags.forEach(tag => {
                const normalizedTag = tag.toLowerCase();

                // Campus-wide
                campusTags[normalizedTag] = (campusTags[normalizedTag] || 0) + 1;

                // Faculty-specific
                if (post.faculty_id) {
                    if (!facultyTags[post.faculty_id]) facultyTags[post.faculty_id] = {};
                    facultyTags[post.faculty_id][normalizedTag] =
                        (facultyTags[post.faculty_id][normalizedTag] || 0) + 1;
                }

                // Department-specific
                if (post.dept_id) {
                    if (!departmentTags[post.dept_id]) departmentTags[post.dept_id] = {};
                    departmentTags[post.dept_id][normalizedTag] =
                        (departmentTags[post.dept_id][normalizedTag] || 0) + 1;
                }
            });
        });

        // Helper to get top 5 tags
        const getTop5 = (tagCounts) => {
            return Object.entries(tagCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([tag, count]) => ({ tag, count }));
        };

        // Save campus-wide trends
        await db.collection('trending').doc('campus').set({
            trends: getTop5(campusTags),
            updated_at: FieldValue.serverTimestamp()
        });

        // Save faculty trends
        for (const [faculty, tags] of Object.entries(facultyTags)) {
            await db.collection('trending').doc(`faculty_${faculty}`).set({
                faculty,
                trends: getTop5(tags),
                updated_at: FieldValue.serverTimestamp()
            });
        }

        // Save department trends
        for (const [dept, tags] of Object.entries(departmentTags)) {
            await db.collection('trending').doc(`dept_${dept}`).set({
                department: dept,
                trends: getTop5(tags),
                updated_at: FieldValue.serverTimestamp()
            });
        }

        logger.info('Trending aggregation completed successfully');
        return { success: true };
    } catch (error) {
        logger.error('Error aggregating trends:', error);
        throw error;
    }
});

/**
 * Clean up old reports (runs daily)
 * Removes reports older than 30 days
 */
export const cleanupOldReports = onSchedule('every 24 hours', async (event) => {
    logger.info('Starting old reports cleanup');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldReports = await db.collection('reports')
        .where('timestamp', '<', thirtyDaysAgo)
        .get();

    const batch = db.batch();
    oldReports.docs.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit();
    logger.info(`Cleaned up ${oldReports.size} old reports`);

    return { success: true, deleted: oldReports.size };
});

/**
 * Serve dynamic Open Graph meta tags for post link previews
 * This enables Twitter/Facebook-style link previews when sharing posts
 */
export const postPreview = onRequest({ cors: true }, async (req, res) => {
    const postId = req.query.id || req.path.split('/').pop();

    if (!postId) {
        res.redirect('https://campus-connect-d09f9.web.app/');
        return;
    }

    try {
        // Fetch the post
        const postDoc = await db.collection('posts').doc(postId).get();

        if (!postDoc.exists || !postDoc.data().is_visible) {
            res.redirect('https://campus-connect-d09f9.web.app/');
            return;
        }

        const post = postDoc.data();

        // Fetch author info
        let authorName = 'Someone';
        try {
            const authorDoc = await db.collection('users').doc(post.author_id).get();
            if (authorDoc.exists) {
                authorName = authorDoc.data().full_name || 'Someone';
            }
        } catch (e) {
            logger.warn('Could not fetch author:', e);
        }

        // Prepare content preview (first 150 chars)
        const contentPreview = post.content
            ? post.content.substring(0, 150) + (post.content.length > 150 ? '...' : '')
            : 'Check out this post on CampusConnect';

        const postUrl = `https://campus-connect-d09f9.web.app/post/${postId}`;
        const imageUrl = post.image_url || 'https://campus-connect-d09f9.web.app/campus-logo.svg';

        // Generate HTML with Open Graph meta tags
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${authorName} on CampusConnect</title>
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="${postUrl}">
    <meta property="og:title" content="${authorName} on CampusConnect">
    <meta property="og:description" content="${contentPreview.replace(/"/g, '&quot;')}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:site_name" content="CampusConnect">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="${post.image_url ? 'summary_large_image' : 'summary'}">
    <meta name="twitter:url" content="${postUrl}">
    <meta name="twitter:title" content="${authorName} on CampusConnect">
    <meta name="twitter:description" content="${contentPreview.replace(/"/g, '&quot;')}">
    <meta name="twitter:image" content="${imageUrl}">
    
    <!-- Redirect to actual app -->
    <meta http-equiv="refresh" content="0;url=${postUrl}">
    <script>window.location.href = "${postUrl}";</script>
</head>
<body>
    <p>Redirecting to <a href="${postUrl}">CampusConnect</a>...</p>
</body>
</html>`;

        res.set('Content-Type', 'text/html');
        res.status(200).send(html);
    } catch (error) {
        logger.error('Error generating post preview:', error);
        res.redirect('https://campus-connect-d09f9.web.app/');
    }
});
