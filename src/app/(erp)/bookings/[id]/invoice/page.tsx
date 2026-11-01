import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPKR, formatDate } from "@/lib/utils";
import {
  Printer,
  ArrowLeft,
  MoonStar,
  Building2,
  Calendar,
  Users,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PrintButton } from "@/app/(erp)/tickets/[id]/eticket/PrintButton";

export default async function PackageInvoicePage({
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
      pilgrims: { include: { customer: true, passport: true } },
      receipts: { orderBy: { date: "asc" } },
    },
  });

  if (!booking) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top action controls (hidden in print) */}
      <div className="flex items-center justify-between no-print border-b pb-4">
        <Link href={`/bookings/${booking.id}`}>
          <Button size="sm" variant="outline" className="gap-1 text-xs">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Booking
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <PrintButton />
        </div>
      </div>

      {/* Printable Invoice Container */}
      <div className="bg-white text-slate-900 rounded-2xl border p-8 sm:p-10 shadow-sm print:p-0 print:border-none print:shadow-none font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-md">
              <MoonStar className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-emerald-900 leading-tight">
                AL-HARAMAIN TRAVEL & UMRAH (PVT) LTD
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Govt. Licensed Umrah & Hajj Tour Operator (DTS # 4921) • NTN: 8941209-1
              </p>
              <p className="text-[10px] text-slate-400">
                Karachi HQ: Main Shahrah-e-Faisal | Lahore: Gulberg III | UAN: +92 21 111 786 111
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold uppercase tracking-wider">
              OFFICIAL TAX INVOICE & VOUCHER
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Invoice Date: {formatDate(booking.createdAt)}
            </div>
          </div>
        </div>

        {/* Invoice & Booking Meta Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border mb-6 text-xs">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
              Booking Invoice #
            </span>
            <span className="font-mono font-bold text-base text-emerald-700">
              {booking.bookingNumber}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
              Primary Pilgrim
            </span>
            <span className="font-bold text-sm text-slate-900">
              {booking.customer.firstName} {booking.customer.lastName}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
              CNIC / Phone
            </span>
            <span className="font-semibold text-slate-900">
              {booking.customer.cnic || booking.customer.phone}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
              Branch & Agent
            </span>
            <span className="font-semibold text-slate-900">
              {booking.branch?.name || "Karachi HQ"}
            </span>
          </div>
        </div>

        {/* Package Itinerary Summary */}
        <div className="border rounded-xl p-4 mb-6 bg-slate-50/60 text-xs space-y-3">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-bold text-sm text-slate-900">{booking.package.name}</h3>
            <span className="font-bold text-emerald-700 font-mono">
              {booking.package.durationDays} Days Duration • Travel Date: {formatDate(booking.travelDate)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-bold block text-slate-800">
                Makkah Accommodation ({booking.package.makkahNights} Nights):
              </span>
              <span className="text-slate-600">
                {booking.package.makkahHotel.name} ({booking.package.makkahHotel.distanceMeters}m from Haram)
              </span>
            </div>

            <div>
              <span className="font-bold block text-slate-800">
                Madinah Accommodation ({booking.package.madinahNights} Nights):
              </span>
              <span className="text-slate-600">
                {booking.package.madinahHotel.name} ({booking.package.madinahHotel.distanceMeters}m from Masjid Nabawi)
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 border-t pt-2 flex justify-between">
            <span>Room Type: <strong>{booking.roomType} Sharing</strong></span>
            <span>Meal Plan: <strong>{booking.package.mealPlan}</strong></span>
            <span>Transport: <strong>{booking.package.transportType}</strong></span>
          </div>
        </div>

        {/* Pilgrims Manifest */}
        <div className="border rounded-xl overflow-hidden mb-6 text-xs">
          <div className="bg-slate-900 text-white px-4 py-2 font-bold flex justify-between items-center">
            <span>Traveling Pilgrims ({booking.pilgrims.length})</span>
            <span className="text-emerald-400 font-normal">Umrah Visa & Transport Included</span>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-100 border-b text-slate-600">
              <tr>
                <th className="p-2.5">#</th>
                <th className="p-2.5">Pilgrim Name</th>
                <th className="p-2.5">Passport Number</th>
                <th className="p-2.5">Relation</th>
                <th className="p-2.5">Room Type</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {booking.pilgrims.map((p, idx) => (
                <tr key={p.id}>
                  <td className="p-2.5 font-mono">{idx + 1}</td>
                  <td className="p-2.5 font-bold">
                    {p.customer.firstName} {p.customer.lastName}
                  </td>
                  <td className="p-2.5 font-mono">
                    {p.passport?.passportNumber || "Attached on File"}
                  </td>
                  <td className="p-2.5">{p.relationToHead}</td>
                  <td className="p-2.5 font-semibold text-emerald-800">{p.roomType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Accounting & Receipts Breakdown */}
        <div className="grid grid-cols-2 gap-6 border rounded-xl p-5 mb-6 text-xs">
          <div>
            <h4 className="font-bold text-slate-800 mb-2 uppercase text-[11px]">
              Payment History & Receipts Issued
            </h4>
            {booking.receipts.length === 0 ? (
              <div className="text-slate-500 italic">No payment receipts registered yet.</div>
            ) : (
              <div className="space-y-1.5 divide-y">
                {booking.receipts.map((r) => (
                  <div key={r.id} className="pt-1.5 flex justify-between">
                    <div>
                      <span className="font-mono font-bold">{r.receiptNumber}</span>
                      <span className="text-[10px] text-slate-400 ml-1.5">({formatDate(r.date)})</span>
                    </div>
                    <span className="font-bold text-emerald-700">{formatPKR(r.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-right space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Gross Package Fare:</span>
              <span className="font-mono font-semibold">{formatPKR(booking.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-blue-700">
              <span>Total Received (Paid):</span>
              <span className="font-mono font-bold">-{formatPKR(booking.paidAmount)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-bold text-base text-slate-900">
              <span>Outstanding Balance Due:</span>
              <span className="font-mono text-amber-700">{formatPKR(booking.balanceAmount)}</span>
            </div>
            <div className="text-[10px] text-slate-500">
              Payment Status: <strong className="uppercase">{booking.paymentStatus}</strong>
            </div>
          </div>
        </div>

        {/* Legal & Terms */}
        <div className="text-[10px] text-slate-500 leading-relaxed space-y-1 mb-6">
          <div>• Passports must have at least 6 months validity from departure date.</div>
          <div>• Cancellation policy applies as per Saudi Ministry of Hajj & Umrah guidelines.</div>
          <div>• This invoice serves as official receipt voucher for Pakistan Customs & Saudi Airport Authorities.</div>
        </div>

        {/* Authorization Seal */}
        <div className="flex items-center justify-between pt-6 border-t text-xs">
          <div>
            <div className="font-mono text-slate-400 text-xs">
              ||||| ||| ||||||| |||| || |||||||| |||| ||||
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              PKG-INV-{booking.bookingNumber} • SYSTEM GENERATED
            </div>
          </div>

          <div className="text-right">
            <div className="text-[11px] font-bold text-emerald-800">
              AL-HARAMAIN TRAVEL AUTHORIZED SIGNATURE
            </div>
            <div className="text-[10px] text-slate-400">
              Accounts & Operations Dept.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
