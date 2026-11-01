"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Truck,
  Plane,
  Building2,
  FileCheck2,
  Car,
  Plus,
  Search,
  Phone,
  Mail,
  ArrowUpRight,
  Receipt,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SupplierItem {
  id: string;
  name: string;
  type: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  balance: number;
  _count: {
    groups: number;
    tickets: number;
    hotelBookings: number;
    visas: number;
    payments: number;
  };
}

interface SuppliersClientProps {
  initialSuppliers: SupplierItem[];
}

export function SuppliersClient({ initialSuppliers }: SuppliersClientProps) {
  const [suppliers, setSuppliers] = useState<SupplierItem[]>(initialSuppliers);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    type: "HOTEL",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    balance: "0",
  });

  const filteredSuppliers = suppliers.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(search.toLowerCase())) ||
      (s.phone && s.phone.includes(search));
    const matchesType = selectedType === "ALL" || s.type === selectedType;
    return matchesSearch && matchesType;
  });

  // Calculate totals
  const totalPayable = suppliers.reduce((acc, s) => (s.balance < 0 ? acc + Math.abs(s.balance) : acc), 0);
  const airlinePayable = suppliers.filter((s) => s.type === "AIRLINE").reduce((acc, s) => (s.balance < 0 ? acc + Math.abs(s.balance) : acc), 0);
  const hotelPayable = suppliers.filter((s) => s.type === "HOTEL").reduce((acc, s) => (s.balance < 0 ? acc + Math.abs(s.balance) : acc), 0);
  const visaPayable = suppliers.filter((s) => s.type === "VISA").reduce((acc, s) => (s.balance < 0 ? acc + Math.abs(s.balance) : acc), 0);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    try {
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          contactPerson: formData.contactPerson || null,
          phone: formData.phone || null,
          email: formData.email || undefined,
          address: formData.address || null,
          balance: parseFloat(formData.balance) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create supplier");
      }

      setSuppliers([
        ...suppliers,
        {
          ...data.supplier,
          _count: { groups: 0, tickets: 0, hotelBookings: 0, visas: 0, payments: 0 },
        },
      ]);
      setIsModalOpen(false);
      setFormData({
        name: "",
        type: "HOTEL",
        contactPerson: "",
        phone: "",
        email: "",
        address: "",
        balance: "0",
      });
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "AIRLINE":
        return <Plane className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
      case "HOTEL":
        return <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case "VISA":
        return <FileCheck2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case "TRANSPORT":
        return <Car className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      default:
        return <Truck className="w-4 h-4 text-slate-600 dark:text-slate-400" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "AIRLINE":
        return "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300";
      case "HOTEL":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300";
      case "VISA":
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300";
      case "TRANSPORT":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Truck className="w-6 h-6 text-emerald-600" />
            Suppliers & Vendor Master
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage airlines, hotel groups, visa agencies, and transport providers with automated payable tracking
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add New Supplier
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-xs">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Net Payables
          </div>
          <div className="text-xl font-bold mt-1 text-red-600 dark:text-red-400">
            PKR {totalPayable.toLocaleString()}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">Across all registered partners</div>
        </div>

        <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-xs">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Plane className="w-3.5 h-3.5 text-cyan-600" /> Airline Payables
          </div>
          <div className="text-xl font-bold mt-1 text-foreground">
            PKR {airlinePayable.toLocaleString()}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">Saudia, PIA, Flynas, etc.</div>
        </div>

        <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-xs">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-emerald-600" /> Hotel Payables
          </div>
          <div className="text-xl font-bold mt-1 text-foreground">
            PKR {hotelPayable.toLocaleString()}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">Makkah & Madinah properties</div>
        </div>

        <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-xs">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <FileCheck2 className="w-3.5 h-3.5 text-purple-600" /> Visa Agencies
          </div>
          <div className="text-xl font-bold mt-1 text-foreground">
            PKR {visaPayable.toLocaleString()}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">Embassy & e-visa providers</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-3 rounded-xl border shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search supplier, contact, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-muted/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
          {["ALL", "AIRLINE", "HOTEL", "VISA", "TRANSPORT", "GENERAL"].map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-3 py-1 text-xs font-medium rounded-lg border transition-all ${
                selectedType === t
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground border-border"
              }`}
            >
              {t === "ALL" ? "All Suppliers" : t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/70 text-muted-foreground uppercase tracking-wider font-semibold border-b">
              <tr>
                <th className="px-4 py-3">Supplier / Vendor</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Contact Person & Phone</th>
                <th className="px-4 py-3">Linked Assets</th>
                <th className="px-4 py-3 text-right">Ledger Balance</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No suppliers found matching your query.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((supplier) => {
                  const isPayable = supplier.balance < 0;
                  const absBal = Math.abs(supplier.balance);

                  return (
                    <tr key={supplier.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground text-sm flex items-center gap-2">
                          {supplier.name}
                        </div>
                        {supplier.address && (
                          <div className="text-[11px] text-muted-foreground truncate max-w-xs mt-0.5">
                            📍 {supplier.address}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${getTypeBadge(
                            supplier.type
                          )}`}
                        >
                          {getTypeIcon(supplier.type)}
                          {supplier.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-foreground font-medium">
                          {supplier.contactPerson || "Primary Contact"}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-3 mt-0.5">
                          {supplier.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {supplier.phone}
                            </span>
                          )}
                          {supplier.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {supplier.email}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          {supplier.type === "AIRLINE" && (
                            <span>
                              {supplier._count.groups} Groups · {supplier._count.tickets} Tickets
                            </span>
                          )}
                          {supplier.type === "HOTEL" && (
                            <span>{supplier._count.hotelBookings} Room Bookings</span>
                          )}
                          {supplier.type === "VISA" && <span>{supplier._count.visas} Visa Apps</span>)}
                          {supplier.type === "TRANSPORT" && <span>Fleet / Logistics</span>}
                          {supplier.type === "GENERAL" && <span>General Vendor</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div
                          className={`font-bold font-mono text-sm ${
                            isPayable ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {isPayable ? `(PKR ${absBal.toLocaleString()})` : `PKR ${absBal.toLocaleString()}`}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {isPayable ? "Payable (Credit)" : "Advance Paid (Debit)"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <Link
                          href={`/ledgers?tab=supplier&supplierId=${supplier.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border bg-muted/60 hover:bg-muted text-foreground text-xs font-semibold transition-colors"
                        >
                          <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                          View Ledger
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card text-card-foreground border rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-muted text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Truck className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold">Register New Supplier / Partner</h2>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSupplier} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Company / Supplier Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Movenpick Hotels Makkah, Saudi Airlines"
                  className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Category / Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="HOTEL">Hotel Property / Operator</option>
                    <option value="AIRLINE">Airline / Flight Consolidator</option>
                    <option value="VISA">Visa Agency / Umrah Operator</option>
                    <option value="TRANSPORT">Transport & Coach Services</option>
                    <option value="GENERAL">General Services</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="e.g. Tariq Al-Hazmi"
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Phone / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+966 12 555 4321"
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Official Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="reservations@hotel.com"
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Address / Location</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Ibrahim Al-Khalil Road, Makkah"
                  className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Opening Balance (PKR)</label>
                <input
                  type="number"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                  placeholder="Negative for payable, positive for advance"
                  className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none font-mono"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Enter negative value if we owe money (Payable), e.g. -500000
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  {submitting ? "Saving..." : "Save Supplier"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
