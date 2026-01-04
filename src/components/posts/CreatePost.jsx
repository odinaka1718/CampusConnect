import { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePosts } from '../../contexts/PostsContext';
import { polishPost } from '../../services/aiService';
import { storage } from '../../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Send, Sparkles, Loader2, X, Wand2, Globe, Users, Building2, ChevronDown, Image, Trash2 } from 'lucide-react';

const CreatePost = () => {
    const { user, userProfile } = useAuth();
    const { createPost } = usePosts();
    const fileInputRef = useRef(null);
    const [content, setContent] = useState('');
    const [scope, setScope] = useState('campus');
    const [showScopeMenu, setShowScopeMenu] = useState(false);
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [showPolishOptions, setShowPolishOptions] = useState(false);

    // Image upload state
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    const scopeOptions = [
        { value: 'campus', label: 'Campus', icon: Globe, description: 'Visible to everyone', color: 'text-emerald-600' },
        { value: 'faculty', label: userProfile?.faculty || 'Faculty', icon: Users, description: 'Visible to your faculty', color: 'text-blue-600' },
        { value: 'department', label: userProfile?.department || 'Department', icon: Building2, description: 'Visible to your department', color: 'text-purple-600' }
    ];

    const currentScope = scopeOptions.find(s => s.value === scope);

    const handleImageSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be less than 5MB');
            return;
        }

        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const uploadImage = async () => {
        if (!imageFile || !user) return null;

        const fileName = `${Date.now()}_${imageFile.name}`;
        const storageRef = ref(storage, `post_images/${user.uid}/${fileName}`);
        await uploadBytes(storageRef, imageFile);
        return await getDownloadURL(storageRef);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if ((!content.trim() && !imageFile) || loading || !user) return;

        setLoading(true);
        try {
            let imageUrl = null;
            if (imageFile) {
                setUploadingImage(true);
                imageUrl = await uploadImage();
                setUploadingImage(false);
            }

            await createPost(content.trim(), scope, imageUrl);
            setContent('');
            setScope('campus');
            removeImage();
        } catch (err) {
            console.error('Error creating post:', err);
        } finally {
            setLoading(false);
            setUploadingImage(false);
        }
    };

    const handlePolish = async (enhancement) => {
        if (!content.trim() || aiLoading) return;

        setAiLoading(true);
        setShowPolishOptions(false);
        try {
            const polishedContent = await polishPost(content, enhancement);
            setContent(polishedContent);
        } catch (err) {
            console.error('Error polishing post:', err);
        } finally {
            setAiLoading(false);
        }
    };

    const polishOptions = [
        { value: 'grammar', label: '✨ Fix Grammar', desc: 'Correct spelling and grammar' },
        { value: 'professional', label: '💼 Professional', desc: 'Make it more formal' },
        { value: 'casual', label: '😊 Casual', desc: 'Make it more friendly' },
        { value: 'fun', label: '🎉 Fun', desc: 'Add some personality' }
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4 mb-4">
            <div className="flex gap-2 sm:gap-3">
                {/* Avatar */}
                {userProfile?.profile_photo ? (
                    <img
                        src={userProfile.profile_photo}
                        alt={userProfile.full_name}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0"
                    />
                ) : (
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold flex-shrink-0 text-sm sm:text-base">
                        {userProfile?.full_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                )}

                {/* Input */}
                <div className="flex-1 min-w-0">
                    <form onSubmit={handleSubmit}>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="What's happening on campus?"
                            className="w-full border-0 resize-none focus:ring-0 text-gray-900 placeholder-gray-500 min-h-[60px] sm:min-h-[80px] text-sm sm:text-base"
                            maxLength={500}
                        />

                        {/* Image Preview */}
                        {imagePreview && (
                            <div className="relative mt-2 mb-3">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-full max-h-48 sm:max-h-64 object-cover rounded-lg"
                                />
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full transition-colors"
                                >
                                    <X className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        )}

                        {/* Character count and actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 gap-1">
                            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                                {/* Image Upload Button */}
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-1.5 sm:p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                    title="Add image"
                                >
                                    <Image className="w-5 h-5" />
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                    className="hidden"
                                />

                                {/* Scope Selector */}
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setShowScopeMenu(!showScopeMenu)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 ${currentScope?.color} bg-gray-50 hover:bg-gray-100 transition-colors`}
                                    >
                                        {currentScope && <currentScope.icon className="w-4 h-4" />}
                                        <span className="hidden sm:inline max-w-[100px] truncate">{currentScope?.label}</span>
                                        <ChevronDown className="w-3 h-3" />
                                    </button>

                                    {showScopeMenu && (
                                        <div className="absolute left-0 bottom-full mb-2 w-64 bg-white rounded-xl border border-gray-200 py-2 z-20 shadow-lg">
                                            <div className="px-3 py-2 border-b border-gray-100">
                                                <span className="text-xs font-medium text-gray-500 uppercase">Post visibility</span>
                                            </div>
                                            {scopeOptions.map(option => (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => {
                                                        setScope(option.value);
                                                        setShowScopeMenu(false);
                                                    }}
                                                    className={`w-full px-3 py-2.5 text-left flex items-center gap-3 hover:bg-gray-50 ${scope === option.value ? 'bg-violet-50' : ''
                                                        }`}
                                                >
                                                    <option.icon className={`w-5 h-5 ${option.color}`} />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium text-gray-900 truncate">{option.label}</div>
                                                        <div className="text-xs text-gray-500">{option.description}</div>
                                                    </div>
                                                    {scope === option.value && (
                                                        <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <span className={`text-xs sm:text-sm ${content.length > 450 ? 'text-orange-500' : 'text-gray-500'}`}>
                                    <span className="hidden sm:inline">{content.length}/500</span>
                                    <span className="sm:hidden">{content.length}</span>
                                </span>

                                {/* AI Polish Button */}
                                <div className="relative hidden sm:block">
                                    <button
                                        type="button"
                                        onClick={() => setShowPolishOptions(!showPolishOptions)}
                                        disabled={!content.trim() || aiLoading}
                                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {aiLoading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Wand2 className="w-4 h-4" />
                                        )}
                                        AI Polish
                                    </button>

                                    {/* Polish Options Dropdown */}
                                    {showPolishOptions && (
                                        <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 p-2 z-10">
                                            <div className="flex items-center justify-between mb-2 px-2">
                                                <span className="text-sm font-medium text-gray-700">Enhance your post</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPolishOptions(false)}
                                                    className="p-1 hover:bg-gray-100 rounded"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                            {polishOptions.map(option => (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => handlePolish(option.value)}
                                                    className="w-full px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                                                >
                                                    <span className="block font-medium text-gray-900">{option.label}</span>
                                                    <span className="text-xs text-gray-500">{option.desc}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={!content.trim() || loading}
                                className="btn-primary flex items-center gap-2"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                                Post
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreatePost;
