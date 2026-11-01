import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPKR, formatDate } from "@/lib/utils";
import {
  TrendingUp,
  FileText,
  BarChart3,
  Calendar,
  Building2,
  Printer,
  FileSpreadsheet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReportsView } from "./ReportsView";

export default async function ReportsPage() {
  const [accounts, bookings, tickets, hotelBookings, branches, expenses] =
    await Promise.all([
      prisma.account.findMany({
        where: { isDeleted: false },
        include: { branch: true },
        orderBy: { code: "asc" },
      }),
      prisma.packageBooking.findMany({
        where: { isDeleted: false },
        include: { package: true, branch: true, createdBy: true },
      }),
      prisma.ticket.findMany({
        where: { isDeleted: false },
        include: { branch: true },
      }),
      prisma.hotelBooking.findMany({
        where: { isDeleted: false },
        include: { branch: true },
      }),
      prisma.branch.findMany({ where: { isDeleted: false } }),
      prisma.expense.findMany({ where: { isDeleted: false } }),
    ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 no-print">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Financial & Management Reports</h1>
            <Badge variant="gold" className="text-xs">
              Executive Audited Statements
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Profit & Loss, Trial Balance, Balance Sheet, Branch Performance, and Multi-Currency reporting.
          </p>
        </div>
      </div>

      {/* Interactive Reports View */}
      <ReportsView
        accounts={accounts}
        bookings={bookings}
        tickets={tickets}
        hotelBookings={hotelBookings}
        branches={branches}
        expenses={expenses}
      />
    </div>
  );
}
