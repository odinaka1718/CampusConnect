# CampusConnect 🎓

A scalable, campus-based social networking web application built for Nile University. CampusConnect creates a private, campus-fenced digital environment for verified university members.

![React](https://img.shields.io/badge/React-18-blue)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.0-teal)
![Vite](https://img.shields.io/badge/Vite-5.0-purple)

## ✨ Features

### 🔐 Domain-Restricted Authentication
- Only users with `@nileuniversity.edu.ng` email addresses can register
- Firebase Authentication for secure login and session management
- Password reset functionality

### 📝 Hierarchical Microblogging Feed
- Share short text updates with the campus community
- Filter posts by Campus, Faculty, or Department
- Real-time "Like" and "Comment" features powered by Firestore listeners

### 📈 Multi-Level Trending Discovery
- Campus-wide trending hashtags (Top 5)
- Faculty-specific trending topics
- Department-specific trending topics
- Auto-aggregated from recent 100 posts

### 🛡️ Community Safety & Auto-Moderation
- Users can flag inappropriate content
- Automatic hiding when a post receives 5 reports
- Firestore Triggers for instant moderation

### 🤖 AI Integration (Firebase AI/Gemini)
- **SmartBio**: Generate engaging bios using AI
- **AI Polish**: Fix grammar, enhance tone, or make posts more fun

## 🏗️ Architecture

### MVVM Pattern
- **Model**: Firestore documents (Users, Posts, Reports)
- **View**: React.js components with Tailwind CSS
- **ViewModel**: React Hooks and Context API for state management

### Tech Stack
- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Cloud Functions)
- **AI**: Google Gemini 1.5 Flash

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Firebase CLI
- A Firebase project with Firestore and Authentication enabled

### Installation

1. Clone the repository:
```bash
cd CampusConnect
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Configure your `.env` file with Firebase credentials:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GEMINI_API_KEY=your_gemini_api_key
```

4. Start the development server:
```bash
npm run dev
```

### Deploying Cloud Functions

1. Install function dependencies:
```bash
cd functions
npm install
```

2. Deploy to Firebase:
```bash
firebase deploy --only functions
```

3. Deploy Firestore rules and indexes:
```bash
firebase deploy --only firestore
```

## 📁 Project Structure

```
CampusConnect/
├── src/
│   ├── components/
│   │   ├── auth/          # Protected route component
│   │   ├── layout/        # Navbar, MainLayout
│   │   ├── posts/         # CreatePost, PostCard
│   │   └── trending/      # TrendingSidebar
│   ├── config/
│   │   └── firebase.js    # Firebase configuration
│   ├── contexts/
│   │   ├── AuthContext.jsx
│   │   ├── PostsContext.jsx
│   │   └── TrendingContext.jsx
│   ├── pages/
│   │   ├── auth/          # Login, Signup, ForgotPassword
│   │   ├── Feed.jsx
│   │   ├── Profile.jsx
│   │   └── Discover.jsx
│   ├── services/
│   │   ├── aiService.js   # Gemini AI integration
│   │   └── commentsService.js
│   └── utils/
│       └── dateUtils.js
├── functions/
│   └── index.js           # Cloud Functions
├── firestore.rules        # Security rules
└── firestore.indexes.json # Database indexes
```

## 🔒 Database Schema

### Users Collection
| Field | Type | Description |
|-------|------|-------------|
| uid | string | Firebase Auth ID |
| username | string | Unique handle |
| full_name | string | User's full name |
| email | string | Verified university email |
| reg_number | string | Student registration number |
| faculty | string | Academic faculty |
| department | string | Specific department |
| bio_text | string | AI-generated or manual bio |

### Posts Collection
| Field | Type | Description |
|-------|------|-------------|
| id | string | Auto-generated ID |
| author_id | string | Reference to User |
| content | string | Post text content |
| faculty_id | string | For filtering |
| dept_id | string | For filtering |
| likes_count | number | Total likes |
| comments_count | number | Total comments |
| report_count | number | Auto-hide at 5 |
| is_visible | boolean | Visibility flag |
| timestamp | timestamp | Creation time |

## 🎯 Success Metrics

- ✅ 100% domain-verified users
- ✅ Page load under 2 seconds (Firestore caching)
- ✅ Real-time engagement features
- ✅ Multi-level trending discovery

## 📄 License

MIT License - See LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

Built with ❤️ for Nile University
