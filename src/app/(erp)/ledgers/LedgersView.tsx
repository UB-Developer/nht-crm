"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Users,
  Building2,
  Wallet,
  CreditCard,
  FileSpreadsheet,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatPKR, formatDate } from "@/lib/utils";
import * as XLSX from "xlsx";

export function LedgersView({
  journalEntries,
  ledgerEntries,
  customers,
  suppliers,
  accounts,
}: {
  journalEntries: any[];
  ledgerEntries: any[];
  customers: any[];
  suppliers: any[];
  accounts: any[];
}) {
  const [activeTab, setActiveTab] = useState<"general" | "customer" | "supplier" | "cash_bank">("general");
  const [searchTerm, setSearchTerm] = useState("");

  // Export to Excel for the current active tab
  const handleExport = () => {
    let exportData: any[] = [];
    let fileName = `Ledger_${activeTab}_${Date.now()}.xlsx`;

    if (activeTab === "general") {
      exportData = ledgerEntries.map((le) => ({
        Date: formatDate(le.createdAt),
        "JV Number": le.journalEntry?.entryNumber,
        Account: le.account?.name,
        Description: le.description,
        "Debit (PKR)": le.debit,
        "Credit (PKR)": le.credit,
        Customer: le.customer ? `${le.customer.firstName} ${le.customer.lastName}` : "",
        Supplier: le.supplier ? le.supplier.name : "",
      }));
    } else if (activeTab === "customer") {
      exportData = customers.map((c) => {
        const totalSales = c.packageBookings.reduce((s: number, b: any) => s + b.totalAmount, 0);
        const totalPaid = c.receipts.reduce((s: number, r: any) => s + r.amount, 0);
        return {
          "Customer Name": `${c.firstName} ${c.lastName}`,
          Phone: c.phone,
          CNIC: c.cnic || "N/A",
          "Total Invoiced (PKR)": totalSales,
          "Total Paid (PKR)": totalPaid,
          "Outstanding Balance (PKR)": Math.max(0, totalSales - totalPaid),
        };
      });
    } else if (activeTab === "supplier") {
      exportData = suppliers.map((s) => ({
        "Supplier Name": s.name,
        Type: s.type,
        "Contact Person": s.contactPerson || "N/A",
        Phone: s.phone || "N/A",
        "Current Payable Balance (PKR)": s.balance,
      }));
    } else {
      exportData = ledgerEntries
        .filter((le) => le.account?.subType === "CASH" || le.account?.subType === "BANK")
        .map((le) => ({
          Date: formatDate(le.createdAt),
          Account: le.account?.name,
          Description: le.description,
          "Debit (Inflow)": le.debit,
          "Credit (Outflow)": le.credit,
        }));
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, activeTab.toUpperCase());
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="space-y-4">
      {/* Tab Switcher & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/50 rounded-xl border">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "general"
                ? "bg-emerald-700 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> General Daybook
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("customer")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "customer"
                ? "bg-emerald-700 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Customer Sales Ledger
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("supplier")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "supplier"
                ? "bg-emerald-700 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> Supplier Ledger
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cash_bank")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === "cash_bank"
                ? "bg-emerald-700 text-white shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Wallet className="w-3.5 h-3.5" /> Cash & Bank Book
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            className="text-xs gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Excel
          </Button>
        </div>
      </div>

      {/* 1. General Daybook Tab */}
      {activeTab === "general" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b text-muted-foreground">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">JV Number</th>
                    <th className="p-3">Account Title</th>
                    <th className="p-3">Particulars / Description</th>
                    <th className="p-3 text-right">Debit (PKR)</th>
                    <th className="p-3 text-right">Credit (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-mono">
                  {ledgerEntries.map((le) => (
                    <tr key={le.id} className="hover:bg-muted/30">
                      <td className="p-3 font-sans text-muted-foreground">
                        {formatDate(le.createdAt)}
                      </td>
                      <td className="p-3 font-bold text-foreground">
                        {le.journalEntry?.entryNumber}
                      </td>
                      <td className="p-3 font-sans font-semibold text-foreground">
                        {le.account?.name}
                      </td>
                      <td className="p-3 font-sans text-muted-foreground">
                        {le.description}
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-600">
                        {le.debit > 0 ? formatPKR(le.debit) : "-"}
                      </td>
                      <td className="p-3 text-right font-bold text-blue-600">
                        {le.credit > 0 ? formatPKR(le.credit) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. Customer Sales Ledger Tab */}
      {activeTab === "customer" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b text-muted-foreground">
                  <tr>
                    <th className="p-3">Customer / Pilgrim</th>
                    <th className="p-3">CNIC / Mobile</th>
                    <th className="p-3 text-right">Total Invoiced (Debits)</th>
                    <th className="p-3 text-right">Receipts Settled (Credits)</th>
                    <th className="p-3 text-right">Outstanding Balance</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {customers.map((c) => {
                    const totalSales = c.packageBookings.reduce((s: number, b: any) => s + b.totalAmount, 0);
                    const totalPaid = c.receipts.reduce((s: number, r: any) => s + r.amount, 0);
                    const outstanding = Math.max(0, totalSales - totalPaid);

                    return (
                      <tr key={c.id} className="hover:bg-muted/30">
                        <td className="p-3">
                          <Link
                            href={`/customers/${c.id}`}
                            className="font-bold text-foreground hover:text-emerald-600"
                          >
                            {c.firstName} {c.lastName}
                          </Link>
                          <div className="text-[11px] text-muted-foreground">
                            {c.packageBookings.length} Bookings on file
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="font-mono">{c.cnic || "No CNIC"}</div>
                          <div className="text-[11px] text-muted-foreground">{c.phone}</div>
                        </td>

                        <td className="p-3 text-right font-mono font-semibold">
                          {formatPKR(totalSales)}
                        </td>

                        <td className="p-3 text-right font-mono text-emerald-600 font-semibold">
                          {formatPKR(totalPaid)}
                        </td>

                        <td className="p-3 text-right font-mono font-bold text-sm text-amber-600">
                          {formatPKR(outstanding)}
                        </td>

                        <td className="p-3 text-center">
                          <Badge
                            variant={outstanding === 0 ? "success" : "warning"}
                            className="text-[10px]"
                          >
                            {outstanding === 0 ? "Fully Paid" : "Balance Due"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. Supplier Ledger Tab */}
      {activeTab === "supplier" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b text-muted-foreground">
                  <tr>
                    <th className="p-3">Supplier Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Contact Person</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3 text-right">Payable Balance (PKR)</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {suppliers.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/30">
                      <td className="p-3 font-bold text-foreground">
                        {s.name}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px]">
                          {s.type}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {s.contactPerson || "Operations Desk"}
                      </td>
                      <td className="p-3 font-mono">{s.phone || "-"}</td>
                      <td className="p-3 text-right font-mono font-bold text-red-600 text-sm">
                        {formatPKR(Math.abs(s.balance))}
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant="destructive" className="text-[10px]">
                          Payable Open
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. Cash & Bank Book Tab */}
      {activeTab === "cash_bank" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b text-muted-foreground">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Cash / Bank Account</th>
                    <th className="p-3">Narration / Voucher Ref</th>
                    <th className="p-3 text-right text-emerald-600">Inflow (Debit)</th>
                    <th className="p-3 text-right text-red-600">Outflow (Credit)</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-mono">
                  {ledgerEntries
                    .filter((le) => le.account?.subType === "CASH" || le.account?.subType === "BANK")
                    .map((le) => (
                      <tr key={le.id} className="hover:bg-muted/30">
                        <td className="p-3 font-sans text-muted-foreground">
                          {formatDate(le.createdAt)}
                        </td>
                        <td className="p-3 font-sans font-bold text-foreground">
                          {le.account?.name}
                        </td>
                        <td className="p-3 font-sans text-muted-foreground">
                          {le.description}
                        </td>
                        <td className="p-3 text-right font-bold text-emerald-600">
                          {le.debit > 0 ? `+${formatPKR(le.debit)}` : "-"}
                        </td>
                        <td className="p-3 text-right font-bold text-red-600">
                          {le.credit > 0 ? `-${formatPKR(le.credit)}` : "-"}
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
