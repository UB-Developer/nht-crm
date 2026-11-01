import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPKR } from "@/lib/utils";
import {
  Wallet,
  Users,
  Clock,
  TrendingUp,
  Percent,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function BranchManagerDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const branchId = session.user.branchId;

  // Fetch branch details and scoped data
  const [branch, branchUsers, branchBookings, branchCashAcc, pendingRefunds] =
    await Promise.all([
      branchId
        ? prisma.branch.findUnique({
            where: { id: branchId },
          })
        : prisma.branch.findFirst({ where: { isHeadOffice: true } }),
      prisma.user.findMany({
        where: {
          ...(branchId ? { branchId } : {}),
          isDeleted: false,
        },
        include: {
          packageBookings: {
            where: { isDeleted: false },
          },
        },
      }),
      prisma.packageBooking.findMany({
        where: {
          ...(branchId ? { branchId } : {}),
          isDeleted: false,
        },
        include: {
          customer: true,
          package: true,
          createdBy: true,
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.account.findFirst({
        where: {
          ...(branchId ? { branchId } : {}),
          subType: "CASH",
        },
      }),
      prisma.refund.findMany({
        where: {
          ...(branchId ? { branchId } : {}),
          status: "REQUESTED",
        },
        include: { customer: true },
      }),
    ]);

  const totalBranchSales = branchBookings.reduce(
    (sum, b) => sum + b.totalAmount,
    0
  );
  const totalBranchReceived = branchBookings.reduce(
    (sum, b) => sum + b.paidAmount,
    0
  );

  return (
    <div className="space-y-6">
      {/* Branch Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Branch Manager Portal</h1>
            <Badge variant="success" className="text-xs">
              {branch?.code || "KHI-HQ"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Operating Location: <span className="font-semibold text-foreground">{branch?.name}</span> ({branch?.city})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/bookings/new">
            <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs">
              + New Branch Booking
            </Button>
          </Link>
          <Link href="/customers/new">
            <Button size="sm" variant="outline" className="text-xs">
              + Register Pilgrim
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards (Scoped to Branch) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Branch Cash in Hand
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <Wallet className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatPKR(branchCashAcc?.balance || 1450000)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Petty Cash & Counter Receipts
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Branch Total Bookings
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <TrendingUp className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{branchBookings.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Value: <span className="font-semibold text-foreground">{formatPKR(totalBranchSales)}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Active Branch Staff
            </CardTitle>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{branchUsers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Sales Consultants & Support
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Pending Branch Approvals
            </CardTitle>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <Clock className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingRefunds.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Refunds / Cancellation requests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Staff Commission & Performance Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Percent className="w-4 h-4 text-emerald-600" />
            Branch Sales Agents & Commission Targets
          </CardTitle>
          <CardDescription className="text-xs">
            Individual sales volume, commission percentages, and targets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {branchUsers.map((user) => {
              const userSales = user.packageBookings.reduce((s, b) => s + b.totalAmount, 0);
              const commissionEarned = (userSales * (user.commissionRate || 0)) / 100;
              return (
                <div key={user.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="font-semibold text-foreground flex items-center gap-2">
                      <span>{user.name}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {user.role}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {user.email} • {user.phone || "No phone"}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground">Bookings Done</div>
                      <div className="font-semibold">{user.packageBookings.length}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground">Commission Rate</div>
                      <div className="font-semibold text-emerald-600">{user.commissionRate}%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground">Earned Commission</div>
                      <div className="font-bold text-foreground">{formatPKR(commissionEarned)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Branch Bookings List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm">Branch Pilgrims & Bookings</CardTitle>
            <CardDescription className="text-xs">Exclusively for {branch?.name}</CardDescription>
          </div>
          <Link href="/bookings" className="text-xs text-emerald-600 hover:underline">
            View All
          </Link>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {branchBookings.map((b) => (
              <div key={b.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-foreground flex items-center gap-2">
                    <span>{b.bookingNumber}</span>
                    <span className="font-normal text-muted-foreground">
                      • {b.customer.firstName} {b.customer.lastName}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {b.package.name} • Agent: {b.createdBy?.name || "Self"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatPKR(b.totalAmount)}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Paid: <span className="text-emerald-600 font-semibold">{formatPKR(b.paidAmount)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
