"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  PlusCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
} from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Button } from "@/components/ui/button";

interface TopbarProps {
  onMobileMenuToggle: () => void;
}

export function Topbar({ onMobileMenuToggle }: TopbarProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { isDark, setTheme } = useTheme();

  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  // Mocked dynamic notifications with passport expiry & deadline alerts
  const notifications = [
    {
      id: 1,
      title: "Passport Expiring (< 6 Months)",
      desc: "Sohail Akhtar's passport CL5544332 expires on 15 Dec 2026. Renewal warning active.",
      time: "10m ago",
      type: "alert",
      link: "/customers",
    },
    {
      id: 2,
      title: "Group Seat Deadline Approaching",
      desc: "SV Nov-Dec Super Economy group requires name list submission in 11 days.",
      time: "1h ago",
      type: "deadline",
      link: "/airline-groups",
    },
    {
      id: 3,
      title: "Payment Due: PKG-2026-0001",
      desc: "Haji Muhammad Iqbal has PKR 390,000 balance remaining.",
      time: "3h ago",
      type: "payment",
      link: "/bookings",
    },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header className="h-16 border-b bg-card/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-64 md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search passenger, passport, PNR, booking..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-muted/60 hover:bg-muted/90 focus:bg-background border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </form>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick New Booking Button */}
        <Button
          size="sm"
          variant="default"
          className="hidden sm:flex items-center gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => router.push("/bookings/new")}
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Booking</span>
        </Button>

        {/* Dark/Light mode toggle */}
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          title="Toggle Theme"
          className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
            className="relative p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-600 animate-pulse" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border bg-card text-card-foreground shadow-xl z-50 p-3">
              <div className="flex items-center justify-between pb-2 mb-2 border-b">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  System Alerts & Notifications (3)
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold cursor-pointer hover:underline">
                  Mark all read
                </span>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      setShowNotifications(false);
                      router.push(n.link);
                    }}
                    className="p-2.5 rounded-lg border bg-muted/40 hover:bg-muted cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>{n.title}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {n.time}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                      {n.desc}
                    </p>
                  </div>
                ))}
              </div>
              <div className="pt-2 mt-2 border-t text-center">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    router.push("/notifications");
                  }}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1"
                >
                  View All Notifications <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User avatar indicator */}
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center text-xs border border-emerald-600/30">
            {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold leading-tight">{session?.user?.name || "Logged In"}</div>
            <div className="text-[10px] text-muted-foreground">{session?.user?.role || "Staff"}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
