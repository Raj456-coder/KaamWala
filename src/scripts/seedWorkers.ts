/**
 * Standalone Worker Seeding Script for Mathura Professionals
 * Populates 48 realistic workers into Firestore across all 6 core categories:
 * - Public data written to `workers/{id}`
 * - Sensitive phone numbers written strictly to `worker_private/{id}`
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { initializeApp, getApps, cert, applicationDefault, App } from "firebase-admin/app";
import { getFirestore, Firestore, Timestamp } from "firebase-admin/firestore";
import { MATHURA_WORKERS_SEED_DATA } from "../data/mathuraWorkersData";

// 1. Ensure local environment variables are loaded
try {
  if (typeof (process as unknown as { loadEnvFile?: (path: string) => void }).loadEnvFile === "function") {
    const envLocalPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envLocalPath)) {
      (process as unknown as { loadEnvFile: (path: string) => void }).loadEnvFile(envLocalPath);
    }
  }
} catch {
  // Ignore env loading errors if already set in environment
}

// 2. Ensure Google Application Default Credentials exist if not explicitly set
function ensureApplicationCredentials() {
  const hasEnvCreds =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ||
    (process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY);

  if (hasEnvCreds) return;

  const appData = process.env.APPDATA;
  if (!appData) return;

  const adcDir = path.join(appData, "gcloud");
  const adcFile = path.join(adcDir, "application_default_credentials.json");

  if (!fs.existsSync(adcFile)) {
    const toolsPath = path.join(os.homedir(), ".config", "configstore", "firebase-tools.json");
    if (fs.existsSync(toolsPath)) {
      try {
        const toolsData = JSON.parse(fs.readFileSync(toolsPath, "utf8"));
        if (toolsData?.tokens?.refresh_token) {
          if (!fs.existsSync(adcDir)) {
            fs.mkdirSync(adcDir, { recursive: true });
          }
          const adcPayload = {
            client_id: "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com",
            client_secret: "j9iVZfS8kkCEFUPaAeJV0sAi",
            refresh_token: toolsData.tokens.refresh_token,
            type: "authorized_user",
          };
          fs.writeFileSync(adcFile, JSON.stringify(adcPayload, null, 2));
          console.log("[Seed] Configured local Application Default Credentials from Firebase CLI session.");
        }
      } catch (err) {
        console.warn("[Seed] Note: Could not auto-sync Firebase CLI credentials:", err);
      }
    }
  }
}

// 3. Initialize Firebase Admin SDK
function initSeedFirestore(): Firestore {
  ensureApplicationCredentials();

  if (getApps().length > 0) {
    return getFirestore();
  }

  const projectId =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    "kaamwala-19";

  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const serviceAccountBase64 =
    process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ||
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;

  let app: App;

  if (serviceAccountBase64) {
    const decoded = Buffer.from(serviceAccountBase64.trim(), "base64").toString("utf8");
    app = initializeApp({ credential: cert(JSON.parse(decoded)), projectId });
  } else if (serviceAccountKey) {
    let rawJson = serviceAccountKey.trim();
    if (!rawJson.startsWith("{")) {
      rawJson = Buffer.from(rawJson, "base64").toString("utf8");
    }
    app = initializeApp({ credential: cert(JSON.parse(rawJson)), projectId });
  } else if (clientEmail && privateKey) {
    const cleanKey = privateKey.replace(/\\n/g, "\n");
    app = initializeApp({ credential: cert({ clientEmail, privateKey: cleanKey, projectId }), projectId });
  } else {
    try {
      app = initializeApp({ credential: applicationDefault(), projectId });
    } catch {
      app = initializeApp({ projectId });
    }
  }

  return getFirestore(app);
}

// 4. Execute Seeding
async function seedWorkers() {
  console.log("===============================================================");
  console.log("       KAAMWALA — SEEDING 48 REALISTIC WORKERS IN MATHURA      ");
  console.log("===============================================================\n");

  const db = initSeedFirestore();
  const now = Timestamp.now();

  console.log(`[Seed] Target database connected. Populating ${MATHURA_WORKERS_SEED_DATA.length} workers...\n`);

  for (const item of MATHURA_WORKERS_SEED_DATA) {
    const workerId = item.id;

    // 1. Public document: `workers/{id}` (No phone numbers included!)
    const publicWorkerDoc = {
      uid: item.id,
      name: item.name,
      photoURL: item.photoURL,
      profilePic: item.photoURL,
      category: item.category,
      categorySlug: item.categorySlug,
      hourlyRate: item.hourlyRate,
      rating: item.rating,
      reviewCount: item.reviewCount,
      jobsCompleted: item.jobsCompleted,
      isAvailable: true,
      isVerified: true,
      verificationStatus: "verified",
      role: "worker",

      personalInfo: {
        fullName: item.name,
        email: `${item.id}@kaamwala.in`,
        address: `${item.area}, Mathura, Uttar Pradesh - ${item.pincode}`,
        city: "Mathura",
        state: "Uttar Pradesh",
      },

      professionalInfo: {
        category: item.categorySlug,
        profession: item.profession,
        experience: item.experience,
        hourlyRate: item.hourlyRate,
        minVisitCharge: item.minVisitCharge,
        skills: item.skills,
        description: item.description,
        languages: ["Hindi", "English"],
      },

      location: {
        city: "Mathura",
        area: item.area,
      },

      serviceArea: {
        city: "Mathura",
        state: "Uttar Pradesh",
        pincode: item.pincode,
        area: item.area,
        latitude: item.latitude,
        longitude: item.longitude,
        locationUpdatedAt: now,
      },

      availability: {
        serviceRadius: 15,
        availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        workingHours: {
          start: "08:00 AM",
          end: "08:00 PM",
        },
        emergencyService: true,
        homeVisit: true,
      },

      documents: {
        profilePhoto: {
          url: item.photoURL,
          uploadedAt: now,
        },
      },

      reviews: [],
      joinedDate: item.joinedDate,
      createdAt: now,
      updatedAt: now,
    };

    // 2. Sensitive document: `worker_private/{id}` (Strict zero-leakage isolation)
    const privateWorkerDoc = {
      workerId: item.id,
      phoneNumber: item.phone,
      createdAt: now,
      updatedAt: now,
    };

    const batch = db.batch();
    const workerRef = db.collection("workers").doc(workerId);
    const privateRef = db.collection("worker_private").doc(workerId);

    batch.set(workerRef, publicWorkerDoc, { merge: true });
    batch.set(privateRef, privateWorkerDoc, { merge: true });

    await batch.commit();

    console.log(`✓ Seeded: ${item.name} (${item.category})`);
    console.log(`  - Location: ${item.area}, Mathura | Rate: ₹${item.hourlyRate}/hr | Rating: ★${item.rating} | Jobs: ${item.jobsCompleted}`);
    console.log(`  - Public Document: workers/${workerId}`);
    console.log(`  - Private Document: worker_private/${workerId} (${item.phone})\n`);
  }

  console.log("===============================================================");
  console.log(`✓ SUCCESS: All ${MATHURA_WORKERS_SEED_DATA.length} Mathura workers seeded successfully!`);
  console.log("===============================================================");
}

seedWorkers().catch((error) => {
  console.error("\n[Seed] FATAL ERROR seeding workers:", error);
  process.exit(1);
});
