# KaamWala — Go-Live Guide

This guide covers the exact manual steps required to deploy KaamWala to production.

## 1. Push Project to GitHub

1. Initialize Git in the project root if not already initialized.
2. Commit all source files.
3. Push to a GitHub repository.
4. Verify that `.env.local` is NOT tracked by Git.

## 2. Import GitHub Repository into Vercel

1. Log in to [Vercel](https://vercel.com/).
2. Click **Add New Project**.
3. Select **Import Git Repository** and choose your GitHub repo.
4. Keep the framework preset as **Next.js**.

## 3. Add Production Environment Variables in Vercel

In Vercel → Project Settings → Environment Variables, add the following:

### Public (client-side)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Yes | Firebase API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Yes | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Yes | Firebase sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Yes | Firebase app ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | No | Google Analytics measurement ID |
| `NEXT_PUBLIC_SITE_URL` | Yes | Production URL, e.g. `https://kaamwala.com` |
| `NEXT_PUBLIC_PAYMENT_PROVIDER` | No | e.g. `razorpay` |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | No | Payment provider public key |

### Private (server-side / secret)

| Variable | Required | Description |
|---|---|---|
| `RAZORPAY_KEY_SECRET` | No | Payment provider secret key |
| `GOOGLE_APPLICATION_CREDENTIALS` | No | Path to Firebase service account key (if using server-side verification) |

**Important:** Never expose private keys through `NEXT_PUBLIC_*` variables.

## 4. Configure Firebase Authentication Authorized Domains

1. Open Firebase Console → Authentication.
2. Go to **Settings** → **Authorized domains**.
3. Add your production domain (e.g. `kaamwala.com`, `kaamwala.vercel.app`).
4. Remove any domains that should not have access.

## 5. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

Or copy the contents of `firestore.rules` into the Firebase Console → Firestore → Rules tab and publish.

## 6. Deploy Firestore Indexes

If you create `firestore.indexes.json`, deploy with:

```bash
firebase deploy --only firestore:indexes
```

Currently, KaamWala does not require composite indexes for basic queries, but you may add them as usage grows.

## 7. Configure Firebase Storage

1. Open Firebase Console → Storage.
2. Upload or paste the rules from `storage.rules`.
3. Ensure the bucket is not publicly writable.
4. Verify worker verification documents are protected.

## 8. Configure Payment Production Credentials

1. Sign up for a payment provider (e.g. Razorpay).
2. Get the production public key and secret key.
3. Add the public key as `NEXT_PUBLIC_RAZORPAY_KEY_ID` in Vercel.
4. Add the secret key as `RAZORPAY_KEY_SECRET` in Vercel (server-side only).
5. Update any backend webhook handlers to verify signatures using the secret key.

**Do not use test/sandbox credentials in production.**

## 9. Configure Payment Webhook URL

If your payment provider supports webhooks:

1. In the payment provider dashboard, set the webhook URL to your production API endpoint.
2. Ensure the endpoint verifies the webhook signature server-side.
3. Make the webhook handler idempotent (safe to call multiple times).

Currently, KaamWala does not expose a public webhook route by default. Add one only when you are ready to integrate real payments.

## 10. Deploy to Vercel

1. Push a commit to your connected GitHub branch, or trigger a manual deploy in the Vercel dashboard.
2. Wait for the build to complete.
3. Verify the deployment URL is working.

## 11. Add Custom Domain

1. In Vercel → Project Settings → Domains, add your custom domain.
2. Follow Vercel's DNS configuration instructions.
3. Update `NEXT_PUBLIC_SITE_URL` in Vercel environment variables to match your production domain.
4. Redeploy if needed.

## 12. Test Production Authentication

1. Open the production site.
2. Test **Register** with a new email.
3. Test **Login** with existing credentials.
4. Test **Logout**.
5. Test **Forgot Password**.
6. Verify session persistence across page refreshes.
7. Verify role-based access (customer vs worker vs admin).

## 13. Test Worker Onboarding

1. Register a new worker account.
2. Complete the **Become Worker** onboarding flow.
3. Verify the worker profile is created in Firestore.
4. Verify the 30-day free trial subscription is created.
5. Verify the worker appears in search.

## 14. Test Customer Contact Unlock

1. Register a new customer account.
2. Search for workers.
3. Verify the free contact counter shows `3 / 3 remaining`.
4. Unlock a worker contact using a free unlock.
5. Verify the counter decreases to `2 / 3 remaining`.
6. Unlock the same worker again — verify it does not charge again.
7. Refresh the page and verify the unlock persists.

## 15. Test Worker Subscription

1. Log in as a worker.
2. Go to **Subscriptions**.
3. Verify the current plan and trial status are displayed.
4. Select a paid plan and verify the order is created.
5. Verify the subscription status updates after payment verification.

## 16. Test Booking

1. Log in as a customer.
2. Book a worker.
3. Verify the booking appears in both customer and worker dashboards.
4. Test booking status updates (accept, complete, cancel).

## 17. Test Admin

1. Log in as an admin user.
2. Verify the admin dashboard loads.
3. Verify admin can view workers, bookings, transactions, subscriptions, unlocks, support requests, and advertisers.
4. Verify a non-admin user cannot access `/admin`.

## 18. Verify Security

1. Verify Firestore rules are active in the Firebase Console.
2. Verify Storage rules are active in the Firebase Console.
3. Verify private routes redirect unauthenticated users.
4. Verify users cannot modify payment records or subscription status from the client.
5. Verify worker phone numbers are not exposed in public API responses.

## 19. Monitor First Production Transactions

1. After go-live, monitor the first real transactions in the admin dashboard.
2. Verify revenue calculations are accurate.
3. Verify no duplicate transactions or unlocks are created.
4. Check Firebase Console logs for errors.

## Important Notes

- **Do not commit `.env.local`** — it is already ignored by `.gitignore`.
- **Do not expose secret keys** through `NEXT_PUBLIC_*`.
- **Do not reset production Firestore data** during deployment.
- **Do not enable demo mode** in production — it is opt-in via `localStorage` only.
- **Do not automatically deploy** — follow the steps above and verify each stage.
