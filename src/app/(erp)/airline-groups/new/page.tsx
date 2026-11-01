"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plane, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPKR } from "@/lib/utils";

interface Airline {
  id: string;
  name: string;
  code: string;
}

interface Route {
  id: string;
  origin: string;
  destination: string;
  flightNumber: string | null;
}

interface Supplier {
  id: string;
  name: string;
}

export default function NewAirlineGroupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Form states
  const [groupName, setGroupName] = useState("");
  const [airlineId, setAirlineId] = useState("");
  const [routeId, setRouteId] = useState("");
  const [pnr, setPnr] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [totalSeats, setTotalSeats] = useState(50);
  const [seatCostPrice, setSeatCostPrice] = useState(190000);
  const [seatSellingPrice, setSeatSellingPrice] = useState(220000);
  const [nameListDeadline, setNameListDeadline] = useState("");
  const [supplierId, setSupplierId] = useState("");

  useEffect(() => {
    // Initial fetch of master data
    async function fetchMasters() {
      try {
        const res = await fetch("/api/airline-groups");
        const data = await res.json();
        if (data.groups && data.groups.length > 0) {
          // Extract unique airlines, routes, and suppliers from groups or fallback
          const g = data.groups[0];
          setAirlines([{ id: g.airline.id, name: g.airline.name, code: g.airline.code }]);
          setRoutes([{ id: g.route.id, origin: g.route.origin, destination: g.route.destination, flightNumber: g.route.flightNumber }]);
          setSuppliers([{ id: g.supplier.id, name: g.supplier.name }]);

          setAirlineId(g.airline.id);
          setRouteId(g.route.id);
          setSupplierId(g.supplier.id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchMasters();
  }, []);

  const unitMargin = seatSellingPrice - seatCostPrice;
  const totalProjectedProfit = totalSeats * unitMargin;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        groupName,
        airlineId,
        routeId,
        pnr: pnr.toUpperCase().trim(),
        departureDate,
        returnDate,
        totalSeats: Number(totalSeats),
        seatCostPrice: Number(seatCostPrice),
        seatSellingPrice: Number(seatSellingPrice),
        nameListDeadline,
        supplierId,
      };

      const res = await fetch("/api/airline-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create group");

      router.push("/airline-groups");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Creation failed");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 border-b pb-4">
        <Link href="/airline-groups">
          <Button size="sm" variant="outline" className="gap-1 text-xs">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Groups
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Create Airline Group Allotment</h1>
          <p className="text-xs text-muted-foreground">
            Configure PNR, seats block, cost vs selling prices, and name-list submission deadlines.
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
            <CardTitle className="text-sm font-semibold">1. Airline Sector & Block Information</CardTitle>
            <CardDescription className="text-xs">Carrier, PNR, flight sectors, and booking dates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">Group Title / Name *</label>
                <Input
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Saudia Ramadan Economy Block 2026"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Group PNR Reference *</label>
                <Input
                  required
                  value={pnr}
                  onChange={(e) => setPnr(e.target.value)}
                  placeholder="e.g. SVRMD26G"
                  className="font-mono uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">Airline Carrier *</label>
                <select
                  value={airlineId}
                  onChange={(e) => setAirlineId(e.target.value)}
                  className="w-full text-xs h-9 border rounded-md px-3 bg-background"
                >
                  <option value="">Select Airline</option>
                  {airlines.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Route Sector *</label>
                <select
                  value={routeId}
                  onChange={(e) => setRouteId(e.target.value)}
                  className="w-full text-xs h-9 border rounded-md px-3 bg-background"
                >
                  <option value="">Select Route</option>
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.origin} - {r.destination} {r.flightNumber ? `(${r.flightNumber})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Ticket Supplier / Consolidator *</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full text-xs h-9 border rounded-md px-3 bg-background"
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
                <label className="block text-xs font-medium mb-1">Departure Date *</label>
                <Input
                  type="date"
                  required
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Return Date *</label>
                <Input
                  type="date"
                  required
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Name-list Submission Deadline *</label>
                <Input
                  type="date"
                  required
                  value={nameListDeadline}
                  onChange={(e) => setNameListDeadline(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Seat Inventory */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">2. Seats Allotment & Financial Margins</CardTitle>
            <CardDescription className="text-xs">Capacity allocation and unit cost/sell calculation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">Total Seats Allocated *</label>
                <Input
                  type="number"
                  min={1}
                  required
                  value={totalSeats}
                  onChange={(e) => setTotalSeats(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Supplier Cost Price per Seat (PKR) *</label>
                <Input
                  type="number"
                  min={0}
                  required
                  value={seatCostPrice}
                  onChange={(e) => setSeatCostPrice(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Selling Price per Seat (PKR) *</label>
                <Input
                  type="number"
                  min={0}
                  required
                  value={seatSellingPrice}
                  onChange={(e) => setSeatSellingPrice(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Live Projected Profit Calculation Widget */}
            <div className="p-3.5 rounded-xl bg-muted/40 border grid grid-cols-3 gap-3 text-center text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Unit Margin / Seat</span>
                <span className="font-bold text-sm text-emerald-600">
                  +{formatPKR(unitMargin)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Total Supplier Payable</span>
                <span className="font-bold text-sm text-foreground">
                  {formatPKR(totalSeats * seatCostPrice)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Projected Gross Profit</span>
                <span className="font-bold text-sm text-emerald-600">
                  {formatPKR(totalProjectedProfit)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link href="/airline-groups">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading}
            className="bg-emerald-700 hover:bg-emerald-800 text-white min-w-36"
          >
            {loading ? "Creating Group..." : "Create Group Allotment"}
          </Button>
        </div>
      </form>
    </div>
  );
}
