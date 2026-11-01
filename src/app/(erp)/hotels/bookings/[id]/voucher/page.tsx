import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPKR, formatDate } from "@/lib/utils";
import {
  Printer,
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  BedDouble,
  MoonStar,
  Star,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PrintButton } from "@/app/(erp)/tickets/[id]/eticket/PrintButton";

export default async function HotelVoucherPage({
  params,
}: {
  params: { id: string };
}) {
  const booking = await prisma.hotelBooking.findUnique({
    where: { id: params.id, isDeleted: false },
    include: {
      hotel: true,
      customer: true,
      supplier: true,
      branch: true,
    },
  });

  if (!booking) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top action controls (hidden in print) */}
      <div className="flex items-center justify-between no-print border-b pb-4">
        <Link href="/hotels/bookings">
          <Button size="sm" variant="outline" className="gap-1 text-xs">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Hotel Bookings
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <PrintButton />
        </div>
      </div>

      {/* Printable Hotel Voucher Card */}
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
                Official Umrah Hospitality & Hotel Accommodation Voucher
              </p>
              <p className="text-[10px] text-slate-400">
                Karachi HQ • Lahore • Islamabad • Helpline: +92 21 111 786 111
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="inline-block px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-xs font-bold uppercase tracking-wider">
              HOTEL CONFIRMATION VOUCHER
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Date: {formatDate(booking.createdAt)}
            </div>
          </div>
        </div>

        {/* Voucher Meta Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border mb-6 text-xs">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
              Voucher / Conf #
            </span>
            <span className="font-mono font-bold text-base text-emerald-700">
              {booking.confirmationNumber}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
              Primary Guest Name
            </span>
            <span className="font-bold text-sm text-slate-900">
              {booking.customer.firstName} {booking.customer.lastName}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
              Phone / WhatsApp
            </span>
            <span className="font-semibold text-slate-900">{booking.customer.phone}</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
              Booking Status
            </span>
            <span className="font-bold text-emerald-700 uppercase">
              CONFIRMED & GUARANTEED
            </span>
          </div>
        </div>

        {/* Hotel Property Showcase */}
        <div className="border rounded-xl p-5 mb-6 bg-gradient-to-r from-slate-50 to-emerald-50/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{booking.hotel.name}</h2>
                <Badge variant={booking.hotel.city === "MAKKAH" ? "default" : "info"} className="text-[10px]">
                  {booking.hotel.city}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>
                  {booking.hotel.distanceMeters} meters from {booking.hotel.city === "MAKKAH" ? "Haram (Holy Kaaba)" : "Masjid-e-Nabawi"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-amber-500 font-bold text-xs bg-white px-2.5 py-1 rounded-md border">
              <Star className="w-3.5 h-3.5 fill-amber-500" />
              <span>{booking.hotel.stars}-Star Hotel</span>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-1">
            <div><strong>Property Address:</strong> {booking.hotel.address}</div>
            <div><strong>Hotel Reception Phone:</strong> {booking.hotel.contactPhone || "+966 12 571 7333"}</div>
            <div><strong>Facilities Included:</strong> {booking.hotel.facilities || "Buffet Breakfast, 24/7 Haram Shuttle, WiFi"}</div>
          </div>
        </div>

        {/* Stay & Room Details */}
        <div className="border rounded-xl overflow-hidden mb-6 text-xs">
          <div className="bg-slate-900 text-white px-4 py-2.5 font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-400" /> Accommodation & Room Details
            </span>
            <span className="text-emerald-400 font-mono">
              Total Stay: {booking.totalNights} Nights
            </span>
          </div>

          <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50/60">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Check-In Date</div>
              <div className="font-bold text-sm text-slate-900">{formatDate(booking.checkInDate)}</div>
              <div className="text-[10px] text-slate-500">From 16:00 (4:00 PM)</div>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Check-Out Date</div>
              <div className="font-bold text-sm text-slate-900">{formatDate(booking.checkOutDate)}</div>
              <div className="text-[10px] text-slate-500">Before 12:00 (Noon)</div>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Rooms Reserved</div>
              <div className="font-bold text-sm text-slate-900">{booking.numberOfRooms} Room(s)</div>
              <div className="text-[10px] text-slate-500">{booking.roomType} Sharing</div>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Meal Plan</div>
              <div className="font-bold text-sm text-emerald-800">Bed & Breakfast</div>
              <div className="text-[10px] text-slate-500">Daily Morning Buffet</div>
            </div>
          </div>
        </div>

        {/* Voucher Guidelines & Check-in instructions */}
        <div className="border rounded-xl p-4 bg-slate-50/60 text-[10px] text-slate-600 space-y-1.5 leading-relaxed mb-6">
          <div className="font-bold text-slate-800 uppercase flex items-center gap-1 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Check-In Guidelines for Guests:
          </div>
          <p>
            1. <strong>Original Passports:</strong> Present this voucher along with original passports of all staying guests and valid Umrah e-Visas at hotel reception desk upon arrival.
          </p>
          <p>
            2. <strong>Check-In / Out Timings:</strong> Standard check-in time across hotels in Saudi Arabia is 16:00 (4:00 PM) and check-out time is 12:00 (Noon). Early check-in is subject to room readiness.
          </p>
          <p>
            3. <strong>Incidentals / Security Deposit:</strong> Some properties may request a refundable incidental deposit for personal calls or room service.
          </p>
        </div>

        {/* Authorized Stamp */}
        <div className="flex items-center justify-between pt-4 border-t text-xs">
          <div>
            <div className="font-mono text-slate-400 text-xs">
              VOUCHER-ID: {booking.id.slice(0, 18).toUpperCase()}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Issued by Al-Haramain Travel & Umrah Hospitality Desk
            </div>
          </div>

          <div className="text-right">
            <div className="text-[11px] font-bold text-emerald-800">
              OFFICIALLY CONFIRMED & SEALED
            </div>
            <div className="text-[10px] text-slate-400">
              Valid for Hotel Check-In across KSA
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
