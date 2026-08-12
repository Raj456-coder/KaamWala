# KaamWala

India's trusted platform to instantly find verified local workers — electricians, plumbers, painters, carpenters, AC repair, drivers, maids, mechanics, tutors and more.

## Features

- **Worker Discovery**: Search and browse verified local professionals by category, rating, and location
- **Booking System**: Book services with date/time selection, real-time worker notifications
- **AI-Powered Search**: Natural language search ("My AC is not cooling" → AC Repair)
- **Smart Worker Ranking**: Workers ranked by verification, availability, rating, experience, and reviews
- **Payment Integration**: Razorpay test-mode payment for booking advances
- **Worker Dashboard**: Track earnings, accept/reject bookings, manage availability
- **Customer Dashboard**: Manage bookings, save favorite workers, leave reviews
- **Notification Center**: In-app notifications for all booking and payment events
- **Admin Dashboard**: Read-only platform statistics and user management
- **Demo Mode**: Toggle to view the platform with sample data — perfect for demos
- **PWA Support**: Installable web app with offline service worker
- **Responsive Design**: Works on mobile, tablet, and desktop

## Tech Stack

- **Next.js 16** (Turbopack, React 19)
- **TypeScript 5**
- **Tailwind CSS 4**
- **Framer Motion 12** (animations)
- **Lucide React** (icons)
- **Firebase** (Auth, Firestore, Storage)
- **Razorpay** (payments — test mode)

## Installation

```bash
git clone <repo-url>
cd kaamwala
npm install
```

## Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id
```

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Enable **Authentication** (Email/Password, Google)
4. Create a **Firestore Database** in test mode
5. Copy the config values to `.env.local`
6. (Optional) Enable **Storage** for file uploads

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /workers/{workerId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == workerId;
    }
    match /bookings/{bookingId} {
      allow read, write: if request.auth != null &&
        (resource.data.customerId == request.auth.uid ||
         resource.data.workerId == request.auth.uid);
    }
    match /payments/{paymentId} {
      allow read, write: if request.auth != null &&
        (resource.data.customerId == request.auth.uid ||
         resource.data.workerId == request.auth.uid);
    }
    match /notifications/{notificationId} {
      allow read: if request.auth != null;
      allow update: if request.auth != null &&
        resource.data.userId == request.auth.uid;
    }
  }
}
```

## Build & Run

```bash
npm run dev      # Development server
npm run build    # Production build
npm start        # Start production server
npm run lint     # Run ESLint
```

## Folder Structure

```
src/
├── app/                    # Next.js 16 app router pages
│   ├── admin/             # Admin dashboard (read-only)
│   ├── become-worker/     # 5-step worker onboarding form
│   ├── categories/        # Category listing
│   ├── category/[slug]/   # Category detail page
│   ├── customer-dashboard/# Customer dashboard (bookings, payments, reviews)
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   ├── role-select/       # Role selection after registration
│   ├── search/            # Worker search with AI filters
│   ├── worker-dashboard/   # Worker dashboard (earnings, bookings)
│   ├── workers/[id]/      # Worker profile page
│   ├── error.tsx          # Global error page
│   ├── not-found.tsx      # 404 page
│   └── layout.tsx         # Root layout (metadata, providers)
├── components/
│   ├── booking/           # Booking dialog, status badges
│   ├── demo/              # Demo mode toggle
│   ├── home/              # Homepage sections
│   ├── layout/            # Service worker registration
│   ├── notifications/     # Notification center
│   ├── search/            # Search filters, AI suggestions, filter chips
│   ├── sections/          # Navbar, Footer, Hero, CategoryCards
│   ├── ui/                # Button, Badge, LoadingSkeleton
│   └── workers/           # WorkerScore component
├── constants/             # Demo data, professions list
├── context/               # AuthContext, ThemeContext
├── hooks/                 # useAuth, useDemoMode, useLocation
├── lib/                   # Firebase config, utils, types
├── services/              # Firestore, booking, payment, notification, AI search services
└── types/                 # TypeScript type definitions
```

## Demo Mode

Toggle Demo Mode using the floating switch on the homepage. When enabled, all data is served from static demo fixtures instead of Firestore — perfect for hackathons and investor demos without requiring a live Firebase project.

## Future Roadmap

- Real-time chat between customers and workers
- Live location tracking for workers
- Advanced analytics dashboard with charts
- Multi-language support (i18n)
- Worker verification through government ID OCR
- Mobile app (React Native)

## License

This project is proprietary software developed for KaamWala.
