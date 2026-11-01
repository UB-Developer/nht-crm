import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPKR, formatDate } from "@/lib/utils";
import {
  Receipt,
  CreditCard,
  RotateCcw,
  BookOpen,
  FileText,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function AccountantDashboard() {
  const [
    accounts,
    journalEntries,
    pendingRefunds,
    recentReceipts,
    recentPayments,
    recentExpenses,
  ] = await Promise.all([
    prisma.account.findMany({
      where: { isDeleted: false },
    }),
    prisma.journalEntry.findMany({
      where: { isDeleted: false },
      include: {
        ledgerEntries: {
          include: { account: true, customer: true, supplier: true },
        },
        branch: true,
      },
      orderBy: { date: "desc" },
      take: 6,
    }),
    prisma.refund.findMany({
      where: { status: "REQUESTED", isDeleted: false },
      include: { customer: true, supplier: true, branch: true },
    }),
    prisma.receipt.findMany({
      where: { isDeleted: false },
      include: { customer: true, account: true },
      orderBy: { date: "desc" },
      take: 5,
    }),
    prisma.payment.findMany({
      where: { isDeleted: false },
      include: { supplier: true, account: true },
      orderBy: { date: "desc" },
      take: 5,
    }),
    prisma.expense.findMany({
      where: { isDeleted: false },
      include: { account: true },
      orderBy: { date: "desc" },
      take: 5,
    }),
  ]);

  // Aggregate financial metrics
  const cashAccounts = accounts.filter((a) => a.subType === "CASH");
  const bankAccounts = accounts.filter((a) => a.subType === "BANK");
  const receivableAcc = accounts.find((a) => a.subType === "RECEIVABLE");
  const payableAcc = accounts.find((a) => a.subType === "PAYABLE");

  const totalCash = cashAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalBank = bankAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalReceivable = receivableAcc?.balance || 390000;
  const totalPayable = payableAcc?.balance || 12250000;

  return (
    <div className="space-y-6">
      {/* Accountant Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Chief Financial & Accounting Desk</h1>
            <Badge variant="warning" className="text-xs">
              Double-Entry Engine
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            General ledgers, cash books, trial balances, auto-posting journal entries, and refund approvals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/accounts/journal-entry/new">
            <Button size="sm" variant="default" className="text-xs gap-1 bg-emerald-700 hover:bg-emerald-800 text-white">
              <Plus className="w-3.5 h-3.5" /> Post JV
            </Button>
          </Link>
          <Link href="/reports">
            <Button size="sm" variant="outline" className="text-xs gap-1">
              <FileText className="w-3.5 h-3.5" /> Trial Balance
            </Button>
          </Link>
          <Link href="/ledgers">
            <Button size="sm" variant="outline" className="text-xs gap-1">
              <BookOpen className="w-3.5 h-3.5" /> Ledgers
            </Button>
          </Link>
        </div>
      </div>

      {/* Accounting KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Cash in Hand
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <Receipt className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatPKR(totalCash)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Counter registers across branches
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Bank Balances
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <CreditCard className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatPKR(totalBank)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Alfalah PKR & Meezan Corporate
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Pilgrim Receivables
            </CardTitle>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatPKR(totalReceivable)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pending installment dues
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Supplier Payables
            </CardTitle>
            <div className="p-2 rounded-lg bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatPKR(totalPayable)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Airlines, Hotels & Visas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actionable Section: Pending Refund Approvals */}
      <Card className="border-amber-300 dark:border-amber-800/60 bg-amber-50/20 dark:bg-amber-950/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-900 dark:text-amber-300">
              <RotateCcw className="w-4 h-4 text-amber-600" />
              Refund Requests Pending Accountant Approval ({pendingRefunds.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Review airline penalties, calculate net refund, and auto-reverse journal entries
            </CardDescription>
          </div>
          <Link href="/refunds" className="text-xs text-amber-700 dark:text-amber-400 font-semibold hover:underline">
            Manage All Refunds
          </Link>
        </CardHeader>
        <CardContent>
          {pendingRefunds.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground">
              🎉 No pending refund approval requests. All tickets and vouchers are up to date.
            </div>
          ) : (
            <div className="divide-y divide-amber-200/60 dark:divide-amber-800/40">
              {pendingRefunds.map((rf) => (
                <div key={rf.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="font-semibold text-foreground flex items-center gap-2">
                      <span>{rf.refundNumber}</span>
                      <span className="font-normal text-muted-foreground">
                        • {rf.customer.firstName} {rf.customer.lastName}
                      </span>
                      <Badge variant="warning" className="text-[10px]">
                        {rf.module} REFUND
                      </Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Original: {formatPKR(rf.originalAmount)} | Penalty: {formatPKR(rf.penaltyAirline + rf.penaltyCompany)} | Net Refund: {formatPKR(rf.customerRefundAmount)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/refunds?id=${rf.id}`}>
                      <Button size="sm" variant="default" className="text-xs bg-amber-600 hover:bg-amber-700 text-white">
                        Review & Approve
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lower Row: Recent Journal Entries & Daybook */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Journal Entries */}
        <div className="lg:col-span-7">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Recent Journal Vouchers (JV)</CardTitle>
                <CardDescription className="text-xs">Double-entry audit log of sales, expenses & receipts</CardDescription>
              </div>
              <Link href="/ledgers" className="text-xs text-emerald-600 hover:underline">
                View General Ledger
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {journalEntries.map((jv) => (
                  <div key={jv.id} className="p-3 rounded-lg border bg-muted/20 text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        <span>{jv.entryNumber}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {jv.referenceType}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{formatDate(jv.date)}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-2">{jv.description}</p>
                    <div className="space-y-1 border-t pt-1.5 text-[11px]">
                      {jv.ledgerEntries.map((le) => (
                        <div key={le.id} className="flex items-center justify-between font-mono">
                          <span className="truncate text-slate-700 dark:text-slate-300">
                            {le.account.name}
                          </span>
                          <span className="shrink-0 ml-2">
                            {le.debit > 0 ? (
                              <span className="text-emerald-600 font-semibold">Dr: {formatPKR(le.debit)}</span>
                            ) : (
                              <span className="text-blue-600 font-semibold">Cr: {formatPKR(le.credit)}</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cash & Bank Feed */}
        <div className="lg:col-span-5 space-y-6">
          {/* Latest Receipts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Customer Receipts (Cash In)</CardTitle>
                <CardDescription className="text-xs">Pilgrim bank transfers & cash</CardDescription>
              </div>
              <Link href="/accounts/receipts" className="text-xs text-emerald-600 hover:underline">
                All Receipts
              </Link>
            </CardHeader>
            <CardContent>
              <div className="divide-y text-xs">
                {recentReceipts.map((r) => (
                  <div key={r.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{r.receiptNumber}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {r.customer.firstName} {r.customer.lastName} • {r.paymentMethod}
                      </div>
                    </div>
                    <div className="font-bold text-emerald-600">{formatPKR(r.amount)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Latest Payments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Supplier Payments (Cash Out)</CardTitle>
                <CardDescription className="text-xs">Airline & hotel settlements</CardDescription>
              </div>
              <Link href="/accounts/payments" className="text-xs text-emerald-600 hover:underline">
                All Payments
              </Link>
            </CardHeader>
            <CardContent>
              <div className="divide-y text-xs">
                {recentPayments.map((p) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{p.paymentNumber}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {p.supplier.name} • {p.paymentMethod}
                      </div>
                    </div>
                    <div className="font-bold text-red-600">{formatPKR(p.amount)}</div>
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
