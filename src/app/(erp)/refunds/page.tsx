import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPKR, formatDate } from "@/lib/utils";
import {
  RotateCcw,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefundsManagerTable } from "./RefundsManagerTable";

export default async function RefundsPage() {
  const refunds = await prisma.refund.findMany({
    where: { isDeleted: false },
    include: {
      customer: true,
      supplier: true,
      branch: true,
      approvedBy: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const totalRefunded = refunds
    .filter((r) => r.status === "APPROVED" || r.status === "REFUNDED")
    .reduce((s, r) => s + r.customerRefundAmount, 0);

  const pendingCount = refunds.filter((r) => r.status === "REQUESTED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Refunds & Cancellation Desk</h1>
            <Badge variant="destructive" className="text-xs">
              Ledger Auto-Reversals
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Ticket, hotel, and package cancellation requests, airline penalty deductions, and auto-reversing JVs.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Pending Approval Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingCount} Requests</div>
            <p className="text-xs text-muted-foreground mt-0.5">Awaiting accountant verification</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Total Customer Refunds Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatPKR(totalRefunded)}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Auto-reversed in general ledger</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Total Files Handled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{refunds.length} Files</div>
            <p className="text-xs text-muted-foreground mt-0.5">Across tickets, hotels & packages</p>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Refunds Table */}
      <RefundsManagerTable initialRefunds={refunds} />
    </div>
  );
}
