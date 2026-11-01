import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPKR, formatDate } from "@/lib/utils";
import {
  BookOpen,
  Plus,
  Users,
  Building2,
  Wallet,
  CreditCard,
  FileSpreadsheet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LedgersView } from "./LedgersView";

export default async function LedgersPage() {
  const [journalEntries, ledgerEntries, customers, suppliers, accounts] =
    await Promise.all([
      prisma.journalEntry.findMany({
        where: { isDeleted: false },
        include: {
          ledgerEntries: {
            include: { account: true, customer: true, supplier: true },
          },
          branch: true,
          createdBy: true,
        },
        orderBy: { date: "desc" },
        take: 100,
      }),
      prisma.ledgerEntry.findMany({
        include: {
          account: true,
          customer: true,
          supplier: true,
          journalEntry: true,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.customer.findMany({
        where: { isDeleted: false },
        include: {
          packageBookings: true,
          receipts: true,
          passports: true,
        },
      }),
      prisma.supplier.findMany({
        where: { isDeleted: false },
        include: {
          payments: true,
          tickets: true,
          hotelBookings: true,
        },
      }),
      prisma.account.findMany({
        where: { isDeleted: false },
      }),
    ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Ledgers & Sub-Ledger Center</h1>
            <Badge variant="warning" className="text-xs">
              General & Subsidiary Books
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            General Daybook, Customer Sales Ledger, Supplier Ledgers, and Cash & Bank Books.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/accounts/journal-entry/new">
            <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs gap-1">
              <Plus className="w-4 h-4" /> Post Manual JV
            </Button>
          </Link>
          <Link href="/reports">
            <Button size="sm" variant="outline" className="text-xs gap-1">
              Trial Balance Report
            </Button>
          </Link>
        </div>
      </div>

      {/* Interactive Tabs for General Ledger, Customer Ledger, Supplier Ledger, Cash Book */}
      <LedgersView
        journalEntries={journalEntries}
        ledgerEntries={ledgerEntries}
        customers={customers}
        suppliers={suppliers}
        accounts={accounts}
      />
    </div>
  );
}
