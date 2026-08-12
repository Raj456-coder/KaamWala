# KaamWala — Go-Live Checklist

Use this checklist before and during production deployment.

## GitHub

- [ ] Repository initialized with Git
- [ ] Project pushed to GitHub
- [ ] `.env.local` is NOT tracked by Git
- [ ] No secrets committed to Git history

## Vercel

- [ ] Vercel project created and connected to GitHub
- [ ] Build settings correct (Next.js)
- [ ] All production environment variables added in Vercel
- [ ] `NEXT_PUBLIC_SITE_URL` set to production domain
- [ ] Production deployment successful

## Firebase

- [ ] Firebase project created
- [ ] Authentication enabled (Email/Password, Google)
- [ ] Firestore Database created
- [ ] Firebase Storage created
- [ ] Production Firestore rules deployed
- [ ] Production Storage rules deployed
- [ ] Firebase authorized domains updated

## Firestore

- [ ] `firestore.rules` deployed
- [ ] Rules restrict admin data from customers/workers
- [ ] Rules prevent users from modifying their own role
- [ ] Rules prevent users from marking payments successful
- [ ] Rules prevent users from granting themselves contact unlocks
- [ ] Empty collections render gracefully

## Storage

- [ ] `storage.rules` deployed
- [ ] Worker verification documents are private
- [ ] No public write access
- [ ] No entire-bucket public read

## Payment

- [ ] Payment provider account created (e.g. Razorpay)
- [ ] Production public key added to Vercel
- [ ] Production secret key added as server-side secret (not `NEXT_PUBLIC_*`)
- [ ] Webhook endpoint configured (if applicable)
- [ ] Webhook signature verification implemented
- [ ] Duplicate payment protection verified

## Authentication

- [ ] Register flow tested
- [ ] Login flow tested
- [ ] Logout flow tested
- [ ] Forgot password tested
- [ ] Session persistence tested
- [ ] Role assignment tested
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

- [ ] `error.tsx` shows friendly message
- [ ] `not-found.tsx` shows friendly message
- [ ] No raw stack traces exposed to users
- [ ] No internal file paths exposed to users
- [ ] No secrets exposed in error messages

## SEO & Metadata

- [ ] Site title and description set
- [ ] Open Graph metadata configured
- [ ] `metadataBase` configured via `NEXT_PUBLIC_SITE_URL`
- [ ] `sitemap.xml` accessible and lists public pages
- [ ] `robots.txt` accessible and blocks private routes
- [ ] `manifest.json` valid
- [ ] Favicon and app icons exist

## PWA

- [ ] `manifest.json` configured
- [ ] Service worker registered in production only
- [ ] Service worker cache strategy appropriate
- [ ] No stale cache issues after deploy

## Mobile

- [ ] Homepage fits mobile screens
- [ ] Login/Register forms usable on mobile
- [ ] Worker listing usable on mobile
- [ ] Worker profile usable on mobile
- [ ] Booking flow usable on mobile
- [ ] Customer dashboard usable on mobile
- [ ] Worker dashboard usable on mobile
- [ ] Admin dashboard usable on mobile

## Data Safety

- [ ] No fake demo data seeded in production
- [ ] No fake workers, customers, or transactions
- [ ] No destructive database changes pending
- [ ] Empty collections render proper empty states

## Final Verification

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] `npm run start` starts successfully
- [ ] Homepage loads
- [ ] Login works
- [ ] Register works
- [ ] Logout works
- [ ] Worker onboarding works
- [ ] Worker search works
- [ ] Booking works
- [ ] Customer dashboard works
- [ ] Worker dashboard works
- [ ] Notifications work
- [ ] Reviews work
- [ ] Worker verification works
- [ ] Customer free contacts work
- [ ] Worker subscription works
- [ ] Admin works
- [ ] Payment security enforced
- [ ] Firestore rules active
- [ ] Storage rules active
- [ ] Error pages work
- [ ] SEO metadata works
