"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star } from "lucide-react";
import { addReviewToBooking } from "@/services/bookingService";
import { useAuth } from "@/hooks/useAuth";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface ReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
}

export default function ReviewDialog({
  isOpen,
  onClose,
  bookingId,
}: ReviewDialogProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"error" | "success">("error");
  const prevOpenRef = useRef(isOpen);

  const resetForm = useCallback(() => {
    setRating(0);
    setComment("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setToastMessage("Please log in to submit a review.");
      setToastType("error");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
      return;
    }
    if (rating === 0) {
      setToastMessage("Please select a rating.");
      setToastType("error");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await addReviewToBooking(bookingId, rating, comment);
      if (error) {
        setToastMessage(error);
        setToastType("error");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
      } else {
        setToastMessage("Review submitted successfully!");
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
            className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-text">Write a Review</h3>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-text mb-3">
                  Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={cn(
                        "p-1 rounded transition-colors",
                        star <= rating
                          ? "text-warning"
                          : "text-slate-300 dark:text-slate-600"
                      )}
                    >
                      <Star
                        className="w-8 h-8 fill-current"
                        fill={star <= rating ? "currentColor" : "none"}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Comment
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white dark:bg-slate-900 text-text resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  className="flex-1"
                >
                  Submit Review
                </Button>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </form>

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
                    <X className="w-5 h-5 text-danger flex-shrink-0" />
                  ) : (
                    <Star className="w-5 h-5 text-success flex-shrink-0" />
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