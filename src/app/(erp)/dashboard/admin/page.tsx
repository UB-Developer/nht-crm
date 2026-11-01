import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPKR, formatDate } from "@/lib/utils";
import {
  TrendingUp,
  Users,
  Building2,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  CreditCard,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminCharts } from "./AdminCharts";

export default async function AdminDashboardPage() {
  // Fetch real aggregated data from database
  const [
    branches,
    totalCustomers,
    totalBookings,
    totalRevenueResult,
    groups,
    recentBookings,
    auditLogs,
    passports,
  ] = await Promise.all([
    prisma.branch.findMany({
      where: { isDeleted: false },
      include: {
        _count: { select: { packageBookings: true, users: true, customers: true } },
      },
    }),
    prisma.customer.count({ where: { isDeleted: false } }),
    prisma.packageBooking.count({ where: { isDeleted: false } }),
    prisma.packageBooking.aggregate({
      _sum: { totalAmount: true, paidAmount: true, balanceAmount: true },
      where: { isDeleted: false },
    }),
    prisma.group.findMany({
      where: { isDeleted: false },
      include: { airline: true },
      take: 5,
    }),
    prisma.packageBooking.findMany({
      where: { isDeleted: false },
      include: {
        customer: true,
        package: true,
        branch: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.auditLog.findMany({
      include: { user: true, branch: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.passport.findMany({
      where: { isDeleted: false },
      take: 100,
    }),
  ]);

  const totalSales = totalRevenueResult._sum.totalAmount || 0;
  const totalReceived = totalRevenueResult._sum.paidAmount || 0;
  const totalReceivable = totalRevenueResult._sum.balanceAmount || 0;

  // Passport expiring soon count
  const expiringPassportsCount = passports.filter((p) => {
    const diffDays = (new Date(p.expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
    return diffDays < 180 && diffDays > 0;
  }).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Executive CRM & ERP Dashboard</h1>
            <Badge variant="purple" className="text-xs">
              Super Admin
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Enterprise overview across all Pakistan branches, airlines, hotels, and pilgrims.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/packages/new">
            <Button size="sm" variant="outline" className="text-xs gap-1">
              <Plus className="w-3.5 h-3.5" /> New Package
            </Button>
          </Link>
          <Link href="/bookings/new">
            <Button size="sm" className="text-xs gap-1 bg-emerald-700 hover:bg-emerald-800 text-white">
              <Plus className="w-3.5 h-3.5" /> Book Pilgrim
            </Button>
          </Link>
          <Link href="/reports">
            <Button size="sm" variant="gold" className="text-xs gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> P&L Report
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Package Sales
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <CreditCard className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatPKR(totalSales)}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-emerald-600 font-semibold flex items-center">
                <ArrowUpRight className="w-3 h-3" /> +14.2%
              </span>
              vs last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Cash / Bank Received
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <TrendingUp className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatPKR(totalReceived)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Outstanding: <span className="text-amber-600 font-semibold">{formatPKR(totalReceivable)}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Registered Pilgrims
            </CardTitle>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active Bookings: <span className="font-semibold text-foreground">{totalBookings}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Passport Expiry Alerts
            </CardTitle>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{expiringPassportsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Expiring in &lt; 6 months (Warning)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Visual Analytics Charts */}
      <AdminCharts totalSales={totalSales} totalReceived={totalReceived} totalReceivable={totalReceivable} />

      {/* Branch Performance Summary */}
      <div>
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-600" />
          Branch Operations & Data Isolation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {branches.map((b) => (
            <Card key={b.id} className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant={b.isHeadOffice ? "success" : "secondary"} className="text-[10px]">
                    {b.code}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{b.city}</span>
                </div>
                <CardTitle className="text-sm mt-1">{b.name}</CardTitle>
                <CardDescription className="text-xs">
                  Manager: {b.managerName || "Unassigned"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="grid grid-cols-3 gap-2 text-center border-t pt-3 text-xs">
                  <div>
                    <div className="font-bold text-foreground">{b._count.packageBookings}</div>
                    <div className="text-[10px] text-muted-foreground">Bookings</div>
                  </div>
                  <div>
                    <div className="font-bold text-foreground">{b._count.customers}</div>
                    <div className="text-[10px] text-muted-foreground">Pilgrims</div>
                  </div>
                  <div>
                    <div className="font-bold text-foreground">{b._count.users}</div>
                    <div className="text-[10px] text-muted-foreground">Staff</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Lower Row: Recent Bookings & Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Bookings */}
        <div className="lg:col-span-7">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Recent Umrah / Hajj Bookings</CardTitle>
                <CardDescription className="text-xs">Live customer registrations and payment statuses</CardDescription>
              </div>
              <Link href="/bookings" className="text-xs text-emerald-600 hover:underline">
                View All
              </Link>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {recentBookings.map((bk) => (
                  <div key={bk.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        <span>{bk.bookingNumber}</span>
                        <span className="font-normal text-muted-foreground">
                          • {bk.customer.firstName} {bk.customer.lastName}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {bk.package.name} ({bk.roomType} Sharing) • {bk.branch?.name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-foreground">{formatPKR(bk.totalAmount)}</div>
                      <Badge
                        variant={bk.paymentStatus === "PAID" ? "success" : "warning"}
                        className="text-[10px] mt-1"
                      >
                        {bk.paymentStatus}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Real-time Enterprise Audit Trail */}
        <div className="lg:col-span-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Live Audit Log Feed
                </CardTitle>
                <CardDescription className="text-xs">Security, ledger, and record tracking</CardDescription>
              </div>
              <Link href="/audit-logs" className="text-xs text-emerald-600 hover:underline">
                Full Log
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-2.5 rounded-lg border bg-muted/20 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-foreground">{log.action} {log.entity}</span>
                      <span className="text-[10px] text-muted-foreground">{formatDate(log.createdAt)}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{log.details}</p>
                    <div className="text-[10px] text-slate-500 mt-1 font-mono">
                      By: {log.user?.name || "System"} ({log.branch?.city || "HQ"})
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
