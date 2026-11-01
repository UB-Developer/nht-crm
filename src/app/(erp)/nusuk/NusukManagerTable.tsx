"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  Clock,
  Download,
  Calendar,
  ShieldCheck,
  FileSpreadsheet,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import * as XLSX from "xlsx";

export function NusukManagerTable({ initialRecords }: { initialRecords: any[] }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const filtered = initialRecords.filter((r) => {
    const term = searchTerm.toLowerCase();
    const passportNo = r.customer.passports?.[0]?.passportNumber || "";
    return (
      r.customer.firstName.toLowerCase().includes(term) ||
      r.customer.lastName.toLowerCase().includes(term) ||
      (r.nusukRefId && r.nusukRefId.toLowerCase().includes(term)) ||
      passportNo.toLowerCase().includes(term)
    );
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((r) => r.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Bulk status update
  const handleBulkUpdate = async (type: "UMRAH" | "RAWDAH", newStatus: string) => {
    if (selectedIds.length === 0) return;
    setLoading(true);

    try {
      const payload = {
        nusukIds: selectedIds,
        ...(type === "UMRAH" ? { umrahPermitStatus: newStatus } : { rawdahPermitStatus: newStatus }),
      };

      const res = await fetch("/api/nusuk", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  // Export Nusuk & Rawdah list to Excel
  const handleExportExcel = () => {
    const exportData = filtered.map((r) => ({
      "Nusuk Reference": r.nusukRefId || "N/A",
      "Pilgrim Name": `${r.customer.firstName} ${r.customer.lastName}`,
      "Passport Number": r.customer.passports?.[0]?.passportNumber || "N/A",
      "Phone": r.customer.phone,
      "Package Booking": r.packageBooking?.bookingNumber || "Direct",
      "Umrah Permit": r.umrahPermitStatus,
      "Rawdah Permit": r.rawdahPermitStatus,
      "Rawdah Slot Date": r.rawdahSlotDate ? formatDate(r.rawdahSlotDate) : "Pending",
      "Remarks": r.remarks || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Nusuk_Pilgrims");
    XLSX.writeFile(workbook, `Nusuk_Rawdah_Manifest_${Date.now()}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Top Search & Actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search pilgrim, Nusuk ref, passport..."
            className="pl-9 text-xs"
          />
        </div>

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
                onClick={() => handleBulkUpdate("RAWDAH", "APPROVED")}
                className="h-7 text-[11px] bg-purple-700 hover:bg-purple-800 text-white"
              >
                Approve Rawdah (Tasreeh)
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={loading}
                onClick={() => handleBulkUpdate("UMRAH", "APPROVED")}
                className="h-7 text-[11px]"
              >
                Approve Umrah
              </Button>
            </div>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportExcel}
            className="text-xs gap-1"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export to Excel (.xlsx)
          </Button>
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
                  <th className="p-3 font-semibold">Nusuk Ref ID</th>
                  <th className="p-3 font-semibold">Pilgrim & Passport</th>
                  <th className="p-3 font-semibold">Package Booking</th>
                  <th className="p-3 font-semibold text-center">Umrah Permit</th>
                  <th className="p-3 font-semibold text-center">Rawdah (Tasreeh)</th>
                  <th className="p-3 font-semibold">Appointment Slot</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-muted-foreground">
                      No Nusuk records match your search query.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/30">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(r.id)}
                          onChange={() => toggleSelectOne(r.id)}
                          className="rounded"
                        />
                      </td>

                      <td className="p-3 font-mono font-bold text-foreground">
                        {r.nusukRefId || "NSK-PENDING"}
                      </td>

                      <td className="p-3">
                        <Link
                          href={`/customers/${r.customer.id}`}
                          className="font-bold text-foreground hover:text-emerald-600"
                        >
                          {r.customer.firstName} {r.customer.lastName}
                        </Link>
                        <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                          {r.customer.passports?.[0]?.passportNumber || "No Passport"}
                        </div>
                      </td>

                      <td className="p-3">
                        {r.packageBooking ? (
                          <Link
                            href={`/bookings/${r.packageBooking.id}`}
                            className="font-mono text-emerald-600 hover:underline"
                          >
                            {r.packageBooking.bookingNumber}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground italic">Direct</span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        <Badge
                          variant={r.umrahPermitStatus === "APPROVED" ? "success" : "warning"}
                          className="text-[10px]"
                        >
                          {r.umrahPermitStatus}
                        </Badge>
                      </td>

                      <td className="p-3 text-center">
                        <Badge
                          variant={r.rawdahPermitStatus === "APPROVED" ? "purple" : "warning"}
                          className="text-[10px]"
                        >
                          {r.rawdahPermitStatus}
                        </Badge>
                      </td>

                      <td className="p-3">
                        {r.rawdahSlotDate ? (
                          <div className="flex items-center gap-1 font-semibold text-foreground">
                            <Calendar className="w-3.5 h-3.5 text-purple-600" />
                            <span>{formatDate(r.rawdahSlotDate)}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-[11px]">
                            Slot Not Booked
                          </span>
                        )}
                        {r.remarks && (
                          <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                            {r.remarks}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
