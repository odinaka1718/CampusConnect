import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Home, TrendingUp, User, LogOut, Search } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
    const { user, userProfile, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            // Check if it's a hashtag search
            const query = searchQuery.trim();
            if (query.startsWith('#')) {
                navigate(`/hashtag/${query.slice(1)}`);
            } else {
                navigate(`/hashtag/${query}`);
            }
            setSearchQuery('');
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (err) {
            console.error('Error logging out:', err);
        }
    };

    const navLinks = [
        { path: '/', icon: Home, label: 'Feed' },
        { path: '/discover', icon: TrendingUp, label: 'Discover' },
        { path: '/profile', icon: User, label: 'Profile' }
    ];

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold">
                            CC
                        </div>
                        <span className="text-xl font-bold text-gray-900 hidden sm:block">
                            CampusConnect
                        </span>
                    </Link>

                    {/* Search Bar - Hidden on mobile */}
                    <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search hashtags... (e.g. #exams)"
                                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </form>

                    {/* Navigation Links */}
                    <div className="flex items-center gap-1">
                        {navLinks.map(link => {
                            const Icon = link.icon;
                            const isActive = location.pathname === link.path;
                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`p-2 rounded-lg transition-colors ${isActive
                                        ? 'text-primary-600 bg-primary-50'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                    title={link.label}
                                >
                                    <Icon className="w-6 h-6" />
                                </Link>
                            );
                        })}

                        {/* User Menu */}
                        <div className="relative ml-2">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-semibold">
                                    {userProfile?.full_name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            </button>

                            {showUserMenu && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                                    <div className="px-4 py-2 border-b border-gray-100">
                                        <p className="font-semibold text-gray-900">{userProfile?.full_name}</p>
                                        <p className="text-sm text-gray-500">@{userProfile?.username}</p>
                                    </div>

                                    <Link
                                        to="/profile"
                                        onClick={() => setShowUserMenu(false)}
                                        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                                    >
                                        <User className="w-4 h-4" />
                                        View Profile
                                    </Link>

                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
