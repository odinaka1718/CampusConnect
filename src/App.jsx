import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PostsProvider } from './contexts/PostsContext';
import { TrendingProvider } from './contexts/TrendingContext';

// Layout
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Auth Pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';

// Main Pages
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import Discover from './pages/Discover';
import HashtagPosts from './pages/HashtagPosts';
import PostView from './pages/PostView';

function App() {
  return (
    <Router>
      <AuthProvider>
        <PostsProvider>
          <TrendingProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Protected Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<Feed />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/discover" element={<Discover />} />
                <Route path="/hashtag/:tag" element={<HashtagPosts />} />
                <Route path="/post/:postId" element={<PostView />} />
              </Route>

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </TrendingProvider>
        </PostsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
