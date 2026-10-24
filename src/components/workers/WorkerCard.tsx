"use client";

import { motion } from "framer-motion";
import { Star, MapPin, Clock, Phone, MessageCircle, CheckCircle2, Languages, Heart, Calendar, Zap } from "lucide-react";
import { WorkerProfile } from "@/types";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import BookingWizardModal from "@/components/booking/BookingWizardModal";
import { CATEGORIZED_SERVICES } from "@/lib/ai/multilingualParser";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { saveWorker, removeSavedWorker } from "@/services/firestoreService";
import { getContactUnlock, getCustomerFreeContactCount, requestContactUnlockApi } from "@/services/monetizationService";
import { useRazorpayCheckout } from "@/hooks/useRazorpayCheckout";
import { CONTACT_UNLOCK_PRICE, CUSTOMER_FREE_CONTACT_UNLOCKS } from "@/lib/launchConfig";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";

type ContactPhase = "idle" | "checking" | "free-confirm" | "unlocking" | "unlocked" | "paid-confirm" | "paying" | "verifying" | "error";

export interface WorkerCardProps {
  worker: WorkerProfile;
  index?: number;
  onViewProfile?: (id: string) => void;
}

function normalizePhoneForTel(phone?: string): string | undefined {
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

export default function WorkerCard({ worker, index = 0, onViewProfile }: WorkerCardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [contactPhase, setContactPhase] = useState<ContactPhase>("idle");
  const [isProcessing, setIsProcessing] = useState(false);
  const [freeRemaining, setFreeRemaining] = useState(0);
  const [contactError, setContactError] = useState<string | null>(null);
  const [workerPhone, setWorkerPhone] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<"call" | "whatsapp" | null>(null);
  const [whatsAppFallback, setWhatsAppFallback] = useState<string | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const { unlockWithRazorpay, loading: isRazorpayLoading } = useRazorpayCheckout();

  const matchedService = useMemo(() => {
    const slug = (worker.categorySlug || "").toLowerCase();
    const cat = (worker.category || "").toLowerCase();
    return (
      CATEGORIZED_SERVICES.find((s) => s.id === slug) ||
      CATEGORIZED_SERVICES.find((s) => slug.includes(s.id) || s.id.includes(slug)) ||
      CATEGORIZED_SERVICES.find((s) => s.name.toLowerCase().includes(cat) || cat.includes(s.name.toLowerCase())) ||
      CATEGORIZED_SERVICES[0]
    );
  }, [worker.categorySlug, worker.category]);

  const isUnlocked = contactPhase === "unlocked";
  const isContactBusy =
    isProcessing ||
    contactPhase === "checking" ||
    contactPhase === "unlocking" ||
    contactPhase === "paying" ||
    contactPhase === "verifying" ||
    isRazorpayLoading;

  const userId = user?.uid;

  useEffect(() => {
    if (!userId) return;
    let mounted = true;
    const checkUnlock = async () => {
      const [unlockResult, countResult] = await Promise.all([
        getContactUnlock(userId, worker.id),
        getCustomerFreeContactCount(userId),
      ]);
      if (!mounted) return;
      if (unlockResult.unlock) {
        setContactPhase("unlocked");
        if (unlockResult.unlock.workerPhone) {
          setWorkerPhone(unlockResult.unlock.workerPhone);
        }
        setFreeRemaining(Math.max(0, CUSTOMER_FREE_CONTACT_UNLOCKS - countResult.count));
      } else if (countResult.error) {
        setContactError(countResult.error);
      }
    };
    checkUnlock();
    return () => {
      mounted = false;
    };
  }, [userId, worker.id]);

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || isSaving) return;
    setIsSaving(true);
    try {
      if (isSaved) {
        await removeSavedWorker(user.uid, worker.id);
        setIsSaved(false);
      } else {
        await saveWorker(user.uid, worker.id);
        setIsSaved(true);
      }
    } catch {
      // silent fail
    } finally {
      setIsSaving(false);
    }
  };

  const openWhatsApp = (phone: string) => {
    const waPhone = getWhatsAppPhone(phone);
    if (!waPhone) {
      setContactError("Unable to normalize phone number for WhatsApp.");
      setContactPhase("error");
      return;
    }
    const url = `https://wa.me/${waPhone}`;
    const opened = window.open(url, "_blank");
    if (!opened) {
      setWhatsAppFallback(url);
    }
  };

  const openCall = (phone: string) => {
    window.location.href = `tel:${normalizePhoneForTel(phone)}`;
  };

  const triggerContact = (action: "call" | "whatsapp", phone?: string | null) => {
    const rawPhone = phone || workerPhone;
    if (!rawPhone) {
      setContactError("Phone number unavailable for this worker.");
      setContactPhase("error");
      return;
    }
    if (action === "call") {
      openCall(rawPhone);
    } else {
      openWhatsApp(rawPhone);
    }
  };

  const handleContactAction = async (action: "call" | "whatsapp") => {
    if (!user) {
      router.push("/login");
      return;
    }
    setPendingAction(action);
    setContactError(null);
    setShowContactModal(false);
    setWhatsAppFallback(null);

    if (contactPhase === "unlocked") {
      if (workerPhone) {
        triggerContact(action, workerPhone);
        return;
      }
      // If unlocked in state but phone not yet fetched, fetch securely from API
      setContactPhase("checking");
      const res = await requestContactUnlockApi(worker.id);
      if (res.success && res.phoneNumber) {
        setContactPhase("unlocked");
        setWorkerPhone(res.phoneNumber);
        triggerContact(action, res.phoneNumber);
      } else {
        setContactPhase("error");
        setContactError(res.error || "Failed to retrieve worker contact details.");
      }
      return;
    }

    setContactPhase("checking");

    try {
      const [unlockResult, countResult] = await Promise.all([
        getContactUnlock(user.uid, worker.id),
        getCustomerFreeContactCount(user.uid),
      ]);

      if (unlockResult.error || countResult.error) {
        const errMsg = unlockResult.error || countResult.error || "Failed to check contact status.";
        setContactError(errMsg);
        setContactPhase("error");
        return;
      }

      if (unlockResult.unlock) {
        setContactPhase("unlocked");
        setFreeRemaining(Math.max(0, CUSTOMER_FREE_CONTACT_UNLOCKS - countResult.count));
        const res = await requestContactUnlockApi(worker.id);
        const resolvedPhone = res.phoneNumber || unlockResult.unlock.workerPhone || null;
        if (resolvedPhone) {
          setWorkerPhone(resolvedPhone);
          triggerContact(action, resolvedPhone);
        } else {
          setContactPhase("error");
          setContactError("Worker contact details are currently unavailable.");
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
      const res = await requestContactUnlockApi(worker.id);
      if (!res.success) {
        if (res.requiresPayment) {
          setContactPhase("paid-confirm");
          return;
        }
        setContactPhase("error");
        setContactError(res.error || "Failed to unlock contact.");
        return;
      }

      setContactPhase("unlocked");
      const resolvedPhone = res.phoneNumber || null;
      setWorkerPhone(resolvedPhone);
      const { count } = await getCustomerFreeContactCount(user.uid);
      setFreeRemaining(Math.max(0, CUSTOMER_FREE_CONTACT_UNLOCKS - count));
      setShowContactModal(false);

      if (pendingAction && resolvedPhone) {
        setTimeout(() => triggerContact(pendingAction, resolvedPhone), 0);
      }
    } catch {
      setContactPhase("error");
      setContactError("Failed to unlock contact. Please try again.");
    }
  };

  const handlePaidUnlock = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isProcessing) return;
    setIsProcessing(true);

    if (!user) {
      setIsProcessing(false);
      return;
    }
    setContactPhase("paying");
    setContactError(null);

    try {
      await unlockWithRazorpay({
        workerId: worker.id,
        workerName: worker.name,
        onSuccess: (data) => {
          setIsProcessing(false);
          setContactPhase("unlocked");
          setWorkerPhone(data.phoneNumber);
          setShowContactModal(false);
          if (pendingAction && data.phoneNumber) {
            setTimeout(() => triggerContact(pendingAction, data.phoneNumber), 0);
          }
        },
        onError: (errMsg) => {
          setIsProcessing(false);
          setContactPhase("error");
          setContactError(errMsg);
        },
        onDismiss: () => {
          setIsProcessing(false);
          setContactPhase("paid-confirm");
        },
      });
    } catch {
      setIsProcessing(false);
      setContactPhase("error");
      setContactError("Failed to initiate payment. Please try again.");
    }
  };

  const handleViewProfile = () => {
    if (onViewProfile) {
      onViewProfile(worker.id);
    } else {
      router.push(`/workers/${worker.id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 overflow-hidden group"
    >
      <div className="relative p-6">
        {!worker.isAvailable && (
          <div className="absolute inset-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <Badge variant="warning" size="md">Currently Busy</Badge>
          </div>
        )}

        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-400 text-xl font-bold overflow-hidden">
              {worker.name.split(" ").map((n) => n[0]).join("")}
            </div>
            {worker.isVerified && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" fill="white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-text truncate">{worker.name}</h3>
              {worker.isVerified && <Badge variant="success" size="sm">Verified</Badge>}
            </div>
            <p className="text-sm text-primary font-medium mb-2">{worker.category}</p>
            <div className="flex items-center gap-4 text-sm text-text-secondary">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-warning fill-warning" />
                <span className="font-medium text-text">{worker.rating}</span>
                <span>({worker.reviewCount})</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{worker.distance}</span>
              </div>
            </div>
          </div>

          {user && (
            <button
              onClick={handleToggleSave}
              disabled={isSaving}
              className={cn(
                "p-2 rounded-full transition-colors",
                isSaved
                  ? "text-danger bg-danger/10"
                  : "text-text-muted hover:text-danger hover:bg-danger/5"
              )}
              aria-label={isSaved ? "Remove from saved" : "Save worker"}
            >
              <Heart className={cn("w-5 h-5", isSaved && "fill-current")} />
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {worker.skills.slice(0, 3).map((skill) => (
            <span key={skill} className="px-3 py-1 bg-primary-50 dark:bg-primary-950 text-primary text-xs font-medium rounded-full">
              {skill}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm text-text-secondary">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{worker.experience} yrs exp</span>
          </div>
          <div className="flex items-center gap-1">
            <Languages className="w-3.5 h-3.5" />
            <span>{worker.languages.slice(0, 2).join(", ")}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
          <div>
            <p className="text-xs text-text-muted">Starting Price</p>
            <p className="font-bold text-primary text-lg">
              {formatCurrency(worker.hourlyRate)}<span className="text-sm font-normal text-text-muted">/hr</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-muted">Location</p>
            <p className="font-medium text-text text-sm line-clamp-1">{worker.location}</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="w-full font-bold shadow-md shadow-primary/20 bg-gradient-to-r from-primary to-accent hover:opacity-95 text-xs py-2.5"
            leftIcon={<Calendar className="w-4 h-4" />}
            onClick={() => setIsBookingModalOpen(true)}
          >
            Book {worker.name.split(" ")[0]} • ₹10 Booking
          </Button>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              leftIcon={<Phone className="w-3.5 h-3.5" />}
              onClick={() => handleContactAction("call")}
              disabled={isContactBusy}
            >
              {contactPhase === "checking" ? "Checking..." : isUnlocked ? "Call Now" : "Call"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="flex-1 text-xs"
              leftIcon={<MessageCircle className="w-3.5 h-3.5" />}
              onClick={() => handleContactAction("whatsapp")}
              disabled={isContactBusy}
            >
              {contactPhase === "checking" ? "Checking..." : isUnlocked ? "WhatsApp" : "WhatsApp"}
            </Button>
            <Button type="button" variant="ghost" size="sm" className="flex-1 text-xs" onClick={handleViewProfile}>
              Profile
            </Button>
          </div>
        </div>

        {isUnlocked && workerPhone && (
          <div className="mt-3 p-3 rounded-xl bg-success-50 dark:bg-success-950 border border-success/20">
            <div className="flex items-center gap-1 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              <p className="text-xs font-semibold text-success">Contact unlocked</p>
            </div>
            <p className="text-xs text-text-muted">{freeRemaining} free contacts remaining</p>
          </div>
        )}

        {contactError && contactPhase === "error" && (
          <p className="mt-2 text-xs text-danger">{contactError}</p>
        )}

        {whatsAppFallback && (
          <div className="mt-2 p-2 rounded-xl bg-primary-50 dark:bg-primary-950 border border-primary/20">
            <p className="text-xs text-text-secondary mb-2">Popup blocked. Tap to continue to WhatsApp.</p>
            <Button
              type="button"
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
            setIsProcessing(false);
            setPendingAction(null);
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
                <Button type="button" variant="ghost" onClick={() => { setShowContactModal(false); setContactPhase("idle"); setIsProcessing(false); setPendingAction(null); }}>
                  Cancel
                </Button>
                <Button type="button" variant="primary" onClick={handleFreeUnlock} isLoading={contactPhase === "unlocking"}>
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
              {contactError && (
                <div className="mb-4 p-3 rounded-xl bg-danger-50 dark:bg-danger-950/50 border border-danger/20 text-danger text-sm">
                  {contactError}
                </div>
              )}
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="ghost" onClick={() => { setShowContactModal(false); setContactPhase("idle"); setIsProcessing(false); setPendingAction(null); }}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handlePaidUnlock}
                  disabled={isProcessing || contactPhase === "paying" || contactPhase === "verifying"}
                  isLoading={isProcessing || contactPhase === "paying" || contactPhase === "verifying"}
                >
                  {isProcessing || contactPhase === "paying" || contactPhase === "verifying"
                    ? "Processing..."
                    : "Pay & Unlock"}
                </Button>
              </div>
            </>
          )}
          {contactPhase === "error" && (
            <>
              <div className="mb-6 p-3.5 rounded-xl bg-danger-50 dark:bg-danger-950/50 border border-danger/20 text-danger text-sm">
                <p className="font-medium mb-1">Payment Failed</p>
                <p className="text-xs text-danger/90">{contactError || "Something went wrong. Please try again."}</p>
              </div>
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="ghost" onClick={() => { setShowContactModal(false); setContactPhase("idle"); setContactError(null); setIsProcessing(false); setPendingAction(null); }}>
                  Close
                </Button>
                <Button type="button" variant="primary" onClick={() => { setContactPhase("paid-confirm"); setContactError(null); setIsProcessing(false); }}>
                  Try Again
                </Button>
              </div>
            </>
          )}
        </Modal>

        <BookingWizardModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          preselectedService={matchedService}
          preselectedWorkerId={worker.id}
          preselectedWorkerName={worker.name}
          preselectedWorkerImage={worker.image}
        />
      </div>
    </motion.div>
  );
}
