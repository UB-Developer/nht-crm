import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPKR, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  CalendarDays,
  Users,
  Printer,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Plane,
  Building2,
  MessageCircle,
  CreditCard,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookingWorkflowActions } from "./BookingWorkflowActions";

export default async function BookingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const booking = await prisma.packageBooking.findUnique({
    where: { id: params.id, isDeleted: false },
    include: {
      package: {
        include: { makkahHotel: true, madinahHotel: true, airline: true },
      },
      customer: { include: { passports: true } },
      branch: true,
      createdBy: true,
      pilgrims: {
        include: { customer: true, passport: true, visas: true, nusukRecords: true },
      },
      receipts: {
        include: { account: true },
        orderBy: { date: "desc" },
      },
    },
  });

  if (!booking) {
    notFound();
  }

  const cleanPhone = booking.customer.phone.replace(/[^0-9]/g, "");
  const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `Assalam o Alaikum ${booking.customer.firstName}, greetings from Al-Haramain Travel. Your booking ${booking.bookingNumber} is currently in '${booking.bookingStatus}' status. Travel Date: ${formatDate(booking.travelDate)}. Outstanding Balance: ${formatPKR(booking.balanceAmount)}.`
  )}`;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div className="flex items-center gap-3">
          <Link href="/bookings">
            <Button size="sm" variant="outline" className="gap-1 text-xs">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Bookings
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{booking.bookingNumber}</h1>
              <Badge variant="outline" className="text-xs">
                {booking.package.name}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Primary Pilgrim: <span className="font-semibold text-foreground">{booking.customer.firstName} {booking.customer.lastName}</span> • Travel Date: {formatDate(booking.travelDate)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp Pilgrim
          </a>
          <Link href={`/bookings/${booking.id}/invoice`}>
            <Button size="sm" variant="outline" className="text-xs gap-1">
              <Printer className="w-3.5 h-3.5" /> Print Invoice & Itinerary
            </Button>
          </Link>
          <Link href={`/refunds/new?module=PACKAGE&referenceId=${booking.id}&customerId=${booking.customerId}&amount=${booking.paidAmount}`}>
            <Button size="sm" variant="destructive" className="text-xs gap-1">
              <RotateCcw className="w-3.5 h-3.5" /> Cancel / Refund
            </Button>
          </Link>
        </div>
      </div>

      {/* Interactive Workflow Stepper Component */}
      <BookingWorkflowActions
        bookingId={booking.id}
        currentStatus={booking.bookingStatus}
      />

      {/* Financials Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Total Booking Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatPKR(booking.totalAmount)}</div>
            <p className="text-xs text-muted-foreground mt-0.5">{booking.roomType} Sharing</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Amount Paid (Receipts)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatPKR(booking.paidAmount)}</div>
            <p className="text-xs text-muted-foreground mt-0.5">{booking.receipts.length} Receipt(s) issued</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Outstanding Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatPKR(booking.balanceAmount)}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Payment: {booking.paymentStatus}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Pilgrims Registered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{booking.totalPilgrims} Pilgrims</div>
            <p className="text-xs text-muted-foreground mt-0.5">Family Group File</p>
          </CardContent>
        </Card>
      </div>

      {/* Pilgrims Manifest with Visa, Nusuk & Ticket Statuses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            Registered Pilgrims & Document Processing Status ({booking.pilgrims.length})
          </CardTitle>
          <CardDescription className="text-xs">
            Individual passport verification, MOFA Umrah e-Visa, and Rawdah permits
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b text-muted-foreground">
                <tr>
                  <th className="p-3.5 font-semibold">#</th>
                  <th className="p-3.5 font-semibold">Pilgrim Name</th>
                  <th className="p-3.5 font-semibold">Passport #</th>
                  <th className="p-3.5 font-semibold">Relation</th>
                  <th className="p-3.5 font-semibold text-center">Umrah Visa</th>
                  <th className="p-3.5 font-semibold text-center">Nusuk Permit</th>
                  <th className="p-3.5 font-semibold text-center">Ticket Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {booking.pilgrims.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="p-3.5 font-mono text-muted-foreground">{idx + 1}</td>
                    <td className="p-3.5 font-bold text-foreground">
                      <Link href={`/customers/${p.customer.id}`} className="hover:text-emerald-600">
                        {p.customer.firstName} {p.customer.lastName}
                      </Link>
                    </td>
                    <td className="p-3.5 font-mono">
                      {p.passport?.passportNumber || "Attached on file"}
                    </td>
                    <td className="p-3.5">
                      <Badge variant="outline" className="text-[10px]">
                        {p.relationToHead}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-center">
                      <Badge variant="warning" className="text-[10px]">
                        {p.visaStatus}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-center">
                      <Badge variant="success" className="text-[10px]">
                        {p.nusukStatus}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-center">
                      <Badge variant="info" className="text-[10px]">
                        {p.ticketStatus}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
