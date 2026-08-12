"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, Clock, Calendar, Info, Star, DollarSign, Megaphone, UserPlus } from "lucide-react";
import { getNotifications, markAsRead, markAllAsRead } from "@/services/notificationService";
import { NotificationDoc, NotificationType } from "@/types/firestore";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface NotificationCenterProps {
  userId: string;
  onNavigate?: () => void;
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "booking_created":
    case "booking_accepted":
    case "booking_rejected":
    case "booking_cancelled":
    case "booking_completed":
      return <Calendar className="w-4 h-4 text-primary" />;
    case "review_received":
      return <Star className="w-4 h-4 text-warning" />;
    case "subscription_updated":
      return <DollarSign className="w-4 h-4 text-success" />;
    case "membership_updated":
      return <UserPlus className="w-4 h-4 text-secondary" />;
    case "contact_unlocked":
      return <Bell className="w-4 h-4 text-primary" />;
    case "advertisement_updated":
      return <Megaphone className="w-4 h-4 text-warning" />;
    case "system":
      return <Info className="w-4 h-4 text-text-muted" />;
    default:
      return <Bell className="w-4 h-4 text-text-muted" />;
  }
}

function getNotificationLink(notification: NotificationDoc): string | undefined {
  if (notification.relatedId) {
    switch (notification.type) {
      case "booking_created":
      case "booking_accepted":
      case "booking_rejected":
      case "booking_cancelled":
      case "booking_completed":
        return `/bookings/${notification.relatedId}`;
      case "review_received":
        return `/workers/${notification.relatedId}`;
      case "subscription_updated":
        return `/subscriptions`;
      case "membership_updated":
        return `/membership`;
      case "contact_unlocked":
        return `/billing`;
      case "advertisement_updated":
        return `/advertise`;
      default:
        return undefined;
    }
  }
  return undefined;
}

export default function NotificationCenter({ userId, onNavigate }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<NotificationDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getNotifications(userId);
      if (result.error) {
        setError(result.error);
      } else {
        setNotifications(result.notifications);
      }
    } catch {
      setError("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const hasFetched = useRef(false);

  useEffect(() => {
    if (!userId || hasFetched.current) return;
    hasFetched.current = true;
    fetchNotifications();
  }, [userId, fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllAsRead = async () => {
    if (!userId) return;
    const { error } = await markAllAsRead(userId);
    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
    }
  };

  const handleMarkAsRead = async (id: string) => {
    const { error } = await markAsRead(id);
    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    }
  };

  const handleNotificationClick = async (notification: NotificationDoc) => {
    if (!notification.read) {
      await handleMarkAsRead(notification.id);
    }
    onNavigate?.();
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-text">Notifications</h3>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
            <CheckCheck className="w-4 h-4 mr-1" />
            Mark all as read
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger rounded-xl p-3 text-sm mb-3">
          {error}
          <Button variant="ghost" size="sm" onClick={fetchNotifications} className="ml-2">
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-8">
          <Bell className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted text-sm">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          <AnimatePresence>
            {notifications.map((notification) => {
              const link = getNotificationLink(notification);
              const content = (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors",
                    notification.read
                      ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                      : "bg-primary-50 dark:bg-primary-950 border-primary-200 dark:border-primary-800"
                  )}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          notification.read
                            ? "text-text-secondary"
                            : "text-text"
                        )}
                      >
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-text-muted mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-text-muted">
                      <Clock className="w-3 h-3" />
                      {notification.createdAt
                        ? notification.createdAt.toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </div>
                  </div>
                </motion.div>
              );

              if (link) {
                return (
                  <Link key={notification.id} href={link}>
                    {content}
                  </Link>
                );
              }

              return content;
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
