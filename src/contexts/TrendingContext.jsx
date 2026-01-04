import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
    collection,
    query,
    orderBy,
    limit,
    getDocs,
    where
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

const TrendingContext = createContext(null);

export const TrendingProvider = ({ children }) => {
    const { userProfile } = useAuth();
    const [campusTrends, setCampusTrends] = useState([]);
    const [facultyTrends, setFacultyTrends] = useState([]);
    const [departmentTrends, setDepartmentTrends] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeScope, setActiveScope] = useState('campus');

    // Extract hashtags from text
    const extractHashtags = (text) => {
        const hashtagRegex = /#(\w+)/g;
        const matches = text.match(hashtagRegex);
        return matches ? matches.map(tag => tag.toLowerCase()) : [];
    };

    // Calculate trending hashtags from posts
    const calculateTrends = useCallback((posts) => {
        const hashtagCounts = {};

        posts.forEach(post => {
            const hashtags = extractHashtags(post.content || '');
            hashtags.forEach(tag => {
                hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
            });
        });

        // Sort by count and get top 5
        return Object.entries(hashtagCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([tag, count]) => ({ tag, count }));
    }, []);

    // Fetch trends for a specific scope
    const fetchTrends = useCallback(async () => {
        setLoading(true);

        try {
            // Campus-wide trends (posts with scope='campus' OR all posts visible to campus)
            const campusQuery = query(
                collection(db, 'posts'),
                where('is_visible', '==', true),
                where('scope', '==', 'campus'),
                orderBy('timestamp', 'desc'),
                limit(100)
            );
            const campusSnapshot = await getDocs(campusQuery);
            const campusPosts = campusSnapshot.docs.map(doc => doc.data());
            setCampusTrends(calculateTrends(campusPosts));

            // Faculty trends (posts with scope='faculty' AND matching faculty)
            if (userProfile?.faculty) {
                const facultyQuery = query(
                    collection(db, 'posts'),
                    where('is_visible', '==', true),
                    where('scope', '==', 'faculty'),
                    where('faculty_id', '==', userProfile.faculty),
                    orderBy('timestamp', 'desc'),
                    limit(100)
                );
                const facultySnapshot = await getDocs(facultyQuery);
                const facultyPosts = facultySnapshot.docs.map(doc => doc.data());
                setFacultyTrends(calculateTrends(facultyPosts));
            }

            // Department trends (posts with scope='department' AND matching department)
            if (userProfile?.department) {
                const deptQuery = query(
                    collection(db, 'posts'),
                    where('is_visible', '==', true),
                    where('scope', '==', 'department'),
                    where('dept_id', '==', userProfile.department),
                    orderBy('timestamp', 'desc'),
                    limit(100)
                );
                const deptSnapshot = await getDocs(deptQuery);
                const deptPosts = deptSnapshot.docs.map(doc => doc.data());
                setDepartmentTrends(calculateTrends(deptPosts));
            }
        } catch (err) {
            console.error('Error fetching trends:', err);
        } finally {
            setLoading(false);
        }
    }, [userProfile, calculateTrends]);

    // Fetch trends on mount and when user profile changes
    useEffect(() => {
        if (userProfile) {
            fetchTrends();
        }
    }, [userProfile, fetchTrends]);

    // Get current trends based on active scope
    const currentTrends = useMemo(() => {
        switch (activeScope) {
            case 'faculty':
                return facultyTrends;
            case 'department':
                return departmentTrends;
            default:
                return campusTrends;
        }
    }, [activeScope, campusTrends, facultyTrends, departmentTrends]);

    const value = useMemo(() => ({
        campusTrends,
        facultyTrends,
        departmentTrends,
        currentTrends,
        loading,
        activeScope,
        setActiveScope,
        refreshTrends: fetchTrends
    }), [campusTrends, facultyTrends, departmentTrends, currentTrends, loading, activeScope, fetchTrends]);

    return (
        <TrendingContext.Provider value={value}>
            {children}
        </TrendingContext.Provider>
    );
};

export const useTrending = () => {
    const context = useContext(TrendingContext);
    if (!context) {
        // Return safe defaults if used outside provider
        return {
            campusTrends: [],
            facultyTrends: [],
            departmentTrends: [],
            currentTrends: [],
            loading: false,
            activeScope: 'campus',
            setActiveScope: () => { },
            refreshTrends: () => { }
        };
    }
    return context;
};

export default TrendingContext;
