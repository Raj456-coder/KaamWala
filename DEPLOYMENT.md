# KaamWala — Deployment Guide

This guide explains how to deploy KaamWala to production on Vercel with Firebase.

## 1. Prerequisites

- A Vercel account
- A Firebase project
- A GitHub repository with this codebase
- (Optional) A payment provider account such as Razorpay

## 2. Connect GitHub Repository

1. Push this repository to GitHub.
2. In Vercel, create a new project and import the GitHub repository.
3. Keep the default framework preset as **Next.js**.

## 3. Add Production Environment Variables

In Vercel → Project Settings → Environment Variables, add the following:

### Firebase (Public — safe for client-side)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | e.g. `kaamwala-19.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | e.g. `kaamwala-19.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Google Analytics measurement ID (optional) |
| `NEXT_PUBLIC_SITE_URL` | Production URL, e.g. `https://kaamwala.com` |

### Payment Provider (Public key only)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_PAYMENT_PROVIDER` | e.g. `razorpay` |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay public key |

### Payment Provider (Secret — server-side only)

If you add backend webhook verification later, store secrets in Vercel Environment Variables marked as **Secret** and never expose them through `NEXT_PUBLIC_*`.

| Variable | Description |
|---|---|
| `RAZORPAY_KEY_SECRET` | Razorpay secret key (server-side only) |

## 4. Configure Firebase Production Settings

1. In Firebase Console, enable:
   - **Authentication** (Email/Password, Google)
   - **Firestore Database** (start in production mode or apply rules below)
   - **Storage** (apply rules below)

2. Update Firebase authorized domains in Authentication settings to include your production domain.

## 5. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

Or apply manually in Firebase Console → Firestore → Rules.

## 6. Deploy Firestore Indexes

If you create `firestore.indexes.json`, deploy with:

```bash
firebase deploy --only firestore:indexes
```

## 7. Configure Firebase Storage Rules

```bash
firebase deploy --only storage
```

Or apply the rules from `storage.rules` in Firebase Console → Storage → Rules.

## 8. Configure Payment Gateway

1. Add your payment provider credentials in Vercel environment variables.
2. Ensure webhook endpoints (if any) verify signatures server-side.
3. Never expose secret keys in client-side code.

## 9. Deploy to Vercel

Push a commit to your connected branch, or trigger a manual deploy in the Vercel dashboard.

## 10. Add Custom Domain

1. In Vercel → Project Settings → Domains, add your custom domain.
2. Update DNS records as instructed by Vercel.
3. Update `NEXT_PUBLIC_SITE_URL` to match your production domain.

## 11. Verify Production

After deployment, verify:

- [ ] Homepage loads
- [ ] Login / Register work
- [ ] Worker onboarding works
- [ ] Worker search works
- [ ] Booking flow works
- [ ] Admin panel is accessible only to admins
- [ ] Firestore rules are active
- [ ] Storage rules are active
- [ ] No console errors with sensitive data

## Important Notes

- **Do not commit `.env.local`** — it is already in `.gitignore`.
- **Do not expose secret keys** through `NEXT_PUBLIC_*`.
- **Do not reset production Firestore data** during deployment.
- **Do not enable demo mode** in production — it is opt-in via localStorage only.
