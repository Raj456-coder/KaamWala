# Project Status

## Completed Sprints
- Sprint 1: Project setup, design system, basic pages (Home, About, Contact, FAQ, etc.)
- Sprint 2: Become Worker onboarding Step 1 (Personal Information form with validation)
- Sprint 3: Become Worker onboarding Step 2 (Professional Details form with validation)
- Sprint 5C.2A: Profession Selection section — searchable dropdown with profession icons
- Sprint 5C.2B: Multi-step navigation fix — Step 1 + Step 2 rendering, back/next navigation, step-aware buttons
- Sprint 5: Full onboarding flow — Steps 1-5 with all form fields, file uploads, localStorage draft, success screen
- Sprint 6: Backend Foundation + Authentication — Firebase init, Firestore schema, AuthContext, login/register/forgot-password/role-select/logout with Firebase Auth
- Sprint 7: Real Worker Marketplace — Firestore data fetching across all pages, search, filters, pagination, performance

## Current Sprint
- Sprint 8: Testing, polish, and edge-case handling

## Next Sprint
- Booking logic
- Payments

## Pending Features
- Booking logic (not implemented per sprint scope)
- Payments (not implemented per sprint scope)
- Dashboard functionality (not implemented per sprint scope)
- Notifications (not implemented per sprint scope)

## Modified Files
- `src/app/layout.tsx` — Wrapped children in AuthProvider
- `src/app/login/page.tsx` — Firebase Auth integration (email/password + Google)
- `src/app/register/page.tsx` — Firebase Auth + role selector (Customer/Worker)
- `src/app/forgot-password/page.tsx` — Firebase password reset
- `src/app/role-select/page.tsx` — Auth guard + Firestore role save
- `src/app/become-worker/page.tsx` — Saves to Firestore on submit, uploads files to Storage
- `src/app/page.tsx` — Fetches featured workers from Firestore
- `src/app/workers/page.tsx` — Fetches all workers from Firestore with Load More pagination
- `src/app/workers/[id]/page.tsx` — Fetches single worker from Firestore by ID
- `src/app/search/page.tsx` — Fetches from Firestore with live search, filters, pagination
- `src/app/categories/page.tsx` — Fetches categories from Firestore
- `src/app/category/[slug]/page.tsx` — Fetches category and workers from Firestore
- `src/components/sections/CategoryCards.tsx` — Fetches categories from Firestore
- `src/components/sections/SearchBar.tsx` — Fetches categories from Firestore for dropdown
- `src/components/search/SearchFilters.tsx` — Added experience and price range filters

## New Files
- `.env.local` — Firebase environment variables
- `.env.example` — Template for Firebase config
- `firestore.rules` — Firestore security rules
- `src/lib/firebase.ts` — Firebase initialization (Auth, Firestore, Storage)
- `src/types/firestore.ts` — Firestore document types (users, workers, customers, bookings, reviews, categories, cities)
- `src/services/authService.ts` — Auth service (register, login, logout, resetPassword, getUserRole, updateUserProfile)
- `src/services/firestoreService.ts` — Firestore CRUD (workers, categories, cities, search)
- `src/services/storageService.ts` — File upload to Firebase Storage
- `src/context/AuthContext.tsx` — Auth context provider
- `src/hooks/useAuth.ts` — Auth hook
- `src/hooks/useLocation.ts` — Geolocation detection hook
- `src/components/ui/LoadingSkeleton.tsx` — Loading skeletons (WorkerCard, CategoryCard, WorkerProfile)
- `src/app/logout/page.tsx` — Logout page
- `src/components/ui/LogoutButton.tsx` — Reusable logout button component

## Firestore Structure
- `users` — All users (uid, email, name, role, photoURL, timestamps)
- `customers` — Customer profiles (bookings, savedWorkers, reviewsGiven)
- `workers` — Worker profiles (personalInfo, professionalInfo, documents, availability, serviceArea, verificationStatus, rating, reviews)
- `bookings` — Booking records (customerId, workerId, service, date, status, amount)
- `reviews` — Review records (bookingId, customerId, workerId, rating, comment)
- `categories` — Service categories (name, slug, icon, description, workerCount)
- `cities` — Supported cities (name, state, slug, active)

## Known Issues
- CategoryCards has duplicate interface definitions (FirestoreCategory/FiresetCategory) — functional but redundant
- `useLocation` hook created but not yet wired to homepage/workers sorting
- Firestore queries may need additional composite indexes for complex filter combinations
- Some unused imports (addDoc, Firestore type) in firestoreService.ts
