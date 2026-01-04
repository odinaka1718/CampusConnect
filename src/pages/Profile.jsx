import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { generateSmartBio } from '../services/aiService';
import { storage, db } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import PostCard from '../components/posts/PostCard';
import { User, Mail, Building, BookOpen, Hash, Edit2, Save, Loader2, Sparkles, X, Camera, Check, FileText } from 'lucide-react';

const Profile = () => {
    const { user, userProfile, updateProfile } = useAuth();
    const fileInputRef = useRef(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [bio, setBio] = useState('');
    const [interests, setInterests] = useState('');
    const [bioTone, setBioTone] = useState('casual');
    const [showAiModal, setShowAiModal] = useState(false);

    // Profile edit fields
    const [editFullName, setEditFullName] = useState('');
    const [editUsername, setEditUsername] = useState('');
    const [profileSaveLoading, setProfileSaveLoading] = useState(false);

    // User posts
    const [userPosts, setUserPosts] = useState([]);
    const [postsLoading, setPostsLoading] = useState(true);

    useEffect(() => {
        if (userProfile) {
            setBio(userProfile.bio_text || '');
            setEditFullName(userProfile.full_name || '');
            setEditUsername(userProfile.username || '');
        }
    }, [userProfile]);

    // Fetch user's posts
    useEffect(() => {
        const fetchUserPosts = async () => {
            if (!user) return;

            setPostsLoading(true);
            try {
                // Query posts by author_id only, then filter visible ones
                const postsQuery = query(
                    collection(db, 'posts'),
                    where('author_id', '==', user.uid),
                    orderBy('timestamp', 'desc')
                );

                const snapshot = await getDocs(postsQuery);
                const posts = snapshot.docs
                    .map(docSnap => ({
                        id: docSnap.id,
                        ...docSnap.data(),
                        author: userProfile // Use current user's profile
                    }))
                    .filter(post => post.is_visible !== false); // Filter out hidden posts

                setUserPosts(posts);
            } catch (err) {
                console.error('Error fetching user posts:', err);
            } finally {
                setPostsLoading(false);
            }
        };

        fetchUserPosts();
    }, [user, userProfile]);

    const handleSaveBio = async () => {
        setLoading(true);
        try {
            await updateProfile({ bio_text: bio });
            setIsEditing(false);
        } catch (err) {
            console.error('Error saving bio:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!editFullName.trim() || !editUsername.trim()) return;

        setProfileSaveLoading(true);
        try {
            await updateProfile({
                full_name: editFullName.trim(),
                username: editUsername.trim().toLowerCase()
            });
            setIsEditingProfile(false);
        } catch (err) {
            console.error('Error saving profile:', err);
        } finally {
            setProfileSaveLoading(false);
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        // Validate file
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be less than 5MB');
            return;
        }

        setUploadingPhoto(true);
        try {
            const storageRef = ref(storage, `profile_photos/${user.uid}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            await updateProfile({ profile_photo: downloadURL });
        } catch (err) {
            console.error('Error uploading photo:', err);
            alert('Failed to upload photo');
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleGenerateBio = async () => {
        if (!interests.trim()) return;

        setAiLoading(true);
        try {
            const generatedBio = await generateSmartBio({
                name: userProfile.full_name,
                faculty: userProfile.faculty,
                department: userProfile.department,
                interests,
                tone: bioTone
            });
            setBio(generatedBio);
            setShowAiModal(false);
            setIsEditing(true);
        } catch (err) {
            console.error('Error generating bio:', err);
        } finally {
            setAiLoading(false);
        }
    };

    if (!userProfile) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            {/* Profile Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Banner */}
                <div className="h-32 bg-gradient-to-r from-primary-500 to-primary-700" />

                {/* Avatar & Name */}
                <div className="px-6 pb-6">
                    <div className="-mt-16 mb-4 relative w-fit">
                        {userProfile.profile_photo ? (
                            <img
                                src={userProfile.profile_photo}
                                alt={userProfile.full_name}
                                className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-lg"
                            />
                        ) : (
                            <div className="w-32 h-32 rounded-full border-4 border-white bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                                {userProfile.full_name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                        )}

                        {/* Photo upload button */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingPhoto}
                            className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                            {uploadingPhoto ? (
                                <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                            ) : (
                                <Camera className="w-5 h-5 text-gray-600" />
                            )}
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                        />
                    </div>

                    <div className="flex items-start justify-between">
                        {isEditingProfile ? (
                            <div className="flex-1 space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={editFullName}
                                        onChange={(e) => setEditFullName(e.target.value)}
                                        className="input-field"
                                        placeholder="Enter your full name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                    <div className="flex items-center">
                                        <span className="text-gray-500 mr-1">@</span>
                                        <input
                                            type="text"
                                            value={editUsername}
                                            onChange={(e) => setEditUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                                            className="input-field flex-1"
                                            placeholder="username"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setIsEditingProfile(false);
                                            setEditFullName(userProfile.full_name || '');
                                            setEditUsername(userProfile.username || '');
                                        }}
                                        className="btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={profileSaveLoading || !editFullName.trim() || !editUsername.trim()}
                                        className="btn-primary flex items-center gap-2"
                                    >
                                        {profileSaveLoading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Check className="w-4 h-4" />
                                        )}
                                        Save
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{userProfile.full_name || 'No Name Set'}</h1>
                                    <p className="text-gray-500">@{userProfile.username || 'unknown'}</p>
                                </div>
                                <button
                                    onClick={() => setIsEditingProfile(true)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Edit profile"
                                >
                                    <Edit2 className="w-5 h-5 text-gray-500" />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Bio */}
                    <div className="mt-4">
                        {isEditing ? (
                            <div className="space-y-3">
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Write something about yourself..."
                                    className="input-field min-h-[100px] resize-none"
                                    maxLength={150}
                                />
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">{bio.length}/150</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowAiModal(true)}
                                            className="btn-secondary flex items-center gap-2"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            AI Generate
                                        </button>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="btn-secondary"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveBio}
                                            disabled={loading}
                                            className="btn-primary flex items-center gap-2"
                                        >
                                            {loading ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Save className="w-4 h-4" />
                                            )}
                                            Save
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start justify-between">
                                <p className="text-gray-700">
                                    {userProfile.bio_text || 'No bio yet. Click edit to add one!'}
                                </p>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <Edit2 className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Profile Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Details</h2>

                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                            <Mail className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-medium text-gray-900">{userProfile.email}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                            <Hash className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Registration Number</p>
                            <p className="font-medium text-gray-900">{userProfile.reg_number}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                            <Building className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Faculty</p>
                            <p className="font-medium text-gray-900">{userProfile.faculty}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Department</p>
                            <p className="font-medium text-gray-900">{userProfile.department}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* My Posts Section */}
            <div className="mt-6">
                <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-primary-600" />
                    <h2 className="text-lg font-semibold text-gray-900">My Posts</h2>
                    <span className="text-sm text-gray-500">({userPosts.length})</span>
                </div>

                {postsLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                    </div>
                ) : userPosts.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
                        <p className="text-gray-500">
                            Share your first post with the campus community!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {userPosts.map(post => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>
                )}
            </div>

            {/* AI Bio Modal */}
            {showAiModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-primary-600" />
                                SmartBio Generator
                            </h3>
                            <button
                                onClick={() => setShowAiModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Your interests & hobbies
                                </label>
                                <textarea
                                    value={interests}
                                    onChange={(e) => setInterests(e.target.value)}
                                    placeholder="e.g., coding, basketball, music, reading..."
                                    className="input-field min-h-[80px] resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tone
                                </label>
                                <div className="flex gap-2">
                                    {['casual', 'professional', 'fun'].map(tone => (
                                        <button
                                            key={tone}
                                            onClick={() => setBioTone(tone)}
                                            className={`px-4 py-2 rounded-lg text-sm capitalize ${bioTone === tone
                                                ? 'bg-primary-100 text-primary-700 font-medium'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            {tone}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleGenerateBio}
                                disabled={aiLoading || !interests.trim()}
                                className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                            >
                                {aiLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        Generate Bio
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
