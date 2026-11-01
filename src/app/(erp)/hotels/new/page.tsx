"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NewHotelPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [city, setCity] = useState<"MAKKAH" | "MADINAH">("MAKKAH");
  const [stars, setStars] = useState(5);
  const [distanceMeters, setDistanceMeters] = useState(50);
  const [address, setAddress] = useState("");
  const [contactPhone, setContactPhone] = useState("+966 ");
  const [facilities, setFacilities] = useState("Buffet Breakfast, Haram View, WiFi, Shuttle Service");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/hotels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          city,
          stars: Number(stars),
          distanceMeters: Number(distanceMeters),
          address,
          contactPhone,
          facilities,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add hotel");

      router.push("/hotels");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error creating property");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 border-b pb-4">
        <Link href="/hotels">
          <Button size="sm" variant="outline" className="gap-1 text-xs">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Hotels
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Contract New Hotel Property</h1>
          <p className="text-xs text-muted-foreground">
            Register Makkah or Madinah hotel with distance from Haram and room facilities.
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
            <CardTitle className="text-sm font-semibold">Property Specifications</CardTitle>
            <CardDescription className="text-xs">Location, proximity to Holy Mosques, and classification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div>
              <label className="block font-medium mb-1">Hotel Name *</label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Swissotel Al Maqam Makkah"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-medium mb-1">City *</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value as "MAKKAH" | "MADINAH")}
                  className="w-full h-9 border rounded-md px-3 bg-background"
                >
                  <option value="MAKKAH">Makkah Al-Mukarramah</option>
                  <option value="MADINAH">Madinah Al-Munawwarah</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Star Rating *</label>
                <select
                  value={stars}
                  onChange={(e) => setStars(Number(e.target.value))}
                  className="w-full h-9 border rounded-md px-3 bg-background"
                >
                  <option value={5}>5-Star Luxury</option>
                  <option value={4}>4-Star Premium</option>
                  <option value={3}>3-Star Economy</option>
                  <option value={2}>2-Star Budget</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">
                  Distance to {city === "MAKKAH" ? "Haram" : "Masjid-e-Nabawi"} (Meters) *
                </label>
                <Input
                  type="number"
                  min={0}
                  required
                  value={distanceMeters}
                  onChange={(e) => setDistanceMeters(Number(e.target.value))}
                />
              </div>
            </div>

            <div>
              <label className="block font-medium mb-1">Full Street Address in KSA *</label>
              <Input
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Abraj Al Bait Complex, King Abdul Aziz Endowment, Makkah"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Contact Phone</label>
              <Input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+966 12 571 7333"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Key Facilities & Services</label>
              <Input
                value={facilities}
                onChange={(e) => setFacilities(e.target.value)}
                placeholder="Buffet Breakfast, 24/7 Haram Shuttle Bus, High-Speed WiFi, Direct Elevator"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link href="/hotels">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading}
            className="bg-emerald-700 hover:bg-emerald-800 text-white min-w-36"
          >
            {loading ? "Saving..." : "Save Hotel Property"}
          </Button>
        </div>
      </form>
    </div>
  );
}
