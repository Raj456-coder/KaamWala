"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, AlertCircle, Calendar, Clock, MapPin, MessageSquare, Briefcase, CreditCard } from "lucide-react";
import { createBooking } from "@/services/bookingService";
import { processPayment, createRazorpayOrder, savePaymentRecord } from "@/services/paymentService";
import { useAuth } from "@/hooks/useAuth";
import Button from "@/components/ui/Button";
import { cn, formatCurrency } from "@/lib/utils";
import { createNotification } from "@/services/notificationService";
import { PaymentRecord } from "@/types/firestore";

interface BookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workerId: string;
  workerName: string;
  workerImage: string;
  hourlyRate?: number;
}

const SERVICES = [
  "Plumbing",
  "Electrical",
  "Carpentry",
  "Painting",
  "Cleaning",
  "AC Repair",
  "Appliance Repair",
  "Pest Control",
  "Masonry",
  "Welding",
  "Other",
];

const DURATIONS = [
  { value: "1", label: "1 Hour" },
  { value: "2", label: "2 Hours" },
  { value: "3", label: "3 Hours" },
  { value: "4", label: "4+ Hours" },
];

export default function BookingDialog({
  isOpen,
  onClose,
  workerId,
  workerName,
  workerImage,
  hourlyRate = 0,
}: BookingDialogProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"error" | "success">("error");
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    service: "",
    description: "",
    date: "",
    time: "",
    address: "",
    landmark: "",
    notes: "",
    duration: "1",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const prevOpenRef = useRef(isOpen);

  const durationHours = formData.duration === "4" ? 4 : parseInt(formData.duration);
  const totalAmount = hourlyRate > 0 ? hourlyRate * durationHours : 0;

  const resetForm = useCallback(() => {
    setFormData({
      service: "",
      description: "",
      date: "",
      time: "",
      address: "",
      landmark: "",
      notes: "",
      duration: "1",
    });
    setErrors({});
  }, []);

  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      resetForm();
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, resetForm]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
    }
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!formData.service) newErrors.service = "Please select a service.";
    if (!formData.date) newErrors.date = "Please select a date.";
    if (!formData.time) newErrors.time = "Please select a time.";
    if (!formData.address.trim()) newErrors.address = "Address is required.";
    if (!formData.duration) newErrors.duration = "Please select duration.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handlePayAdvance = async () => {
    if (!user) return;
    setPaymentLoading(true);
    setPaymentError(null);

    try {
      const { orderId, error: orderError } = await createRazorpayOrder(
        Math.round(totalAmount * 0.5)
      );
      if (orderError) {
        setPaymentError(orderError);
        setPaymentLoading(false);
        return;
      }

      await processPayment({
        amount: Math.round(totalAmount * 0.5),
        name: user.displayName || user.email || "Customer",
        description: `Advance payment for ${formData.service} booking`,
        orderId: orderId,
        onSuccess: async (response: { razorpay_payment_id: string; razorpay_order_id: string }) => {
          const paymentRecord: PaymentRecord = {
            id: response.razorpay_payment_id,
            bookingId: createdBookingId || "",
            customerId: user.uid,
            workerId,
            amount: Math.round(totalAmount * 0.5),
            currency: "INR",
            status: "success",
            method: "razorpay",
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            createdAt: new Date(),
          };

          const { error: saveError } = await savePaymentRecord(paymentRecord);
          if (saveError) {
            setPaymentError(saveError);
          } else {
            await createNotification(
              workerId,
              "payment_received",
              "Advance Payment Received",
              `A payment of ${formatCurrency(Math.round(totalAmount * 0.5))} has been received for the booking.`,
              createdBookingId || undefined
            );
          }
          setPaymentLoading(false);
          setPaymentSuccess(true);
        },
        onFailure: (error: string) => {
          setPaymentError(error);
          setPaymentLoading(false);
        },
      });
    } catch {
      setPaymentError("Payment processing failed.");
      setPaymentLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!user) {
      setToastMessage("Please log in to book a service.");
      setToastType("error");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
      return;
    }

    setIsSubmitting(true);
    try {
      const earnings = Math.round(totalAmount * 0.85);

      const { id: newBookingId, error } = await createBooking({
        customerId: user.uid,
        workerId,
        workerName,
        workerImage,
        service: formData.service,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        address: formData.address,
        landmark: formData.landmark,
        notes: formData.notes,
        duration: `${formData.duration}hr`,
        status: "pending",
        amount: totalAmount,
        totalAmount,
        earnings,
      });

      if (error) {
        setToastMessage(error);
        setToastType("error");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
      } else {
        setCreatedBookingId(newBookingId);
        setToastMessage("Booking created successfully!");
        setToastType("success");
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
          resetForm();
          onClose();
        }, 2000);
      }
    } catch {
      setToastMessage("Something went wrong. Please try again.");
      setToastType("error");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-text">Book Service</h3>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-6 p-4 bg-surface dark:bg-slate-900 rounded-2xl">
                <div
                  className="w-14 h-14 rounded-2xl flex-shrink-0 bg-cover bg-center bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600"
                  style={workerImage ? { backgroundImage: `url(${workerImage})` } : undefined}
                >
                  {!workerImage && (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 dark:text-slate-400 text-xl font-bold">
                      {workerName.split(" ").map((n) => n[0]).join("")}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-text text-lg">{workerName}</p>
                  {hourlyRate > 0 && (
                    <p className="text-primary font-medium">{"INR"}{hourlyRate}/hr</p>
                  )}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      <Briefcase className="w-4 h-4 inline mr-1 text-text-muted" />
                      Service Required
                    </label>
                    <select
                      value={formData.service}
                      onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-900 text-text",
                        errors.service
                          ? "border-danger"
                          : "border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20"
                      )}
                    >
                      <option value="">Select a service</option>
                      {SERVICES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {errors.service && <p className="text-danger text-xs mt-1">{errors.service}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      <Calendar className="w-4 h-4 inline mr-1 text-text-muted" />
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      min={today}
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-900 text-text",
                        errors.date
                          ? "border-danger"
                          : "border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20"
                      )}
                    />
                    {errors.date && <p className="text-danger text-xs mt-1">{errors.date}</p>}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      <Clock className="w-4 h-4 inline mr-1 text-text-muted" />
                      Preferred Time
                    </label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-900 text-text",
                        errors.time
                          ? "border-danger"
                          : "border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20"
                      )}
                    />
                    {errors.time && <p className="text-danger text-xs mt-1">{errors.time}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      <Clock className="w-4 h-4 inline mr-1 text-text-muted" />
                      Estimated Duration
                    </label>
                    <select
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-900 text-text",
                        errors.duration
                          ? "border-danger"
                          : "border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20"
                      )}
                    >
                      {DURATIONS.map((d) => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                    {errors.duration && <p className="text-danger text-xs mt-1">{errors.duration}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    <MapPin className="w-4 h-4 inline mr-1 text-text-muted" />
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Enter your full address"
                    className={cn(
                      "w-full px-4 py-3 rounded-xl border bg-white dark:bg-slate-900 text-text",
                      errors.address
                        ? "border-danger"
                        : "border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    )}
                  />
                  {errors.address && <p className="text-danger text-xs mt-1">{errors.address}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    <MapPin className="w-4 h-4 inline mr-1 text-text-muted" />
                    Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.landmark}
                    onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                    placeholder="Nearby landmark"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white dark:bg-slate-900 text-text"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    <MessageSquare className="w-4 h-4 inline mr-1 text-text-muted" />
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what you need done..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white dark:bg-slate-900 text-text resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    <MessageSquare className="w-4 h-4 inline mr-1 text-text-muted" />
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any additional instructions..."
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white dark:bg-slate-900 text-text resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" isLoading={isSubmitting} className="flex-1">
                    Confirm Booking
                  </Button>
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                </div>

                {totalAmount > 0 && !paymentSuccess && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full"
                      leftIcon={<CreditCard className="w-4 h-4" />}
                      onClick={handlePayAdvance}
                      isLoading={paymentLoading}
                    >
                      Pay Advance (50% — {formatCurrency(Math.round(totalAmount * 0.5))})
                    </Button>
                    {paymentError && (
                      <p className="text-danger text-xs mt-2 text-center">
                        {paymentError}
                      </p>
                    )}
                  </div>
                )}
              </form>
            </div>

            <AnimatePresence>
              {showToast && (
                <motion.div
                  initial={{ opacity: 0, y: 20, x: "-50%" }}
                  animate={{ opacity: 1, y: 0, x: "-50%" }}
                  exit={{ opacity: 0, y: 20, x: "-50%" }}
                  transition={{ duration: 0.3 }}
                  className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl shadow-black/20 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  role="alert"
                >
                  {toastType === "error" ? (
                    <AlertCircle className="w-5 h-5 text-danger flex-shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                  )}
                  <span className="text-text-secondary">{toastMessage}</span>
                  <button
                    onClick={() => setShowToast(false)}
                    className="ml-2 text-text-muted hover:text-text transition-colors"
                    aria-label="Close notification"
                  >
                    <X className="w-3.5 h-3.5 rotate-45" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
