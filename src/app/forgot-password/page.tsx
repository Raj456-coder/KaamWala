"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { resetPassword } from "@/services/authService";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const emailError = useCallback(() => {
    if (!email.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Invalid email format";
    return "";
  }, [email]);

  const isValid = email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const hasError = !!emailError();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = emailError();
    if (err) return;

    setIsLoading(true);
    setIsError(false);
    setErrorMessage("");

    const { error } = await resetPassword(email);

    if (error) {
      setIsLoading(false);
      setIsError(true);
      setErrorMessage("If an account with that email exists, we have sent a password reset link.");
    } else {
      setIsLoading(false);
      setIsSubmitted(true);
    }
  };

  const handleReset = () => {
    setEmail("");
    setIsSubmitted(false);
    setIsError(false);
    setErrorMessage("");
  };

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7 text-primary" fill="white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-heading text-text">
            Forgot Password?
          </h1>
          <p className="text-text-secondary mt-3 max-w-sm mx-auto">
            Enter your email address and we&apos;ll send you a password reset link.
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-slate-700/40 shadow-2xl shadow-black/5 p-6 sm:p-8"
        >
          <AnimatePresence mode="wait">
            {!isSubmitted && !isError ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-text mb-2"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className={cn(
                          "w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border transition-all duration-200 text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm",
                          hasError
                            ? "border-danger focus:ring-danger/40 focus:border-danger"
                            : "border-slate-200 dark:border-slate-700 focus:border-primary"
                        )}
                        autoComplete="email"
                      />
                    </div>
                    <AnimatePresence>
                      {hasError && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="text-danger text-xs mt-2 flex items-center gap-1"
                        >
                          <AlertCircle className="w-3 h-3" />
                          {emailError()}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    rightIcon={isLoading ? undefined : <ArrowRight className="w-4 h-4" />}
                    disabled={!isValid || isLoading}
                    isLoading={isLoading}
                  >
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </form>
              </motion.div>
            ) : isError ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-center py-4"
              >
                <div className="w-14 h-14 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-7 h-7 text-danger" />
                </div>
                <h3 className="text-lg font-bold text-text mb-2">Unable to Send Reset Link</h3>
                <p className="text-text-secondary text-sm mb-6">{errorMessage}</p>
                <div className="space-y-3">
                  <Button variant="primary" className="w-full" onClick={handleReset}>
                    Try Again
                  </Button>
                  <Link href="/login" className="block">
                    <Button variant="outline" className="w-full">
                      Back to Login
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", damping: 15, duration: 0.4 }}
                className="text-center py-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 12, delay: 0.2 }}
                  className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle2 className="w-8 h-8 text-success" fill="white" />
                </motion.div>
                <h3 className="text-xl font-bold text-text mb-2">
                  Reset Link Sent
                </h3>
                <p className="text-text-secondary text-sm mb-2">
                  Password reset link sent successfully.
                </p>
                <p className="text-text-muted text-xs mb-6">
                  Check your inbox at{" "}
                  <span className="font-medium text-text">{email}</span> and follow the
                  instructions.
                </p>
                <div className="space-y-3">
                  <Link href="/login" className="block">
                    <Button variant="primary" className="w-full" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                      Back to Login
                    </Button>
                  </Link>
                  <Button variant="ghost" className="w-full" onClick={handleReset}>
                    Send Another Link
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 text-center"
        >
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Remember your password? Back to Login
          </Link>
        </motion.div>
      </div>
    </main>
  );
}