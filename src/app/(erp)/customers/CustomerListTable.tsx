"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  AlertTriangle,
  FileCheck2,
  Phone,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  Building,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatDate, isPassportExpiringSoon } from "@/lib/utils";

interface CustomerWithRelations {
  id: string;
  firstName: string;
  lastName: string;
  cnic: string | null;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  city: string | null;
  branch: { name: string; city: string } | null;
  passports: Array<{
    id: string;
    passportNumber: string;
    expiryDate: Date | string;
    nationality: string;
    passportScanUrl: string | null;
  }>;
  _count: {
    packageBookings: number;
    tickets: number;
    visas: number;
  };
}

export function CustomerListTable({
  initialCustomers,
}: {
  initialCustomers: CustomerWithRelations[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState("ALL");

  const filtered = initialCustomers.filter((c) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      c.firstName.toLowerCase().includes(term) ||
      c.lastName.toLowerCase().includes(term) ||
      (c.cnic && c.cnic.includes(term)) ||
      c.phone.includes(term) ||
      c.passports.some((p) => p.passportNumber.toLowerCase().includes(term));

    const matchesBranch =
      branchFilter === "ALL" || c.branch?.city.toUpperCase() === branchFilter;

    return matchesSearch && matchesBranch;
  });

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, CNIC, phone, passport..."
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="text-xs border rounded-lg px-3 py-1.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="ALL">All Branches</option>
            <option value="KARACHI">Karachi</option>
            <option value="LAHORE">Lahore</option>
            <option value="ISLAMABAD">Islamabad</option>
          </select>
        </div>
      </div>

      {/* Results Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b text-muted-foreground">
                <tr>
                  <th className="p-3.5 font-semibold">Pilgrim Details</th>
                  <th className="p-3.5 font-semibold">CNIC / Contact</th>
                  <th className="p-3.5 font-semibold">Passport & Validity</th>
                  <th className="p-3.5 font-semibold">Branch</th>
                  <th className="p-3.5 font-semibold text-center">Bookings / Visas</th>
                  <th className="p-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      No pilgrims found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => {
                    const primaryPassport = c.passports[0];
                    const hasExpiringSoon = primaryPassport
                      ? isPassportExpiringSoon(primaryPassport.expiryDate)
                      : false;

                    const cleanPhone = c.phone.replace(/[^0-9]/g, "");
                    const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                      `Assalam o Alaikum ${c.firstName}, greetings from Al-Haramain Travel & Umrah regarding your pilgrimage file.`
                    )}`;

                    return (
                      <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3.5">
                          <Link
                            href={`/customers/${c.id}`}
                            className="font-bold text-sm text-foreground hover:text-emerald-600 flex items-center gap-1.5"
                          >
                            <span>{c.firstName} {c.lastName}</span>
                          </Link>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {c.city || "Pakistan"}
                          </div>
                        </td>

                        <td className="p-3.5">
                          <div className="font-mono text-[11px] text-foreground">
                            {c.cnic || "No CNIC"}
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{c.phone}</span>
                          </div>
                        </td>

                        <td className="p-3.5">
                          {primaryPassport ? (
                            <div>
                              <div className="font-mono font-bold text-foreground flex items-center gap-1.5">
                                <FileCheck2 className="w-3.5 h-3.5 text-slate-500" />
                                <span>{primaryPassport.passportNumber}</span>
                              </div>
                              <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                <span>Expires: {formatDate(primaryPassport.expiryDate)}</span>
                              </div>
                              {hasExpiringSoon && (
                                <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded">
                                  <AlertTriangle className="w-3 h-3 shrink-0" />
                                  <span>&lt; 6 Months Validity!</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic text-[11px]">
                              No Passport Linked
                            </span>
                          )}
                        </td>

                        <td className="p-3.5">
                          <Badge variant="outline" className="text-[10px]">
                            {c.branch?.name || "General"}
                          </Badge>
                        </td>

                        <td className="p-3.5 text-center">
                          <div className="inline-flex items-center gap-2 text-xs font-semibold">
                            <span title="Package Bookings">{c._count.packageBookings} Bookings</span>
                            <span>•</span>
                            <span title="Visas Applied">{c._count.visas} Visas</span>
                          </div>
                        </td>

                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-md hover:bg-emerald-50 text-emerald-600 dark:hover:bg-emerald-950/60"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                            <Link
                              href={`/customers/${c.id}`}
                              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
                              title="View Pilgrim Profile & Documents"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
