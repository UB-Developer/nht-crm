"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Users,
  Ticket,
  CalendarDays,
  Plane,
  Phone,
  MapPin,
  Loader2,
  AlertCircle,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

interface SearchResults {
  customers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    cnic?: string | null;
    phone: string;
    passportNumber?: string | null;
    branch?: { name: string; city: string } | null;
    passports: Array<{ passportNumber: string; expiryDate: string }>;
  }>;
  tickets: Array<{
    id: string;
    pnr: string;
    ticketNumber: string;
    routeDetails: string;
    departureDate: string;
    status: string;
    customer: { firstName: string; lastName: string; phone: string };
    supplier: { name: string };
    branch?: { name: string } | null;
  }>;
  bookings: Array<{
    id: string;
    bookingNumber: string;
    status: string;
    totalAmount: number;
    paidAmount: number;
    customer: { firstName: string; lastName: string; phone: string };
    package: { name: string };
    branch?: { name: string } | null;
  }>;
  groups: Array<{
    id: string;
    groupName: string;
    pnr: string;
    departureDate: string;
    totalSeats: number;
    seatsSold: number;
    airline: { name: string; code: string };
    route: { origin: string; destination: string };
  }>;
}

export function SearchClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");

  const performSearch = useCallback(async (q: string) => {
    if (!q || q.trim().length < 2) {
      setResults(null);
      setTotal(0);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setResults(data.results);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery, performSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    performSearch(query.trim());
  };

  const STATUS_COLORS: Record<string, string> = {
    ISSUED: "bg-emerald-100 text-emerald-700",
    CONFIRMED: "bg-blue-100 text-blue-700",
    DRAFT: "bg-slate-100 text-slate-600",
    CANCELLED: "bg-red-100 text-red-700",
    COMPLETED: "bg-purple-100 text-purple-700",
    REFUNDED: "bg-amber-100 text-amber-700",
    OPEN: "bg-cyan-100 text-cyan-700",
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Search Bar */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 mb-4">
          <Search className="w-6 h-6 text-emerald-600" />
          Global Search
        </h1>

        <form onSubmit={handleSubmit} className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by passenger name, passport number, PNR, CNIC, booking ID..."
            autoFocus
            className="w-full pl-12 pr-32 py-3 border-2 rounded-xl bg-background focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 focus:outline-none text-sm shadow-xs"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Search
          </button>
        </form>

        <p className="text-xs text-muted-foreground mt-2 flex gap-4">
          {["Passenger Name", "Passport Number", "CNIC", "PNR", "Ticket No.", "Booking ID (PKG-)"].map((hint) => (
            <button
              key={hint}
              onClick={() => {
                setQuery(hint.includes("PKG-") ? "PKG-" : hint.split(" ")[0]);
              }}
              className="hover:text-emerald-600 transition-colors"
            >
              {hint}
            </button>
          ))}
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
          <span className="ml-3 text-sm text-muted-foreground">Searching across all records…</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* No results */}
      {!loading && results && total === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <div className="text-lg font-semibold text-foreground">No results found</div>
          <p className="text-sm mt-1">
            No records match <strong>&quot;{initialQuery}&quot;</strong>. Try a different name, passport number, or PNR.
          </p>
        </div>
      )}

      {/* Results */}
      {!loading && results && total > 0 && (
        <div className="space-y-6">
          <div className="text-sm text-muted-foreground">
            Found <strong className="text-foreground">{total}</strong> results for{" "}
            <strong className="text-emerald-600">&quot;{initialQuery}&quot;</strong>
          </div>

          {/* Customers / Pilgrims */}
          {results.customers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                <Users className="w-4 h-4 text-blue-500" />
                Pilgrims & Customers ({results.customers.length})
              </div>
              <div className="space-y-2">
                {results.customers.map((c) => (
                  <Link
                    key={c.id}
                    href={`/customers/${c.id}`}
                    className="flex items-center justify-between p-4 rounded-xl border bg-card hover:border-emerald-500/50 hover:bg-muted/40 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm shrink-0">
                        {c.firstName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-foreground">
                          {c.firstName} {c.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>
                          {(c.passports[0]?.passportNumber || c.passportNumber) && (
                            <span>🛂 {c.passports[0]?.passportNumber || c.passportNumber}</span>
                          )}
                          {c.cnic && <span>🪪 {c.cnic}</span>}
                          {c.branch && (
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.branch.city}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-600 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Tickets */}
          {results.tickets.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                <Ticket className="w-4 h-4 text-cyan-500" />
                Single Tickets ({results.tickets.length})
              </div>
              <div className="space-y-2">
                {results.tickets.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tickets/${t.id}/eticket`}
                    className="flex items-center justify-between p-4 rounded-xl border bg-card hover:border-cyan-500/50 hover:bg-muted/40 transition-all group"
                  >
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold font-mono text-sm text-foreground">{t.pnr}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLORS[t.status] || "bg-muted text-muted-foreground"}`}>
                          {t.status}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex gap-3">
                        <span>🎫 {t.ticketNumber}</span>
                        <span>✈️ {t.routeDetails}</span>
                        <span>👤 {t.customer.firstName} {t.customer.lastName}</span>
                        <span>Via: {t.supplier.name}</span>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-cyan-600 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Package Bookings */}
          {results.bookings.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                <CalendarDays className="w-4 h-4 text-purple-500" />
                Package Bookings ({results.bookings.length})
              </div>
              <div className="space-y-2">
                {results.bookings.map((b) => {
                  const balance = b.totalAmount - b.paidAmount;
                  return (
                    <Link
                      key={b.id}
                      href={`/bookings/${b.id}`}
                      className="flex items-center justify-between p-4 rounded-xl border bg-card hover:border-purple-500/50 hover:bg-muted/40 transition-all group"
                    >
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold font-mono text-sm text-foreground">{b.bookingNumber}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLORS[b.status] || "bg-muted text-muted-foreground"}`}>
                            {b.status}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex gap-3">
                          <span>📦 {b.package.name}</span>
                          <span>👤 {b.customer.firstName} {b.customer.lastName}</span>
                          <span className={balance > 0 ? "text-red-600 font-semibold" : "text-emerald-600 font-semibold"}>
                            {balance > 0 ? `Balance: PKR ${balance.toLocaleString()}` : "Fully Paid ✓"}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-purple-600 transition-colors" />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Airline Groups */}
          {results.groups.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                <Plane className="w-4 h-4 text-emerald-500" />
                Airline Groups ({results.groups.length})
              </div>
              <div className="space-y-2">
                {results.groups.map((g) => {
                  const available = g.totalSeats - g.seatsSold;
                  return (
                    <Link
                      key={g.id}
                      href={`/airline-groups/${g.id}`}
                      className="flex items-center justify-between p-4 rounded-xl border bg-card hover:border-emerald-500/50 hover:bg-muted/40 transition-all group"
                    >
                      <div>
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-sm text-foreground">{g.groupName}</span>
                          <span className="font-mono text-xs text-muted-foreground">PNR: {g.pnr}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex gap-3">
                          <span>✈️ {g.airline.code} | {g.route.origin} → {g.route.destination}</span>
                          <span>{new Date(g.departureDate).toLocaleDateString("en-PK")}</span>
                          <span className={available > 5 ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold"}>
                            {available} seats available
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-600 transition-colors" />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state — no search yet */}
      {!loading && !results && !error && (
        <div className="text-center py-16">
          <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
          <div className="text-foreground font-semibold text-lg">Search across all records</div>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
            Enter a passenger name, passport number, PNR, CNIC, or booking ID (PKG-2026-0001) to find any record instantly.
          </p>
          <div className="flex justify-center gap-2 mt-4 flex-wrap">
            {["Muhammad Iqbal", "CL5544332", "SV-2026", "PKG-2026-0001"].map((ex) => (
              <button
                key={ex}
                onClick={() => {
                  setQuery(ex);
                  performSearch(ex);
                  router.push(`/search?q=${encodeURIComponent(ex)}`);
                }}
                className="px-3 py-1 rounded-lg border text-xs font-mono hover:bg-muted transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
