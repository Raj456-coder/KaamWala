"use client";

import { useState, useEffect } from "react";
import { notFound, useParams } from "next/navigation";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import { getWorkerById, mapFirestoreWorkerToProfile } from "@/services/firestoreService";
import { getContactUnlock, createContactUnlockOrder } from "@/services/monetizationService";
import { WorkerProfile } from "@/types";
import { WorkerWithId } from "@/services/firestoreService";
import { ContactUnlockWithId } from "@/types/monetization";
import { WorkerProfileSkeleton } from "@/components/ui/LoadingSkeleton";
import Link from "next/link";
import { Star, MapPin, Clock, Phone, MessageCircle, CheckCircle2, Languages, ArrowLeft, Share2, Calendar, Heart, Shield, AlertCircle, ShieldCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import BookingDialog from "@/components/booking/BookingDialog";
import WorkerScore from "@/components/workers/WorkerScore";
import { useAuth } from "@/hooks/useAuth";
import { saveWorker, removeSavedWorker } from "@/services/firestoreService";
import ContactUnlockButton from "@/components/monetization/ContactUnlockButton";

export default function WorkerProfilePage() {
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuth();
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [rawWorker, setRawWorker] = useState<WorkerWithId | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [unlock, setUnlock] = useState<ContactUnlockWithId | null>(null);
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (!id) {
      notFound();
      return;
    }

    const fetchWorker = async () => {
      const { worker: fetchedWorker, error } = await getWorkerById(id);
      if (!error && fetchedWorker) {
        const profile = mapFirestoreWorkerToProfile(fetchedWorker);
        setWorker(profile);
        setRawWorker(fetchedWorker);
      } else {
        notFound();
      }
      setLoading(false);
    };

    fetchWorker();
  }, [id]);

  useEffect(() => {
    const fetchUnlock = async () => {
      if (!user || !id) return;
      const { unlock: unlockRecord } = await getContactUnlock(user.uid, id);
      if (unlockRecord) {
        setUnlock(unlockRecord);
      }
    };
    fetchUnlock();
  }, [user, id]);

  const handleToggleSave = async () => {
    if (!user || !worker || isSaving) return;
    setIsSaving(true);
    try {
      if (isSaved) {
        await removeSavedWorker(user.uid, worker.id);
        setIsSaved(false);
        setToast({ message: "Removed from saved workers", type: "success" });
      } else {
        await saveWorker(user.uid, worker.id);
        setIsSaved(true);
        setToast({ message: "Worker saved to favorites", type: "success" });
      }
    } catch {
      setToast({ message: "Failed to update favorites", type: "error" });
    } finally {
      setIsSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-surface">
        <Navbar />
        <div className="pt-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <WorkerProfileSkeleton />
          </div>
        </div>
      <Footer />

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl shadow-black/20 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm">
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-danger flex-shrink-0" />
          )}
          <span className="text-text-secondary">{toast.message}</span>
        </div>
      )}
      </main>
    );
  }

  if (!worker) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-surface">
      <Navbar />

      <div className="pt-20">
        <div className="relative h-64 sm:h-80 bg-gradient-to-br from-primary to-primary-700">
          <div className="absolute inset-0 bg-black/10" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-shrink-0 -mt-20 sm:-mt-24">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-400 text-4xl font-bold border-4 border-white dark:border-slate-800 shadow-lg">
                    {worker.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h1 className="text-2xl sm:text-3xl font-bold font-heading text-text">{worker.name}</h1>
                    {worker.isVerified && (
                      <Badge variant="success" size="md" className="flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Verified
                      </Badge>
                    )}
                    {!worker.isAvailable && <Badge variant="warning">Currently Busy</Badge>}
                  </div>

                  <p className="text-lg text-primary font-medium mb-3">{worker.category}</p>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-warning fill-warning" />
                      <span className="font-semibold text-text">{worker.rating}</span>
                      <span>({worker.reviewCount} reviews)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{worker.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{worker.experience} years experience</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {worker.languages.map((lang) => (
                      <span key={lang} className="px-3 py-1 bg-primary-50 dark:bg-primary-950 text-primary text-xs font-medium rounded-full flex items-center gap-1">
                        <Languages className="w-3 h-3" /> {lang}
                      </span>
                    ))}
                  </div>

                  {rawWorker && (
                    <div className="mt-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-surface-alt">
                      <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        Trust & Verification
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <p className="text-text-muted">Status</p>
                          <Badge variant={rawWorker.verificationStatus === "verified" ? "success" : rawWorker.verificationStatus === "pending" ? "warning" : rawWorker.verificationStatus === "suspended" ? "danger" : "neutral"}>
                            {rawWorker.verificationStatus.replace("_", " ")}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-text-muted">Profession</p>
                          <p className="font-medium text-text">{rawWorker.professionalInfo?.profession || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-text-muted">Experience</p>
                          <p className="font-medium text-text">{rawWorker.professionalInfo?.experience || 0} yrs</p>
                        </div>
                        <div>
                          <p className="text-text-muted">Rating</p>
                          <p className="font-medium text-text">{rawWorker.rating || 0} ({rawWorker.reviewCount || 0})</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    {user && (
                      <ContactUnlockButton
                        workerId={id}
                        workerName={worker.name}
                        phoneNumber={rawWorker?.personalInfo?.phone}
                        unlock={unlock}
                        loading={unlockLoading}
                        onUnlockRequest={async () => {
                          if (!user) return;
                          setUnlockLoading(true);
                          const { orderId, error } = await createContactUnlockOrder(user.uid, id);
                          if (error) {
                            setToast({ message: error, type: "error" });
                          } else {
                            setToast({ message: "Unlock order created. Complete payment to access contact.", type: "success" });
                          }
                          setUnlockLoading(false);
                          setTimeout(() => setToast(null), 3000);
                        }}
                      />
                    )}
                    <Button variant="secondary" leftIcon={<MessageCircle className="w-4 h-4" />}>WhatsApp</Button>
                    <Button variant="primary" leftIcon={<Calendar className="w-4 h-4" />} onClick={() => setIsBookingOpen(true)}>Hire Now</Button>
                    {user && (
                      <Button
                        variant={isSaved ? "outline" : "ghost"}
                        leftIcon={<Heart className={cn("w-4 h-4", isSaved && "fill-current text-danger")} />}
                        onClick={handleToggleSave}
                        disabled={isSaving}
                        className={isSaved ? "text-danger border-danger/30" : ""}
                      >
                        {isSaving ? "Saving..." : isSaved ? "Saved" : "Save"}
                      </Button>
                    )}
                    <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                      <Link href="/workers">Back to Workers</Link>
                    </Button>
                    <Button variant="ghost" leftIcon={<Share2 className="w-4 h-4" />}>Share Profile</Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 p-6 sm:p-8">
              <h2 className="text-xl font-bold font-heading text-text mb-4">About</h2>
              <p className="text-text-secondary leading-relaxed mb-6">{worker.description}</p>

              <h3 className="text-lg font-semibold text-text mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {worker.skills.map((skill) => (
                  <span key={skill} className="px-4 py-2 bg-primary-50 dark:bg-primary-950 text-primary text-sm font-medium rounded-xl">{skill}</span>
                ))}
              </div>

              <div className="bg-surface dark:bg-slate-900 rounded-2xl p-6 mb-6">
                <h3 className="font-semibold text-text mb-4 flex items-center gap-2">Profile Score</h3>
                <div className="flex items-center gap-6">
                  <WorkerScore worker={worker} size="md" showFactors={true} />
                  <div className="flex-1">
                    <p className="text-sm text-text-secondary mb-2">
                      Overall profile completeness and quality score based on verification, ratings, experience, portfolio, and profile completeness.
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant={worker.isVerified ? "success" : "warning"}>
                        {worker.isVerified ? "Verified" : "Pending Verification"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 mb-6">
                <div className="bg-surface dark:bg-slate-900 rounded-2xl p-5">
                  <h3 className="font-semibold text-text mb-2">Availability</h3>
                  <p className="text-text-secondary">{worker.availability}</p>
                </div>
                 <div className="bg-surface dark:bg-slate-900 rounded-2xl p-5">
                   <h3 className="font-semibold text-text mb-2">Pricing</h3>
                   <p className="text-2xl font-bold text-primary">{formatCurrency(worker.hourlyRate)}<span className="text-sm font-normal text-text-muted">/hr</span></p>
                   {worker.minVisitCharge && worker.minVisitCharge > 0 && (
                     <p className="text-sm text-text-secondary mt-1">Min. visit charge: {formatCurrency(worker.minVisitCharge)}</p>
                   )}
                 </div>
              </div>

              {worker.reviews.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-text mb-4">Customer Reviews</h3>
                  <div className="space-y-4">
                    {worker.reviews.map((review) => (
                      <div key={review.id} className="bg-surface dark:bg-slate-900 rounded-2xl p-5">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center text-white font-bold text-sm">
                            {review.userName.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <div>
                            <p className="font-medium text-text">{review.userName}</p>
                            <div className="flex items-center gap-1">
                              {[...Array(review.rating)].map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 text-warning fill-warning" />
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="text-text-secondary text-sm">{review.comment}</p>
                        <p className="text-xs text-text-muted mt-2">{review.date}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {worker && (
        <BookingDialog
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          workerId={worker.id}
          workerName={worker.name}
          workerImage={worker.image}
          hourlyRate={worker.hourlyRate}
        />
      )}
    </main>
  );
}
