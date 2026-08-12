"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ShieldCheck,
  Zap,
  Clock,
} from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { loginUser, getFriendlyAuthError } from "@/services/authService";
import { auth, googleProvider, signInWithPopup } from "@/lib/firebase";
import { getUserRole } from "@/services/authService";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"error" | "success">("error");

  useEffect(() => {
    if (!loading && user) {
      getUserRole(user.uid).then((role) => {
        if (role === "worker") {
          window.location.href = "/worker-dashboard";
        } else if (role === "admin") {
          window.location.href = "/admin";
        } else {
          window.location.href = role === "customer" ? "/customer-dashboard" : "/role-select";
        }
      });
    }
  }, [user, loading]);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Invalid email format";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    return newErrors;
  }, [email, password]);

  const isValid =
    email.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    password.length >= 6;
  const formErrors = validate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) return;

    setIsLoading(true);

    const { user, error } = await loginUser(email, password);

    if (error) {
      setIsLoading(false);
      setToastMessage(error.message);
      setToastType("error");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    } else {
      setIsLoading(false);
      setIsSubmitted(true);

      setTimeout(async () => {
        const role = await getUserRole(user.uid);
        if (role === "worker") {
          window.location.href = "/worker-dashboard";
        } else if (role === "admin") {
          window.location.href = "/admin";
        } else {
          window.location.href = role === "customer" ? "/customer-dashboard" : "/role-select";
        }
      }, 1500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      handleSubmit(e);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    if (provider !== "Google") return;
    if (!auth || !googleProvider) {
      setToastMessage("Authentication service is not available. Please check your Firebase configuration.");
      setToastType("error");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    setIsLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const role = await getUserRole(user.uid);

      if (!role) {
        window.location.href = "/role-select";
        return;
      }

      setIsSubmitted(true);
      setTimeout(() => {
        if (role === "worker") {
          window.location.href = "/worker-dashboard";
        } else if (role === "admin") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/customer-dashboard";
        }
      }, 1500);
    } catch (error: unknown) {
      setIsLoading(false);
      const err = error as { code?: string; message?: string };
      setToastMessage(getFriendlyAuthError({ code: err.code ?? "", message: err.message ?? "" }));
      setToastType("error");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  return (
    <main className="min-h-screen bg-surface">
      <div className="min-h-screen flex flex-col lg:flex-row">
        {/* Left Side - Illustration */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary via-primary-700 to-primary-900 overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/30 to-secondary/10 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 flex flex-col justify-center px-12 max-w-lg">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-sm">
                <ShieldCheck className="w-8 h-8 text-white" fill="white" />
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold font-heading text-white mb-4 leading-tight">
                Welcome Back
              </h1>

              <p className="text-lg text-primary-100 max-w-md mb-8 leading-relaxed">
                Hire trusted professionals or manage your services with KaamWala.
              </p>

              <div className="space-y-4">
                {[
                  {
                    icon: <ShieldCheck className="w-5 h-5" />,
                    text: "Verified Workers",
                    color: "bg-success/20 text-success",
                  },
                  {
                    icon: <Zap className="w-5 h-5" />,
                    text: "Fast Hiring",
                    color: "bg-warning/20 text-warning",
                  },
                  {
                    icon: <Clock className="w-5 h-5" />,
                    text: "Secure Platform",
                    color: "bg-primary-50 text-primary",
                  },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.15 }}
                    className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3 backdrop-blur-sm"
                  >
                    <span
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                        item.color
                      )}
                    >
                      {item.icon}
                    </span>
                    <span className="text-sm text-white/90">{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Side - Login Card */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12 lg:py-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-md"
            onKeyDown={handleKeyDown}
          >
            <div className="lg:hidden mb-6 text-center">
              <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary/25">
                <ShieldCheck className="w-7 h-7 text-white" fill="white" />
              </div>
              <h1 className="text-2xl font-bold font-heading text-text">Welcome Back</h1>
              <p className="text-text-secondary text-sm mt-1.5">
                Sign in to your KaamWala account
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-slate-700/40 shadow-2xl shadow-black/10 p-6 sm:p-8"
            >
              <h2 className="text-2xl font-bold font-heading text-text mb-1">
                Sign In
              </h2>
              <p className="text-text-secondary text-sm mb-6">
                Enter your credentials to access your account
              </p>

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
                noValidate
                autoComplete="on"
              >
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-text mb-2"
                  >
                    Email Address
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted transition-colors duration-200 group-focus-within:text-primary" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => {}}
                      placeholder="you@example.com"
                      className={cn(
                        "w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border transition-all duration-200 text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm",
                        formErrors.email
                          ? "border-danger focus:ring-danger/40 focus:border-danger"
                          : "border-slate-200 dark:border-slate-700 focus:border-primary"
                      )}
                      autoComplete="email"
                      aria-invalid={!!formErrors.email}
                      aria-describedby={formErrors.email ? "email-error" : undefined}
                    />
                  </div>
                  <AnimatePresence>
                    {formErrors.email && (
                      <motion.p
                        initial={{ opacity: 0, y: -4, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -4, height: 0 }}
                        id="email-error"
                        className="text-danger text-xs mt-1.5 flex items-center gap-1 overflow-hidden"
                        role="alert"
                      >
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        {formErrors.email}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-text"
                    >
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-xs text-primary hover:underline font-medium transition-colors duration-200 focus:outline-none focus:underline focus:ring-2 focus:ring-primary/40 rounded"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted transition-colors duration-200 group-focus-within:text-primary" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => {}}
                      placeholder="••••••••"
                      className={cn(
                        "w-full pl-11 pr-12 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border transition-all duration-200 text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm",
                        formErrors.password
                          ? "border-danger focus:ring-danger/40 focus:border-danger"
                          : "border-slate-200 dark:border-slate-700 focus:border-primary"
                      )}
                      autoComplete="current-password"
                      aria-invalid={!!formErrors.password}
                      aria-describedby={formErrors.password ? "password-error" : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 rounded p-1"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      <motion.div
                        initial={false}
                        animate={{ rotate: showPassword ? 180 : 0, scale: showPassword ? 0.9 : 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </motion.div>
                    </button>
                  </div>
                  <AnimatePresence>
                    {formErrors.password && (
                      <motion.p
                        initial={{ opacity: 0, y: -4, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -4, height: 0 }}
                        id="password-error"
                        className="text-danger text-xs mt-1.5 flex items-center gap-1 overflow-hidden"
                        role="alert"
                      >
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        {formErrors.password}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/40 transition-colors duration-200"
                    />
                    <span className="text-sm text-text-secondary group-hover:text-text transition-colors duration-200">
                      Remember Me
                    </span>
                  </label>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full relative overflow-hidden"
                  rightIcon={isLoading ? undefined : <ArrowRight className="w-4 h-4" />}
                  disabled={!isValid || isLoading}
                  isLoading={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing In...
                    </span>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>

              {/* OR Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm text-text-muted text-xs font-medium rounded-full border border-slate-200 dark:border-slate-700">
                    OR
                  </span>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
                  leftIcon={<span className="text-lg">G</span>}
                  onClick={() => handleSocialLogin("Google")}
                  disabled={isLoading}
                >
                  Continue with Google
                </Button>
                <Button
                  variant="outline"
                  className="w-full hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
                  leftIcon={<span className="text-lg">📱</span>}
                  onClick={() => handleSocialLogin("Phone")}
                  disabled={isLoading}
                >
                  Continue with Phone
                </Button>
              </div>

              {/* Bottom Links */}
              <div className="mt-6 text-center space-y-2">
                <p className="text-sm text-text-secondary">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/register"
                    className="text-primary font-semibold hover:underline underline-offset-2 transition-colors duration-200"
                  >
                    Create Account
                  </Link>
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors duration-200 group"
                >
                  <span className="group-hover:-translate-x-0.5 transition-transform duration-200 inline-flex">
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </span>
                  Continue as Guest
                </Link>
              </div>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 flex items-center justify-center gap-4 text-text-muted"
            >
              <div className="flex items-center gap-1.5 text-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-success" />
                <span>Secure Login</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-300" />
              <div className="flex items-center gap-1.5 text-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-success" />
                <span>Verified Platform</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl shadow-black/20 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
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
              <ArrowLeft className="w-3.5 h-3.5 rotate-45" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Overlay */}
      <AnimatePresence>
        {isSubmitted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 15 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl text-center max-w-sm mx-4"
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
                Login Successful
              </h3>
              <p className="text-text-secondary text-sm mb-4">
                Welcome back to KaamWala!
              </p>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
              </div>
              <p className="text-xs text-text-muted mt-3">Redirecting...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Focus Styles */}
      <style>{`
        *:focus-visible {
          outline: 2px solid rgba(37, 99, 235, 0.5);
          outline-offset: 2px;
          border-radius: 4px;
        }
        input:focus-visible {
          outline: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </main>
  );
}