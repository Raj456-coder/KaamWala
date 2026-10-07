"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import { getWorkerById, mapFirestoreWorkerToProfile, saveWorker, removeSavedWorker } from "@/services/firestoreService";
import { getContactUnlock, getCustomerFreeContactCount, requestContactUnlockApi } from "@/services/monetizationService";
import { useRazorpayCheckout } from "@/hooks/useRazorpayCheckout";
import { CONTACT_UNLOCK_PRICE, CUSTOMER_FREE_CONTACT_UNLOCKS } from "@/lib/launchConfig";
import { WorkerProfile } from "@/types";
import { WorkerWithId } from "@/services/firestoreService";
import { ContactUnlockWithId } from "@/types/monetization";
import { WorkerProfileSkeleton } from "@/components/ui/LoadingSkeleton";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { formatCurrency, cn } from "@/lib/utils";
import BookingDialog from "@/components/booking/BookingDialog";
import WorkerScore from "@/components/workers/WorkerScore";
import { useAuth } from "@/hooks/useAuth";
import { Star, MapPin, Clock, Phone, MessageCircle, CheckCircle2, Languages, ArrowLeft, Share2, Calendar, Heart, AlertCircle, ShieldCheck } from "lucide-react";

function normalizePhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  return phone.replace(/[^0-9+]/g, "");
}

function getWhatsAppPhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.startsWith("91") && digits.length === 12) {
    return digits;
  }
  if (digits.length === 10) {
    return "91" + digits;
  }
  return digits.length > 0 ? digits : undefined;
}

export default function WorkerProfilePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuth();
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [rawWorker, setRawWorker] = useState<WorkerWithId | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [notFound, setNotFound] = useState(!id);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [unlock, setUnlock] = useState<ContactUnlockWithId | null>(null);
  const [unlockedPhone, setUnlockedPhone] = useState<string | null>(null);
  const [unlockedWhatsAppUrl, setUnlockedWhatsAppUrl] = useState<string | null>(null);
  const [contactPhase, setContactPhase] = useState<"idle" | "checking" | "free-confirm" | "unlocking" | "paid-confirm" | "paying" | "verifying" | "error">("idle");
  const [freeRemaining, setFreeRemaining] = useState(0);
  const [contactError, setContactError] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [pendingContactAction, setPendingContactAction] = useState<"call" | "whatsapp" | null>(null);
  const [whatsAppFallback, setWhatsAppFallback] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const { unlockWithRazorpay, loading: isRazorpayLoading } = useRazorpayCheckout();

  useEffect(() => {
    if (!id) {
      return;
    }

    const fetchWorker = async () => {
      const { worker: fetchedWorker, error } = await getWorkerById(id);
      if (!error && fetchedWorker) {
        const profile = mapFirestoreWorkerToProfile(fetchedWorker);
        setWorker(profile);
        // Zero-leakage privacy: sanitize rawWorker so phone numbers are completely stripped
        const sanitizedWorker = { ...fetchedWorker };
        delete (sanitizedWorker as Record<string, unknown>).phone;
        if (sanitizedWorker.personalInfo) {
          sanitizedWorker.personalInfo = { ...sanitizedWorker.personalInfo };
          delete (sanitizedWorker.personalInfo as Record<string, unknown>).phone;
        }
        setRawWorker(sanitizedWorker);
      } else {
        setNotFound(true);
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
        if (unlockRecord.workerPhone) {
          setUnlockedPhone(unlockRecord.workerPhone);
        }
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
      </main>
    );
  }

  if (!worker || notFound) {
    return (
      <main className="min-h-screen bg-surface">
        <Navbar />
        <div className="pt-24 pb-12">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold font-heading text-text mb-3">Worker not found</h1>
            <p className="text-text-secondary mb-6">The worker profile you are looking for does not exist or has been removed.</p>
            <Link href="/workers">
              <Button variant="primary">Back to Workers</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  const isUnlocked = unlock?.status === "success" || !!unlockedPhone;

  // Zero-leakage privacy: phone number is only populated after server entitlement verification via the API route
  const resolvedPhone = isUnlocked ? (unlockedPhone || undefined) : undefined;

  const isContactProcessing =
    contactPhase === "checking" ||
    contactPhase === "unlocking" ||
    contactPhase === "paying" ||
    contactPhase === "verifying" ||
    isRazorpayLoading;

  const openWhatsApp = (phone: string) => {
    const waPhone = getWhatsAppPhone(phone);
    if (!waPhone) return;
    const url = `https://wa.me/${waPhone}`;
    const opened = window.open(url, "_blank");
    if (!opened) {
      setWhatsAppFallback(url);
    }
  };

  const openCall = (phone: string) => {
    window.location.href = `tel:${normalizePhone(phone)}`;
  };

  const handleContactAction = async (action: "call" | "whatsapp") => {
    if (!user) {
      router.push("/login");
      return;
    }
    setPendingContactAction(action);
    setContactError(null);
    setShowContactModal(false);
    setWhatsAppFallback(null);

    if (isUnlocked) {
      if (unlockedPhone) {
        if (action === "call") openCall(unlockedPhone);
        else openWhatsApp(unlockedWhatsAppUrl || unlockedPhone);
        return;
      }

      setContactPhase("checking");
      const res = await requestContactUnlockApi(id);
      setContactPhase("idle");
      if (res.success && res.phoneNumber) {
        setUnlockedPhone(res.phoneNumber);
        if (res.whatsappUrl) setUnlockedWhatsAppUrl(res.whatsappUrl);
        if (action === "call") openCall(res.phoneNumber);
        else openWhatsApp(res.whatsappUrl || res.phoneNumber);
      } else {
        setContactError(res.error || "Failed to retrieve worker contact details.");
      }
      return;
    }

    setContactPhase("checking");
    try {
      const [unlockResult, countResult] = await Promise.all([
        getContactUnlock(user.uid, id),
        getCustomerFreeContactCount(user.uid),
      ]);

      if (unlockResult.error || countResult.error) {
        setContactError(unlockResult.error || countResult.error || "Failed to check contact status.");
        setContactPhase("error");
        return;
      }

      if (unlockResult.unlock) {
        setUnlock(unlockResult.unlock);
        setFreeRemaining(Math.max(0, CUSTOMER_FREE_CONTACT_UNLOCKS - countResult.count));
        const res = await requestContactUnlockApi(id);
        setContactPhase("idle");
        if (res.success && res.phoneNumber) {
          setUnlockedPhone(res.phoneNumber);
          if (res.whatsappUrl) setUnlockedWhatsAppUrl(res.whatsappUrl);
          if (action === "call") openCall(res.phoneNumber);
          else openWhatsApp(res.whatsappUrl || res.phoneNumber);
        } else {
          setContactError(res.error || "Worker contact details are currently unavailable.");
        }
        return;
      }

      const remaining = Math.max(0, CUSTOMER_FREE_CONTACT_UNLOCKS - countResult.count);
      setFreeRemaining(remaining);

      if (remaining > 0) {
        setContactPhase("free-confirm");
        setShowContactModal(true);
      } else {
        setContactPhase("paid-confirm");
        setShowContactModal(true);
      }
    } catch {
      setContactPhase("error");
      setContactError("Failed to check contact status. Please try again.");
    }
  };

  const handleFreeUnlock = async () => {
    if (!user) return;
    setContactPhase("unlocking");
    setContactError(null);
    try {
      const res = await requestContactUnlockApi(id);
      if (!res.success) {
        if (res.requiresPayment) {
          setContactPhase("paid-confirm");
          return;
        }
        setContactPhase("error");
        setContactError(res.error || "Failed to unlock contact.");
        return;
      }

      setUnlockedPhone(res.phoneNumber || null);
      if (res.whatsappUrl) setUnlockedWhatsAppUrl(res.whatsappUrl);
      const { unlock: updated } = await getContactUnlock(user.uid, id);
      if (updated) setUnlock(updated);
      setFreeRemaining((prev) => Math.max(0, prev - 1));
      setShowContactModal(false);
      setContactPhase("idle");

      const phone = res.phoneNumber;
      if (phone && pendingContactAction) {
        setTimeout(() => {
          if (pendingContactAction === "call") openCall(phone);
          else openWhatsApp(res.whatsappUrl || phone);
          setPendingContactAction(null);
        }, 100);
      }
    } catch {
      setContactPhase("error");
      setContactError("Failed to unlock contact. Please try again.");
    }
  };

  const handlePaidUnlock = async () => {
    if (!user || !worker) return;
    setContactPhase("paying");
    setContactError(null);

    await unlockWithRazorpay({
      workerId: id,
      workerName: worker.name,
      onSuccess: async (data) => {
        setUnlockedPhone(data.phoneNumber);
        setUnlockedWhatsAppUrl(data.whatsappUrl);
        const { unlock: updated } = await getContactUnlock(user.uid, id);
        if (updated) setUnlock(updated);
        setShowContactModal(false);
        setContactPhase("idle");

        if (pendingContactAction && data.phoneNumber) {
          setTimeout(() => {
            if (pendingContactAction === "call") openCall(data.phoneNumber);
            else openWhatsApp(data.whatsappUrl || data.phoneNumber);
            setPendingContactAction(null);
          }, 100);
        }
      },
      onError: (errMsg) => {
        setContactPhase("error");
        setContactError(errMsg);
      },
    });
  };

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
                  <div
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 bg-cover bg-center flex items-center justify-center text-slate-500 dark:text-slate-400 text-4xl font-bold border-4 border-white dark:border-slate-800 shadow-lg overflow-hidden"
                    style={worker.image ? { backgroundImage: `url(${worker.image})` } : undefined}
                  >
                    {!worker.image && worker.name.split(" ").map((n) => n[0]).join("")}
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
                    {isUnlocked ? (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<Phone className="w-4 h-4" />}
                          onClick={() => resolvedPhone && openCall(resolvedPhone)}
                        >
                          Call ({resolvedPhone})
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<MessageCircle className="w-4 h-4" />}
                          onClick={() => resolvedPhone && openWhatsApp(resolvedPhone)}
                        >
                          WhatsApp
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Phone className="w-4 h-4" />}
                          onClick={() => handleContactAction("call")}
                          disabled={isContactProcessing}
                        >
                          {contactPhase === "checking" ? "Checking..." : "Call"}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<MessageCircle className="w-4 h-4" />}
                          onClick={() => handleContactAction("whatsapp")}
                          disabled={isContactProcessing}
                        >
                          {contactPhase === "checking" ? "Checking..." : "WhatsApp"}
                        </Button>
                      </>
                    )}
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
                    <Link href="/workers">
                      <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                        Back to Workers
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      leftIcon={<Share2 className="w-4 h-4" />}
                      onClick={() => {
                        if (typeof window !== "undefined") {
                          navigator.clipboard.writeText(window.location.href);
                          setToast({ message: "Profile link copied to clipboard!", type: "success" });
                          setTimeout(() => setToast(null), 3000);
                        }
                      }}
                    >
                      Share Profile
                    </Button>
                  </div>
                  {isUnlocked && (
                    <div className="mt-3 p-3 rounded-xl bg-success-50 dark:bg-success-950 border border-success/20">
                      <div className="flex items-center gap-1 mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                        <p className="text-xs font-semibold text-success">Contact unlocked</p>
                      </div>
                      {resolvedPhone ? (
                        <>
                          <p className="text-sm font-medium text-text">{resolvedPhone}</p>
                          <p className="text-xs text-text-muted">{freeRemaining} free contacts remaining</p>
                        </>
                      ) : (
                        <p className="text-xs text-danger">Phone number unavailable</p>
                      )}
                    </div>
                  )}
                  {contactError && contactPhase === "error" && (
                    <p className="mt-2 text-xs text-danger">{contactError}</p>
                  )}
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

      {whatsAppFallback && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl shadow-black/20 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm">
          <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
          <span className="text-text-secondary">Popup blocked. Tap to continue to WhatsApp.</span>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              window.open(whatsAppFallback, "_blank");
              setWhatsAppFallback(null);
            }}
          >
            Continue to WhatsApp
          </Button>
        </div>
      )}

      <Modal
        isOpen={showContactModal}
        onClose={() => {
          setShowContactModal(false);
          setContactPhase("idle");
          setPendingContactAction(null);
        }}
        title="Unlock Contact"
      >
        {(contactPhase === "free-confirm" || contactPhase === "unlocking") && (
          <>
            <p className="text-text-secondary mb-1">
              You have <span className="font-bold text-text">{freeRemaining}</span> free contact accesses remaining.
            </p>
            <p className="text-text-secondary mb-6">
              Use 1 free access to contact this worker?
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => { setShowContactModal(false); setContactPhase("idle"); setPendingContactAction(null); }}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleFreeUnlock} isLoading={contactPhase === "unlocking"}>
                {contactPhase === "unlocking" ? "Unlocking..." : "Use Free Access"}
              </Button>
            </div>
          </>
        )}
        {(contactPhase === "paid-confirm" || contactPhase === "paying" || contactPhase === "verifying") && (
          <>
            <p className="text-text-secondary mb-1">
              You&apos;ve used all your free contact accesses.
            </p>
            <p className="text-text-secondary mb-6">
              Unlock <span className="font-bold text-text">{worker.name}</span>&apos;s contact for <span className="font-bold text-text">{formatCurrency(CONTACT_UNLOCK_PRICE)}</span>?
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => { setShowContactModal(false); setContactPhase("idle"); setPendingContactAction(null); }}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handlePaidUnlock} isLoading={contactPhase === "paying" || contactPhase === "verifying"}>
                {contactPhase === "paying" ? "Opening payment..." : contactPhase === "verifying" ? "Verifying..." : "Pay & Unlock"}
              </Button>
            </div>
          </>
        )}
        {contactPhase === "error" && contactError && (
          <>
            <p className="text-danger mb-6">{contactError}</p>
            <div className="flex justify-end">
              <Button variant="primary" onClick={() => { setShowContactModal(false); setContactPhase("idle"); setContactError(null); setPendingContactAction(null); }}>
                Close
              </Button>
            </div>
          </>
        )}
      </Modal>

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
