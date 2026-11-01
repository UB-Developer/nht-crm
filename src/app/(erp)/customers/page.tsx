import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, isPassportExpiringSoon } from "@/lib/utils";
import {
  Users,
  UserPlus,
  Search,
  AlertTriangle,
  FileCheck2,
  Phone,
  MessageCircle,
  FileText,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomerListTable } from "./CustomerListTable";

export default async function CustomersPage() {
  const session = await getServerSession(authOptions);
  const branchId = session?.user?.branchId;

  const customers = await prisma.customer.findMany({
    where: {
      isDeleted: false,
      ...(session?.user?.role === "BRANCH_MANAGER" || session?.user?.role === "STAFF"
        ? { branchId: branchId || undefined }
        : {}),
    },
    include: {
      passports: { where: { isDeleted: false } },
      branch: true,
      _count: {
        select: {
          packageBookings: true,
          tickets: true,
          visas: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Pilgrim & Customer Profiles</h1>
            <Badge variant="default" className="text-xs">
              {customers.length} Registered
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Complete database of Umrah/Hajj pilgrims, passport scans, CNICs, and 6-month validity alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/customers/new">
            <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs gap-1">
              <UserPlus className="w-4 h-4" /> Register New Pilgrim
            </Button>
          </Link>
        </div>
      </div>

      {/* Interactive TanStack Table with instant client search & passport alerts */}
      <CustomerListTable initialCustomers={customers} />
    </div>
  );
}
