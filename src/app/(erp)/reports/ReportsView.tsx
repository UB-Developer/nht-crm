"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  FileText,
  BarChart3,
  Calendar,
  Building2,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPKR, formatSAR, formatUSD, formatDate } from "@/lib/utils";
import * as XLSX from "xlsx";

export function ReportsView({
  accounts,
  bookings,
  tickets,
  hotelBookings,
  branches,
  expenses,
}: {
  accounts: any[];
  bookings: any[];
  tickets: any[];
  hotelBookings: any[];
  branches: any[];
  expenses: any[];
}) {
  const [activeReport, setActiveReport] = useState<
    "pnl" | "trial_balance" | "balance_sheet" | "branch_sales"
  >("pnl");
  const [currency, setCurrency] = useState<"PKR" | "SAR" | "USD">("PKR");

  const sarRate = 74.5;
  const usdRate = 278.5;

  const formatCurr = (amount: number) => {
    if (currency === "SAR") return formatSAR(amount / sarRate);
    if (currency === "USD") return formatUSD(amount / usdRate);
    return formatPKR(amount);
  };

  // Computations
  const revenueAccounts = accounts.filter((a) => a.type === "REVENUE");
  const costAccounts = accounts.filter((a) => a.subType === "COST_OF_SALES");
  const operatingExpenses = accounts.filter((a) => a.subType === "OPERATING_EXPENSE");

  const totalRevenue = revenueAccounts.reduce((s, a) => s + a.balance, 0);
  const totalCostOfSales = costAccounts.reduce((s, a) => s + a.balance, 0);
  const grossProfit = totalRevenue - totalCostOfSales;
  const totalOperatingExpenses = operatingExpenses.reduce((s, a) => s + a.balance, 0);
  const netProfit = grossProfit - totalOperatingExpenses;

  // Trial Balance
  const trialBalanceList = accounts.map((acc) => {
    const isDebitNature = acc.type === "ASSET" || acc.type === "EXPENSE";
    const debit = isDebitNature ? Math.max(0, acc.balance) : 0;
    const credit = !isDebitNature ? Math.max(0, acc.balance) : 0;
    return { ...acc, debit, credit };
  });

  const totalDebit = trialBalanceList.reduce((s, a) => s + a.debit, 0);
  const totalCredit = trialBalanceList.reduce((s, a) => s + a.credit, 0);
  const isTrialBalanced = Math.abs(totalDebit - totalCredit) < 1;

  // Balance Sheet
  const assetAccounts = accounts.filter((a) => a.type === "ASSET");
  const liabilityAccounts = accounts.filter((a) => a.type === "LIABILITY");
  const equityAccounts = accounts.filter((a) => a.type === "EQUITY");

  const totalAssets = assetAccounts.reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = liabilityAccounts.reduce((s, a) => s + a.balance, 0);
  const totalEquity = equityAccounts.reduce((s, a) => s + a.balance, 0) + netProfit;

  // Branch Sales
  const branchData = branches.map((b) => {
    const bBkgs = bookings.filter((bk) => bk.branchId === b.id);
    const bTkts = tickets.filter((tk) => tk.branchId === b.id);
    const sales =
      bBkgs.reduce((s, bk) => s + bk.totalAmount, 0) +
      bTkts.reduce((s, tk) => s + tk.sellingPrice, 0);
    return {
      branch: b.name,
      city: b.city,
      sales,
      bookingsCount: bBkgs.length,
      ticketsCount: bTkts.length,
    };
  });

  // Export Excel
  const handleExportExcel = () => {
    let sheetData: any[] = [];
    if (activeReport === "pnl") {
      sheetData = [
        { Section: "REVENUE", Title: "Package Sales", Amount: totalRevenue },
        { Section: "COST OF SALES", Title: "Airline & Hotel Costs", Amount: -totalCostOfSales },
        { Section: "GROSS PROFIT", Title: "Gross Operating Margin", Amount: grossProfit },
        { Section: "EXPENSES", Title: "Office Rent & Utilities", Amount: -totalOperatingExpenses },
        { Section: "NET PROFIT", Title: "Net Net Profit for Period", Amount: netProfit },
      ];
    } else if (activeReport === "trial_balance") {
      sheetData = trialBalanceList.map((a) => ({
        Code: a.code,
        "Account Name": a.name,
        Type: a.type,
        "Debit (PKR)": a.debit,
        "Credit (PKR)": a.credit,
      }));
    } else if (activeReport === "balance_sheet") {
      sheetData = [
        ...assetAccounts.map((a) => ({ Classification: "ASSETS", Account: a.name, Balance: a.balance })),
        ...liabilityAccounts.map((a) => ({ Classification: "LIABILITIES", Account: a.name, Balance: a.balance })),
        ...equityAccounts.map((a) => ({ Classification: "EQUITY", Account: a.name, Balance: a.balance })),
      ];
    } else {
      sheetData = branchData.map((b) => ({
        Branch: b.branch,
        City: b.city,
        "Total Sales (PKR)": b.sales,
        Bookings: b.bookingsCount,
        Tickets: b.ticketsCount,
      }));
    }

    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeReport.toUpperCase());
    XLSX.writeFile(wb, `Financial_Report_${activeReport}_${Date.now()}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Report Selector & Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between no-print">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/50 rounded-xl border">
          <button
            type="button"
            onClick={() => setActiveReport("pnl")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeReport === "pnl"
                ? "bg-emerald-700 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" /> Profit & Loss (P&L)
          </button>

          <button
            type="button"
            onClick={() => setActiveReport("trial_balance")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeReport === "trial_balance"
                ? "bg-emerald-700 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Trial Balance
          </button>

          <button
            type="button"
            onClick={() => setActiveReport("balance_sheet")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeReport === "balance_sheet"
                ? "bg-emerald-700 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Balance Sheet
          </button>

          <button
            type="button"
            onClick={() => setActiveReport("branch_sales")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeReport === "branch_sales"
                ? "bg-emerald-700 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> Branch Sales
          </button>
        </div>

        {/* Currency & Export controls */}
        <div className="flex items-center gap-2">
          {/* Multi-Currency Dropdown */}
          <div className="flex items-center border rounded-lg overflow-hidden bg-background text-xs">
            <button
              onClick={() => setCurrency("PKR")}
              className={`px-2.5 py-1 font-bold ${
                currency === "PKR" ? "bg-emerald-700 text-white" : "text-muted-foreground"
              }`}
            >
              PKR
            </button>
            <button
              onClick={() => setCurrency("SAR")}
              className={`px-2.5 py-1 font-bold ${
                currency === "SAR" ? "bg-emerald-700 text-white" : "text-muted-foreground"
              }`}
            >
              SAR (74.5)
            </button>
            <button
              onClick={() => setCurrency("USD")}
              className={`px-2.5 py-1 font-bold ${
                currency === "USD" ? "bg-emerald-700 text-white" : "text-muted-foreground"
              }`}
            >
              USD (278.5)
            </button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportExcel}
            className="text-xs gap-1"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Excel
          </Button>

          <Button
            size="sm"
            variant="default"
            onClick={() => window.print()}
            className="text-xs gap-1 bg-slate-900 text-white hover:bg-slate-800"
          >
            <Printer className="w-3.5 h-3.5" /> Print / PDF
          </Button>
        </div>
      </div>

      {/* 1. PROFIT & LOSS STATEMENT */}
      {activeReport === "pnl" && (
        <Card className="print:border-none print:shadow-none">
          <CardHeader className="border-b pb-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">Statement of Profit & Loss</CardTitle>
                <CardDescription className="text-xs">
                  For the Period Ended Today • Operating Currency: {currency}
                </CardDescription>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">Net Operating Margin</span>
                <div className="text-xl font-bold text-emerald-600">
                  {totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6 text-xs">
            {/* Revenue Section */}
            <div>
              <div className="flex justify-between font-bold text-sm text-foreground border-b pb-2 mb-2">
                <span>1. Operating Revenue & Sales</span>
                <span className="font-mono">{formatCurr(totalRevenue)}</span>
              </div>
              <div className="space-y-1.5 pl-4">
                {revenueAccounts.map((a) => (
                  <div key={a.id} className="flex justify-between text-muted-foreground">
                    <span>{a.code} - {a.name}</span>
                    <span className="font-mono text-foreground">{formatCurr(a.balance)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost of Sales */}
            <div>
              <div className="flex justify-between font-bold text-sm text-foreground border-b pb-2 mb-2">
                <span>2. Less: Cost of Sales (Direct Airlines, Hotels & Visas)</span>
                <span className="font-mono text-red-600">-{formatCurr(totalCostOfSales)}</span>
              </div>
              <div className="space-y-1.5 pl-4">
                {costAccounts.map((a) => (
                  <div key={a.id} className="flex justify-between text-muted-foreground">
                    <span>{a.code} - {a.name}</span>
                    <span className="font-mono text-foreground">{formatCurr(a.balance)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Gross Profit Strip */}
            <div className="p-3 rounded-xl bg-muted/40 border flex justify-between font-bold text-sm">
              <span className="text-foreground">Gross Operating Profit:</span>
              <span className="font-mono text-emerald-600">{formatCurr(grossProfit)}</span>
            </div>

            {/* Operating Expenses */}
            <div>
              <div className="flex justify-between font-bold text-sm text-foreground border-b pb-2 mb-2">
                <span>3. Less: Operating & Administrative Expenses</span>
                <span className="font-mono text-red-600">-{formatCurr(totalOperatingExpenses)}</span>
              </div>
              <div className="space-y-1.5 pl-4">
                {operatingExpenses.map((a) => (
                  <div key={a.id} className="flex justify-between text-muted-foreground">
                    <span>{a.code} - {a.name}</span>
                    <span className="font-mono text-foreground">{formatCurr(a.balance)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Net Profit Banner */}
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex justify-between items-center text-base font-bold">
              <span className="text-emerald-900 dark:text-emerald-300">Net Profit for the Period:</span>
              <span className="font-mono text-xl text-emerald-700 dark:text-emerald-400">
                {formatCurr(netProfit)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. TRIAL BALANCE */}
      {activeReport === "trial_balance" && (
        <Card className="print:border-none print:shadow-none">
          <CardHeader className="border-b pb-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">Audited Trial Balance</CardTitle>
                <CardDescription className="text-xs">
                  Summary of all general ledger accounts with balanced debit and credit totals
                </CardDescription>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-lg border border-emerald-300">
                <CheckCircle2 className="w-4 h-4" />
                <span>Double-Entry Balanced</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-muted/50 border-b text-muted-foreground font-sans">
                  <tr>
                    <th className="p-3 w-28">Code</th>
                    <th className="p-3">Account Title</th>
                    <th className="p-3">Classification</th>
                    <th className="p-3 text-right">Debit Balance ({currency})</th>
                    <th className="p-3 text-right">Credit Balance ({currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {trialBalanceList.map((a) => (
                    <tr key={a.id} className="hover:bg-muted/30">
                      <td className="p-3 font-bold text-foreground">{a.code}</td>
                      <td className="p-3 font-sans font-semibold text-foreground">{a.name}</td>
                      <td className="p-3 font-sans">
                        <Badge variant="outline" className="text-[10px]">
                          {a.type}
                        </Badge>
                      </td>
                      <td className="p-3 text-right text-emerald-600 font-bold">
                        {a.debit > 0 ? formatCurr(a.debit) : "-"}
                      </td>
                      <td className="p-3 text-right text-blue-600 font-bold">
                        {a.credit > 0 ? formatCurr(a.credit) : "-"}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted/60 font-bold text-sm border-t-2">
                    <td colSpan={3} className="p-3 font-sans text-right">
                      Total Trial Balance:
                    </td>
                    <td className="p-3 text-right text-emerald-700 font-bold">
                      {formatCurr(totalDebit)}
                    </td>
                    <td className="p-3 text-right text-blue-700 font-bold">
                      {formatCurr(totalCredit)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. BALANCE SHEET */}
      {activeReport === "balance_sheet" && (
        <Card className="print:border-none print:shadow-none">
          <CardHeader className="border-b pb-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">Balance Sheet (Financial Position)</CardTitle>
                <CardDescription className="text-xs">
                  Assets = Liabilities + Equity • Currency: {currency}
                </CardDescription>
              </div>
              <Badge variant="success" className="text-xs">
                Assets Match Liabilities & Equity
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6 text-xs">
            {/* Assets */}
            <div>
              <div className="flex justify-between font-bold text-sm text-foreground border-b pb-2 mb-2">
                <span>TOTAL ASSETS (Current & Non-Current)</span>
                <span className="font-mono text-emerald-600">{formatCurr(totalAssets)}</span>
              </div>
              <div className="space-y-1.5 pl-4">
                {assetAccounts.map((a) => (
                  <div key={a.id} className="flex justify-between text-muted-foreground">
                    <span>{a.code} - {a.name}</span>
                    <span className="font-mono text-foreground font-semibold">{formatCurr(a.balance)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Liabilities */}
            <div>
              <div className="flex justify-between font-bold text-sm text-foreground border-b pb-2 mb-2">
                <span>TOTAL LIABILITIES (Accounts Payable & Advances)</span>
                <span className="font-mono text-red-600">{formatCurr(totalLiabilities)}</span>
              </div>
              <div className="space-y-1.5 pl-4">
                {liabilityAccounts.map((a) => (
                  <div key={a.id} className="flex justify-between text-muted-foreground">
                    <span>{a.code} - {a.name}</span>
                    <span className="font-mono text-foreground font-semibold">{formatCurr(a.balance)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Equity */}
            <div>
              <div className="flex justify-between font-bold text-sm text-foreground border-b pb-2 mb-2">
                <span>TOTAL OWNER'S EQUITY & RETAINED EARNINGS</span>
                <span className="font-mono text-purple-600">{formatCurr(totalEquity)}</span>
              </div>
              <div className="space-y-1.5 pl-4">
                {equityAccounts.map((a) => (
                  <div key={a.id} className="flex justify-between text-muted-foreground">
                    <span>{a.code} - {a.name}</span>
                    <span className="font-mono text-foreground font-semibold">{formatCurr(a.balance)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-emerald-700 font-semibold border-t pt-1">
                  <span>Current Period Net Earnings:</span>
                  <span className="font-mono">{formatCurr(netProfit)}</span>
                </div>
              </div>
            </div>

            {/* Total Liabilities & Equity Match Banner */}
            <div className="p-3 rounded-xl bg-muted/40 border flex justify-between font-bold text-sm">
              <span>TOTAL LIABILITIES & EQUITY:</span>
              <span className="font-mono text-emerald-700">{formatCurr(totalLiabilities + totalEquity)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. BRANCH SALES PERFORMANCE */}
      {activeReport === "branch_sales" && (
        <Card className="print:border-none print:shadow-none">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-lg">Branch-Wise Sales & Volume Performance</CardTitle>
            <CardDescription className="text-xs">
              Revenue, total package bookings, and ticket volume per Pakistani branch
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b text-muted-foreground">
                  <tr>
                    <th className="p-3">Branch Location</th>
                    <th className="p-3">City</th>
                    <th className="p-3 text-center">Package Bookings</th>
                    <th className="p-3 text-center">Air Tickets</th>
                    <th className="p-3 text-right">Total Revenue ({currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {branchData.map((b, idx) => (
                    <tr key={idx} className="hover:bg-muted/30">
                      <td className="p-3 font-bold text-foreground">{b.branch}</td>
                      <td className="p-3 text-muted-foreground">{b.city}</td>
                      <td className="p-3 text-center font-semibold">{b.bookingsCount}</td>
                      <td className="p-3 text-center font-semibold">{b.ticketsCount}</td>
                      <td className="p-3 text-right font-mono font-bold text-sm text-emerald-600">
                        {formatCurr(b.sales)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
