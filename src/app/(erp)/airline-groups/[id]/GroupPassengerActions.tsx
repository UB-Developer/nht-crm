"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CustomerOption {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  passports: Array<{ id: string; passportNumber: string }>;
}

export function GroupPassengerActions({
  groupId,
  availableSeats,
  customers,
}: {
  groupId: string;
  availableSeats: number;
  customers: CustomerOption[];
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customerId, setCustomerId] = useState("");
  const [passportId, setPassportId] = useState("");
  const [ticketNumber, setTicketNumber] = useState("");

  const handleCustomerSelect = (cId: string) => {
    setCustomerId(cId);
    const c = customers.find((cust) => cust.id === cId);
    if (c && c.passports.length > 0) {
      setPassportId(c.passports[0].id);
    } else {
      setPassportId("");
    }
  };

  const handleAddPassenger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/airline-groups/${groupId}/passengers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          passportId: passportId || null,
          ticketNumber: ticketNumber.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add passenger");

      setModalOpen(false);
      setCustomerId("");
      setPassportId("");
      setTicketNumber("");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error adding passenger");
      setLoading(false);
    }
  };

  const selectedCust = customers.find((c) => c.id === customerId);

  return (
    <div>
      <Button
        size="sm"
        disabled={availableSeats <= 0}
        onClick={() => setModalOpen(true)}
        className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs gap-1"
      >
        <Plus className="w-3.5 h-3.5" /> Add Pilgrim to Group ({availableSeats} Available)
      </Button>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card text-card-foreground border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold">Add Pilgrim to Group Manifest</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAddPassenger} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">Select Pilgrim *</label>
                <select
                  required
                  value={customerId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="w-full h-9 border rounded-md px-3 bg-background"
                >
                  <option value="">Choose Pilgrim</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Select Passport</label>
                <select
                  value={passportId}
                  onChange={(e) => setPassportId(e.target.value)}
                  className="w-full h-9 border rounded-md px-3 bg-background font-mono"
                >
                  <option value="">Choose Passport</option>
                  {selectedCust?.passports.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.passportNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Optional E-Ticket #</label>
                <Input
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value)}
                  placeholder="e.g. 065-2345678901"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white"
                >
                  {loading ? "Adding..." : "Add to Manifest"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
