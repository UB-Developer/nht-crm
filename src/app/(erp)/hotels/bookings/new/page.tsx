"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Hotel, AlertTriangle, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPKR } from "@/lib/utils";
import { differenceInDays, parseISO } from "date-fns";

interface CustomerOption {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface HotelOption {
  id: string;
  name: string;
  city: string;
  distanceMeters: number;
  rooms: Array<{
    id: string;
    roomType: string;
    costPrice: number;
    sellingPrice: number;
  }>;
}

interface SupplierOption {
  id: string;
  name: string;
}

export default function NewHotelBookingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [hotels, setHotels] = useState<HotelOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);

  // Form states
  const [customerId, setCustomerId] = useState("");
  const [hotelId, setHotelId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [roomType, setRoomType] = useState("DOUBLE");
  const [numberOfRooms, setNumberOfRooms] = useState(1);
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [costPrice, setCostPrice] = useState(65000);
  const [sellingPrice, setSellingPrice] = useState(78000);

  useEffect(() => {
    async function loadData() {
      try {
        const [cRes, hRes, tRes] = await Promise.all([
          fetch("/api/customers"),
          fetch("/api/hotels"),
          fetch("/api/tickets"),
        ]);
        const cData = await cRes.json();
        const hData = await hRes.json();
        const tData = await tRes.json();

        if (cData.customers?.length > 0) {
          setCustomers(cData.customers);
          setCustomerId(cData.customers[0].id);
        }

        if (hData.hotels?.length > 0) {
          setHotels(hData.hotels);
          setHotelId(hData.hotels[0].id);
        }

        if (tData.tickets?.length > 0) {
          const supList: SupplierOption[] = [];
          tData.tickets.forEach((t: { supplier: { id: string; name: string } }) => {
            if (!supList.some((s) => s.id === t.supplier.id)) {
              supList.push({ id: t.supplier.id, name: t.supplier.name });
            }
          });
          setSuppliers(supList);
          if (supList.length > 0) setSupplierId(supList[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, []);

  // Calculate nights dynamically
  let totalNights = 1;
  if (checkInDate && checkOutDate) {
    try {
      const days = differenceInDays(parseISO(checkOutDate), parseISO(checkInDate));
      if (days > 0) totalNights = days;
    } catch {
      totalNights = 1;
    }
  }

  // Update rates when hotel or room type changes
  const handleHotelChange = (hId: string) => {
    setHotelId(hId);
    const selected = hotels.find((h) => h.id === hId);
    if (selected && selected.rooms.length > 0) {
      const r = selected.rooms[0];
      setRoomType(r.roomType);
      setCostPrice(r.costPrice * totalNights * numberOfRooms);
      setSellingPrice(r.sellingPrice * totalNights * numberOfRooms);
    }
  };

  const calculatedProfit = sellingPrice - costPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        hotelId,
        customerId,
        supplierId,
        roomType,
        numberOfRooms: Number(numberOfRooms),
        checkInDate,
        checkOutDate,
        costPrice: Number(costPrice),
        sellingPrice: Number(sellingPrice),
      };

      const res = await fetch("/api/hotel-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create booking");

      router.push(`/hotels/bookings/${data.booking.id}/voucher`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Booking creation failed");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 border-b pb-4">
        <Link href="/hotels/bookings">
          <Button size="sm" variant="outline" className="gap-1 text-xs">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Bookings
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Reserve Hotel Room(s)</h1>
          <p className="text-xs text-muted-foreground">
            Automatic nights calculation, season rates, voucher confirmation, and ledger posting.
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
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">1. Property & Dates Selection</CardTitle>
            <CardDescription className="text-xs">Hotel choice, room type, and length of stay</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">Select Guest Pilgrim *</label>
                <select
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full h-9 border rounded-md px-3 bg-background"
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
                <label className="block font-medium mb-1">Select Hotel Property *</label>
                <select
                  required
                  value={hotelId}
                  onChange={(e) => handleHotelChange(e.target.value)}
                  className="w-full h-9 border rounded-md px-3 bg-background"
                >
                  <option value="">Select Hotel</option>
                  {hotels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.city} - {h.distanceMeters}m from Haram)
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
                  onChange={(e) => setRoomType(e.target.value)}
                  className="w-full h-9 border rounded-md px-3 bg-background"
                >
                  <option value="DOUBLE">Double Sharing (2 Beds)</option>
                  <option value="TRIPLE">Triple Sharing (3 Beds)</option>
                  <option value="QUAD">Quad Sharing (4 Beds)</option>
                  <option value="QUINT">Quint Sharing (5 Beds)</option>
                  <option value="SHARING">General Sharing</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Number of Rooms *</label>
                <Input
                  type="number"
                  min={1}
                  required
                  value={numberOfRooms}
                  onChange={(e) => setNumberOfRooms(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Hotel Supplier / Wholesaler *</label>
                <select
                  required
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full h-9 border rounded-md px-3 bg-background"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-medium mb-1">Check-In Date *</label>
                <Input
                  type="date"
                  required
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Check-Out Date *</label>
                <Input
                  type="date"
                  required
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Auto-Calculated Nights</label>
                <div className="h-9 rounded-md border bg-muted/30 px-3 flex items-center font-bold text-sm text-foreground">
                  {totalNights} Night{totalNights > 1 ? "s" : ""}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Double Entry Ledger Posting */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">2. Hotel Cost & Selling Rates</CardTitle>
            <CardDescription className="text-xs">Contracted cost price vs guest selling price</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">Total Supplier Cost (PKR) *</label>
                <Input
                  type="number"
                  min={0}
                  required
                  value={costPrice}
                  onChange={(e) => setCostPrice(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Total Selling Price (PKR) *</label>
                <Input
                  type="number"
                  min={0}
                  required
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/40 border grid grid-cols-3 gap-3 text-center">
              <div>
                <span className="text-muted-foreground block text-[11px]">Duration</span>
                <span className="font-bold text-sm">{totalNights} Nights</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Total Rooms</span>
                <span className="font-bold text-sm">{numberOfRooms} Room(s)</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Agency Margin</span>
                <span className="font-bold text-sm text-emerald-600">+{formatPKR(calculatedProfit)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link href="/hotels/bookings">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading}
            className="bg-emerald-700 hover:bg-emerald-800 text-white min-w-36"
          >
            {loading ? "Confirming..." : "Confirm & Issue Voucher"}
          </Button>
        </div>
      </form>
    </div>
  );
}
