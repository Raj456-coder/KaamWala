import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signInAnonymously,
  User,
  Auth,
} from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
};

function hasValidFirebaseConfig(): boolean {
  return [
    firebaseConfig.apiKey,
    firebaseConfig.authDomain,
    firebaseConfig.projectId,
    firebaseConfig.storageBucket,
    firebaseConfig.messagingSenderId,
    firebaseConfig.appId,
  ].every((v) => typeof v === "string" && v.trim().length > 0);
}

let firebaseApp: FirebaseApp | undefined;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;
let _googleProvider: GoogleAuthProvider | null = null;

const firebaseReady = hasValidFirebaseConfig();

if (typeof window !== "undefined" && firebaseReady && !getApps().length) {
  try {
    firebaseApp = initializeApp(firebaseConfig);
    _auth = getAuth(firebaseApp);
    _db = getFirestore(firebaseApp);
    _storage = getStorage(firebaseApp);
    _googleProvider = new GoogleAuthProvider();
    console.log("[Firebase] Initialized successfully", {
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain,
    });
  } catch (err) {
    console.error("[Firebase] Initialization failed:", err);
    firebaseApp = undefined;
    _auth = null;
    _db = null;
    _storage = null;
    _googleProvider = null;
  }
}

if (typeof window !== "undefined" && !firebaseReady) {
  console.error("[Firebase] Configuration missing — check .env.local for NEXT_PUBLIC_FIREBASE_* variables");
}

export const app = firebaseApp;
export const auth: Auth | null = _auth;
export const db: Firestore | null = _db;
export const storage: FirebaseStorage | null = _storage;
export const googleProvider: GoogleAuthProvider | null = _googleProvider;
export { firebaseReady };

export type { User };
export {
  signInWithPopup,
  signInWithRedirect,
  signInAnonymously,
  GoogleAuthProvider,
};
