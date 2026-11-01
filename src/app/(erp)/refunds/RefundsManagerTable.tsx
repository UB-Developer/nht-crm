"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RotateCcw, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPKR, formatDate } from "@/lib/utils";

export function RefundsManagerTable({ initialRefunds }: { initialRefunds: any[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setLoadingId(id);
    try {
      const res = await fetch("/api/refunds", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b text-muted-foreground">
              <tr>
                <th className="p-3.5 font-semibold">Refund #</th>
                <th className="p-3.5 font-semibold">Module</th>
                <th className="p-3.5 font-semibold">Pilgrim / Customer</th>
                <th className="p-3.5 font-semibold text-right">Original Paid</th>
                <th className="p-3.5 font-semibold text-right">Penalties Deducted</th>
                <th className="p-3.5 font-semibold text-right">Net Customer Refund</th>
                <th className="p-3.5 font-semibold text-center">Status</th>
                <th className="p-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {initialRefunds.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-muted-foreground">
                    No refund requests on record.
                  </td>
                </tr>
              ) : (
                initialRefunds.map((r) => {
                  const totalPenalties = r.penaltyAirline + r.penaltySupplier + r.penaltyCompany;
                  const isPending = r.status === "REQUESTED";

                  return (
                    <tr key={r.id} className="hover:bg-muted/30">
                      <td className="p-3.5 font-mono font-bold text-foreground">
                        {r.refundNumber}
                      </td>

                      <td className="p-3.5">
                        <Badge variant="outline" className="text-[10px]">
                          {r.module}
                        </Badge>
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-foreground">
                          {r.customer.firstName} {r.customer.lastName}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{r.customer.phone}</div>
                      </td>

                      <td className="p-3.5 text-right font-mono">
                        {formatPKR(r.originalAmount)}
                      </td>

                      <td className="p-3.5 text-right font-mono text-red-600 font-semibold">
                        -{formatPKR(totalPenalties)}
                      </td>

                      <td className="p-3.5 text-right font-mono font-bold text-emerald-600 text-sm">
                        {formatPKR(r.customerRefundAmount)}
                      </td>

                      <td className="p-3.5 text-center">
                        <Badge
                          variant={
                            r.status === "APPROVED" || r.status === "REFUNDED"
                              ? "success"
                              : r.status === "REJECTED"
                              ? "destructive"
                              : "warning"
                          }
                          className="text-[10px]"
                        >
                          {r.status}
                        </Badge>
                      </td>

                      <td className="p-3.5 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              disabled={loadingId === r.id}
                              onClick={() => handleStatusChange(r.id, "APPROVED")}
                              className="h-7 text-[11px] bg-emerald-700 hover:bg-emerald-800 text-white"
                            >
                              Approve & Reverse
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={loadingId === r.id}
                              onClick={() => handleStatusChange(r.id, "REJECTED")}
                              className="h-7 text-[11px]"
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-medium">
                            Processed ({formatDate(r.updatedAt)})
                          </span>
                        )}
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
  );
}
