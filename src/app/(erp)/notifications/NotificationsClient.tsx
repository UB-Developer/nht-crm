"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bell,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileCheck2,
  DollarSign,
  Plane,
  BellOff,
  CheckCheck,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  linkUrl?: string | null;
  createdAt: string;
}

interface NotificationsClientProps {
  initialNotifications: NotificationItem[];
  initialUnread: number;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  PASSPORT_EXPIRY: <AlertTriangle className="w-4 h-4 text-amber-500" />,
  GROUP_DEADLINE: <Plane className="w-4 h-4 text-cyan-500" />,
  PAYMENT_DUE: <DollarSign className="w-4 h-4 text-red-500" />,
  VISA_STATUS: <FileCheck2 className="w-4 h-4 text-purple-500" />,
  REFUND_REQUEST: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  GENERAL: <Bell className="w-4 h-4 text-slate-500" />,
};

const TYPE_BG: Record<string, string> = {
  PASSPORT_EXPIRY: "border-amber-200 bg-amber-50/60 dark:border-amber-800 dark:bg-amber-950/20",
  GROUP_DEADLINE: "border-cyan-200 bg-cyan-50/60 dark:border-cyan-800 dark:bg-cyan-950/20",
  PAYMENT_DUE: "border-red-200 bg-red-50/60 dark:border-red-800 dark:bg-red-950/20",
  VISA_STATUS: "border-purple-200 bg-purple-50/60 dark:border-purple-800 dark:bg-purple-950/20",
  REFUND_REQUEST: "border-emerald-200 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/20",
  GENERAL: "border-border bg-muted/30",
};

export function NotificationsClient({ initialNotifications, initialUnread }: NotificationsClientProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [unread, setUnread] = useState(initialUnread);
  const [filter, setFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState<string | null>(null);

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "UNREAD") return !n.isRead;
    if (filter === "READ") return n.isRead;
    if (filter !== "ALL") return n.type === filter;
    return true;
  });

  const markRead = async (id: string) => {
    if (loading) return;
    const notification = notifications.find((n) => n.id === id);
    if (!notification || notification.isRead) return;

    setLoading(id);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnread((u) => Math.max(0, u - 1));
    } finally {
      setLoading(null);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
    } catch {
      // silent
    }
  };

  const formatTime = (dt: string) => {
    const now = new Date();
    const then = new Date(dt);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const uniqueTypes = Array.from(new Set(notifications.map((n) => n.type)));

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Bell className="w-6 h-6 text-emerald-600" />
            Notifications
            {unread > 0 && (
              <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unread} unread
              </span>
            )}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Passport expiry alerts, payment reminders, visa updates, and group deadline warnings
          </p>
        </div>
        {unread > 0 && (
          <Button
            onClick={markAllRead}
            variant="outline"
            className="flex items-center gap-2 text-xs font-semibold"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            Mark All Read ({unread})
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 flex-wrap border-b border-border pb-2">
        {[
          { id: "ALL", label: `All (${notifications.length})` },
          { id: "UNREAD", label: `Unread (${unread})` },
          ...uniqueTypes.map((t) => ({
            id: t,
            label: t.replace(/_/g, " "),
          })),
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === tab.id
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {filteredNotifications.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <BellOff className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <div className="font-semibold text-foreground">No notifications</div>
          <p className="text-sm mt-1">You&apos;re all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markRead(n.id)}
              className={`relative p-4 rounded-xl border transition-all cursor-pointer group ${
                TYPE_BG[n.type] || "border-border bg-card"
              } ${!n.isRead ? "shadow-xs" : "opacity-70 hover:opacity-100"}`}
            >
              {/* Unread indicator */}
              {!n.isRead && (
                <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}

              <div className="flex items-start gap-3">
                <div className={`mt-0.5 p-2 rounded-lg ${!n.isRead ? "bg-white dark:bg-slate-800 shadow-xs" : "bg-muted/50"}`}>
                  {TYPE_ICON[n.type] || TYPE_ICON.GENERAL}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className={`font-semibold text-sm ${!n.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                      {n.title}
                    </div>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      {formatTime(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.message}</p>

                  {n.linkUrl && (
                    <Link
                      href={n.linkUrl}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-semibold hover:underline"
                    >
                      View Record <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>

              {loading === n.id && (
                <div className="absolute inset-0 bg-background/50 rounded-xl flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
