import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPKR, formatDate } from "@/lib/utils";
import {
  FileCheck2,
  Users,
  Clock,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VisaManagerTable } from "./VisaManagerTable";

export default async function VisasPage() {
  const visas = await prisma.visa.findMany({
    where: { isDeleted: false },
    include: {
      customer: true,
      passport: true,
      supplier: true,
      pilgrim: {
        include: { packageBooking: true },
      },
    },
    orderBy: { applicationDate: "desc" },
  });

  const total = visas.length;
  const processing = visas.filter((v) => v.status === "PROCESSING" || v.status === "SUBMITTED").length;
  const approved = visas.filter((v) => v.status === "APPROVED" || v.status === "STAMPED").length;
  const totalCost = visas.reduce((s, v) => s + v.costPrice, 0);
  const totalRevenue = visas.reduce((s, v) => s + v.sellingPrice, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Visa Processing Desk</h1>
            <Badge variant="default" className="text-xs">
              {visas.length} Applications
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Track Umrah & Hajj e-visas through MOFA/embassy agents, bulk status updates, and passport tracking.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-cyan-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Total Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Submitted via visa agents</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Processing / Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{processing}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Pending MOFA approval</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Approved & Stamped</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{approved}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Ready for departure</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Visa Service Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              +{formatPKR(totalRevenue - totalCost)}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Net facilitation earnings</p>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Visa Manager Table with Bulk Updates */}
      <VisaManagerTable initialVisas={visas} />
    </div>
  );
}
