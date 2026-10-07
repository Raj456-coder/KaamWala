"use client";

import { useState, useCallback } from "react";
import { auth } from "@/lib/firebase";

export interface RazorpaySuccessData {
  phoneNumber: string;
  whatsappUrl: string;
}

export interface RazorpayCheckoutOptions {
  workerId: string;
  workerName: string;
  onSuccess?: (data: RazorpaySuccessData) => void;
  onError?: (error: string) => void;
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayErrorResponse {
  error?: {
    code?: string;
    description?: string;
    source?: string;
    step?: string;
    reason?: string;
    metadata?: Record<string, unknown>;
  };
}

declare global {
  interface Window {
    Razorpay?: {
      new(options: Record<string, unknown>): {
        open(): void;
        on(event: string, handler: (response: RazorpayErrorResponse) => void): void;
      };
    };
  }
}

/**
 * Dynamically loads the official Razorpay Checkout JavaScript SDK.
 */
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true));
      existingScript.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function useRazorpayCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unlockWithRazorpay = useCallback(async (options: RazorpayCheckoutOptions) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Verify user is logged in
      const currentUser = auth?.currentUser;
      if (!currentUser) {
        const authErr = "Please sign in to proceed with contact unlock.";
        setError(authErr);
        options.onError?.(authErr);
        setLoading(false);
        return;
      }

      // 2. Load Razorpay SDK
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        const scriptErr = "Failed to load Razorpay payment gateway. Please check your network connection.";
        setError(scriptErr);
        options.onError?.(scriptErr);
        setLoading(false);
        return;
      }

      // 3. Obtain Firebase ID token
      const idToken = await currentUser.getIdToken();

      // 4. Create Razorpay order on server
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ workerId: options.workerId }),
      });

      const orderData = await orderRes.json().catch(() => ({}));
      if (!orderRes.ok || !orderData.orderId) {
        const orderErr = orderData.error || `Failed to create payment order (${orderRes.status})`;
        setError(orderErr);
        options.onError?.(orderErr);
        setLoading(false);
        return;
      }

      // 5. Configure Razorpay modal
      const rzpOptions = {
        key: orderData.keyId,
        amount: orderData.amount, // 1000 paise (₹10.00)
        currency: orderData.currency || "INR",
        name: "KaamWala",
        description: `Unlock Contact - ${options.workerName}`,
        order_id: orderData.orderId,
        prefill: {
          name: currentUser.displayName || "",
          email: currentUser.email || "",
          contact: currentUser.phoneNumber || "",
        },
        theme: {
          color: "#16a34a", // Primary brand emerald
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
          confirm_close: true,
        },
        handler: async (response: RazorpaySuccessResponse) => {
          try {
            // 6. Post verification to server
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                workerId: options.workerId,
              }),
            });

            const verifyData = await verifyRes.json().catch(() => ({}));
            if (!verifyRes.ok || !verifyData.success) {
              const verifyErr = verifyData.error || "Payment verification failed.";
              setError(verifyErr);
              options.onError?.(verifyErr);
              setLoading(false);
              return;
            }

            setLoading(false);
            options.onSuccess?.({
              phoneNumber: verifyData.phoneNumber,
              whatsappUrl: verifyData.whatsappUrl,
            });
          } catch (err) {
            const verifyErr = err instanceof Error ? err.message : "Payment verification network error.";
            setError(verifyErr);
            options.onError?.(verifyErr);
            setLoading(false);
          }
        },
      };

      const rzpInstance = new window.Razorpay(rzpOptions);
      rzpInstance.on("payment.failed", (failedRes: RazorpayErrorResponse) => {
        const failMsg = failedRes?.error?.description || "Payment failed or was cancelled.";
        setError(failMsg);
        options.onError?.(failMsg);
        setLoading(false);
      });

      rzpInstance.open();
    } catch (err) {
      const genericErr = err instanceof Error ? err.message : "Payment initiation failed.";
      setError(genericErr);
      options.onError?.(genericErr);
      setLoading(false);
    }
  }, []);

  return {
    unlockWithRazorpay,
    loading,
    error,
    setError,
  };
}
