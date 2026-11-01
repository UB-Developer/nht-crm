"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Users,
  Plus,
  Trash2,
  AlertTriangle,
  CreditCard,
  Building,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPKR } from "@/lib/utils";

interface PackageOption {
  id: string;
  name: string;
  packageType: string;
  durationDays: number;
  sellDouble: number;
  sellTriple: number;
  sellQuad: number;
  sellQuint: number;
  childPrice: number;
  infantPrice: number;
  makkahHotel: { name: string; city: string };
  madinahHotel: { name: string; city: string };
}

interface CustomerOption {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  passports: Array<{ id: string; passportNumber: string }>;
}

export default function NewPackageBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPackageId = searchParams.get("packageId");
  const preselectedCustomerId = searchParams.get("customerId");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);

  // Form states
  const [packageId, setPackageId] = useState(preselectedPackageId || "");
  const [customerId, setCustomerId] = useState(preselectedCustomerId || "");
  const [roomType, setRoomType] = useState<"DOUBLE" | "TRIPLE" | "QUAD" | "QUINT">("QUAD");
  const [travelDate, setTravelDate] = useState("2026-11-20");
  const [notes, setNotes] = useState("");

  // Payment plan
  const [paidAmount, setPaidAmount] = useState(500000);
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [paymentReference, setPaymentReference] = useState("ONLINE-TRANSFER-ADVANCE");

  // Pilgrims list
  const [pilgrims, setPilgrims] = useState([
    {
      customerId: preselectedCustomerId || "",
      passportId: "",
      relationToHead: "SELF",
      roomType: "QUAD",
      isChild: false,
      isInfant: false,
    },
  ]);

  useEffect(() => {
    async function loadMasters() {
      try {
        const [pkgRes, custRes] = await Promise.all([
          fetch("/api/packages"),
          fetch("/api/customers"),
        ]);
        const pkgData = await pkgRes.json();
        const custData = await custRes.json();

        if (pkgData.packages?.length > 0) {
          setPackages(pkgData.packages);
          if (!packageId) setPackageId(pkgData.packages[0].id);
        }

        if (custData.customers?.length > 0) {
          setCustomers(custData.customers);
          if (!customerId) {
            setCustomerId(custData.customers[0].id);
            setPilgrims([
              {
                customerId: custData.customers[0].id,
                passportId: custData.customers[0].passports?.[0]?.id || "",
                relationToHead: "SELF",
                roomType: "QUAD",
                isChild: false,
                isInfant: false,
              },
            ]);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadMasters();
  }, []);

  const selectedPkg = packages.find((p) => p.id === packageId);

  // Rate per pilgrim based on chosen room type
  let ratePerPilgrim = 0;
  if (selectedPkg) {
    if (roomType === "DOUBLE") ratePerPilgrim = selectedPkg.sellDouble;
    else if (roomType === "TRIPLE") ratePerPilgrim = selectedPkg.sellTriple;
    else if (roomType === "QUAD") ratePerPilgrim = selectedPkg.sellQuad;
    else if (roomType === "QUINT") ratePerPilgrim = selectedPkg.sellQuint;
  }

  const totalAmount = pilgrims.reduce((sum, p) => {
    if (p.isInfant) return sum + (selectedPkg?.infantPrice || 70000);
    if (p.isChild) return sum + (selectedPkg?.childPrice || 175000);
    return sum + ratePerPilgrim;
  }, 0);

  const balanceAmount = Math.max(0, totalAmount - paidAmount);

  // Add another family member to this booking
  const addPilgrim = () => {
    const defaultCustId = customers[0]?.id || "";
    setPilgrims([
      ...pilgrims,
      {
        customerId: defaultCustId,
        passportId: customers[0]?.passports?.[0]?.id || "",
        relationToHead: "SPOUSE",
        roomType,
        isChild: false,
        isInfant: false,
      },
    ]);
  };

  const removePilgrim = (index: number) => {
    if (pilgrims.length <= 1) return;
    setPilgrims(pilgrims.filter((_, i) => i !== index));
  };

  const updatePilgrim = (index: number, field: string, val: any) => {
    const updated = [...pilgrims];
    (updated[index] as any)[field] = val;
    if (field === "customerId") {
      const c = customers.find((cust) => cust.id === val);
      updated[index].passportId = c?.passports?.[0]?.id || "";
    }
    setPilgrims(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        packageId,
        customerId,
        roomType,
        travelDate,
        notes,
        totalAmount,
        paidAmount: Number(paidAmount),
        paymentMethod,
        paymentReference,
        pilgrims,
      };

      const res = await fetch("/api/package-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create booking");

      router.push(`/bookings/${data.booking.id}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Booking creation failed");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 border-b pb-4">
        <Link href="/bookings">
          <Button size="sm" variant="outline" className="gap-1 text-xs">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Bookings
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Create Umrah / Hajj Package Booking</h1>
          <p className="text-xs text-muted-foreground">
            Register family/group pilgrims, assign room sharing, and establish installment payment plan.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Package & Room Sharing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">1. Select Package & Room Sharing</CardTitle>
            <CardDescription className="text-xs">Select package itinerary and sharing type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">Select Package *</label>
                <select
                  required
                  value={packageId}
                  onChange={(e) => setPackageId(e.target.value)}
                  className="w-full h-9 border rounded-md px-3 bg-background"
                >
                  <option value="">Select Package</option>
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.durationDays} Days - Quad {formatPKR(p.sellQuad)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Primary Family Head Pilgrim *</label>
                <select
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full h-9 border rounded-md px-3 bg-background"
                >
                  <option value="">Select Primary Pilgrim</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-medium mb-1">Room Sharing Type *</label>
                <select
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value as any)}
                  className="w-full h-9 border rounded-md px-3 bg-background font-semibold text-emerald-700 dark:text-emerald-400"
                >
                  <option value="DOUBLE">Double Sharing (2 Beds)</option>
                  <option value="TRIPLE">Triple Sharing (3 Beds)</option>
                  <option value="QUAD">Quad Sharing (4 Beds - Popular)</option>
                  <option value="QUINT">Quint Sharing (5 Beds)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Travel / Departure Date *</label>
                <Input
                  type="date"
                  required
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Rate per Adult Pilgrim</label>
                <div className="h-9 rounded-md border bg-muted/30 px-3 flex items-center font-bold text-sm text-foreground">
                  {formatPKR(ratePerPilgrim)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Family / Group Pilgrims Manifest */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                2. Group Pilgrims ({pilgrims.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Link all traveling family members with passports and relation to head
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addPilgrim}
              className="text-xs gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Family Member
            </Button>
          </CardHeader>

          <CardContent className="space-y-3">
            {pilgrims.map((p, idx) => {
              const currentCust = customers.find((c) => c.id === p.customerId);
              return (
                <div key={idx} className="p-3 rounded-xl border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] text-muted-foreground font-semibold uppercase mb-1">
                        Pilgrim Name #{idx + 1}
                      </label>
                      <select
                        value={p.customerId}
                        onChange={(e) => updatePilgrim(idx, "customerId", e.target.value)}
                        className="w-full h-8 border rounded-md px-2 bg-background text-xs"
                      >
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.firstName} {c.lastName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-muted-foreground font-semibold uppercase mb-1">
                        Passport Document
                      </label>
                      <select
                        value={p.passportId}
                        onChange={(e) => updatePilgrim(idx, "passportId", e.target.value)}
                        className="w-full h-8 border rounded-md px-2 bg-background text-xs font-mono"
                      >
                        <option value="">No Passport Attached</option>
                        {currentCust?.passports.map((pass) => (
                          <option key={pass.id} value={pass.id}>
                            {pass.passportNumber}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-muted-foreground font-semibold uppercase mb-1">
                        Relation to Head
                      </label>
                      <select
                        value={p.relationToHead}
                        onChange={(e) => updatePilgrim(idx, "relationToHead", e.target.value)}
                        className="w-full h-8 border rounded-md px-2 bg-background text-xs"
                      >
                        <option value="SELF">Self (Family Head)</option>
                        <option value="SPOUSE">Spouse / Wife</option>
                        <option value="SON">Son</option>
                        <option value="DAUGHTER">Daughter</option>
                        <option value="FATHER">Father</option>
                        <option value="MOTHER">Mother</option>
                        <option value="BROTHER">Brother</option>
                        <option value="OTHER">Other Pilgrim</option>
                      </select>
                    </div>
                  </div>

                  {pilgrims.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePilgrim(idx)}
                      className="p-1.5 text-red-500 hover:text-red-700 self-end sm:self-center"
                      title="Remove pilgrim"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Step 3: Payment Plan & Auto Ledger Settlement */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              3. Payment Plan & Advance Settlement
            </CardTitle>
            <CardDescription className="text-xs">
              Automatic receipt voucher generation and accounts receivable balancing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-medium mb-1">Total Package Price (PKR)</label>
                <div className="h-9 rounded-md border bg-muted/40 px-3 flex items-center font-bold text-base text-foreground">
                  {formatPKR(totalAmount)}
                </div>
              </div>

              <div>
                <label className="block font-medium mb-1">Advance Payment Received (PKR) *</label>
                <Input
                  type="number"
                  min={0}
                  max={totalAmount}
                  required
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Outstanding Balance (PKR)</label>
                <div className="h-9 rounded-md border bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-3 flex items-center font-bold text-base">
                  {formatPKR(balanceAmount)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full h-9 border rounded-md px-3 bg-background"
                >
                  <option value="BANK_TRANSFER">Bank Online Transfer (IBFT)</option>
                  <option value="CASH">Cash in Hand at Branch Counter</option>
                  <option value="CHEQUE">Bank Pay Order / Cheque</option>
                  <option value="ONLINE">Debit / Credit Card</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Bank Reference / Notes</label>
                <Input
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="e.g. BAFL-FT-908121 / Counter Receipt"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium mb-1">Booking Notes / Special Requests</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Wheelchair requested for Rawdah slot, Haram view preferred."
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link href="/bookings">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading}
            className="bg-emerald-700 hover:bg-emerald-800 text-white min-w-36"
          >
            {loading ? "Creating..." : "Confirm & Post Booking"}
          </Button>
        </div>
      </form>
    </div>
  );
}
