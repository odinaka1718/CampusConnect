/**
 * Format a date to a relative time string (e.g., "2 hours ago")
 * @param {Date|Object} date - The date to format (can be Date object or Firestore Timestamp)
 * @returns {string} Formatted relative time string
 */
export const formatDistanceToNow = (date) => {
    if (!date) return 'Just now';

    // Handle Firestore Timestamp objects
    let dateObj = date;
    if (date && typeof date.toDate === 'function') {
        dateObj = date.toDate();
    }

    // Check if the date is valid
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
        return 'Just now';
    }

    const now = new Date();
    const diffInSeconds = Math.floor((now - dateObj) / 1000);

    // Handle future dates or very recent
    if (diffInSeconds < 0 || diffInSeconds < 60) {
        return 'Just now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours}h ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
        return `${diffInDays}d ago`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
        return `${diffInWeeks}w ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
        return `${diffInMonths}mo ago`;
    }

    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears}y ago`;
};

// Alias for backwards compatibility
export const formatRelativeTime = formatDistanceToNow;

/**
 * Format a date to a full date string
 * @param {Date|Object} date - The date to format (can be Date object or Firestore Timestamp)
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
    if (!date) return 'Unknown date';

    // Handle Firestore Timestamp objects
    let dateObj = date;
    if (date && typeof date.toDate === 'function') {
        dateObj = date.toDate();
    }

    // Check if the date is valid
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
        return 'Unknown date';
    }

    return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

/**
 * Format a date to a time string
 * @param {Date} date - The date to format
 * @returns {string} Formatted time string
 */
export const formatTime = (date) => {
    if (!date) return 'Unknown time';

    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
    });
};
