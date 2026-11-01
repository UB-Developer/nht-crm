import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPKR, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Plane,
  Users,
  Clock,
  Plus,
  Ticket,
  RotateCcw,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GroupPassengerActions } from "./GroupPassengerActions";

export default async function AirlineGroupDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [group, allCustomers] = await Promise.all([
    prisma.group.findUnique({
      where: { id: params.id, isDeleted: false },
      include: {
        airline: true,
        route: true,
        supplier: true,
        branch: true,
        passengers: {
          where: { isDeleted: false },
          include: { customer: true, passport: true },
        },
      },
    }),
    prisma.customer.findMany({
      where: { isDeleted: false },
      include: { passports: true },
      take: 50,
    }),
  ]);

  if (!group) {
    notFound();
  }

  const availableSeats = group.totalSeats - (group.seatsSold + group.seatsBlocked);
  const totalGroupCost = group.seatsSold * group.seatCostPrice;
  const totalGroupRevenue = group.seatsSold * group.seatSellingPrice;
  const totalGroupProfit = totalGroupRevenue - totalGroupCost;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div className="flex items-center gap-3">
          <Link href="/airline-groups">
            <Button size="sm" variant="outline" className="gap-1 text-xs">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{group.groupName}</h1>
              <Badge variant="outline" className="font-mono text-xs font-bold">
                PNR: {group.pnr}
              </Badge>
              <Badge variant={group.status === "OPEN" ? "success" : "secondary"} className="text-xs">
                {group.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Carrier: {group.airline.name} ({group.airline.code}) • Sector: {group.route.origin} - {group.route.destination} • Supplier: {group.supplier.name}
            </p>
          </div>
        </div>

        {/* Client Interactive Actions Component */}
        <GroupPassengerActions
          groupId={group.id}
          availableSeats={availableSeats}
          customers={allCustomers}
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-cyan-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Total Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{group.totalSeats} Seats</div>
            <p className="text-xs text-muted-foreground mt-0.5">Purchased block allotment</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Seats Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{group.seatsSold} Seats</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {((group.seatsSold / group.totalSeats) * 100).toFixed(1)}% Load factor
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Unallocated Seats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{availableSeats} Seats Open</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {group.seatsBlocked} seats temporarily held
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Group-Wise Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatPKR(totalGroupProfit)}</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Net margin earned on {group.seatsSold} sold seats
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sector Dates & Deadlines */}
      <Card>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-muted-foreground block text-[11px]">Departure Date</span>
            <span className="font-bold text-sm text-foreground">{formatDate(group.departureDate)}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Return Date</span>
            <span className="font-bold text-sm text-foreground">{formatDate(group.returnDate)}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Name-list Submission Deadline</span>
            <span className="font-bold text-sm text-amber-600 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {formatDate(group.nameListDeadline)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Passenger Manifest Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm">Passenger Name List Manifest ({group.passengers.length})</CardTitle>
            <CardDescription className="text-xs">
              Pilgrims assigned to this airline block allotment for submission to airline
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b text-muted-foreground">
                <tr>
                  <th className="p-3.5 font-semibold">#</th>
                  <th className="p-3.5 font-semibold">Passenger Name</th>
                  <th className="p-3.5 font-semibold">Passport Number</th>
                  <th className="p-3.5 font-semibold">E-Ticket Number</th>
                  <th className="p-3.5 font-semibold text-right">Selling Price</th>
                  <th className="p-3.5 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {group.passengers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      No passengers added to this group yet. Use the "Add Pilgrim to Group" button above.
                    </td>
                  </tr>
                ) : (
                  group.passengers.map((p, idx) => (
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
                      <td className="p-3.5 font-mono">{p.ticketNumber || "Pending Issuance"}</td>
                      <td className="p-3.5 text-right font-semibold">
                        {formatPKR(p.seatSellingPrice)}
                      </td>
                      <td className="p-3.5 text-center">
                        <Badge variant="success" className="text-[10px]">
                          {p.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
