import { initializeApp, cert, getApps, getApp, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";

let adminApp: App | null = null;
let adminDbInstance: Firestore | null = null;
let adminAuthInstance: Auth | null = null;

export function initAdmin(): App {
  if (getApps().length > 0) {
    adminApp = getApp();
    return adminApp;
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const serviceAccountBase64 =
    process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ||
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;

  // 1. Explicit base64 environment variable
  if (serviceAccountBase64) {
    try {
      const decoded = Buffer.from(serviceAccountBase64.trim(), "base64").toString("utf8");
      const parsed = JSON.parse(decoded);
      adminApp = initializeApp({
        credential: cert(parsed),
        projectId: parsed.project_id || projectId,
      });
      return adminApp;
    } catch (e) {
      console.error("[firebaseAdmin] Failed to parse base64 service account key:", e);
    }
  }

  // 2. Direct Service Account Key (raw JSON or base64 encoded string)
  if (serviceAccountKey) {
    try {
      let rawJson = serviceAccountKey.trim();
      if (!rawJson.startsWith("{")) {
        rawJson = Buffer.from(rawJson, "base64").toString("utf8");
      }
      const parsed = JSON.parse(rawJson);
      adminApp = initializeApp({
        credential: cert(parsed),
        projectId: parsed.project_id || projectId,
      });
      return adminApp;
    } catch (e) {
      console.error("[firebaseAdmin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", e);
    }
  }

  // 3. Individual credentials (client email & private key)
  if (clientEmail && privateKey) {
    let cleanPrivateKey = privateKey;
    if (!cleanPrivateKey.includes("-----BEGIN PRIVATE KEY-----")) {
      try {
        cleanPrivateKey = Buffer.from(cleanPrivateKey.trim(), "base64").toString("utf8");
      } catch {
        // use as-is
      }
    }
    cleanPrivateKey = cleanPrivateKey.replace(/\\n/g, "\n");

    adminApp = initializeApp({
      credential: cert({
        projectId: projectId || "kaamwala-19",
        clientEmail,
        privateKey: cleanPrivateKey,
      }),
      projectId: projectId || "kaamwala-19",
    });
    return adminApp;
  }

  adminApp = initializeApp({
    projectId: projectId || "kaamwala-19",
  });
  return adminApp;
}

export function getAdminDb(): Firestore {
  if (!adminApp) {
    initAdmin();
  }
  if (!adminDbInstance && adminApp) {
    adminDbInstance = getFirestore(adminApp);
  }
  if (!adminDbInstance) {
    throw new Error("Admin Firestore could not be initialized");
  }
  return adminDbInstance;
}

export const adminDb = new Proxy({} as Firestore, {
  get(_target, prop) {
    return getAdminDb()[prop as keyof Firestore];
  },
});

export async function verifyIdToken(idToken: string) {
  if (!adminApp) {
    initAdmin();
  }
  if (!adminAuthInstance && adminApp) {
    adminAuthInstance = getAuth(adminApp);
  }
  if (!adminAuthInstance) {
    throw new Error("Admin Auth could not be initialized");
  }
  return adminAuthInstance.verifyIdToken(idToken);
}
