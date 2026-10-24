"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  MapPin,
  Navigation,
  CreditCard,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Zap,
  Lock,
  ArrowRight,
  User,
  Radio,
  Info,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import {
  CATEGORIZED_SERVICES,
  CategorizedService,
  ServiceTier,
} from "@/lib/ai/multilingualParser";
import {
  getWorkerBookedSlots,
  createOnDemandBooking,
} from "@/services/bookingService";
import { createRazorpayOrder, openRazorpayModal } from "@/services/paymentService";
import { formatCurrency, cn } from "@/lib/utils";
import { Coordinates } from "@/lib/location";

interface BookingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedService?: CategorizedService | null;
  preselectedWorkerId?: string;
  preselectedWorkerName?: string;
  preselectedWorkerImage?: string;
}

const ALL_30_MIN_SLOTS = [
  "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM",
  "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
  "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM",
  "08:00 PM",
];

export default function BookingWizardModal({
  isOpen,
  onClose,
  preselectedService,
  preselectedWorkerId,
  preselectedWorkerName,
  preselectedWorkerImage,
}: BookingWizardModalProps) {
  const { user } = useAuth();
  const router = useRouter();

  // Wizard Steps: 1: Service/Worker, 2: Date & Time, 3: Location, 4: Confirm, 5: Success
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1 State: Service Selection
  const [selectedService, setSelectedService] = useState<CategorizedService>(
    preselectedService || CATEGORIZED_SERVICES[0]
  );
  const [serviceTierFilter, setServiceTierFilter] = useState<"all" | ServiceTier>("all");

  // Step 2 State: Date & Time Slots
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [selectedSlot, setSelectedSlot] = useState<string>("09:00 AM");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);

  // Step 3 State: Location
  const [address, setAddress] = useState<string>("");
  const [landmark, setLandmark] = useState<string>("");
  const [city, setCity] = useState<string>("Mathura");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [locationSuccessMsg, setLocationSuccessMsg] = useState<string | null>(null);

  // Step 4 State: Payment & Processing
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Step 5 State: Created Booking Result & OTP
  const [createdBooking, setCreatedBooking] = useState<{
    id: string;
    otp: string;
    broadcastCount: number;
  } | null>(null);

  // Sync preselected service if passed
  useEffect(() => {
    if (preselectedService) {
      setSelectedService(preselectedService);
    }
  }, [preselectedService]);

  // Fetch booked slots from `worker_schedules` whenever worker or date changes
  useEffect(() => {
    let isMounted = true;
    const fetchSlots = async () => {
      const workerId = preselectedWorkerId || "general";
      setIsLoadingSlots(true);
      const { bookedSlots: fetched } = await getWorkerBookedSlots(workerId, selectedDate);
      if (isMounted) {
        setBookedSlots(fetched);
        setIsLoadingSlots(false);
      }
    };

    fetchSlots();
    return () => {
      isMounted = false;
    };
  }, [preselectedWorkerId, selectedDate]);

  // HTML5 Live Geolocation handler
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setPaymentError("Geolocation is not supported by your browser.");
      return;
    }

    setIsDetectingLocation(true);
    setLocationSuccessMsg(null);
    setPaymentError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoordinates({ latitude, longitude });

        // Try free reverse geocoding via OpenStreetMap
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          if (res.ok) {
            const data = await res.json();
            const displayName = data.display_name || "";
            const detectedCity =
              data.address?.city ||
              data.address?.town ||
              data.address?.suburb ||
              "Current Location";
            setAddress(displayName.slice(0, 80));
            setCity(detectedCity);
            setLocationSuccessMsg(`Live GPS location detected: ${detectedCity}`);
          } else {
            setAddress(`Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`);
            setLocationSuccessMsg("Live GPS coordinates detected successfully!");
          }
        } catch {
          setAddress(`Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`);
          setLocationSuccessMsg("Live GPS coordinates detected successfully!");
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (err) => {
        setIsDetectingLocation(false);
        setPaymentError("Unable to retrieve location. Please check browser permissions or type address manually.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Step 4: Confirm & Checkout strictly ₹10 Platform Fee via Razorpay
  const handlePayPlatformFeeAndBook = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isProcessing) return;

    // Task 4: Verify and sync authentication state with currentUser.uid explicitly
    const activeAuthUser = auth?.currentUser;
    const effectiveUserId = activeAuthUser?.uid || user?.uid;

    if (!user && !activeAuthUser) {
      console.warn("[Booking Flow] Auth check failed: user is not logged in.");
      setPaymentError("Authentication required: Please log in or register before confirming your booking.");
      try {
        sessionStorage.setItem("pending_booking_redirect", window.location.pathname);
      } catch {}
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (!effectiveUserId) {
      console.error("[Booking Flow] Auth check failed: effectiveUserId is null or undefined.");
      setPaymentError("Your user session could not be verified. Please log in again.");
      router.push("/login");
      return;
    }

    if (!address.trim()) {
      setPaymentError("Please provide your service address before proceeding.");
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    // =========================================================================
    // Task 1 & 2 - Step A: Call Next.js API route to create Razorpay order id
    // NO FIRESTORE WRITE BEFORE PAYMENT!
    // =========================================================================
    let orderResult: { orderId: string; keyId: string; amount: number };
    try {
      console.log("[Payment Flow Step A] Calling /api/create-order for user:", effectiveUserId);
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 1000, // strictly ₹10 = 1000 paise
          currency: "INR",
          customerId: effectiveUserId,
          service: selectedService.name,
          type: "platform_booking_fee",
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.orderId) {
        const errorMsg = data.error || data.message || "Failed to create payment order on server.";
        console.error("[PAYMENT ERROR Step A - API Route /api/create-order]:", errorMsg, data);
        setPaymentError(`Payment Gateway Error: ${errorMsg}`);
        setIsProcessing(false);
        return;
      }

      orderResult = {
        orderId: data.orderId || data.order_id,
        keyId: data.keyId || data.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
        amount: data.amount || 1000,
      };
      console.log("[Payment Flow Step A Success] Order created:", orderResult.orderId);
    } catch (apiError: unknown) {
      const err = apiError instanceof Error ? apiError.message : String(apiError);
      console.error("[PAYMENT ERROR Step A - API Route Exception]:", apiError);
      setPaymentError(`Could not connect to payment gateway: ${err}`);
      setIsProcessing(false);
      return;
    }

    // =========================================================================
    // Task 1 & 2 - Step B: Open Razorpay checkout widget
    // =========================================================================
    try {
      console.log("[Payment Flow Step B] Opening Razorpay checkout widget for order:", orderResult.orderId);
      await openRazorpayModal({
        keyId: orderResult.keyId,
        orderId: orderResult.orderId,
        amount: orderResult.amount,
        name: activeAuthUser?.displayName || user?.displayName || user?.email || "Customer",
        description: `Platform Booking Fee - ${selectedService.name}`,
        prefill: {
          name: activeAuthUser?.displayName || user?.displayName || "",
          email: activeAuthUser?.email || user?.email || "",
        },
        onDismiss: () => {
          console.log("[Payment Flow Step B] Razorpay checkout dismissed by user without payment.");
          setIsProcessing(false);
        },
        // =====================================================================
        // Task 1 & 2 - Step C: ONLY upon successful payment (inside handler callback),
        // execute Firestore addDoc to save booking and OTP
        // =====================================================================
        handler: async (response) => {
          console.log("[Payment Flow Step C] Razorpay payment successful! Payment ID:", response.razorpay_payment_id);
          try {
            // Task 4: Re-verify authenticated currentUser.uid
            const currentAuth = auth?.currentUser;
            const customerId = currentAuth?.uid || effectiveUserId;

            if (!customerId) {
              const authErrorMsg = "User authentication lost after payment. Please contact support with Payment ID: " + response.razorpay_payment_id;
              console.error("[PAYMENT ERROR Step C - Auth Verification]:", authErrorMsg);
              setPaymentError(authErrorMsg);
              setIsProcessing(false);
              return;
            }

            console.log("[Payment Flow Step C] Saving booking to Firestore `bookings` collection for customerId:", customerId);
            const bookingResult = await createOnDemandBooking({
              customerId,
              customerName: currentAuth?.displayName || user?.displayName || user?.email || "Customer",
              workerId: preselectedWorkerId,
              workerName: preselectedWorkerName || "On-Demand Broadcast",
              workerImage: preselectedWorkerImage || "",
              service: selectedService.name,
              description: `On-demand booking for ${selectedService.name}. Scheduled slot: ${selectedSlot}`,
              date: selectedDate,
              time: selectedSlot,
              address: address.trim(),
              landmark: landmark.trim(),
              duration: "1hr",
              coordinates: coordinates || undefined,
              isBroadcast: !preselectedWorkerId,
            });

            if (bookingResult.error || !bookingResult.id) {
              console.error("[PAYMENT ERROR Step C - Firestore DB Write]:", bookingResult.error);
              setPaymentError(bookingResult.error || "Failed to record booking in database.");
              setIsProcessing(false);
              return;
            }

            console.log("[Payment Flow Step C Success] Booking successfully saved in Firestore with ID:", bookingResult.id, "OTP:", bookingResult.otp);

            // Step 5: Advance to Success state
            setCreatedBooking({
              id: bookingResult.id,
              otp: bookingResult.otp,
              broadcastCount: bookingResult.broadcastCount,
            });
            setIsProcessing(false);
            setCurrentStep(5);
          } catch (firestoreErr: unknown) {
            const dbErrorMsg = firestoreErr instanceof Error ? firestoreErr.message : String(firestoreErr);
            console.error("[PAYMENT ERROR Step C - Firestore DB Write Exception]:", firestoreErr);
            setPaymentError(`Database save error after payment: ${dbErrorMsg}`);
            setIsProcessing(false);
          }
        },
      });
    } catch (widgetError: unknown) {
      const widgetMsg = widgetError instanceof Error ? widgetError.message : String(widgetError);
      console.error("[PAYMENT ERROR Step B - Razorpay Widget Exception]:", widgetError);
      setPaymentError(`Failed to load payment checkout widget: ${widgetMsg}`);
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-850 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden my-8"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold font-heading text-text">
                  On-Demand Booking • तुरंत बुकिंग
                </h2>
                <p className="text-xs text-text-secondary">
                  Step {currentStep <= 4 ? currentStep : 4} of 4 • केवल ₹10 बुकिंग शुल्क
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-text-muted hover:text-text hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Indicator */}
          {currentStep <= 4 && (
            <div className="px-6 pt-4 pb-2 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
              <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold">
                <div className={`pb-2 border-b-2 transition-colors ${currentStep >= 1 ? "border-primary text-primary" : "border-transparent text-text-muted"}`}>
                  1. Service
                </div>
                <div className={`pb-2 border-b-2 transition-colors ${currentStep >= 2 ? "border-primary text-primary" : "border-transparent text-text-muted"}`}>
                  2. Date & Time
                </div>
                <div className={`pb-2 border-b-2 transition-colors ${currentStep >= 3 ? "border-primary text-primary" : "border-transparent text-text-muted"}`}>
                  3. Location
                </div>
                <div className={`pb-2 border-b-2 transition-colors ${currentStep >= 4 ? "border-primary text-primary" : "border-transparent text-text-muted"}`}>
                  4. Confirm (₹10)
                </div>
              </div>
            </div>
          )}

          {/* Modal Body */}
          <div className="p-5 sm:p-7 max-h-[75vh] overflow-y-auto">
            {/* ================= STEP 1: SERVICE SELECTION ================= */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-text mb-1">
                    Select Required Service • सेवा चुनें
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Choose from verified skilled, semi-skilled or general services.
                  </p>
                </div>

                {/* Tier Filter Chips */}
                <div className="flex flex-wrap gap-2">
                  {(["all", "skilled", "semi-skilled", "non-skilled"] as const).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setServiceTierFilter(tier)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                        serviceTierFilter === tier
                          ? "bg-primary text-white shadow-sm"
                          : "bg-surface-alt text-text-secondary hover:text-text"
                      }`}
                    >
                      {tier === "all" ? "All Services" : tier.replace("-", " ")}
                    </button>
                  ))}
                </div>

                {/* Service Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                  {CATEGORIZED_SERVICES.filter(
                    (s) => serviceTierFilter === "all" || s.tier === serviceTierFilter
                  ).map((service) => {
                    const isSelected = selectedService.id === service.id;
                    return (
                      <div
                        key={service.id}
                        onClick={() => setSelectedService(service)}
                        className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? "border-primary bg-primary-50/50 dark:bg-primary-950/40 shadow-sm"
                            : "border-slate-200 dark:border-slate-700 hover:border-primary/40 bg-white dark:bg-slate-800"
                        }`}
                      >
                        <div>
                          <p className="font-bold text-sm text-text">{service.name}</p>
                          <p className="text-xs text-primary font-medium">{service.hindiName}</p>
                          <p className="text-[11px] text-text-muted mt-1">{service.hourlyRange}</p>
                        </div>

                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? "border-primary bg-primary text-white" : "border-slate-300 dark:border-slate-600"}`}>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Worker assignment preview */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-warning" />
                    <span>
                      {preselectedWorkerName ? (
                        <>Selected Worker: <strong>{preselectedWorkerName}</strong></>
                      ) : (
                        <>Matching Mode: <strong>Nearest Verified Worker within 5km</strong></>
                      )}
                    </span>
                  </div>
                  <span className="text-success font-semibold">
                    {preselectedWorkerName ? "Direct Assignment Active" : "Instant Broadcast Active"}
                  </span>
                </div>

                <div className="flex justify-end pt-3">
                  <Button
                    type="button"
                    variant="primary"
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                    onClick={() => setCurrentStep(2)}
                  >
                    Continue to Date & Time
                  </Button>
                </div>
              </div>
            )}

            {/* ================= STEP 2: DATE & TIME SLOTS ================= */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-text mb-1">
                    Select Date & Time Slot • तारीख और समय चुनें
                  </h3>
                  <p className="text-xs text-text-secondary">
                    30-minute arrival slots. Booked slots are disabled automatically.
                  </p>
                </div>

                {/* Date Selection Options */}
                <div>
                  <label className="block text-xs font-semibold text-text-muted mb-2">
                    Select Service Date
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {/* Today */}
                    {(() => {
                      const todayStr = new Date().toISOString().split("T")[0];
                      const isTodaySelected = selectedDate === todayStr;
                      return (
                        <button
                          type="button"
                          onClick={() => setSelectedDate(todayStr)}
                          className={`px-4 py-2.5 rounded-2xl text-xs font-bold border-2 transition-all flex items-center gap-1.5 ${
                            isTodaySelected
                              ? "border-primary bg-primary text-white shadow-sm"
                              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-text"
                          }`}
                        >
                          <Zap className="w-3.5 h-3.5" />
                          Today (तत्काल / Instant)
                        </button>
                      );
                    })()}

                    {/* Tomorrow */}
                    {(() => {
                      const tom = new Date();
                      tom.setDate(tom.getDate() + 1);
                      const tomStr = tom.toISOString().split("T")[0];
                      const isTomSelected = selectedDate === tomStr;
                      return (
                        <button
                          type="button"
                          onClick={() => setSelectedDate(tomStr)}
                          className={`px-4 py-2.5 rounded-2xl text-xs font-bold border-2 transition-all flex items-center gap-1.5 ${
                            isTomSelected
                              ? "border-primary bg-primary text-white shadow-sm"
                              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-text"
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          Tomorrow (कल)
                        </button>
                      );
                    })()}

                    {/* Custom Date Input */}
                    <input
                      type="date"
                      value={selectedDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-3 py-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-text focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                {/* 30-min Time Slots Grid with Firestore Cross-Check */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-text-muted">
                      Select 30-Min Arrival Window ({selectedDate})
                    </label>
                    {isLoadingSlots && (
                      <span className="text-[11px] text-text-muted animate-pulse">
                        Checking schedule...
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-56 overflow-y-auto pr-1">
                    {ALL_30_MIN_SLOTS.map((slot) => {
                      const isBooked = bookedSlots.includes(slot);
                      const isSelected = selectedSlot === slot && !isBooked;

                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={isBooked}
                          onClick={() => setSelectedSlot(slot)}
                          className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-center flex flex-col items-center justify-center gap-1 ${
                            isBooked
                              ? "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-text-muted/40 cursor-not-allowed line-through"
                              : isSelected
                              ? "bg-primary text-white border-primary shadow-sm"
                              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-text hover:border-primary/50"
                          }`}
                        >
                          <span>{slot}</span>
                          {isBooked ? (
                            <span className="text-[9px] uppercase font-bold text-danger">Booked</span>
                          ) : (
                            <span className={`text-[9px] ${isSelected ? "text-white/80" : "text-success"}`}>
                              Available
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="ghost"
                    leftIcon={<ChevronLeft className="w-4 h-4" />}
                    onClick={() => setCurrentStep(1)}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                    onClick={() => setCurrentStep(3)}
                  >
                    Continue to Location
                  </Button>
                </div>
              </div>
            )}

            {/* ================= STEP 3: LOCATION & LIVE GPS ================= */}
            {currentStep === 3 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-text mb-1">
                    Service Address • स्थान की जानकारी
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Select your address or use Live HTML5 Geolocation for instant 5km matching.
                  </p>
                </div>

                {/* Live GPS Detection Button */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-primary-50 to-primary-100/50 dark:from-primary-950/40 dark:to-slate-900 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <Navigation className="w-4 h-4" />
                      Live Device Geolocation (GPS)
                    </p>
                    <p className="text-[11px] text-text-secondary mt-0.5">
                      Auto-detect coordinates for Uber-style rapid dispatch.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleDetectLocation}
                    isLoading={isDetectingLocation}
                    disabled={isDetectingLocation}
                    leftIcon={<MapPin className="w-4 h-4" />}
                  >
                    {isDetectingLocation ? "Detecting GPS..." : "Use Live Location"}
                  </Button>
                </div>

                {locationSuccessMsg && (
                  <div className="p-3 bg-success-50 dark:bg-success-950/50 border border-success/30 rounded-xl text-xs text-success font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{locationSuccessMsg}</span>
                  </div>
                )}

                {/* Address Form Inputs */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-text mb-1">
                      Complete House / Street Address *
                    </label>
                    <textarea
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g., Flat 302, Krishna Kunj Apartment, Dampier Nagar..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-text text-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-text mb-1">
                        Landmark (मशहूर पहचान)
                      </label>
                      <input
                        type="text"
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        placeholder="Near Krishna Janmabhoomi / SBI Branch"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-text text-xs focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text mb-1">
                        City / Town
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Mathura"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-text text-xs focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {paymentError && (
                  <p className="text-xs text-danger font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {paymentError}
                  </p>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="ghost"
                    leftIcon={<ChevronLeft className="w-4 h-4" />}
                    onClick={() => setCurrentStep(2)}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                    onClick={() => {
                      if (!address.trim()) {
                        setPaymentError("Please provide an address to continue.");
                        return;
                      }
                      setPaymentError(null);
                      setCurrentStep(4);
                    }}
                  >
                    Continue to Confirm
                  </Button>
                </div>
              </div>
            )}

            {/* ================= STEP 4: CONFIRM & ₹10 PAYMENT PIVOT ================= */}
            {currentStep === 4 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-text mb-1">
                    Booking Summary & Platform Fee • पुष्टि एवं भुगतान
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Review your service booking. Only ₹10 platform fee is charged right now.
                  </p>
                </div>

                {/* Summary Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                    <span className="text-text-muted">Service:</span>
                    <span className="font-bold text-text">{selectedService.name} ({selectedService.hindiName})</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                    <span className="text-text-muted">Scheduled Slot:</span>
                    <span className="font-semibold text-text">{selectedDate} at {selectedSlot}</span>
                  </div>
                  <div className="flex items-start justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                    <span className="text-text-muted">Service Location:</span>
                    <span className="font-medium text-text text-right max-w-xs line-clamp-2">{address} {landmark && `(${landmark})`}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Assigned Worker:</span>
                    <span className="font-semibold text-primary">
                      {preselectedWorkerName || "Nearest 5km Verified Broadcast"}
                    </span>
                  </div>
                </div>

                {/* Platform Fee Payment Pivot Box */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-2 border-emerald-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                      Amount Payable Now (Razorpay)
                    </span>
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      ₹10.00
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted mb-3">
                    Fixed platform booking fee for dispatching and instant matching.
                  </p>

                  {/* Prominent Direct Worker Pay Disclaimer */}
                  <div className="p-3 bg-white/80 dark:bg-slate-850/90 rounded-xl border border-emerald-500/20 text-xs text-text flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-emerald-900 dark:text-emerald-300 mb-0.5">
                        Direct Worker Payment Notice (सीधा भुगतान)
                      </p>
                      <p className="text-text-secondary text-[11px] leading-relaxed">
                        Pay the worker directly in <strong>cash or UPI</strong> after the job is completed to your satisfaction ({selectedService.hourlyRange}). No labor commission is deducted upfront.
                      </p>
                    </div>
                  </div>
                </div>

                {paymentError && (
                  <div className="p-3 bg-danger-50 dark:bg-danger-950/50 border border-danger/30 rounded-xl text-xs text-danger font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{paymentError}</span>
                  </div>
                )}

                {/* Pay ₹10 & Confirm Button */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="ghost"
                    leftIcon={<ChevronLeft className="w-4 h-4" />}
                    onClick={() => setCurrentStep(3)}
                    disabled={isProcessing}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handlePayPlatformFeeAndBook}
                    isLoading={isProcessing}
                    disabled={isProcessing}
                    leftIcon={<CreditCard className="w-4 h-4" />}
                  >
                    {isProcessing ? "Processing ₹10 Payment..." : "Pay ₹10 & Confirm Booking"}
                  </Button>
                </div>
              </div>
            )}

            {/* ================= STEP 5: SUCCESS & 4-DIGIT OTP ================= */}
            {currentStep === 5 && createdBooking && (
              <div className="text-center py-4 space-y-5">
                <div className="w-16 h-16 rounded-full bg-success-50 dark:bg-success-950/60 border-2 border-success text-success flex items-center justify-center mx-auto shadow-lg shadow-success/20 animate-bounce">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div>
                  <h3 className="text-2xl font-black font-heading text-text">
                    Booking Confirmed! • बुकिंग सफल
                  </h3>
                  <p className="text-xs sm:text-sm text-text-secondary mt-1">
                    Platform fee ₹10 verified. Your request has been broadcasted to verified workers within 5km!
                  </p>
                </div>

                {/* 4-Digit OTP Display Box */}
                <div className="p-5 rounded-3xl bg-gradient-to-tr from-primary-50 to-primary-100/60 dark:from-slate-900 dark:to-primary-950/50 border-2 border-primary/30 max-w-sm mx-auto shadow-md">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">
                    Your 4-Digit Job Start OTP
                  </p>
                  <div className="text-4xl font-black tracking-widest text-text font-mono my-2 py-2 px-4 bg-white dark:bg-slate-800 rounded-2xl border border-primary/20 shadow-inner inline-block">
                    {createdBooking.otp}
                  </div>
                  <p className="text-[11px] text-text-muted mt-2">
                    Share this 4-digit code with your worker only after they arrive at your location to begin service.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-text-secondary max-w-sm mx-auto">
                  <p className="font-semibold text-text mb-0.5">10-Minute Free Cancellation Window</p>
                  <p className="text-[11px]">
                    Cancel within 10 minutes to receive an instant ₹5 refund credited to your KaamWala Wallet.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => {
                      onClose();
                      router.push(`/bookings/${createdBooking.id}`);
                    }}
                  >
                    View Booking Status & Timer
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      onClose();
                      router.push("/customer-dashboard");
                    }}
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
