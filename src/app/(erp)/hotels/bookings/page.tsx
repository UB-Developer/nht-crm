import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPKR, formatDate } from "@/lib/utils";
import {
  Hotel,
  Plus,
  Printer,
  RotateCcw,
  Calendar,
  BedDouble,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function HotelBookingsPage() {
  const bookings = await prisma.hotelBooking.findMany({
    where: { isDeleted: false },
    include: {
      hotel: true,
      customer: true,
      supplier: true,
      branch: true,
    },
    orderBy: { checkInDate: "desc" },
  });

  const totalSales = bookings.reduce((s, b) => s + b.sellingPrice, 0);
  const totalProfit = bookings.reduce((s, b) => s + b.profit, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Hotel Bookings & Vouchers</h1>
            <Badge variant="default" className="text-xs">
              {bookings.length} Bookings
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Confirmed guest room reservations, nights calculation, supplier payments, and hotel vouchers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/hotels/bookings/new">
            <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs gap-1">
              <Plus className="w-4 h-4" /> New Hotel Booking
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-rose-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Total Hotel Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.length}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Vouchers issued</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Total Hotel Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatPKR(totalSales)}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Guest billing</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Net Hotel Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">+{formatPKR(totalProfit)}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Recognized agency margin</p>
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
                  <th className="p-3.5 font-semibold">Voucher / Conf #</th>
                  <th className="p-3.5 font-semibold">Hotel Property</th>
                  <th className="p-3.5 font-semibold">Guest Pilgrim</th>
                  <th className="p-3.5 font-semibold">Room & Nights</th>
                  <th className="p-3.5 font-semibold">Check-In / Out</th>
                  <th className="p-3.5 font-semibold text-right">Cost vs Selling</th>
                  <th className="p-3.5 font-semibold text-center">Status</th>
                  <th className="p-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-foreground">
                      {b.confirmationNumber}
                    </td>

                    <td className="p-3.5">
                      <div className="font-bold text-foreground">{b.hotel.name}</div>
                      <Badge variant={b.hotel.city === "MAKKAH" ? "default" : "info"} className="text-[10px] mt-0.5">
                        {b.hotel.city} ({b.hotel.distanceMeters}m)
                      </Badge>
                    </td>

                    <td className="p-3.5">
                      <Link
                        href={`/customers/${b.customer.id}`}
                        className="font-semibold text-foreground hover:text-emerald-600"
                      >
                        {b.customer.firstName} {b.customer.lastName}
                      </Link>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {b.customer.phone}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-semibold flex items-center gap-1">
                        <BedDouble className="w-3.5 h-3.5 text-rose-600" />
                        <span>{b.numberOfRooms}x {b.roomType}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {b.totalNights} Nights
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="text-foreground font-medium">In: {formatDate(b.checkInDate)}</div>
                      <div className="text-muted-foreground text-[11px]">Out: {formatDate(b.checkOutDate)}</div>
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="font-bold text-foreground">{formatPKR(b.sellingPrice)}</div>
                      <div className="text-[10px] text-emerald-600 font-medium">
                        Profit: +{formatPKR(b.profit)}
                      </div>
                    </td>

                    <td className="p-3.5 text-center">
                      <Badge variant="success" className="text-[10px]">
                        {b.status}
                      </Badge>
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/hotels/bookings/${b.id}/voucher`}
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                          title="Print Hotel Voucher PDF"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-semibold">Voucher</span>
                        </Link>
                        <Link
                          href={`/refunds/new?module=HOTEL&referenceId=${b.id}&customerId=${b.customerId}&amount=${b.sellingPrice}`}
                          className="p-1.5 rounded-md hover:bg-red-50 text-red-600 dark:hover:bg-red-950/40"
                          title="Cancel / Refund Hotel Booking"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </Link>
                      </div>
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
