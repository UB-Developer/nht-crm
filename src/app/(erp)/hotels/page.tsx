import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPKR } from "@/lib/utils";
import {
  Hotel,
  Building2,
  Plus,
  Star,
  MapPin,
  BedDouble,
  ArrowRight,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function HotelsMasterPage() {
  const hotels = await prisma.hotel.findMany({
    where: { isDeleted: false },
    include: {
      rooms: { where: { isDeleted: false } },
      _count: { select: { hotelBookings: true } },
    },
    orderBy: { distanceMeters: "asc" },
  });

  const makkahHotels = hotels.filter((h) => h.city === "MAKKAH");
  const madinahHotels = hotels.filter((h) => h.city === "MADINAH");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Hotels & Properties Master</h1>
            <Badge variant="default" className="text-xs">
              {hotels.length} Properties
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Makkah Al-Mukarramah & Madinah Al-Munawwarah hotels, star categories, and walking distance to Holy Mosques.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/hotels/new">
            <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs gap-1">
              <Plus className="w-4 h-4" /> Add Hotel Property
            </Button>
          </Link>
          <Link href="/hotels/bookings/new">
            <Button size="sm" variant="gold" className="text-xs gap-1">
              <Calendar className="w-4 h-4" /> Book Rooms
            </Button>
          </Link>
        </div>
      </div>

      {/* Property Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {hotels.map((h) => (
          <Card key={h.id} className="relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant={h.city === "MAKKAH" ? "default" : "info"} className="text-xs font-bold">
                  {h.city}
                </Badge>
                <div className="flex items-center gap-0.5 text-amber-500 font-bold text-xs">
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
              <p className="text-xs text-muted-foreground line-clamp-2">
                {h.facilities || "Buffet Breakfast, 24/7 Concierge, Free WiFi, Haram Elevator"}
              </p>

              {/* Room Pricing Snapshot */}
              <div className="border-t pt-2.5 space-y-1.5">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Contracted Rates per Night
                </div>
                {h.rooms.map((r) => (
                  <div key={r.id} className="flex justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400">
                      {r.roomType} Room
                    </span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      {formatPKR(r.sellingPrice)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">
                  {h._count.hotelBookings} Bookings
                </span>
                <Link
                  href={`/hotels/${h.id}`}
                  className="text-emerald-600 hover:underline font-semibold flex items-center gap-1"
                >
                  Manage Rooms & Rates <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
