import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AuthContext = createContext(null);

// Nile University email domain validation
const VALID_EMAIL_DOMAIN = '@nileuniversity.edu.ng';

export const validateNileUniversityEmail = (email) => {
    return email.toLowerCase().endsWith(VALID_EMAIL_DOMAIN);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch user profile from Firestore
    const fetchUserProfile = useCallback(async (uid) => {
        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                setUserProfile({ id: userDoc.id, ...userDoc.data() });
            }
        } catch (err) {
            console.error('Error fetching user profile:', err);
        }
    }, []);

    // Listen to auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                await fetchUserProfile(currentUser.uid);
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [fetchUserProfile]);

    // Sign up new user
    const signup = async (email, password, profileData) => {
        setError(null);

        // Validate Nile University email
        if (!validateNileUniversityEmail(email)) {
            const err = new Error('Only Nile University email addresses (@nileuniversity.edu.ng) are allowed.');
            setError(err.message);
            throw err;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const { uid } = userCredential.user;

            // Create user profile in Firestore
            const userProfileData = {
                uid,
                email: email.toLowerCase(),
                username: profileData.username,
                full_name: profileData.full_name,
                reg_number: profileData.reg_number,
                faculty: profileData.faculty,
                department: profileData.department,
                bio_text: '',
                created_at: serverTimestamp(),
                updated_at: serverTimestamp()
            };

            await setDoc(doc(db, 'users', uid), userProfileData);

            // Send email verification
            await sendEmailVerification(userCredential.user);

            setUserProfile({ id: uid, ...userProfileData });
            return userCredential.user;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Sign in existing user
    const login = async (email, password) => {
        setError(null);

        if (!validateNileUniversityEmail(email)) {
            const err = new Error('Only Nile University email addresses are allowed.');
            setError(err.message);
            throw err;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            await fetchUserProfile(userCredential.user.uid);
            return userCredential.user;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Sign out
    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setUserProfile(null);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Password reset
    const resetPassword = async (email) => {
        setError(null);

        if (!validateNileUniversityEmail(email)) {
            const err = new Error('Only Nile University email addresses are allowed.');
            setError(err.message);
            throw err;
        }

        try {
            await sendPasswordResetEmail(auth, email);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    // Update user profile
    const updateProfile = async (updates) => {
        if (!user) return;

        try {
            const userRef = doc(db, 'users', user.uid);
            await setDoc(userRef, {
                ...updates,
                updated_at: serverTimestamp()
            }, { merge: true });

            await fetchUserProfile(user.uid);
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const value = {
        user,
        userProfile,
        loading,
        error,
        signup,
        login,
        logout,
        resetPassword,
        updateProfile,
        fetchUserProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
