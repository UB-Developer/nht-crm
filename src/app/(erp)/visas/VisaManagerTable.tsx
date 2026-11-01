"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  Phone,
  MessageCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatDate, formatPKR } from "@/lib/utils";

interface VisaRecord {
  id: string;
  visaType: string;
  status: string;
  visaNumber: string | null;
  applicationDate: Date | string;
  costPrice: number;
  sellingPrice: number;
  remarks: string | null;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  passport: {
    passportNumber: string;
    expiryDate: Date | string;
  } | null;
  supplier: {
    name: string;
  } | null;
}

export function VisaManagerTable({ initialVisas }: { initialVisas: any[] }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const filtered = initialVisas.filter((v) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      v.customer.firstName.toLowerCase().includes(term) ||
      v.customer.lastName.toLowerCase().includes(term) ||
      (v.passport?.passportNumber && v.passport.passportNumber.toLowerCase().includes(term)) ||
      (v.visaNumber && v.visaNumber.toLowerCase().includes(term));

    const matchesStatus = statusFilter === "ALL" || v.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((v) => v.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkUpdate = async (newStatus: string) => {
    if (selectedIds.length === 0) return;
    setLoading(true);

    try {
      const res = await fetch("/api/visas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visaIds: selectedIds,
          status: newStatus,
        }),
      });

      if (!res.ok) throw new Error("Bulk update failed");
      setSelectedIds([]);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Bulk Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search pilgrim, passport, visa #..."
            className="pl-9 text-xs"
          />
        </div>

        {/* Bulk Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-1.5 p-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 rounded-lg">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 px-2">
                {selectedIds.length} Selected
              </span>
              <Button
                size="sm"
                variant="default"
                disabled={loading}
                onClick={() => handleBulkUpdate("APPROVED")}
                className="h-7 text-[11px] bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                Approve Selected
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={loading}
                onClick={() => handleBulkUpdate("PROCESSING")}
                className="h-7 text-[11px]"
              >
                Processing
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={loading}
                onClick={() => handleBulkUpdate("STAMPED")}
                className="h-7 text-[11px]"
              >
                Stamped
              </Button>
            </div>
          )}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border rounded-lg px-3 py-1.5 bg-background text-foreground focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="PROCESSING">Processing</option>
            <option value="APPROVED">Approved</option>
            <option value="STAMPED">Stamped</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b text-muted-foreground">
                <tr>
                  <th className="p-3 w-8">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filtered.length && filtered.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="p-3 font-semibold">Pilgrim & Passport</th>
                  <th className="p-3 font-semibold">Visa Type & Agent</th>
                  <th className="p-3 font-semibold">Application Date</th>
                  <th className="p-3 font-semibold">Visa Number</th>
                  <th className="p-3 font-semibold text-center">Status</th>
                  <th className="p-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      No visa records match your filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map((v) => {
                    const cleanPhone = v.customer.phone.replace(/[^0-9]/g, "");
                    const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                      `Assalam o Alaikum ${v.customer.firstName}, greetings from Al-Haramain Travel. Your Umrah visa status is currently: ${v.status} (Visa Number: ${v.visaNumber || "Pending"}).`
                    )}`;

                    return (
                      <tr key={v.id} className="hover:bg-muted/30">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(v.id)}
                            onChange={() => toggleSelectOne(v.id)}
                            className="rounded"
                          />
                        </td>

                        <td className="p-3">
                          <Link
                            href={`/customers/${v.customer.id}`}
                            className="font-bold text-foreground hover:text-emerald-600"
                          >
                            {v.customer.firstName} {v.customer.lastName}
                          </Link>
                          <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                            Passport: {v.passport?.passportNumber || "Not Attached"}
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="font-semibold">{v.visaType} Visa</div>
                          <div className="text-[10px] text-muted-foreground">
                            Agent: {v.supplier?.name || "Direct Embassy"}
                          </div>
                        </td>

                        <td className="p-3 text-muted-foreground">
                          {formatDate(v.applicationDate)}
                        </td>

                        <td className="p-3 font-mono font-bold text-foreground">
                          {v.visaNumber || (
                            <span className="text-slate-400 italic font-sans text-[11px]">
                              In Process
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-center">
                          <Badge
                            variant={
                              v.status === "APPROVED" || v.status === "STAMPED"
                                ? "success"
                                : v.status === "REJECTED"
                                ? "destructive"
                                : "warning"
                            }
                            className="text-[10px]"
                          >
                            {v.status}
                          </Badge>
                        </td>

                        <td className="p-3 text-right">
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-md hover:bg-emerald-50 text-emerald-600 dark:hover:bg-emerald-950/40 inline-flex items-center gap-1 text-[11px] font-semibold"
                            title="Send WhatsApp update to pilgrim"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Notify</span>
                          </a>
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
