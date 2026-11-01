import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPKR } from "@/lib/utils";
import {
  Receipt,
  Plus,
  BookOpen,
  TrendingUp,
  Wallet,
  CreditCard,
  Building2,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function AccountsPage() {
  const accounts = await prisma.account.findMany({
    where: { isDeleted: false },
    include: {
      branch: true,
      _count: { select: { ledgerEntries: true } },
    },
    orderBy: { code: "asc" },
  });

  const categories = [
    { title: "Assets (1000s)", type: "ASSET", color: "border-l-emerald-600", desc: "Cash, Bank Accounts, Pilgrim Receivables" },
    { title: "Liabilities (2000s)", type: "LIABILITY", color: "border-l-red-600", desc: "Supplier Payables, Pilgrim Advances" },
    { title: "Equity (3000s)", type: "EQUITY", color: "border-l-purple-600", desc: "Capital & Retained Earnings" },
    { title: "Revenue (4000s)", type: "REVENUE", color: "border-l-blue-600", desc: "Package Sales, Ticket Revenue, Hotel Bookings" },
    { title: "Expenses (5000s - 6000s)", type: "EXPENSE", color: "border-l-amber-600", desc: "Direct Airline/Hotel Costs, Office Expenses" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Chart of Accounts</h1>
            <Badge variant="warning" className="text-xs">
              Double-Entry General Ledger
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Standard Pakistani corporate accounting chart: Assets, Liabilities, Equity, Revenue, and Cost of Sales.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/accounts/journal-entry/new">
            <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs gap-1">
              <Plus className="w-4 h-4" /> Post Journal Voucher (JV)
            </Button>
          </Link>
          <Link href="/ledgers">
            <Button size="sm" variant="outline" className="text-xs gap-1">
              <BookOpen className="w-4 h-4" /> View Daybook & Ledgers
            </Button>
          </Link>
          <Link href="/reports">
            <Button size="sm" variant="gold" className="text-xs gap-1">
              <FileText className="w-4 h-4" /> Trial Balance
            </Button>
          </Link>
        </div>
      </div>

      {/* Account Categories Display */}
      <div className="space-y-6">
        {categories.map((cat) => {
          const list = accounts.filter((a) => a.type === cat.type);
          const totalBalance = list.reduce((s, a) => s + a.balance, 0);

          return (
            <Card key={cat.type} className={`border-l-4 ${cat.color}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base">{cat.title}</CardTitle>
                  <CardDescription className="text-xs">{cat.desc}</CardDescription>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">
                    Category Balance
                  </span>
                  <span className="font-bold text-base text-foreground">
                    {formatPKR(totalBalance)}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 border-y text-muted-foreground">
                      <tr>
                        <th className="p-3 w-28 font-semibold">Account Code</th>
                        <th className="p-3 font-semibold">Account Title</th>
                        <th className="p-3 font-semibold">Sub-Type</th>
                        <th className="p-3 font-semibold">Currency</th>
                        <th className="p-3 font-semibold">Branch</th>
                        <th className="p-3 font-semibold text-center">Entries</th>
                        <th className="p-3 font-semibold text-right">Current Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {list.map((acc) => (
                        <tr key={acc.id} className="hover:bg-muted/20">
                          <td className="p-3 font-mono font-bold text-foreground">
                            {acc.code}
                          </td>
                          <td className="p-3 font-bold text-foreground">
                            {acc.name}
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="text-[10px]">
                              {acc.subType}
                            </Badge>
                          </td>
                          <td className="p-3 font-mono text-muted-foreground">
                            {acc.currency}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {acc.branch?.name || "Corporate (All)"}
                          </td>
                          <td className="p-3 text-center font-medium">
                            {acc._count.ledgerEntries}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-sm">
                            {formatPKR(acc.balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
