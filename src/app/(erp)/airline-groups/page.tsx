import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPKR, formatDate } from "@/lib/utils";
import {
  Plane,
  PlaneTakeoff,
  Plus,
  Clock,
  ArrowRight,
  TrendingUp,
  Users,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function AirlineGroupsPage() {
  const groups = await prisma.group.findMany({
    where: { isDeleted: false },
    include: {
      airline: true,
      route: true,
      supplier: true,
      passengers: { where: { isDeleted: false } },
    },
    orderBy: { departureDate: "asc" },
  });

  const totalSeats = groups.reduce((s, g) => s + g.totalSeats, 0);
  const totalSold = groups.reduce((s, g) => s + g.seatsSold, 0);
  const totalRevenue = groups.reduce((s, g) => s + g.seatsSold * g.seatSellingPrice, 0);
  const totalCost = groups.reduce((s, g) => s + g.seatsSold * g.seatCostPrice, 0);
  const totalMargin = totalRevenue - totalCost;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Airline Groups & Block Allotments</h1>
            <Badge variant="info" className="text-xs">
              {groups.length} Active Groups
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Bulk group seat purchases (Saudia, PIA, Flynas, Airblue), PNRs, and passenger name-list deadlines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/airline-groups/new">
            <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs gap-1">
              <Plus className="w-4 h-4" /> Create New Group Allotment
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-cyan-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Total Group Seats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSeats}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Across all airline blocks</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Seats Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{totalSold}</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalSeats > 0 ? ((totalSold / totalSeats) * 100).toFixed(1) : 0}% booked
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Seats Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{totalSeats - totalSold}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Remaining unallocated seats</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Group Profit Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatPKR(totalMargin)}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Recognized margin on sold seats</p>
          </CardContent>
        </Card>
      </div>

      {/* Groups List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map((g) => {
          const soldPct = Math.round((g.seatsSold / g.totalSeats) * 100);
          const available = g.totalSeats - (g.seatsSold + g.seatsBlocked);
          const groupProfit = g.seatsSold * (g.seatSellingPrice - g.seatCostPrice);

          return (
            <Card key={g.id} className="relative overflow-hidden flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs font-bold">
                      PNR: {g.pnr}
                    </Badge>
                    <Badge variant={g.status === "OPEN" ? "success" : "secondary"} className="text-[10px]">
                      {g.status}
                    </Badge>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600">
                    Est. Profit: {formatPKR(groupProfit)}
                  </span>
                </div>
                <CardTitle className="text-base mt-2">{g.groupName}</CardTitle>
                <CardDescription className="text-xs">
                  {g.airline.name} ({g.airline.code}) • Route: {g.route.origin} - {g.route.destination} • Supplier: {g.supplier.name}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                {/* Sector Dates */}
                <div className="p-2.5 rounded-lg bg-muted/30 border grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Departure:</span>
                    <span className="font-semibold">{formatDate(g.departureDate)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Return:</span>
                    <span className="font-semibold">{formatDate(g.returnDate)}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground font-medium">
                      Sold: {g.seatsSold} | Blocked: {g.seatsBlocked} | Open: {available}
                    </span>
                    <span className="font-bold text-emerald-600">{soldPct}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5 flex overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: `${soldPct}%` }} />
                    <div
                      className="bg-amber-400 h-full"
                      style={{ width: `${(g.seatsBlocked / g.totalSeats) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                  <div className="p-2 rounded bg-muted/20 border">
                    <div className="text-[10px] text-muted-foreground">Cost / Seat</div>
                    <div className="font-semibold">{formatPKR(g.seatCostPrice)}</div>
                  </div>
                  <div className="p-2 rounded bg-muted/20 border">
                    <div className="text-[10px] text-muted-foreground">Sell / Seat</div>
                    <div className="font-semibold text-emerald-600">{formatPKR(g.seatSellingPrice)}</div>
                  </div>
                  <div className="p-2 rounded bg-muted/20 border">
                    <div className="text-[10px] text-muted-foreground">Unit Margin</div>
                    <div className="font-bold">+{formatPKR(g.seatSellingPrice - g.seatCostPrice)}</div>
                  </div>
                </div>

                {/* Deadline and Action */}
                <div className="pt-2 border-t flex items-center justify-between text-xs">
                  <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Name-list: {formatDate(g.nameListDeadline)}
                  </span>
                  <Link
                    href={`/airline-groups/${g.id}`}
                    className="text-emerald-600 hover:underline font-semibold flex items-center gap-1"
                  >
                    Passenger Manifest ({g.passengers.length}) <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
