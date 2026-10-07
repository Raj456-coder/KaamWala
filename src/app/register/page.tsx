"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Phone,
  User,
  Users,
  Briefcase,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { registerUser } from "@/services/authService";
import { getWorkerById } from "@/services/firestoreService";
import { UserRole } from "@/types/firestore";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("customer");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const validatePhone = (p: string) => /^[\d\s\-+()]{7,15}$/.test(p);

  const getPasswordStrength = (p: string) => {
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthLabels = ["Weak", "Fair", "Good", "Strong", "Very Strong"];
  const strengthColors = [
    "bg-danger",
    "bg-warning",
    "bg-primary",
    "bg-success",
    "bg-success",
  ];

  const errors = useCallback(() => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Full name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!validateEmail(email)) e.email = "Invalid email format";
    if (!phone.trim()) e.phone = "Mobile number is required";
    else if (!validatePhone(phone)) e.phone = "Enter a valid Indian mobile number";
    if (!password) e.password = "Password is required";
    else if (password.length < 6) e.password = "Password must be at least 6 characters";
    if (!confirmPassword) e.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword) e.confirmPassword = "Passwords do not match";
    return e;
  }, [name, email, phone, password, confirmPassword]);

  const errorMap = errors();
  const hasErrors = Object.keys(errorMap).length > 0;

  const isValid =
    name.trim() &&
    validateEmail(email) &&
    validatePhone(phone) &&
    password.length >= 6 &&
    password === confirmPassword &&
    !hasErrors;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = errors();
    if (Object.keys(errs).length > 0) return;

    setIsLoading(true);

    const { user: registeredUser, error: regError } = await registerUser(
      email,
      password,
      name,
      selectedRole,
      phone
    );

    if (regError) {
      setIsLoading(false);
      setError(regError.message);
    } else {
      setIsLoading(false);
      setIsSubmitted(true);

      setTimeout(async () => {
        if (selectedRole === "worker") {
          if (registeredUser?.uid) {
            try {
              const { worker } = await getWorkerById(registeredUser.uid);
              if (
                worker?.professionalInfo?.profession ||
                worker?.professionalInfo?.category
              ) {
                window.location.href = "/worker-dashboard";
                return;
              }
            } catch (err) {
              console.error("[Register] Error checking worker profile:", err);
            }
          }
          window.location.href = "/become-worker";
        } else {
          window.location.href = "/customer-dashboard";
        }
      }, 1500);
    }
  };

  return (
    <main className="min-h-screen bg-surface">
      <div className="min-h-screen flex flex-col lg:flex-row">
        {/* Left Side */}
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
                Join KaamWala
              </h1>

              <p className="text-lg text-primary-100 max-w-md mb-8 leading-relaxed">
                Create an account to hire trusted workers or offer your
                professional services.
              </p>

              <div className="space-y-4">
                {[
                  {
                    icon: <CheckCircle2 className="w-5 h-5" />,
                    text: "Trusted Community",
                    color: "bg-success/20 text-success",
                  },
                  {
                    icon: <ShieldCheck className="w-5 h-5" />,
                    text: "Verified Professionals",
                    color: "bg-warning/20 text-warning",
                  },
                  {
                    icon: <Zap className="w-5 h-5" />,
                    text: "Fast Hiring",
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

        {/* Right Side */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12 lg:py-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-md"
          >
            <div className="lg:hidden mb-6 text-center">
              <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary/25">
                <ShieldCheck className="w-7 h-7 text-white" fill="white" />
              </div>
              <h1 className="text-2xl font-bold font-heading text-text">
                Create Account
              </h1>
              <p className="text-text-secondary text-sm mt-1.5">
                Join KaamWala today
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-slate-700/40 shadow-2xl shadow-black/10 p-6 sm:p-8"
            >
              <h2 className="text-2xl font-bold font-heading text-text mb-1">
                Create Account
              </h2>
              <p className="text-text-secondary text-sm mb-6">
                Sign up to get started with KaamWala
              </p>

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
                noValidate
                autoComplete="on"
              >
                {/* Full Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-text mb-2"
                  >
                    Full Name
                  </label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted transition-colors duration-200 group-focus-within:text-primary" />
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      className={cn(
                        "w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border transition-all duration-200 text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm",
                        errorMap.name
                          ? "border-danger focus:ring-danger/40 focus:border-danger"
                          : "border-slate-200 dark:border-slate-700 focus:border-primary"
                      )}
                      autoComplete="name"
                      aria-invalid={!!errorMap.name}
                    />
                  </div>
                  <AnimatePresence>
                    {errorMap.name && (
                      <motion.p
                        initial={{ opacity: 0, y: -4, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -4, height: 0 }}
                        className="text-danger text-xs mt-1.5 flex items-center gap-1 overflow-hidden"
                        role="alert"
                      >
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        {errorMap.name}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

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
                      placeholder="you@example.com"
                      className={cn(
                        "w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border transition-all duration-200 text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm",
                        errorMap.email
                          ? "border-danger focus:ring-danger/40 focus:border-danger"
                          : "border-slate-200 dark:border-slate-700 focus:border-primary"
                      )}
                      autoComplete="email"
                      aria-invalid={!!errorMap.email}
                    />
                  </div>
                  <AnimatePresence>
                    {errorMap.email && (
                      <motion.p
                        initial={{ opacity: 0, y: -4, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -4, height: 0 }}
                        className="text-danger text-xs mt-1.5 flex items-center gap-1 overflow-hidden"
                        role="alert"
                      >
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        {errorMap.email}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Mobile Number */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-text mb-2"
                  >
                    Mobile Number
                  </label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted transition-colors duration-200 group-focus-within:text-primary" />
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className={cn(
                        "w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border transition-all duration-200 text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm",
                        errorMap.phone
                          ? "border-danger focus:ring-danger/40 focus:border-danger"
                          : "border-slate-200 dark:border-slate-700 focus:border-primary"
                      )}
                      autoComplete="tel"
                      aria-invalid={!!errorMap.phone}
                    />
                  </div>
                  <AnimatePresence>
                    {errorMap.phone && (
                      <motion.p
                        initial={{ opacity: 0, y: -4, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -4, height: 0 }}
                        className="text-danger text-xs mt-1.5 flex items-center gap-1 overflow-hidden"
                        role="alert"
                      >
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        {errorMap.phone}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-text mb-2"
                  >
                    Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted transition-colors duration-200 group-focus-within:text-primary" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a strong password"
                      className={cn(
                        "w-full pl-11 pr-12 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border transition-all duration-200 text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm",
                        errorMap.password
                          ? "border-danger focus:ring-danger/40 focus:border-danger"
                          : "border-slate-200 dark:border-slate-700 focus:border-primary"
                      )}
                      autoComplete="new-password"
                      aria-invalid={!!errorMap.password}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 rounded p-1"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      <motion.div
                        initial={false}
                        animate={{
                          rotate: showPassword ? 180 : 0,
                          scale: showPassword ? 0.9 : 1,
                        }}
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
                    {errorMap.password && (
                      <motion.p
                        initial={{ opacity: 0, y: -4, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -4, height: 0 }}
                        className="text-danger text-xs mt-1.5 flex items-center gap-1 overflow-hidden"
                        role="alert"
                      >
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        {errorMap.password}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {/* Password Strength */}
                  {password.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <motion.div
                            className={cn(
                              "h-full rounded-full transition-all duration-300",
                              strengthColors[passwordStrength - 1] ||
                                "bg-slate-300"
                            )}
                            initial={{ width: 0 }}
                            animate={{
                              width: `${(passwordStrength / 5) * 100}%`,
                            }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <span className="text-[10px] font-medium text-text-muted">
                          {strengthLabels[passwordStrength - 1] || "Weak"}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-text mb-2"
                  >
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted transition-colors duration-200 group-focus-within:text-primary" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className={cn(
                        "w-full pl-11 pr-12 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border transition-all duration-200 text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm",
                        errorMap.confirmPassword
                          ? "border-danger focus:ring-danger/40 focus:border-danger"
                          : "border-slate-200 dark:border-slate-700 focus:border-primary"
                      )}
                      autoComplete="new-password"
                      aria-invalid={!!errorMap.confirmPassword}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 rounded p-1"
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                    >
                      <motion.div
                        initial={false}
                        animate={{
                          rotate: showConfirmPassword ? 180 : 0,
                          scale: showConfirmPassword ? 0.9 : 1,
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </motion.div>
                    </button>
                  </div>
                  <AnimatePresence>
                    {errorMap.confirmPassword && (
                      <motion.p
                        initial={{ opacity: 0, y: -4, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -4, height: 0 }}
                        className="text-danger text-xs mt-1.5 flex items-center gap-1 overflow-hidden"
                        role="alert"
                      >
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        {errorMap.confirmPassword}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-text mb-3">
                    I want to
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        value: "customer",
                        label: "Hire Workers",
                        icon: <Users className="w-5 h-5" />,
                        desc: "Find and book trusted professionals",
                      },
                      {
                        value: "worker",
                        label: "Offer Services",
                        icon: <Briefcase className="w-5 h-5" />,
                        desc: "Provide your professional services",
                      },
                    ].map((option) => (
                      <motion.button
                        key={option.value}
                        type="button"
                        onClick={() => setSelectedRole(option.value as UserRole)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 text-center",
                          selectedRole === option.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-slate-200 dark:border-slate-700 text-text-secondary hover:border-primary/30"
                        )}
                      >
                        {option.icon}
                        <span className="text-sm font-medium">{option.label}</span>
                        <span className="text-xs">{option.desc}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-danger-50 dark:bg-danger-950 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full relative overflow-hidden"
                  rightIcon={
                    isLoading ? undefined : <ArrowRight className="w-4 h-4" />
                  }
                  disabled={!isValid || isLoading}
                  isLoading={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Account...
                    </span>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>

              {/* Bottom Links */}
              <div className="mt-6 text-center">
                <p className="text-sm text-text-secondary">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-primary font-semibold hover:underline underline-offset-2 transition-colors duration-200"
                  >
                    Login
                  </Link>
                </p>
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
                <span>Secure Registration</span>
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
                Account Created
              </h3>
              <p className="text-text-secondary text-sm mb-4">
                Welcome to KaamWala! Your account has been created successfully.
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