# KaamWala — Production Checklist

Use this checklist before going live.

## Firebase

- [ ] Firebase project created
- [ ] Authentication enabled (Email/Password, Google)
- [ ] Firestore Database created
- [ ] Firebase Storage created
- [ ] Production Firestore rules deployed
- [ ] Production Storage rules deployed
- [ ] Firebase authorized domains updated

## Environment Variables

- [ ] `NEXT_PUBLIC_FIREBASE_*` variables set in Vercel
- [ ] `NEXT_PUBLIC_SITE_URL` set to production domain
- [ ] Payment provider public key set in Vercel
- [ ] Payment provider secret key set as server-side secret (not `NEXT_PUBLIC_*`)
- [ ] `.env.local` not committed to Git
- [ ] `.env.example` reviewed and kept up to date

## Security

- [x] Firestore rules restrict admin data
- [x] Firestore rules restrict worker private data
- [x] Firestore rules prevent users from modifying their own role
- [x] Firestore rules prevent users from marking payments successful
- [x] Firestore rules prevent users from granting themselves contact unlocks
- [x] Storage rules protect worker verification documents
- [x] Admin route protected by Firestore rules (defense in depth)
- [x] No secret keys exposed in client-side code
- [x] No raw Firebase/payment errors shown to users

## Payment

- [x] Payment secrets stored server-side only
- [x] Client cannot mark payments successful
- [x] Client cannot change payment amount
- [x] Client cannot activate subscriptions
- [x] Client cannot unlock contacts without entitlement
- [x] Duplicate payments do not create duplicate entitlements
- [x] Payment failure states handled gracefully
- [x] Payment provider webhook verification prepared (idempotent)

## Database

- [x] No fake demo data seeded in production collections
- [x] Empty collections handled gracefully
- [x] Composite indexes defined for critical queries
- [x] No destructive database changes pending

## Authentication

- [x] Register flow works
- [x] Login flow works
- [x] Logout flow works
- [x] Forgot password works
- [x] Session persistence works
- [x] Role assignment works
- [x] Unauthorized users cannot access `/admin`
- [x] Unauthorized users cannot access private dashboards
- [x] Auth errors are user-friendly

## Admin

- [x] Admin dashboard accessible only to admin role
- [x] Admin can manage workers
- [x] Admin can manage verifications
- [x] Admin can manage bookings
- [x] Admin can view transactions
- [x] Admin can manage subscriptions
- [x] Admin can manage contact unlocks
- [x] Admin can manage support requests
- [x] Admin can manage advertisers

## Error Handling

- [x] `error.tsx` exists and shows friendly message
- [x] `not-found.tsx` exists and shows friendly message
- [x] Loading states exist for async pages
- [x] No raw stack traces exposed to users
- [x] No internal file paths exposed to users

## SEO & Metadata

- [ ] Site title and description set
- [ ] Open Graph metadata configured
- [ ] Twitter/social metadata configured
- [ ] `metadataBase` configured for production URL
- [ ] `sitemap.ts` exists and lists public pages
- [ ] `robots.ts` exists and blocks private routes
- [ ] `robots.txt` exists
- [ ] `manifest.json` exists and is valid
- [ ] Favicon and app icons exist

## PWA

- [ ] `manifest.json` configured
- [ ] Service worker registered in production only
- [ ] Service worker cache strategy appropriate
- [ ] No stale cache issues after deploy

## Performance

- [x] `next build` passes
- [ ] Images use Next.js Image component with remote patterns
- [x] Fonts loaded efficiently
- [ ] No obviously unused heavy dependencies
- [ ] Mobile layout tested

## Mobile

- [ ] Homepage fits mobile screens
- [ ] Worker listing fits mobile screens
- [ ] Worker profile fits mobile screens
- [ ] Login/Register forms usable on mobile
- [ ] Booking flow usable on mobile
- [ ] Admin dashboard usable on mobile

## Legal / Trust

- [x] Terms of Service page exists
- [x] Privacy Policy page exists
- [x] Contact page exists
- [x] No fabricated legal claims or registrations

## Analytics

- [x] Analytics architecture in place
- [x] No sensitive personal data tracked unnecessarily
- [x] App does not crash if analytics is unavailable

## Logging

- [ ] Production logs do not contain passwords
- [ ] Production logs do not contain payment secrets
- [ ] Production logs do not contain Firebase private credentials
- [ ] Production logs do not contain auth tokens
- [ ] Production logs do not contain unnecessary phone numbers

## Vercel

- [ ] Project connected to GitHub
- [ ] Build settings correct (Next.js)
- [ ] Environment variables configured
- [ ] Production domain configured (optional)
- [ ] `npm run build` passes in Vercel

## Final Test

- [ ] Homepage loads
- [ ] Login works
- [ ] Register works
- [ ] Logout works
- [ ] Worker onboarding works
- [ ] Worker profile works
- [ ] Worker discovery works
- [ ] Location / nearby works
- [ ] AI search works
- [ ] Booking works
- [ ] Customer dashboard works
- [ ] Worker dashboard works
- [ ] Notifications work
- [ ] Reviews work
- [ ] Worker verification works
- [ ] Customer free contacts work
- [ ] Paid contact unlock architecture works
- [ ] Worker subscription works
- [ ] Admin works
- [ ] Payment security enforced
- [ ] Firestore rules active
- [ ] Storage rules active
- [ ] Error pages work
- [ ] Mobile layout works
- [ ] PWA works
- [ ] SEO metadata works
