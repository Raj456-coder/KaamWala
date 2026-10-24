"use client";

import BookingWizardModal from "./BookingWizardModal";

interface BookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workerId: string;
  workerName: string;
  workerImage: string;
  hourlyRate?: number;
}

/**
 * BookingDialog now forwards directly to the 4-Step On-Demand Booking Wizard
 * with the ₹10 Platform Fee model, HTML5 Live Geolocation, 30-minute slot
 * Firestore cross-checking, 4-digit OTP generation, and 5km broadcast query.
 */
export default function BookingDialog({
  isOpen,
  onClose,
  workerId,
  workerName,
  workerImage,
}: BookingDialogProps) {
  return (
    <BookingWizardModal
      isOpen={isOpen}
      onClose={onClose}
      preselectedWorkerId={workerId}
      preselectedWorkerName={workerName}
      preselectedWorkerImage={workerImage}
    />
  );
}
