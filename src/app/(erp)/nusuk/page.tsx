import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Download,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NusukManagerTable } from "./NusukManagerTable";

export default async function NusukPage() {
  const records = await prisma.nusuk.findMany({
    where: { isDeleted: false },
    include: {
      customer: { include: { passports: true } },
      packageBooking: { include: { package: true } },
      pilgrim: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const total = records.length;
  const rawdahConfirmed = records.filter((r) => r.rawdahPermitStatus === "APPROVED").length;
  const umrahConfirmed = records.filter((r) => r.umrahPermitStatus === "APPROVED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Nusuk Platform & Rawdah Permits</h1>
            <Badge variant="success" className="text-xs">
              Ministry of Hajj & Umrah
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Tracking Umrah permits, Rawdah Sharif (Tasreeh) prayer slots, package linking, and bulk updates.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-emerald-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Total Nusuk Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Linked to package bookings</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Umrah Permits Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{umrahConfirmed}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Active Haram Tawaf QR permits</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Rawdah Slots Booked (Tasreeh)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{rawdahConfirmed}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Men & Women confirmed prayer slots</p>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Nusuk Table with Excel Export */}
      <NusukManagerTable initialRecords={records} />
    </div>
  );
}
