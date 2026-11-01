import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPKR, formatDate } from "@/lib/utils";
import {
  Compass,
  CreditCard,
  Percent,
  Users,
  FileCheck2,
  Plus,
  MessageCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function StaffDashboard() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = session.user.id;

  // Fetch the logged-in agent's own data
  const [currentUser, myBookings, myCustomers, packages] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: { branch: true },
    }),
    prisma.packageBooking.findMany({
      where: {
        createdById: userId,
        isDeleted: false,
      },
      include: {
        customer: true,
        package: true,
        pilgrims: { include: { visas: true, nusukRecords: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.customer.findMany({
      where: {
        branchId: session.user.branchId || undefined,
        isDeleted: false,
      },
      include: { passports: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.package.findMany({
      where: { isDeleted: false },
      take: 4,
    }),
  ]);

  const totalSales = myBookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const commissionRate = currentUser?.commissionRate || 3.5;
  const commissionEarned = (totalSales * commissionRate) / 100;

  return (
    <div className="space-y-6">
      {/* Sales Consultant Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Sales Consultant Desk</h1>
            <Badge variant="outline" className="text-xs bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
              Agent Portal
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome, <span className="font-semibold text-foreground">{currentUser?.name}</span> • Branch: {currentUser?.branch?.name}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/customers/new">
            <Button size="sm" variant="default" className="text-xs gap-1 bg-emerald-700 hover:bg-emerald-800 text-white">
              <Plus className="w-3.5 h-3.5" /> New Customer
            </Button>
          </Link>
          <Link href="/bookings/new">
            <Button size="sm" variant="gold" className="text-xs gap-1">
              <Plus className="w-3.5 h-3.5" /> Book Package
            </Button>
          </Link>
          <Link href="/customers">
            <Button size="sm" variant="outline" className="text-xs gap-1">
              <FileCheck2 className="w-3.5 h-3.5" /> Passports
            </Button>
          </Link>
        </div>
      </div>

      {/* Agent KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              My Total Sales
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <CreditCard className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatPKR(totalSales)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {myBookings.length} confirmed bookings
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              My Earned Commission
            </CardTitle>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <Percent className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatPKR(commissionEarned)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on {commissionRate}% commission rate
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Registered Pilgrims
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{myCustomers.length} Families</div>
            <p className="text-xs text-muted-foreground mt-1">
              In your branch portfolio
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Active Bookings
            </CardTitle>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
              <Compass className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{myBookings.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Under processing & ticketing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Sell Packages Showcase */}
      <div>
        <h2 className="text-base font-semibold mb-3">Available Umrah & Hajj Packages to Sell</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {packages.map((pkg) => (
            <Card key={pkg.id} className="p-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="success" className="text-[10px]">
                    {pkg.packageType}
                  </Badge>
                  <span className="text-xs font-bold text-emerald-600">
                    From {formatPKR(pkg.sellQuad)}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-foreground">{pkg.name}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {pkg.description}
                </p>
              </div>
              <div className="pt-3 mt-3 border-t flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Duration: {pkg.durationDays} Days</span>
                <Link href={`/bookings/new?packageId=${pkg.id}`}>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                    Sell Package
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Agent's Own Bookings & Direct WhatsApp Link */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm">My Recent Sales & Bookings</CardTitle>
            <CardDescription className="text-xs">
              Pilgrim names, balances, and one-click WhatsApp messaging
            </CardDescription>
          </div>
          <Link href="/bookings" className="text-xs text-emerald-600 hover:underline">
            View All
          </Link>
        </CardHeader>
        <CardContent>
          <div className="divide-y text-xs">
            {myBookings.map((bk) => {
              const cleanPhone = bk.customer.phone.replace(/[^0-9]/g, "");
              const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                `Assalam o Alaikum ${bk.customer.firstName}, greetings from Al-Haramain Travel. Your Umrah booking reference is ${bk.bookingNumber}. Total: ${formatPKR(bk.totalAmount)}, Outstanding Balance: ${formatPKR(bk.balanceAmount)}.`
              )}`;

              return (
                <div key={bk.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-foreground flex items-center gap-2">
                      <span>{bk.bookingNumber}</span>
                      <span className="font-normal text-muted-foreground">
                        • {bk.customer.firstName} {bk.customer.lastName}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {bk.bookingStatus}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {bk.package.name} ({bk.roomType}) • Travel Date: {formatDate(bk.travelDate)}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold">{formatPKR(bk.totalAmount)}</div>
                      <div className="text-[10px] text-amber-600 font-medium">
                        Balance: {formatPKR(bk.balanceAmount)}
                      </div>
                    </div>

                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 transition-colors flex items-center gap-1 font-semibold text-[11px]"
                      title="Send WhatsApp Update to Pilgrim"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
