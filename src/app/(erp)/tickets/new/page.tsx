"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Ticket, AlertTriangle, Plane } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPKR } from "@/lib/utils";

interface CustomerOption {
  id: string;
  firstName: string;
  lastName: string;
  cnic: string | null;
  phone: string;
  passports: Array<{ id: string; passportNumber: string }>;
}

interface SupplierOption {
  id: string;
  name: string;
}

export default function NewTicketPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);

  // Form states
  const [customerId, setCustomerId] = useState("");
  const [passportId, setPassportId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [pnr, setPnr] = useState("");
  const [ticketNumber, setTicketNumber] = useState("");
  const [routeDetails, setRouteDetails] = useState("KHI - JED - KHI");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [fare, setFare] = useState(185000);
  const [tax, setTax] = useState(25000);
  const [supplierCost, setSupplierCost] = useState(195000);
  const [sellingPrice, setSellingPrice] = useState(225000);

  useEffect(() => {
    async function loadData() {
      try {
        const [custRes, tktRes] = await Promise.all([
          fetch("/api/customers"),
          fetch("/api/tickets"),
        ]);
        const custData = await custRes.json();
        const tktData = await tktRes.json();

        if (custData.customers) {
          setCustomers(custData.customers);
          if (custData.customers.length > 0) {
            setCustomerId(custData.customers[0].id);
            if (custData.customers[0].passports?.length > 0) {
              setPassportId(custData.customers[0].passports[0].id);
            }
          }
        }

        if (tktData.tickets && tktData.tickets.length > 0) {
          const supMap = new Map();
          tktData.tickets.forEach((t: { supplier: { id: string; name: string } }) => {
            supMap.set(t.supplier.id, t.supplier.name);
          });
          const supList: SupplierOption[] = [];
          supMap.forEach((name, id) => supList.push({ id, name }));
          setSuppliers(supList);
          if (supList.length > 0) setSupplierId(supList[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, []);

  // Update passport selection when customer changes
  const handleCustomerChange = (cId: string) => {
    setCustomerId(cId);
    const selected = customers.find((c) => c.id === cId);
    if (selected && selected.passports.length > 0) {
      setPassportId(selected.passports[0].id);
    } else {
      setPassportId("");
    }
  };

  const calculatedProfit = sellingPrice - supplierCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        customerId,
        passportId: passportId || null,
        supplierId,
        pnr: pnr.toUpperCase().trim(),
        ticketNumber: ticketNumber.trim(),
        routeDetails,
        departureDate,
        returnDate: returnDate || null,
        fare: Number(fare),
        tax: Number(tax),
        supplierCost: Number(supplierCost),
        sellingPrice: Number(sellingPrice),
      };

      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to issue ticket");

      router.push(`/tickets/${data.ticket.id}/eticket`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Issuance failed");
      setLoading(false);
    }
  };

  const selectedCust = customers.find((c) => c.id === customerId);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 border-b pb-4">
        <Link href="/tickets">
          <Button size="sm" variant="outline" className="gap-1 text-xs">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Tickets
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Issue Single Airline Ticket</h1>
          <p className="text-xs text-muted-foreground">
            Book flight from supplier, record PNR, and automatically post sales and payable ledger entries.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 text-xs flex items-center gap-2 border border-red-200 dark:border-red-800">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">1. Passenger & Flight Details</CardTitle>
            <CardDescription className="text-xs">Select pilgrim, attach passport, and specify flight sector</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">Select Passenger (Pilgrim) *</label>
                <select
                  value={customerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full text-xs h-9 border rounded-md px-3 bg-background"
                  required
                >
                  <option value="">Select Pilgrim</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Attached Passport</label>
                <select
                  value={passportId}
                  onChange={(e) => setPassportId(e.target.value)}
                  className="w-full text-xs h-9 border rounded-md px-3 bg-background font-mono"
                >
                  <option value="">Select Passport</option>
                  {selectedCust?.passports.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.passportNumber}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">Ticket Supplier / Consolidator *</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full text-xs h-9 border rounded-md px-3 bg-background"
                  required
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Airline PNR *</label>
                <Input
                  required
                  value={pnr}
                  onChange={(e) => setPnr(e.target.value)}
                  placeholder="e.g. PK8819A"
                  className="font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">E-Ticket Number (13 Digits) *</label>
                <Input
                  required
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value)}
                  placeholder="214-1234567890"
                  className="font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">Sector / Route Details *</label>
                <Input
                  required
                  value={routeDetails}
                  onChange={(e) => setRouteDetails(e.target.value)}
                  placeholder="KHI - JED - KHI"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Departure Date *</label>
                <Input
                  type="date"
                  required
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Return Date</label>
                <Input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing, Cost & Double Entry Ledger Posting */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">2. Pricing, Supplier Cost & Profit Margin</CardTitle>
            <CardDescription className="text-xs">Automatic ledger generation for revenue & accounts payable</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">Base Fare (PKR)</label>
                <Input
                  type="number"
                  min={0}
                  value={fare}
                  onChange={(e) => setFare(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Taxes / Surcharges (PKR)</label>
                <Input
                  type="number"
                  min={0}
                  value={tax}
                  onChange={(e) => setTax(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Supplier Cost Price (PKR) *</label>
                <Input
                  type="number"
                  min={0}
                  required
                  value={supplierCost}
                  onChange={(e) => setSupplierCost(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Selling Price to Pilgrim (PKR) *</label>
                <Input
                  type="number"
                  min={0}
                  required
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Profit margin banner */}
            <div className="p-3.5 rounded-xl bg-muted/40 border grid grid-cols-3 gap-3 text-center text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Supplier Cost</span>
                <span className="font-bold text-sm text-foreground">{formatPKR(supplierCost)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Selling Price</span>
                <span className="font-bold text-sm text-foreground">{formatPKR(sellingPrice)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Net Agency Profit</span>
                <span className="font-bold text-sm text-emerald-600">+{formatPKR(calculatedProfit)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link href="/tickets">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading}
            className="bg-emerald-700 hover:bg-emerald-800 text-white min-w-36"
          >
            {loading ? "Issuing Ticket..." : "Issue & Print E-Ticket"}
          </Button>
        </div>
      </form>
    </div>
  );
}
