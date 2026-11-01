"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Store,
  BadgeDollarSign,
  PlaneTakeoff,
  Building2,
  Compass,
  Users,
  PackageCheck,
  CalendarDays,
  Plane,
  Ticket,
  Hotel,
  FileCheck2,
  ShieldCheck,
  Receipt,
  BookOpen,
  BarChart3,
  RotateCcw,
  Truck,
  Network,
  FileSpreadsheet,
  Settings,
  LogOut,
  MoonStar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAVIGATION_ITEMS, UserRole, ROLE_CONFIGS } from "@/types/roles";

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Store,
  BadgeDollarSign,
  PlaneTakeoff,
  Building2,
  Compass,
  Users,
  PackageCheck,
  CalendarDays,
  Plane,
  Ticket,
  Hotel,
  FileCheck2,
  ShieldCheck,
  Receipt,
  BookOpen,
  BarChart3,
  RotateCcw,
  Truck,
  Network,
  FileSpreadsheet,
  Settings,
};

interface SidebarProps {
  onItemClick?: () => void;
}

export function Sidebar({ onItemClick }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const userRole = (session?.user?.role as UserRole) || UserRole.STAFF;
  const roleConfig = ROLE_CONFIGS[userRole] || ROLE_CONFIGS[UserRole.STAFF];

  // Filter items matching the current user's role
  const allowedNav = NAVIGATION_ITEMS.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <aside className="flex flex-col h-full bg-slate-900 text-slate-100 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-900/40 group-hover:scale-105 transition-transform">
            <MoonStar className="w-6 h-6" />
          </div>
          <div>
            <div className="font-bold text-sm leading-tight text-white tracking-wide">
              AL-HARAMAIN
            </div>
            <div className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider">
              Travel & Umrah ERP
            </div>
          </div>
        </Link>
      </div>

      {/* Role & Branch Banner */}
      <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800/80">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-slate-400">Signed In As:</span>
          <span
            className={cn(
              "text-[11px] font-semibold px-2 py-0.5 rounded-full border",
              roleConfig.badgeColor
            )}
          >
            {roleConfig.name}
          </span>
        </div>
        <div className="text-[11px] text-slate-300 truncate font-medium">
          📍 {session?.user?.branchName || "All Branches (Head Office)"}
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
          Navigation Menu
        </div>
        {allowedNav.map((item) => {
          const Icon = ICON_MAP[item.iconName] || Compass;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard/admin" &&
              item.href !== "/dashboard/branch" &&
              item.href !== "/dashboard/accountant" &&
              item.href !== "/dashboard/tickets" &&
              item.href !== "/dashboard/hotels" &&
              item.href !== "/dashboard/staff" &&
              pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group",
                isActive
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/50 font-semibold"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 transition-transform group-hover:scale-110",
                  isActive ? "text-white" : "text-slate-400 group-hover:text-emerald-400"
                )}
              />
              <span className="truncate">{item.title}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80">
          <div className="truncate mr-2">
            <div className="text-xs font-medium text-slate-200 truncate">
              {session?.user?.name || "Demo User"}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {session?.user?.email || "user@alharamain.pk"}
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign Out"
            className="p-1.5 rounded-md hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
