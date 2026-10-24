import { NextRequest, NextResponse } from "next/server";
import { initAdmin, adminDb } from "@/lib/firebaseAdmin";
import { MATHURA_WORKERS_SEED_DATA } from "@/data/mathuraWorkersData";
import { Timestamp } from "firebase-admin/firestore";

export async function GET(request: NextRequest) {
  return handleSeed(request);
}

export async function POST(request: NextRequest) {
  return handleSeed(request);
}

async function handleSeed(request: NextRequest) {
  try {
    initAdmin();

    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: "Firebase Admin Firestore could not be initialized." },
        { status: 500 }
      );
    }

    const batch = adminDb.batch();
    const seededList: Array<{ id: string; name: string; category: string; area: string; hourlyRate: number }> = [];

    for (const worker of MATHURA_WORKERS_SEED_DATA) {
      const now = Timestamp.now();
      const workerRef = adminDb.collection("workers").doc(worker.id);
      const privateRef = adminDb.collection("worker_private").doc(worker.id);

      // Public Document in `workers` collection
      const publicDoc = {
        uid: worker.id,
        email: `${worker.id}@kaamwala.in`,
        name: worker.name,
        role: "worker",
        category: worker.category,
        categorySlug: worker.categorySlug,
        hourlyRate: worker.hourlyRate,
        rating: worker.rating,
        reviewCount: worker.reviewCount,
        jobsCompleted: worker.jobsCompleted,
        isAvailable: true,
        isVerified: true,
        verificationStatus: "verified",
        photoURL: worker.photoURL,

        personalInfo: {
          fullName: worker.name,
          email: `${worker.id}@kaamwala.in`,
          address: `${worker.area}, Mathura, Uttar Pradesh - ${worker.pincode}`,
          city: "Mathura",
          state: "Uttar Pradesh",
        },

        professionalInfo: {
          profession: worker.profession,
          category: worker.categorySlug,
          experience: worker.experience,
          hourlyRate: worker.hourlyRate,
          minVisitCharge: worker.minVisitCharge,
          description: worker.description,
          skills: worker.skills,
          languages: ["Hindi", "English"],
        },

        serviceArea: {
          state: "Uttar Pradesh",
          city: "Mathura",
          pincode: worker.pincode,
          area: worker.area,
          latitude: worker.latitude,
          longitude: worker.longitude,
          locationUpdatedAt: now,
        },

        availability: {
          serviceRadius: 15,
          availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          workingHours: {
            start: "08:00 AM",
            end: "08:00 PM",
          },
          emergencyService: true,
          homeVisit: true,
        },

        documents: {
          profilePhoto: {
            url: worker.photoURL,
            uploadedAt: now,
          },
        },

        reviews: [],
        joinedDate: worker.joinedDate,
        createdAt: now,
        updatedAt: now,
      };

      batch.set(workerRef, publicDoc, { merge: true });

      // Private Document in `worker_private` collection for contact unlock
      batch.set(
        privateRef,
        {
          workerId: worker.id,
          phoneNumber: worker.phone,
          updatedAt: now,
        },
        { merge: true }
      );

      seededList.push({
        id: worker.id,
        name: worker.name,
        category: worker.category,
        area: worker.area,
        hourlyRate: worker.hourlyRate,
      });
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${seededList.length} Mathura-focused workers into Firestore!`,
      totalCount: seededList.length,
      categoriesBreakdown: {
        Electrician: seededList.filter((w) => w.category === "Electrician").length,
        Plumber: seededList.filter((w) => w.category === "Plumber").length,
        "House Maid": seededList.filter((w) => w.category === "House Maid").length,
        Babysitter: seededList.filter((w) => w.category === "Babysitter").length,
        Cook: seededList.filter((w) => w.category === "Cook").length,
        "Bathroom Cleaner": seededList.filter((w) => w.category === "Bathroom Cleaner").length,
      },
      localities: [
        "Krishna Nagar",
        "Holi Gate",
        "Masani",
        "Govardhan Chauraha",
        "Highway Plaza area",
        "Township",
      ],
      sampleWorkers: seededList.slice(0, 6),
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[Seed API Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: errorMsg || "Failed to seed workers.",
      },
      { status: 500 }
    );
  }
}
