import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPKR, formatDate } from "@/lib/utils";
import {
  Hotel,
  Building2,
  BedDouble,
  MapPin,
  Star,
  Plus,
  ArrowRight,
  RotateCcw,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function HotelManagerDashboard() {
  const [hotels, hotelBookings, hotelRefunds] = await Promise.all([
    prisma.hotel.findMany({
      where: { isDeleted: false },
      include: {
        rooms: { where: { isDeleted: false } },
        _count: { select: { hotelBookings: true } },
      },
    }),
    prisma.hotelBooking.findMany({
      where: { isDeleted: false },
      include: { hotel: true, customer: true, supplier: true },
      orderBy: { checkInDate: "desc" },
      take: 6,
    }),
    prisma.refund.findMany({
      where: { module: "HOTEL", isDeleted: false },
      include: { customer: true },
    }),
  ]);

  const makkahHotels = hotels.filter((h) => h.city === "MAKKAH");
  const madinahHotels = hotels.filter((h) => h.city === "MADINAH");
  const totalRooms = hotels.reduce(
    (sum, h) => sum + h.rooms.reduce((rSum, r) => rSum + r.totalRooms, 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Hotel Manager Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Makkah & Madinah Hotels Desk</h1>
            <Badge variant="destructive" className="text-xs bg-rose-600 hover:bg-rose-700">
              Hospitality & Contracting
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Contracted properties, distances from Haram / Masjid-e-Nabawi, room allocations, and hotel vouchers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/hotels/new">
            <Button size="sm" variant="default" className="text-xs gap-1 bg-emerald-700 hover:bg-emerald-800 text-white">
              <Plus className="w-3.5 h-3.5" /> Add Property
            </Button>
          </Link>
          <Link href="/hotels/bookings/new">
            <Button size="sm" variant="outline" className="text-xs gap-1">
              <Plus className="w-3.5 h-3.5" /> Book Rooms
            </Button>
          </Link>
          <Link href="/hotels">
            <Button size="sm" variant="outline" className="text-xs gap-1">
              <Building2 className="w-3.5 h-3.5" /> Master Inventory
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-rose-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Makkah Contracted Hotels
            </CardTitle>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
              <Building2 className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{makkahHotels.length} Properties</div>
            <p className="text-xs text-muted-foreground mt-1">
              Abraj Al Bait & Markazia Central
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Madinah Contracted Hotels
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <Building2 className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{madinahHotels.length} Properties</div>
            <p className="text-xs text-muted-foreground mt-1">
              Northern Courtyard & Markazia
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Contracted Rooms
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <BedDouble className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalRooms} Rooms</div>
            <p className="text-xs text-muted-foreground mt-1">
              Double, Triple, Quad & Sharing
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Confirmed Hotel Bookings
            </CardTitle>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <Calendar className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{hotelBookings.length} Vouchers</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active guest reservations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Property Cards Grid */}
      <div>
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
          <Hotel className="w-4 h-4 text-rose-600" />
          Featured Properties & Proximity to Holy Sites
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hotels.map((h) => (
            <Card key={h.id} className="relative overflow-hidden flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant={h.city === "MAKKAH" ? "default" : "info"} className="text-[10px]">
                    {h.city}
                  </Badge>
                  <div className="flex items-center gap-0.5 text-amber-500 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                    <span>{h.stars}-Star</span>
                  </div>
                </div>
                <CardTitle className="text-base mt-2">{h.name}</CardTitle>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>
                    {h.distanceMeters}m from {h.city === "MAKKAH" ? "Haram (Kaaba)" : "Masjid-e-Nabawi"}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                <p className="text-[11px] text-muted-foreground line-clamp-2">
                  {h.facilities || "Buffet Breakfast, 24/7 Concierge, WiFi"}
                </p>

                <div className="border-t pt-2.5 space-y-1.5">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Room Types & Seasons
                  </div>
                  {h.rooms.slice(0, 2).map((r) => (
                    <div key={r.id} className="flex justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400">
                        {r.roomType} Sharing
                      </span>
                      <span className="font-semibold">{formatPKR(r.sellingPrice)} / night</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Bookings: {h._count.hotelBookings}</span>
                  <Link
                    href={`/hotels/${h.id}`}
                    className="text-emerald-600 hover:underline font-semibold flex items-center gap-1"
                  >
                    View Rates <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Hotel Bookings & Refunds */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Recent Hotel Reservations</CardTitle>
                <CardDescription className="text-xs">Guest vouchers, check-in dates, and nights</CardDescription>
              </div>
              <Link href="/hotels/bookings" className="text-xs text-emerald-600 hover:underline">
                View All
              </Link>
            </CardHeader>
            <CardContent>
              <div className="divide-y text-xs">
                {hotelBookings.map((b) => (
                  <div key={b.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        <span>{b.hotel.name}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {b.roomType}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        Guest: {b.customer.firstName} {b.customer.lastName} • {b.totalNights} Nights ({formatDate(b.checkInDate)} to {formatDate(b.checkOutDate)})
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatPKR(b.sellingPrice)}</div>
                      <Badge variant="success" className="text-[10px] mt-1">
                        {b.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-rose-600" />
                Hotel Refund & Cancellations
              </CardTitle>
              <CardDescription className="text-xs">Supplier penalty deductions</CardDescription>
            </CardHeader>
            <CardContent>
              {hotelRefunds.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  No active hotel cancellation requests.
                </div>
              ) : (
                <div className="space-y-3">
                  {hotelRefunds.map((rf) => (
                    <div key={rf.id} className="p-3 rounded-lg border bg-muted/20 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">{rf.refundNumber}</span>
                        <Badge variant="warning" className="text-[10px]">
                          {rf.status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{rf.notes}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
