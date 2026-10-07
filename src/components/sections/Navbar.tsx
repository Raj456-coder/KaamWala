"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  Menu,
  X,
  Zap,
  LogIn,
  UserPlus,
  Moon,
  Sun,
  Bell,
  Heart,
  LayoutDashboard,
  User,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import LogoutButton from "@/components/ui/LogoutButton";
import { cn } from "@/lib/utils";
import { getUnreadCount } from "@/services/notificationService";
import NotificationCenter from "@/components/notifications/NotificationCenter";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/categories", label: "Categories" },
  { href: "/search", label: "Find Workers" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { theme, toggleTheme } = useTheme();
  const { user, role } = useAuth();
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const fetchUnread = async () => {
      const { count } = await getUnreadCount(user.uid);
      if (!cancelled) {
        setUnreadCount(count);
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
        isScrolled
          ? "bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-lg shadow-black/5 border-b border-slate-200 dark:border-slate-800"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/25 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6 text-white" fill="white" />
            </div>
            <span className="text-2xl font-bold font-heading text-text">
              Kaam<span className="text-primary">Wala</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative text-sm font-medium text-text-secondary hover:text-primary transition-colors py-2"
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <Link
                href="/favorites"
                className="relative text-sm font-medium text-text-secondary hover:text-primary transition-colors py-2 flex items-center gap-1"
              >
                <Heart className="w-4 h-4" />
                Saved
              </Link>
            )}
            {user && role === "worker" && (
              <Link
                href="/subscriptions"
                className="relative text-sm font-medium text-text-secondary hover:text-primary transition-colors py-2"
              >
                Plans
              </Link>
            )}
            {user && role === "customer" && (
              <>
                <Link
                  href="/membership"
                  className="relative text-sm font-medium text-text-secondary hover:text-primary transition-colors py-2"
                >
                  Membership
                </Link>
                <Link
                  href="/billing"
                  className="relative text-sm font-medium text-text-secondary hover:text-primary transition-colors py-2"
                >
                  Billing
                </Link>
              </>
            )}
            {user && (
              <Link
                href="/advertise"
                className="relative text-sm font-medium text-text-secondary hover:text-primary transition-colors py-2"
              >
                Advertise
              </Link>
            )}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5 text-warning" />
              ) : (
                <Moon className="w-5 h-5 text-primary" />
              )}
            </button>
            {user && (
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5 text-text-secondary" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                <AnimatePresence>
                  {isNotificationOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ type: "spring", damping: 25, stiffness: 300 }}
                      className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl shadow-black/10 border border-slate-200 dark:border-slate-700 z-50 overflow-hidden"
                    >
                      <NotificationCenter userId={user.uid} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href={
                    role === "worker"
                      ? "/worker-dashboard"
                      : role === "admin"
                      ? "/admin"
                      : role === "customer"
                      ? "/customer-dashboard"
                      : "/role-select"
                  }
                >
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<LayoutDashboard className="w-4 h-4" />}
                  >
                    Dashboard
                  </Button>
                </Link>
                <Link
                  href={
                    role === "worker"
                      ? "/worker-dashboard"
                      : role === "admin"
                      ? "/admin"
                      : role === "customer"
                      ? "/customer-dashboard"
                      : "/role-select"
                  }
                  className="flex items-center gap-2 p-1 pl-1 pr-2 rounded-full border border-slate-200 dark:border-slate-700 hover:border-primary/50 transition-colors"
                  title={user.displayName || user.email || "Profile"}
                  aria-label="User profile"
                >
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt={user.displayName || "Avatar"}
                      width={28}
                      height={28}
                      className="w-7 h-7 rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                      {user.displayName
                        ? user.displayName.slice(0, 2)
                        : user.email
                        ? user.email.slice(0, 2)
                        : <User className="w-3.5 h-3.5" />}
                    </div>
                  )}
                  {role && (
                    <Badge variant={role === "worker" ? "primary" : "neutral"} size="sm">
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Badge>
                  )}
                </Link>
                <LogoutButton variant="ghost" size="sm" />
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" leftIcon={<LogIn className="w-4 h-4" />}>
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm" leftIcon={<UserPlus className="w-4 h-4" />}>
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5 text-warning" />
              ) : (
                <Moon className="w-5 h-5 text-primary" />
              )}
            </button>
            {user && (
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5 text-text-secondary" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                <AnimatePresence>
                  {isNotificationOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ type: "spring", damping: 25, stiffness: 300 }}
                      className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl shadow-black/10 border border-slate-200 dark:border-slate-700 z-50 overflow-hidden"
                    >
                      <NotificationCenter userId={user.uid} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 overflow-hidden"
          >
              <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-xl text-text-secondary hover:text-primary hover:bg-primary-50 dark:hover:bg-primary-950 transition-colors font-medium"
                  >
                    {link.label}
                  </Link>
                ))}
                {user && (
                  <Link
                    href="/favorites"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-xl text-text-secondary hover:text-primary hover:bg-primary-50 dark:hover:bg-primary-950 transition-colors font-medium flex items-center gap-2"
                  >
                    <Heart className="w-4 h-4" />
                    Saved Workers
                  </Link>
                )}
                {user && role === "worker" && (
                  <Link
                    href="/subscriptions"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-xl text-text-secondary hover:text-primary hover:bg-primary-50 dark:hover:bg-primary-950 transition-colors font-medium"
                  >
                    Plans
                  </Link>
                )}
                {user && role === "customer" && (
                  <>
                    <Link
                      href="/membership"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-xl text-text-secondary hover:text-primary hover:bg-primary-50 dark:hover:bg-primary-950 transition-colors font-medium"
                    >
                      Membership
                    </Link>
                    <Link
                      href="/billing"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-xl text-text-secondary hover:text-primary hover:bg-primary-50 dark:hover:bg-primary-950 transition-colors font-medium"
                    >
                      Billing
                    </Link>
                  </>
                )}
                {user && (
                  <Link
                    href="/advertise"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-xl text-text-secondary hover:text-primary hover:bg-primary-50 dark:hover:bg-primary-950 transition-colors font-medium"
                  >
                    Advertise
                  </Link>
                )}
                <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  {user ? (
                    <>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl mb-1">
                        {user.photoURL ? (
                          <Image
                            src={user.photoURL}
                            alt={user.displayName || "Avatar"}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm uppercase">
                            {user.displayName
                              ? user.displayName.slice(0, 2)
                              : user.email
                              ? user.email.slice(0, 2)
                              : <User className="w-5 h-5" />}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-text truncate">
                            {user.displayName || user.email?.split("@")[0] || "User"}
                          </p>
                          {user.email && (
                            <p className="text-xs text-text-muted truncate">{user.email}</p>
                          )}
                        </div>
                        {role && (
                          <Badge variant={role === "worker" ? "primary" : "neutral"} size="sm">
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </Badge>
                        )}
                      </div>
                      <Link
                        href={
                          role === "worker"
                            ? "/worker-dashboard"
                            : role === "admin"
                            ? "/admin"
                            : role === "customer"
                            ? "/customer-dashboard"
                            : "/role-select"
                        }
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="w-full"
                      >
                        <Button variant="primary" className="w-full justify-center" leftIcon={<LayoutDashboard className="w-4 h-4" />}>
                          Dashboard
                        </Button>
                      </Link>
                      <LogoutButton variant="ghost" className="w-full justify-center" onSuccess={() => setIsMobileMenuOpen(false)} />
                    </>
                  ) : (
                    <>
                      <Link href="/login" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full justify-center">
                          Login
                        </Button>
                      </Link>
                      <Link href="/register" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button variant="primary" className="w-full justify-center">
                          Register
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

