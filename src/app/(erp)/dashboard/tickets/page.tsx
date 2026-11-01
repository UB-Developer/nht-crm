import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPKR, formatDate } from "@/lib/utils";
import {
  PlaneTakeoff,
  Plane,
  Ticket,
  Users,
  Plus,
  Clock,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function TicketManagerDashboard() {
  const [groups, singleTickets, airlines, flights, ticketRefunds] =
    await Promise.all([
      prisma.group.findMany({
        where: { isDeleted: false },
        include: { airline: true, route: true, supplier: true },
        orderBy: { departureDate: "asc" },
      }),
      prisma.ticket.findMany({
        where: { isDeleted: false },
        include: { customer: true, supplier: true },
        orderBy: { departureDate: "desc" },
        take: 8,
      }),
      prisma.airline.findMany({ where: { isDeleted: false } }),
      prisma.flight.findMany({
        where: { isDeleted: false },
        include: { airline: true, route: true },
      }),
      prisma.refund.findMany({
        where: { module: "TICKET", isDeleted: false },
        include: { customer: true, supplier: true },
      }),
    ]);

  // Calculations
  const totalGroupSeats = groups.reduce((sum, g) => sum + g.totalSeats, 0);
  const totalSold = groups.reduce((sum, g) => sum + g.seatsSold, 0);
  const totalBlocked = groups.reduce((sum, g) => sum + g.seatsBlocked, 0);
  const totalAvailable = totalGroupSeats - (totalSold + totalBlocked);
  const totalProfit = singleTickets.reduce((sum, t) => sum + t.profit, 0);

  return (
    <div className="space-y-6">
      {/* Aviation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Aviation & Ticketing Desk</h1>
            <Badge variant="info" className="text-xs">
              Seat Inventory Control
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage airline group allotments, PNRs, name-list deadlines, individual e-tickets, and airline penalties.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/airline-groups/new">
            <Button size="sm" variant="default" className="text-xs gap-1 bg-emerald-700 hover:bg-emerald-800 text-white">
              <Plus className="w-3.5 h-3.5" /> Create Group
            </Button>
          </Link>
          <Link href="/tickets/new">
            <Button size="sm" variant="outline" className="text-xs gap-1">
              <Plus className="w-3.5 h-3.5" /> Issue Single Ticket
            </Button>
          </Link>
          <Link href="/airline-groups">
            <Button size="sm" variant="outline" className="text-xs gap-1">
              <Plane className="w-3.5 h-3.5" /> Routes & Flights
            </Button>
          </Link>
        </div>
      </div>

      {/* Aviation KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-cyan-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Group Allotments
            </CardTitle>
            <div className="p-2 rounded-lg bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300">
              <PlaneTakeoff className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalGroupSeats} Seats</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across Saudia, PIA & Flynas groups
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Seats Sold / Confirmed
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{totalSold} Seats</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((totalSold / totalGroupSeats) * 100).toFixed(1)}% Load Factor
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Unallocated Inventory
            </CardTitle>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <Clock className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{totalAvailable} Seats Open</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalBlocked} seats temporarily blocked
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Single Tickets Issued
            </CardTitle>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
              <Ticket className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{singleTickets.length} Tickets</div>
            <p className="text-xs text-muted-foreground mt-1">
              Direct Margin: <span className="text-emerald-600 font-semibold">{formatPKR(totalProfit)}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Group Allocations & Inventory Breakdown */}
      <div>
        <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
          <Plane className="w-4 h-4 text-cyan-600" />
          Active Airline Groups & Name-list Deadlines
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((g) => {
            const openSeats = g.totalSeats - (g.seatsSold + g.seatsBlocked);
            const soldPct = Math.round((g.seatsSold / g.totalSeats) * 100);
            return (
              <Card key={g.id} className="relative overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs font-mono font-bold">
                      PNR: {g.pnr}
                    </Badge>
                    <Badge
                      variant={g.status === "OPEN" ? "success" : "secondary"}
                      className="text-[10px]"
                    >
                      {g.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-base mt-2">{g.groupName}</CardTitle>
                  <CardDescription className="text-xs">
                    Airline: <span className="font-semibold text-foreground">{g.airline.name} ({g.airline.code})</span> • Route: {g.route.origin} - {g.route.destination}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Seats Sold: {g.seatsSold} of {g.totalSeats}</span>
                      <span className="font-semibold text-emerald-600">{soldPct}% Filled</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden flex">
                      <div className="bg-emerald-500 h-full" style={{ width: `${soldPct}%` }} />
                      <div
                        className="bg-amber-400 h-full"
                        style={{ width: `${(g.seatsBlocked / g.totalSeats) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-muted/30 border text-center text-xs">
                    <div>
                      <div className="text-[10px] text-muted-foreground">Seat Cost</div>
                      <div className="font-semibold">{formatPKR(g.seatCostPrice)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground">Selling Price</div>
                      <div className="font-semibold text-emerald-600">{formatPKR(g.seatSellingPrice)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground">Unit Profit</div>
                      <div className="font-bold text-foreground">
                        {formatPKR(g.seatSellingPrice - g.seatCostPrice)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5" /> Name-list Deadline: {formatDate(g.nameListDeadline)}
                    </span>
                    <Link
                      href={`/airline-groups/${g.id}`}
                      className="text-emerald-600 hover:underline font-semibold flex items-center gap-1"
                    >
                      Manage Passengers <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Single Tickets & Refund Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Recently Issued Single Tickets</CardTitle>
                <CardDescription className="text-xs">Individual PNRs, routes, and airline margins</CardDescription>
              </div>
              <Link href="/tickets" className="text-xs text-emerald-600 hover:underline">
                View All
              </Link>
            </CardHeader>
            <CardContent>
              <div className="divide-y text-xs">
                {singleTickets.map((t) => (
                  <div key={t.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        <span>{t.ticketNumber}</span>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {t.pnr}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        Passenger: {t.customer.firstName} {t.customer.lastName} • Route: {t.routeDetails}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatPKR(t.sellingPrice)}</div>
                      <div className="text-[10px] text-emerald-600 font-medium">
                        Profit: +{formatPKR(t.profit)}
                      </div>
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
                <RotateCcw className="w-4 h-4 text-amber-600" />
                Ticket Refund Tracking
              </CardTitle>
              <CardDescription className="text-xs">
                Airline penalties & status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ticketRefunds.map((rf) => (
                  <div key={rf.id} className="p-3 rounded-lg border bg-muted/20 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">{rf.refundNumber}</span>
                      <Badge variant={rf.status === "APPROVED" ? "success" : "warning"} className="text-[10px]">
                        {rf.status}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{rf.notes}</p>
                    <div className="mt-2 text-[10px] text-slate-500 flex justify-between border-t pt-1">
                      <span>Airline Penalty: {formatPKR(rf.penaltyAirline)}</span>
                      <span className="font-bold text-foreground">Refund: {formatPKR(rf.customerRefundAmount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
