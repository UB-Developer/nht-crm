"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PackageCheck, AlertTriangle, Calculator, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPKR } from "@/lib/utils";

interface HotelOption {
  id: string;
  name: string;
  city: string;
  distanceMeters: number;
}

interface AirlineOption {
  id: string;
  name: string;
  code: string;
}

interface GroupOption {
  id: string;
  groupName: string;
  pnr: string;
  seatCostPrice: number;
  seatSellingPrice: number;
}

export default function NewPackagePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [hotels, setHotels] = useState<HotelOption[]>([]);
  const [airlines, setAirlines] = useState<AirlineOption[]>([]);
  const [groups, setGroups] = useState<GroupOption[]>([]);

  // Form states
  const [name, setName] = useState("");
  const [packageType, setPackageType] = useState<"UMRAH" | "HAJJ" | "RAMADAN" | "CUSTOM">("UMRAH");
  const [durationDays, setDurationDays] = useState(15);
  const [makkahHotelId, setMakkahHotelId] = useState("");
  const [makkahNights, setMakkahNights] = useState(7);
  const [madinahHotelId, setMadinahHotelId] = useState("");
  const [madinahNights, setMadinahNights] = useState(7);
  const [mealPlan, setMealPlan] = useState("BED_AND_BREAKFAST");
  const [transportType, setTransportType] = useState("BUS_VIP");
  const [airlineId, setAirlineId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [description, setDescription] = useState("");

  // Cost sheet breakdown items
  const [flightCost, setFlightCost] = useState(195000);
  const [visaCost, setVisaCost] = useState(42000);
  const [transportCost, setTransportCost] = useState(15000);
  const [ziyaratCost, setZiyaratCost] = useState(5000);
  const [makkahNightCost, setMakkahNightCost] = useState(15000); // per person in quad
  const [madinahNightCost, setMadinahNightCost] = useState(12000); // per person in quad
  const [targetMarginPct, setTargetMarginPct] = useState(15); // 15% margin

  useEffect(() => {
    async function loadData() {
      try {
        const [hRes, gRes] = await Promise.all([
          fetch("/api/hotels"),
          fetch("/api/airline-groups"),
        ]);
        const hData = await hRes.json();
        const gData = await gRes.json();

        if (hData.hotels?.length > 0) {
          setHotels(hData.hotels);
          const m = hData.hotels.find((h: HotelOption) => h.city === "MAKKAH") || hData.hotels[0];
          const md = hData.hotels.find((h: HotelOption) => h.city === "MADINAH") || hData.hotels[0];
          setMakkahHotelId(m.id);
          setMadinahHotelId(md.id);
        }

        if (gData.groups?.length > 0) {
          setGroups(gData.groups);
          setGroupId(gData.groups[0].id);
          setFlightCost(gData.groups[0].seatCostPrice);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, []);

  // Cost sheet auto-calculations
  const totalHotelCostQuad = makkahNights * makkahNightCost + madinahNights * madinahNightCost;
  const baseCostPerPerson = flightCost + visaCost + transportCost + ziyaratCost;

  // Multipliers by room sharing (Double is higher per person, Quint is lowest)
  const costDouble = Math.round(baseCostPerPerson + totalHotelCostQuad * 1.6);
  const sellDouble = Math.round(costDouble * (1 + targetMarginPct / 100));

  const costTriple = Math.round(baseCostPerPerson + totalHotelCostQuad * 1.25);
  const sellTriple = Math.round(costTriple * (1 + targetMarginPct / 100));

  const costQuad = Math.round(baseCostPerPerson + totalHotelCostQuad);
  const sellQuad = Math.round(costQuad * (1 + targetMarginPct / 100));

  const costQuint = Math.round(baseCostPerPerson + totalHotelCostQuad * 0.85);
  const sellQuint = Math.round(costQuint * (1 + targetMarginPct / 100));

  const childPrice = Math.round(flightCost + visaCost + transportCost + 20000);
  const infantPrice = Math.round(flightCost * 0.3 + 20000);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        name,
        packageType,
        durationDays: Number(durationDays),
        makkahHotelId,
        makkahNights: Number(makkahNights),
        madinahHotelId,
        madinahNights: Number(madinahNights),
        mealPlan,
        transportIncluded: true,
        transportType,
        visaIncluded: true,
        zyaratIncluded: true,
        airlineId: airlineId || null,
        groupId: groupId || null,
        costDouble,
        sellDouble,
        costTriple,
        sellTriple,
        costQuad,
        sellQuad,
        costQuint,
        sellQuint,
        childPrice,
        infantPrice,
        description: description || `Complete ${durationDays}-Day ${packageType} Package with Haram front hotels and direct flights.`,
      };

      const res = await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create package");

      router.push("/packages");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Creation failed");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 border-b pb-4">
        <Link href="/packages">
          <Button size="sm" variant="outline" className="gap-1 text-xs">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Packages
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Create Umrah / Hajj Package</h1>
          <p className="text-xs text-muted-foreground">
            Dynamic cost sheet auto-calculation (Flight + Hotel + Visa + Transport + Margin = Selling Price).
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
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">1. Package Identity & Itinerary</CardTitle>
            <CardDescription className="text-xs">Package name, duration, and hotels selection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-medium mb-1">Package Name *</label>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 15-Day Royal VIP Umrah Package (5-Star Haram Front)"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Package Category *</label>
                <select
                  value={packageType}
                  onChange={(e) => setPackageType(e.target.value as any)}
                  className="w-full h-9 border rounded-md px-3 bg-background"
                >
                  <option value="UMRAH">Umrah Standard</option>
                  <option value="RAMADAN">Ramadan Special</option>
                  <option value="HAJJ">Hajj Package</option>
                  <option value="CUSTOM">Custom Group</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">Makkah Hotel *</label>
                <select
                  required
                  value={makkahHotelId}
                  onChange={(e) => setMakkahHotelId(e.target.value)}
                  className="w-full h-9 border rounded-md px-3 bg-background"
                >
                  {hotels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.city} - {h.distanceMeters}m)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Makkah Nights *</label>
                <Input
                  type="number"
                  min={1}
                  required
                  value={makkahNights}
                  onChange={(e) => setMakkahNights(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">Madinah Hotel *</label>
                <select
                  required
                  value={madinahHotelId}
                  onChange={(e) => setMadinahHotelId(e.target.value)}
                  className="w-full h-9 border rounded-md px-3 bg-background"
                >
                  {hotels.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.city} - {h.distanceMeters}m)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Madinah Nights *</label>
                <Input
                  type="number"
                  min={1}
                  required
                  value={madinahNights}
                  onChange={(e) => setMadinahNights(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-medium mb-1">Total Duration (Days) *</label>
                <Input
                  type="number"
                  min={1}
                  required
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Meal / Board Plan</label>
                <select
                  value={mealPlan}
                  onChange={(e) => setMealPlan(e.target.value)}
                  className="w-full h-9 border rounded-md px-3 bg-background"
                >
                  <option value="BED_AND_BREAKFAST">Bed & Breakfast</option>
                  <option value="ROOM_ONLY">Room Only</option>
                  <option value="HALF_BOARD">Half Board (Breakfast + Dinner)</option>
                  <option value="FULL_BOARD">Full Board (Buffet 3 Meals)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Transport Vehicle</label>
                <select
                  value={transportType}
                  onChange={(e) => setTransportType(e.target.value)}
                  className="w-full h-9 border rounded-md px-3 bg-background"
                >
                  <option value="BUS_VIP">Luxury VIP Bus (Air-Conditioned)</option>
                  <option value="PRIVATE_GMC">Private GMC Yukon / Suburban</option>
                  <option value="SHARING_COASTER">Sharing Coaster</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Cost Sheet & Margin Calculator */}
        <Card className="border-emerald-600/30">
          <CardHeader className="bg-emerald-50/30 dark:bg-emerald-950/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-900 dark:text-emerald-300">
                  <Calculator className="w-4 h-4 text-emerald-600" />
                  2. Cost Sheet Auto-Calculation Engine
                </CardTitle>
                <CardDescription className="text-xs">
                  Fine-tune cost components; the system auto-calculates Double, Triple, Quad & Quint selling rates
                </CardDescription>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-white dark:bg-slate-900 border px-3 py-1.5 rounded-lg shadow-xs">
                <span>Target Agency Margin:</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={targetMarginPct}
                  onChange={(e) => setTargetMarginPct(Number(e.target.value))}
                  className="w-12 font-bold text-center border-b focus:outline-none text-emerald-600"
                />
                <span>%</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-muted/30 border">
              <div>
                <label className="block font-medium mb-1">Airline Seat Cost (PKR)</label>
                <Input
                  type="number"
                  value={flightCost}
                  onChange={(e) => setFlightCost(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Umrah Visa Fee (PKR)</label>
                <Input
                  type="number"
                  value={visaCost}
                  onChange={(e) => setVisaCost(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Transport Cost (PKR)</label>
                <Input
                  type="number"
                  value={transportCost}
                  onChange={(e) => setTransportCost(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Ziyarat Fee (PKR)</label>
                <Input
                  type="number"
                  value={ziyaratCost}
                  onChange={(e) => setZiyaratCost(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Generated Rates Matrix */}
            <div>
              <div className="text-[11px] font-bold text-foreground mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Auto-Generated Pricing Table per Pilgrim (PKR)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                {/* Double */}
                <div className="p-3 rounded-xl border bg-card shadow-xs">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Double Sharing</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Cost: {formatPKR(costDouble)}</div>
                  <div className="text-sm font-bold text-emerald-600 mt-1">{formatPKR(sellDouble)}</div>
                  <div className="text-[10px] text-emerald-700 font-medium">Margin: +{formatPKR(sellDouble - costDouble)}</div>
                </div>

                {/* Triple */}
                <div className="p-3 rounded-xl border bg-card shadow-xs">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Triple Sharing</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Cost: {formatPKR(costTriple)}</div>
                  <div className="text-sm font-bold text-emerald-600 mt-1">{formatPKR(sellTriple)}</div>
                  <div className="text-[10px] text-emerald-700 font-medium">Margin: +{formatPKR(sellTriple - costTriple)}</div>
                </div>

                {/* Quad */}
                <div className="p-3 rounded-xl border-2 border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-xs">
                  <div className="text-xs font-bold text-emerald-900 dark:text-emerald-300">Quad (Most Popular)</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Cost: {formatPKR(costQuad)}</div>
                  <div className="text-base font-bold text-emerald-700 dark:text-emerald-400 mt-1">{formatPKR(sellQuad)}</div>
                  <div className="text-[10px] text-emerald-700 font-medium">Margin: +{formatPKR(sellQuad - costQuad)}</div>
                </div>

                {/* Quint */}
                <div className="p-3 rounded-xl border bg-card shadow-xs">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Quint Sharing</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Cost: {formatPKR(costQuint)}</div>
                  <div className="text-sm font-bold text-emerald-600 mt-1">{formatPKR(sellQuint)}</div>
                  <div className="text-[10px] text-emerald-700 font-medium">Margin: +{formatPKR(sellQuint - costQuint)}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link href="/packages">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading}
            className="bg-emerald-700 hover:bg-emerald-800 text-white min-w-36"
          >
            {loading ? "Publishing..." : "Publish Package"}
          </Button>
        </div>
      </form>
    </div>
  );
}
