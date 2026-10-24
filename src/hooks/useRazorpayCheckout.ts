"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
  onDismiss?: () => void;
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

let razorpayScriptPromise: Promise<boolean> | null = null;

/**
 * Dynamically loads the official Razorpay Checkout JavaScript SDK.
 * Uses a singleton promise to ensure the script is only injected and loaded once.
 */
function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }
  if (window.Razorpay) {
    return Promise.resolve(true);
  }
  if (razorpayScriptPromise) {
    return razorpayScriptPromise;
  }

  razorpayScriptPromise = new Promise<boolean>((resolve) => {
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      existingScript.addEventListener("load", () => resolve(true), { once: true });
      existingScript.addEventListener("error", () => {
        razorpayScriptPromise = null;
        resolve(false);
      }, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      razorpayScriptPromise = null;
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
}

export function useRazorpayCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitiatingRef = useRef(false);

  // Preload Razorpay SDK once on mount with an empty dependency array to avoid infinite compilation or re-render loops
  useEffect(() => {
    let isMounted = true;
    loadRazorpayScript().catch((err) => {
      if (isMounted) {
        console.warn("Failed to preload Razorpay SDK:", err);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const unlockWithRazorpay = useCallback(async (options: RazorpayCheckoutOptions) => {
    if (isInitiatingRef.current) {
      console.warn("Payment request already in progress. Ignoring duplicate click.");
      return;
    }
    isInitiatingRef.current = true;
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
        isInitiatingRef.current = false;
        return;
      }

      // 2. Load Razorpay SDK
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        const scriptErr = "Failed to load Razorpay payment gateway. Please check your network connection.";
        setError(scriptErr);
        options.onError?.(scriptErr);
        setLoading(false);
        isInitiatingRef.current = false;
        return;
      }

      // 3. Obtain Firebase ID token
      let idToken: string | null = null;
      try {
        idToken = await currentUser.getIdToken();
      } catch (tokenErr) {
        console.warn("Failed to retrieve ID token:", tokenErr);
      }

      // 4. Create Razorpay order on server
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (idToken) {
        headers.Authorization = `Bearer ${idToken}`;
      }

      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers,
        body: JSON.stringify({ workerId: options.workerId }),
      });

      const orderData = await orderRes.json().catch(() => ({}));
      const order_id = orderData.order_id || orderData.orderId;

      if (!orderRes.ok || !order_id) {
        const orderErr =
          orderData.error ||
          orderData.message ||
          (orderRes.status === 500
            ? "Payment gateway credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."
            : `Failed to create payment order (${orderRes.status})`);
        setError(orderErr);
        options.onError?.(orderErr);
        setLoading(false);
        isInitiatingRef.current = false;
        return;
      }

      // 5. Configure Razorpay modal with NEXT_PUBLIC_RAZORPAY_KEY_ID and order_id
      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || orderData.keyId || orderData.key;
      if (!razorpayKey) {
        const credErr = "Payment gateway credentials not configured. Please set NEXT_PUBLIC_RAZORPAY_KEY_ID.";
        setError(credErr);
        options.onError?.(credErr);
        setLoading(false);
        isInitiatingRef.current = false;
        return;
      }

      const rzpOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || razorpayKey,
        order_id: order_id,
        amount: orderData.amount || 1000, // 1000 paise (₹10.00)
        currency: orderData.currency || "INR",
        name: "KaamWala",
        description: `Unlock Contact - ${options.workerName}`,
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
            isInitiatingRef.current = false;
            setLoading(false);
            options.onDismiss?.();
          },
          confirm_close: true,
        },
        handler: async (response: RazorpaySuccessResponse) => {
          try {
            // 6. Post verification to server
            const verifyHeaders: Record<string, string> = {
              "Content-Type": "application/json",
            };
            if (idToken) {
              verifyHeaders.Authorization = `Bearer ${idToken}`;
            }

            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: verifyHeaders,
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                workerId: options.workerId,
              }),
            });

            const verifyData = await verifyRes.json().catch(() => ({}));
            if (!verifyRes.ok || !verifyData.success) {
              const verifyErr = verifyData.error || verifyData.message || "Payment verification failed.";
              setError(verifyErr);
              options.onError?.(verifyErr);
              setLoading(false);
              isInitiatingRef.current = false;
              return;
            }

            setLoading(false);
            isInitiatingRef.current = false;
            options.onSuccess?.({
              phoneNumber: verifyData.phoneNumber,
              whatsappUrl: verifyData.whatsappUrl,
            });
          } catch (err) {
            const verifyErr = err instanceof Error ? err.message : "Payment verification network error.";
            setError(verifyErr);
            options.onError?.(verifyErr);
            setLoading(false);
            isInitiatingRef.current = false;
          }
        },
      };

      const rzpInstance = new window.Razorpay(rzpOptions);
      rzpInstance.on("payment.failed", (failedRes: RazorpayErrorResponse) => {
        const failMsg = failedRes?.error?.description || "Payment failed or was cancelled.";
        setError(failMsg);
        options.onError?.(failMsg);
        setLoading(false);
        isInitiatingRef.current = false;
      });

      rzpInstance.open();
    } catch (err) {
      const genericErr = err instanceof Error ? err.message : "Payment initiation failed.";
      setError(genericErr);
      options.onError?.(genericErr);
      setLoading(false);
      isInitiatingRef.current = false;
    }
  }, []);

  return {
    unlockWithRazorpay,
    loading,
    error,
    setError,
  };
}
