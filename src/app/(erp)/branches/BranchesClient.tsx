"use client";

import React, { useState } from "react";
import {
  Network,
  Store,
  Users,
  Plus,
  Percent,
  TrendingUp,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Shield,
  Edit2,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface BranchData {
  id: string;
  name: string;
  code: string;
  city: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  managerName?: string | null;
  isHeadOffice: boolean;
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    phone?: string | null;
    commissionRate: number;
    isActive: boolean;
  }>;
  _count: {
    customers: number;
    packageBookings: number;
    tickets: number;
    hotelBookings: number;
  };
}

interface UserData {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  branchId?: string | null;
  commissionRate: number;
  isActive: boolean;
  branch?: {
    id: string;
    name: string;
    code: string;
    city: string;
  } | null;
  totalBookingsCount: number;
  totalSalesVolume: number;
  earnedCommission: number;
}

interface BranchesClientProps {
  initialBranches: BranchData[];
  initialUsers: UserData[];
}

export function BranchesClient({ initialBranches, initialUsers }: BranchesClientProps) {
  const [branches, setBranches] = useState<BranchData[]>(initialBranches);
  const [users, setUsers] = useState<UserData[]>(initialUsers);
  const [activeTab, setActiveTab] = useState<"BRANCHES" | "STAFF" | "PERFORMANCE">("BRANCHES");

  // Modals
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingCommissionUser, setEditingCommissionUser] = useState<UserData | null>(null);

  // Form states
  const [branchForm, setBranchForm] = useState({
    name: "",
    code: "",
    city: "Karachi",
    address: "",
    phone: "",
    email: "",
    managerName: "",
    isHeadOffice: false,
  });

  const [staffForm, setStaffForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "STAFF",
    branchId: initialBranches[0]?.id || "",
    commissionRate: "3.5",
  });

  const [commissionRateInput, setCommissionRateInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(branchForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create branch");

      setBranches([
        ...branches,
        {
          ...data.branch,
          users: [],
          _count: { customers: 0, packageBookings: 0, tickets: 0, hotelBookings: 0 },
        },
      ]);
      setIsBranchModalOpen(false);
      setBranchForm({
        name: "",
        code: "",
        city: "Karachi",
        address: "",
        phone: "",
        email: "",
        managerName: "",
        isHeadOffice: false,
      });
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...staffForm,
          commissionRate: parseFloat(staffForm.commissionRate) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create staff");

      const createdUser: UserData = {
        ...data.user,
        branch: branches.find((b) => b.id === data.user.branchId) || null,
        totalBookingsCount: 0,
        totalSalesVolume: 0,
        earnedCommission: 0,
      };

      setUsers([createdUser, ...users]);
      setIsStaffModalOpen(false);
      setStaffForm({
        name: "",
        email: "",
        password: "",
        phone: "",
        role: "STAFF",
        branchId: branches[0]?.id || "",
        commissionRate: "3.5",
      });
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCommissionUser) return;
    setSubmitting(true);
    setErrorMsg("");

    try {
      const newRate = parseFloat(commissionRateInput) || 0;
      const res = await fetch("/api/users", {
        method: "POST", // using PATCH route handler or POST
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCommissionUser.id,
          commissionRate: newRate,
        }),
      });

      // Update local state
      setUsers(
        users.map((u) => {
          if (u.id === editingCommissionUser.id) {
            const earnedCommission = (u.totalSalesVolume * newRate) / 100;
            return { ...u, commissionRate: newRate, earnedCommission };
          }
          return u;
        })
      );
      setEditingCommissionUser(null);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleUserStatus = async (user: UserData) => {
    try {
      const newStatus = !user.isActive;
      await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          isActive: newStatus,
        }),
      });

      setUsers(users.map((u) => (u.id === user.id ? { ...u, isActive: newStatus } : u)));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Network className="w-6 h-6 text-emerald-600" />
            Branches & Staff Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Multi-branch data isolation, branch registers, sales targets, and staff commission configuration
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsBranchModalOpen(true)}
            variant="outline"
            className="text-xs font-semibold flex items-center gap-1.5"
          >
            <Store className="w-4 h-4 text-emerald-600" />
            Add Branch
          </Button>
          <Button
            onClick={() => setIsStaffModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add Staff Member
          </Button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab("BRANCHES")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === "BRANCHES"
              ? "bg-emerald-600 text-white"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Store className="w-4 h-4" />
          Branches Network ({branches.length})
        </button>
        <button
          onClick={() => setActiveTab("STAFF")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === "STAFF"
              ? "bg-emerald-600 text-white"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Users className="w-4 h-4" />
          Staff & Consultants Directory ({users.length})
        </button>
        <button
          onClick={() => setActiveTab("PERFORMANCE")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === "PERFORMANCE"
              ? "bg-emerald-600 text-white"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Targets & Commission Matrix
        </button>
      </div>

      {/* Tab 1: Branches Network */}
      {activeTab === "BRANCHES" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="p-5 rounded-2xl border bg-card text-card-foreground shadow-xs flex flex-col justify-between hover:border-emerald-500/50 transition-all"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                      {branch.code}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm leading-tight text-foreground">{branch.name}</h3>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-emerald-600" /> {branch.city}
                      </span>
                    </div>
                  </div>
                  {branch.isHeadOffice && (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-200">
                      Head Office
                    </span>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-border/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Branch Manager:</span>
                    <span className="font-semibold text-foreground">
                      {branch.managerName || "Designated Manager"}
                    </span>
                  </div>
                  {branch.phone && (
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Direct Phone:</span>
                      <span className="font-mono text-foreground">{branch.phone}</span>
                    </div>
                  )}
                  {branch.address && (
                    <div className="text-[11px] text-muted-foreground truncate">
                      📍 {branch.address}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border/80 text-center">
                  <div className="p-2 rounded-lg bg-muted/40">
                    <div className="text-base font-bold text-foreground">
                      {branch.users.length}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Staff</div>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/40">
                    <div className="text-base font-bold text-foreground">
                      {branch._count.packageBookings}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Packages</div>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/40">
                    <div className="text-base font-bold text-foreground">
                      {branch._count.tickets}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Tickets</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Data Isolation:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Enforced RBAC
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Staff & Consultants Directory */}
      {activeTab === "STAFF" && (
        <div className="rounded-xl border bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/70 text-muted-foreground uppercase tracking-wider font-semibold border-b">
                <tr>
                  <th className="px-4 py-3">Team Member</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Branch Location</th>
                  <th className="px-4 py-3 text-right">Commission Rate</th>
                  <th className="px-4 py-3 text-right">Sales Volume</th>
                  <th className="px-4 py-3 text-right">Commission Accrued</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground text-sm">{user.name}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                        <Mail className="w-3 h-3" /> {user.email}
                        {user.phone && (
                          <span className="flex items-center gap-1">
                            · <Phone className="w-3 h-3" /> {user.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-muted text-foreground">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {user.branch?.name || "Head Office / Corporate"}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {user.branch?.city || "National"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-foreground font-mono text-xs">
                        {user.commissionRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-bold font-mono text-foreground">
                        PKR {user.totalSalesVolume.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {user.totalBookingsCount} bookings
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        PKR {user.earnedCommission.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleUserStatus(user)}
                        title="Click to toggle status"
                        className="inline-flex items-center gap-1 cursor-pointer"
                      >
                        {user.isActive ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300">
                            Suspended
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingCommissionUser(user);
                          setCommissionRateInput(user.commissionRate.toString());
                        }}
                        className="text-xs h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit Rate
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Performance & Targets Matrix */}
      {activeTab === "PERFORMANCE" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {users
              .filter((u) => u.role === "STAFF" || u.role === "BRANCH_MANAGER")
              .map((staff) => {
                const target = 5000000; // PKR 5M default monthly quota
                const progressPct = Math.min(100, Math.round((staff.totalSalesVolume / target) * 100));

                return (
                  <div
                    key={staff.id}
                    className="p-5 rounded-xl border bg-card text-card-foreground shadow-xs space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{staff.name}</h4>
                        <div className="text-[11px] text-muted-foreground">
                          {staff.role} · {staff.branch?.name || "Corporate"}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          {staff.commissionRate}% Commission
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1 font-medium">
                        <span className="text-muted-foreground">Monthly Target Progress</span>
                        <span className="font-bold text-foreground font-mono">{progressPct}%</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
                        <span>Achieved: PKR {staff.totalSalesVolume.toLocaleString()}</span>
                        <span>Target: PKR {target.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Commission Payables:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        PKR {staff.earnedCommission.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Modal: Add Branch */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card text-card-foreground border rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsBranchModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-muted text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Store className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold">Register New Branch Office</h2>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateBranch} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Branch Name *</label>
                  <input
                    type="text"
                    required
                    value={branchForm.name}
                    onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                    placeholder="e.g. Rawalpindi Branch"
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Branch Code *</label>
                  <input
                    type="text"
                    required
                    value={branchForm.code}
                    onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. RWP"
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={branchForm.city}
                    onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                    placeholder="e.g. Rawalpindi, Peshawar"
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Branch Manager</label>
                  <input
                    type="text"
                    value={branchForm.managerName}
                    onChange={(e) => setBranchForm({ ...branchForm, managerName: e.target.value })}
                    placeholder="Manager Name"
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Official Phone</label>
                  <input
                    type="text"
                    value={branchForm.phone}
                    onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                    placeholder="+92 51 555 1234"
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Official Email</label>
                  <input
                    type="email"
                    value={branchForm.email}
                    onChange={(e) => setBranchForm({ ...branchForm, email: e.target.value })}
                    placeholder="rwp@alharamain.pk"
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Physical Address</label>
                <input
                  type="text"
                  value={branchForm.address}
                  onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                  placeholder="Office # 4, Mall Road, Saddar"
                  className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsBranchModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  {submitting ? "Saving..." : "Save Branch"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Staff Member */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card text-card-foreground border rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsStaffModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-muted text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold">Onboard Staff Member</h2>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  placeholder="e.g. Asad Qureshi"
                  className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Email (Login ID) *</label>
                  <input
                    type="email"
                    required
                    value={staffForm.email}
                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                    placeholder="asad@alharamain.pk"
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Temporary Password *</label>
                  <input
                    type="password"
                    required
                    value={staffForm.password}
                    onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Role *</label>
                  <select
                    value={staffForm.role}
                    onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="STAFF">Staff (Sales Agent)</option>
                    <option value="BRANCH_MANAGER">Branch Manager</option>
                    <option value="ACCOUNTANT">Accountant</option>
                    <option value="TICKET_MANAGER">Ticket Manager</option>
                    <option value="HOTEL_MANAGER">Hotel Manager</option>
                    <option value="ADMIN">Operations Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Assign Branch *</label>
                  <select
                    value={staffForm.branchId}
                    onChange={(e) => setStaffForm({ ...staffForm, branchId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.city})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Mobile / WhatsApp</label>
                  <input
                    type="text"
                    value={staffForm.phone}
                    onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                    placeholder="+92 300 0000000"
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Commission Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={staffForm.commissionRate}
                    onChange={(e) => setStaffForm({ ...staffForm, commissionRate: e.target.value })}
                    placeholder="3.5"
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsStaffModalOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  {submitting ? "Creating..." : "Create Account"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Commission Rate */}
      {editingCommissionUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card text-card-foreground border rounded-2xl max-w-sm w-full p-5 shadow-2xl relative">
            <button
              onClick={() => setEditingCommissionUser(null)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-muted text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-base mb-1">Update Commission Rate</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Agent: <strong className="text-foreground">{editingCommissionUser.name}</strong>
            </p>

            <form onSubmit={handleUpdateCommission} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Commission Percentage (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="50"
                  value={commissionRateInput}
                  onChange={(e) => setCommissionRateInput(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background text-sm font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingCommissionUser(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  Save Rate
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
