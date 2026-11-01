import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPKR, formatDate } from "@/lib/utils";
import {
  Ticket,
  Plus,
  Printer,
  RotateCcw,
  Search,
  ExternalLink,
  Plane,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function TicketsPage() {
  const tickets = await prisma.ticket.findMany({
    where: { isDeleted: false },
    include: {
      customer: true,
      passport: true,
      supplier: true,
      branch: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const totalSales = tickets.reduce((s, t) => s + t.sellingPrice, 0);
  const totalProfit = tickets.reduce((s, t) => s + t.profit, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Single Tickets & Itineraries</h1>
            <Badge variant="info" className="text-xs">
              {tickets.length} Tickets
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Individual airline ticket issuance, PNR management, supplier costs, margins, and e-ticket printing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/tickets/new">
            <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs gap-1">
              <Plus className="w-4 h-4" /> Issue Single Ticket
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-cyan-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Total Tickets Issued</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.length}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Individual PNR bookings</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Total Ticket Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatPKR(totalSales)}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Gross passenger revenue</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Direct Ticket Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">+{formatPKR(totalProfit)}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Net earned commission</p>
          </CardContent>
        </Card>
      </div>

      {/* Tickets Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b text-muted-foreground">
                <tr>
                  <th className="p-3.5 font-semibold">Ticket # & PNR</th>
                  <th className="p-3.5 font-semibold">Passenger Name</th>
                  <th className="p-3.5 font-semibold">Route & Travel Date</th>
                  <th className="p-3.5 font-semibold">Supplier</th>
                  <th className="p-3.5 font-semibold text-right">Cost vs Selling</th>
                  <th className="p-3.5 font-semibold text-right">Profit</th>
                  <th className="p-3.5 font-semibold text-center">Status</th>
                  <th className="p-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3.5">
                      <div className="font-mono font-bold text-foreground">{t.ticketNumber}</div>
                      <Badge variant="outline" className="text-[10px] font-mono mt-0.5">
                        PNR: {t.pnr}
                      </Badge>
                    </td>

                    <td className="p-3.5">
                      <Link
                        href={`/customers/${t.customer.id}`}
                        className="font-semibold text-foreground hover:text-emerald-600"
                      >
                        {t.customer.firstName} {t.customer.lastName}
                      </Link>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        Passport: {t.passport?.passportNumber || "Not Attached"}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-semibold flex items-center gap-1">
                        <Plane className="w-3.5 h-3.5 text-cyan-600" />
                        <span>{t.routeDetails}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        Dep: {formatDate(t.departureDate)} {t.returnDate ? `| Ret: ${formatDate(t.returnDate)}` : ""}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-medium">{t.supplier.name}</div>
                      <div className="text-[10px] text-muted-foreground">{t.supplier.type}</div>
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="font-semibold">{formatPKR(t.sellingPrice)}</div>
                      <div className="text-[10px] text-muted-foreground">
                        Cost: {formatPKR(t.supplierCost)}
                      </div>
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="font-bold text-emerald-600">+{formatPKR(t.profit)}</div>
                    </td>

                    <td className="p-3.5 text-center">
                      <Badge
                        variant={t.status === "ISSUED" ? "success" : "warning"}
                        className="text-[10px]"
                      >
                        {t.status}
                      </Badge>
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/tickets/${t.id}/eticket`}
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                          title="Print E-Ticket / Itinerary PDF"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-semibold">Print</span>
                        </Link>
                        <Link
                          href={`/refunds/new?module=TICKET&referenceId=${t.id}&customerId=${t.customerId}&amount=${t.sellingPrice}`}
                          className="p-1.5 rounded-md hover:bg-red-50 text-red-600 dark:hover:bg-red-950/40"
                          title="Request Ticket Refund"
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
