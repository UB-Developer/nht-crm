import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPKR } from "@/lib/utils";
import {
  PackageCheck,
  Plus,
  Building2,
  Plane,
  Clock,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Utensils,
  Car,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function PackagesPage() {
  const packages = await prisma.package.findMany({
    where: { isDeleted: false },
    include: {
      makkahHotel: true,
      madinahHotel: true,
      airline: true,
      group: true,
      _count: { select: { packageBookings: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Umrah & Hajj Packages</h1>
            <Badge variant="default" className="text-xs">
              {packages.length} Configured
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Complete cost sheets, hotel nights (Makkah & Madinah), group flights, and sharing type pricing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/packages/new">
            <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs gap-1">
              <Plus className="w-4 h-4" /> Create New Package
            </Button>
          </Link>
          <Link href="/bookings/new">
            <Button size="sm" variant="gold" className="text-xs gap-1">
              <Calendar className="w-4 h-4" /> Book Pilgrims
            </Button>
          </Link>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {packages.map((pkg) => (
          <Card key={pkg.id} className="relative overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all border-emerald-950/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant={pkg.packageType === "HAJJ" ? "warning" : "success"} className="text-xs font-bold">
                  {pkg.packageType} PACKAGE
                </Badge>
                <div className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  {pkg.durationDays} Days / {pkg.makkahNights + pkg.madinahNights} Nights
                </div>
              </div>
              <CardTitle className="text-lg mt-2">{pkg.name}</CardTitle>
              <CardDescription className="text-xs line-clamp-2 mt-1">
                {pkg.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
              {/* Hotel & Flight Inclusions Strip */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-muted/30 border text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-emerald-600" /> Makkah Hotel ({pkg.makkahNights} Nights)
                  </span>
                  <span className="font-bold block text-foreground truncate mt-0.5">
                    {pkg.makkahHotel.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {pkg.makkahHotel.distanceMeters}m from Haram
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-emerald-600" /> Madinah Hotel ({pkg.madinahNights} Nights)
                  </span>
                  <span className="font-bold block text-foreground truncate mt-0.5">
                    {pkg.madinahHotel.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {pkg.madinahHotel.distanceMeters}m from Masjid Nabawi
                  </span>
                </div>
              </div>

              {/* Service Badges */}
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Plane className="w-3 h-3 text-cyan-600" /> {pkg.airline?.name || "Saudia / PIA"}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Utensils className="w-3 h-3 text-amber-600" /> {pkg.mealPlan}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Car className="w-3 h-3 text-purple-600" /> {pkg.transportType}
                </span>
                {pkg.visaIncluded && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Umrah Visa
                  </span>
                )}
              </div>

              {/* Sharing Rates Sheet */}
              <div className="border-t pt-3">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Selling Prices per Pilgrim (By Room Sharing)
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-muted/20 border">
                    <div className="text-[10px] text-muted-foreground">Double</div>
                    <div className="font-bold text-foreground">{formatPKR(pkg.sellDouble)}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/20 border">
                    <div className="text-[10px] text-muted-foreground">Triple</div>
                    <div className="font-bold text-foreground">{formatPKR(pkg.sellTriple)}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/40 border border-emerald-500/30">
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">Quad (Pop)</div>
                    <div className="font-bold text-emerald-700 dark:text-emerald-400">{formatPKR(pkg.sellQuad)}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/20 border">
                    <div className="text-[10px] text-muted-foreground">Quint</div>
                    <div className="font-bold text-foreground">{formatPKR(pkg.sellQuint)}</div>
                  </div>
                </div>
              </div>

              {/* Bookings & Action */}
              <div className="pt-2 border-t flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">
                  {pkg._count.packageBookings} Confirmed Bookings
                </span>
                <Link href={`/bookings/new?packageId=${pkg.id}`}>
                  <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs gap-1">
                    Book Pilgrim Group <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
