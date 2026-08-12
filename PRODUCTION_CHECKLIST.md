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

- [ ] Firestore rules restrict admin data
- [ ] Firestore rules restrict worker private data
- [ ] Firestore rules prevent users from modifying their own role
- [ ] Firestore rules prevent users from marking payments successful
- [ ] Firestore rules prevent users from granting themselves contact unlocks
- [ ] Storage rules protect worker verification documents
- [ ] Admin route protected by Firestore rules (defense in depth)
- [ ] No secret keys exposed in client-side code
- [ ] No raw Firebase/payment errors shown to users

## Payment

- [ ] Payment secrets stored server-side only
- [ ] Client cannot mark payments successful
- [ ] Client cannot change payment amount
- [ ] Client cannot activate subscriptions
- [ ] Client cannot unlock contacts without entitlement
- [ ] Duplicate payments do not create duplicate entitlements
- [ ] Payment failure states handled gracefully
- [ ] Payment provider webhook verification prepared (idempotent)

## Database

- [ ] No fake demo data seeded in production collections
- [ ] Empty collections handled gracefully
- [ ] Composite indexes defined for critical queries
- [ ] No destructive database changes pending

## Authentication

- [ ] Register flow works
- [ ] Login flow works
- [ ] Logout flow works
- [ ] Forgot password works
- [ ] Session persistence works
- [ ] Role assignment works
- [ ] Unauthorized users cannot access `/admin`
- [ ] Unauthorized users cannot access private dashboards
- [ ] Auth errors are user-friendly

## Admin

- [ ] Admin dashboard accessible only to admin role
- [ ] Admin can manage workers
- [ ] Admin can manage verifications
- [ ] Admin can manage bookings
- [ ] Admin can view transactions
- [ ] Admin can manage subscriptions
- [ ] Admin can manage contact unlocks
- [ ] Admin can manage support requests
- [ ] Admin can manage advertisers

## Error Handling

- [ ] `error.tsx` exists and shows friendly message
- [ ] `not-found.tsx` exists and shows friendly message
- [ ] Loading states exist for async pages
- [ ] No raw stack traces exposed to users
- [ ] No internal file paths exposed to users

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

- [ ] `next build` passes
- [ ] Images use Next.js Image component with remote patterns
- [ ] Fonts loaded efficiently
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

- [ ] Terms of Service page exists
- [ ] Privacy Policy page exists
- [ ] Contact page exists
- [ ] No fabricated legal claims or registrations

## Analytics

- [ ] Analytics architecture in place
- [ ] No sensitive personal data tracked unnecessarily
- [ ] App does not crash if analytics is unavailable

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
