import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPKR, formatDate } from "@/lib/utils";
import {
  Printer,
  ArrowLeft,
  Plane,
  Luggage,
  Calendar,
  Clock,
  MoonStar,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PrintButton } from "./PrintButton";

export default async function ETicketPage({
  params,
}: {
  params: { id: string };
}) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id, isDeleted: false },
    include: {
      customer: true,
      passport: true,
      supplier: true,
      branch: true,
    },
  });

  if (!ticket) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top action controls (hidden when printing) */}
      <div className="flex items-center justify-between no-print border-b pb-4">
        <Link href="/tickets">
          <Button size="sm" variant="outline" className="gap-1 text-xs">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Tickets
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <PrintButton />
        </div>
      </div>

      {/* Printable E-Ticket Container */}
      <div className="bg-white text-slate-900 rounded-2xl border p-8 sm:p-10 shadow-sm print:p-0 print:border-none print:shadow-none font-sans">
        {/* Header Branding */}
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
                Govt. Licensed Umrah & Hajj Tour Operator (DTS # 4921) • IATA Accredited
              </p>
              <p className="text-[10px] text-slate-400">
                Karachi HQ: Main Shahrah-e-Faisal | Lahore: Gulberg III | UAN: +92 21 111 786 111
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold uppercase tracking-wider">
              ELECTRONIC TICKET / ITINERARY
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Issued On: {formatDate(ticket.createdAt)}
            </div>
          </div>
        </div>

        {/* Passenger & Booking Meta Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border mb-6 text-xs">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
              Passenger Name
            </span>
            <span className="font-bold text-sm text-slate-900">
              {ticket.customer.firstName} {ticket.customer.lastName}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
              Booking Ref (PNR)
            </span>
            <span className="font-mono font-bold text-base text-emerald-700">
              {ticket.pnr}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
              E-Ticket Number
            </span>
            <span className="font-mono font-bold text-sm text-slate-900">
              {ticket.ticketNumber}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
              Passport Number
            </span>
            <span className="font-mono font-bold text-sm text-slate-900">
              {ticket.passport?.passportNumber || "Attached on File"}
            </span>
          </div>
        </div>

        {/* Flight Details Sector Table */}
        <div className="border rounded-xl overflow-hidden mb-6">
          <div className="bg-slate-900 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Plane className="w-4 h-4 text-emerald-400" /> Flight Itinerary Details
            </span>
            <span className="text-[11px] text-slate-300 font-normal">
              Status: <strong className="text-emerald-400">CONFIRMED (OK)</strong>
            </span>
          </div>

          <div className="p-4 space-y-4 text-xs">
            {/* Outbound Sector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-lg bg-slate-50/80 border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                  DEP
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900">
                    {ticket.routeDetails.split("-")[0]?.trim() || "KHI"} → {ticket.routeDetails.split("-")[1]?.trim() || "JED"}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Carrier: {ticket.supplier.name} • Class: Economy
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div>
                  <div className="text-[10px] text-slate-400">Date</div>
                  <div className="font-semibold">{formatDate(ticket.departureDate)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Baggage Allowance</div>
                  <div className="font-semibold flex items-center gap-1 text-slate-700">
                    <Luggage className="w-3.5 h-3.5" /> 2 Pcs (46 Kg)
                  </div>
                </div>
              </div>
            </div>

            {/* Return Sector if applicable */}
            {ticket.returnDate && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-lg bg-slate-50/80 border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm">
                    RET
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900">
                      {ticket.routeDetails.split("-")[1]?.trim() || "JED"} → {ticket.routeDetails.split("-")[0]?.trim() || "KHI"}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Carrier: {ticket.supplier.name} • Class: Economy
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-[10px] text-slate-400">Date</div>
                    <div className="font-semibold">{formatDate(ticket.returnDate)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Baggage Allowance</div>
                    <div className="font-semibold flex items-center gap-1 text-slate-700">
                      <Luggage className="w-3.5 h-3.5" /> 2 Pcs (46 Kg)
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fare & Payment Summary */}
        <div className="grid grid-cols-2 gap-4 border rounded-xl p-4 mb-6 text-xs">
          <div>
            <h4 className="font-bold text-slate-800 mb-2">Payment Details</h4>
            <div className="text-slate-600 space-y-1 text-[11px]">
              <div>Payment Mode: Bank Transfer / Online Portal</div>
              <div>Form of Payment: Full Settlement</div>
              <div>Endorsement: Non-Endorsable / Umrah Group Validity</div>
            </div>
          </div>

          <div className="text-right space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Air Fare:</span>
              <span className="font-mono">{formatPKR(ticket.fare)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Taxes & Surcharges:</span>
              <span className="font-mono">{formatPKR(ticket.tax)}</span>
            </div>
            <div className="flex justify-between border-t pt-1 font-bold text-sm text-emerald-900">
              <span>Total Paid:</span>
              <span className="font-mono">{formatPKR(ticket.sellingPrice)}</span>
            </div>
          </div>
        </div>

        {/* Mandatory Travel Notice & Saudi Regulations */}
        <div className="border rounded-xl p-4 bg-slate-50/60 text-[10px] text-slate-600 space-y-1.5 leading-relaxed">
          <div className="font-bold text-slate-800 uppercase flex items-center gap-1 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Important Notice for Pilgrims & Passengers:
          </div>
          <p>
            1. <strong>Airport Reporting:</strong> Passengers must report at the international departure terminal minimum 4 hours prior to scheduled departure. Check-in counters close 60 minutes before departure.
          </p>
          <p>
            2. <strong>Passport Validity:</strong> Passports must be valid for at least 6 months from the date of travel. Valid Umrah/Hajj visa and Nusuk permit must be kept in hard copy.
          </p>
          <p>
            3. <strong>Zamzam Allowance:</strong> One factory-sealed 5-litre Zamzam water bottle is allowed per pilgrim on return flights from Jeddah / Madinah (checked baggage allowance).
          </p>
          <p>
            4. <strong>Reissue & Cancellation:</strong> Penalties and fare differences apply as per airline policy. For assistance, contact our 24/7 helpline at +92 21 111 786 111.
          </p>
        </div>

        {/* Barcode Mock & Authorized Stamp */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t text-xs">
          <div>
            <div className="font-mono tracking-widest text-slate-400 text-xs">
              ||| | ||||| || |||||| | |||| ||| ||||||| ||| ||||
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              ETKT-{ticket.ticketNumber} • {ticket.pnr}
            </div>
          </div>

          <div className="text-right">
            <div className="text-[11px] font-bold text-emerald-800">
              AL-HARAMAIN TRAVEL VERIFIED
            </div>
            <div className="text-[10px] text-slate-400">
              Authorized Electronic Travel Document
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
