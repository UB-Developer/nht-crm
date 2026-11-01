import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPKR, formatDate } from "@/lib/utils";
import {
  CalendarDays,
  Plus,
  Printer,
  RotateCcw,
  MessageCircle,
  ExternalLink,
  Users,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function PackageBookingsPage() {
  const session = await getServerSession(authOptions);
  const branchId = session?.user?.branchId;

  const bookings = await prisma.packageBooking.findMany({
    where: {
      isDeleted: false,
      ...(session?.user?.role === "STAFF"
        ? { createdById: session.user.id }
        : session?.user?.role === "BRANCH_MANAGER"
        ? { branchId: branchId || undefined }
        : {}),
    },
    include: {
      package: true,
      customer: true,
      branch: true,
      createdBy: true,
      pilgrims: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const totalSales = bookings.reduce((s, b) => s + b.totalAmount, 0);
  const totalPaid = bookings.reduce((s, b) => s + b.paidAmount, 0);
  const totalOutstanding = bookings.reduce((s, b) => s + b.balanceAmount, 0);

  const getWorkflowBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="secondary">Draft</Badge>;
      case "CONFIRMED":
        return <Badge variant="info">Confirmed</Badge>;
      case "VISA_PROCESSING":
        return <Badge variant="warning">Visa Processing</Badge>;
      case "TICKETED":
        return <Badge variant="purple">Ticketed</Badge>;
      case "DEPARTED":
        return <Badge variant="default" className="bg-blue-600">Departed</Badge>;
      case "COMPLETED":
        return <Badge variant="success">Completed</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Umrah & Hajj Bookings</h1>
            <Badge variant="default" className="text-xs">
              {bookings.length} Bookings
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            End-to-end pilgrim lifecycle: Draft → Confirmed → Visa Processing → Ticketed → Departed → Completed.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/bookings/new">
            <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs gap-1">
              <Plus className="w-4 h-4" /> New Package Booking
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-emerald-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Total Bookings Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatPKR(totalSales)}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Across all confirmed pilgrims</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Received Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatPKR(totalPaid)}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Cleared cash & bank deposits</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Pending Receivables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatPKR(totalOutstanding)}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Remaining installment dues</p>
          </CardContent>
        </Card>
      </div>

      {/* Bookings Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b text-muted-foreground">
                <tr>
                  <th className="p-3.5 font-semibold">Booking #</th>
                  <th className="p-3.5 font-semibold">Primary Pilgrim</th>
                  <th className="p-3.5 font-semibold">Package & Sharing</th>
                  <th className="p-3.5 font-semibold">Travel Date</th>
                  <th className="p-3.5 font-semibold text-right">Financials</th>
                  <th className="p-3.5 font-semibold text-center">Lifecycle Status</th>
                  <th className="p-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {bookings.map((b) => {
                  const cleanPhone = b.customer.phone.replace(/[^0-9]/g, "");
                  const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                    `Assalam o Alaikum ${b.customer.firstName}, greetings from Al-Haramain Travel. Your booking reference is ${b.bookingNumber} (${b.package.name}). Status: ${b.bookingStatus}. Total: ${formatPKR(b.totalAmount)}, Balance Due: ${formatPKR(b.balanceAmount)}.`
                  )}`;

                  return (
                    <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-foreground">
                        <Link href={`/bookings/${b.id}`} className="hover:text-emerald-600">
                          {b.bookingNumber}
                        </Link>
                        <div className="text-[10px] text-muted-foreground font-sans">
                          {b.totalPilgrims} Pilgrim{b.totalPilgrims > 1 ? "s" : ""}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <Link
                          href={`/customers/${b.customer.id}`}
                          className="font-bold text-foreground hover:text-emerald-600"
                        >
                          {b.customer.firstName} {b.customer.lastName}
                        </Link>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {b.customer.phone}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-semibold text-foreground line-clamp-1">{b.package.name}</div>
                        <Badge variant="outline" className="text-[10px] mt-0.5">
                          {b.roomType} Sharing
                        </Badge>
                      </td>

                      <td className="p-3.5">
                        <div className="font-semibold">{formatDate(b.travelDate)}</div>
                        <div className="text-[10px] text-muted-foreground">{b.package.durationDays} Days</div>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="font-bold text-foreground">{formatPKR(b.totalAmount)}</div>
                        <div className="text-[10px] text-amber-600 font-medium">
                          Bal: {formatPKR(b.balanceAmount)}
                        </div>
                      </td>

                      <td className="p-3.5 text-center">
                        {getWorkflowBadge(b.bookingStatus)}
                        <div className="text-[10px] text-muted-foreground mt-1 uppercase font-semibold">
                          Pay: {b.paymentStatus}
                        </div>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-md hover:bg-emerald-50 text-emerald-600 dark:hover:bg-emerald-950/40"
                            title="Send WhatsApp Update"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                          <Link
                            href={`/bookings/${b.id}/invoice`}
                            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                            title="Print Invoice / Voucher PDF"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-semibold">Invoice</span>
                          </Link>
                          <Link
                            href={`/bookings/${b.id}`}
                            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                            title="Manage Booking Workflow"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
