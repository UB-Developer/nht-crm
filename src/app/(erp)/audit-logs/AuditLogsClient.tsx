"use client";

import React, { useState, useMemo } from "react";
import {
  FileSpreadsheet,
  Search,
  Filter,
  User,
  Calendar,
  Activity,
  Database,
  CheckCircle2,
  Edit2,
  Trash2,
  LogIn,
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";

interface AuditLogEntry {
  id: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  branchId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  branch?: {
    id: string;
    name: string;
    code: string;
    city: string;
  } | null;
}

interface UserRef {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface BranchRef {
  id: string;
  name: string;
  code: string;
  city: string;
}

interface AuditLogsClientProps {
  initialLogs: AuditLogEntry[];
  users: UserRef[];
  branches: BranchRef[];
}

const PAGE_SIZE = 25;

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200",
  UPDATE: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-200",
  LOGIN: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200",
  APPROVE: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200",
  REFUND: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200",
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  CREATE: <CheckCircle2 className="w-3.5 h-3.5" />,
  UPDATE: <Edit2 className="w-3.5 h-3.5" />,
  DELETE: <Trash2 className="w-3.5 h-3.5" />,
  LOGIN: <LogIn className="w-3.5 h-3.5" />,
  APPROVE: <ShieldCheck className="w-3.5 h-3.5" />,
  REFUND: <RotateCcw className="w-3.5 h-3.5" />,
};

export function AuditLogsClient({ initialLogs, users, branches }: AuditLogsClientProps) {
  const [search, setSearch] = useState("");
  const [selectedAction, setSelectedAction] = useState("ALL");
  const [selectedEntity, setSelectedEntity] = useState("ALL");
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // Unique entities for filter
  const uniqueEntities = useMemo(() => {
    const entities = new Set(initialLogs.map((l) => l.entity));
    return ["ALL", ...Array.from(entities).sort()];
  }, [initialLogs]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return initialLogs.filter((log) => {
      const matchSearch =
        !search ||
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.entity.toLowerCase().includes(search.toLowerCase()) ||
        (log.user?.name && log.user.name.toLowerCase().includes(search.toLowerCase())) ||
        (log.entityId && log.entityId.includes(search)) ||
        (log.details && log.details.toLowerCase().includes(search.toLowerCase()));

      const matchAction = selectedAction === "ALL" || log.action === selectedAction;
      const matchEntity = selectedEntity === "ALL" || log.entity === selectedEntity;
      const matchBranch = selectedBranch === "ALL" || log.branchId === selectedBranch;
      const matchUser = selectedUser === "ALL" || log.userId === selectedUser;

      return matchSearch && matchAction && matchEntity && matchBranch && matchUser;
    });
  }, [initialLogs, search, selectedAction, selectedEntity, selectedBranch, selectedUser]);

  const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleExportCSV = () => {
    const headers = ["Timestamp", "Action", "Entity", "Entity ID", "Actor", "Role", "Branch", "Details", "IP"];
    const rows = filteredLogs.map((log) => [
      new Date(log.createdAt).toLocaleString("en-PK"),
      log.action,
      log.entity,
      log.entityId || "",
      log.user?.name || "System",
      log.user?.role || "",
      log.branch?.name || "",
      log.details || "",
      log.ipAddress || "",
    ]);
    const csvContent = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_log_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTime = (dt: string) => {
    const d = new Date(dt);
    return d.toLocaleString("en-PK", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const parseDetails = (details?: string | null) => {
    if (!details) return null;
    try {
      return JSON.parse(details);
    } catch {
      return details;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
            Audit & Activity Logs
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Immutable trail of all system actions — every creation, update, approval, login, and refund
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV ({filteredLogs.length} records)
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {["CREATE", "UPDATE", "DELETE", "LOGIN", "APPROVE", "REFUND"].map((action) => {
          const count = initialLogs.filter((l) => l.action === action).length;
          return (
            <button
              key={action}
              onClick={() => {
                setSelectedAction(selectedAction === action ? "ALL" : action);
                setCurrentPage(1);
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedAction === action
                  ? "ring-2 ring-emerald-600 border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30"
                  : "bg-card hover:bg-muted"
              }`}
            >
              <div className="text-lg font-bold text-foreground">{count}</div>
              <div
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border mt-1 ${ACTION_COLORS[action] || "bg-slate-100 text-slate-700"}`}
              >
                {ACTION_ICONS[action]}
                {action}
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-card p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Filter className="w-4 h-4" />
          Filter & Search
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search actions, entities, actors..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-muted/50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <select
            value={selectedAction}
            onChange={(e) => { setSelectedAction(e.target.value); setCurrentPage(1); }}
            className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none"
          >
            <option value="ALL">All Actions</option>
            {["CREATE", "UPDATE", "DELETE", "LOGIN", "APPROVE", "REFUND"].map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          <select
            value={selectedEntity}
            onChange={(e) => { setSelectedEntity(e.target.value); setCurrentPage(1); }}
            className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none"
          >
            {uniqueEntities.map((e) => (
              <option key={e} value={e}>{e === "ALL" ? "All Entities" : e}</option>
            ))}
          </select>

          <select
            value={selectedBranch}
            onChange={(e) => { setSelectedBranch(e.target.value); setCurrentPage(1); }}
            className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none"
          >
            <option value="ALL">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <select
            value={selectedUser}
            onChange={(e) => { setSelectedUser(e.target.value); setCurrentPage(1); }}
            className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none"
          >
            <option value="ALL">All Users</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
        {(search || selectedAction !== "ALL" || selectedEntity !== "ALL" || selectedBranch !== "ALL" || selectedUser !== "ALL") && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            Showing <strong className="text-foreground">{filteredLogs.length}</strong> results with active filters.{" "}
            <button
              onClick={() => {
                setSearch(""); setSelectedAction("ALL"); setSelectedEntity("ALL");
                setSelectedBranch("ALL"); setSelectedUser("ALL"); setCurrentPage(1);
              }}
              className="text-red-600 hover:underline font-semibold"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/70 text-muted-foreground uppercase tracking-wider font-semibold border-b">
              <tr>
                <th className="px-4 py-3 w-36">Timestamp</th>
                <th className="px-4 py-3 w-24">Action</th>
                <th className="px-4 py-3">Entity / Record</th>
                <th className="px-4 py-3">Performed By</th>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    No audit records found matching your criteria.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  const details = parseDetails(log.details);
                  const isExpanded = expandedLog === log.id;

                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        className="hover:bg-muted/40 transition-colors cursor-pointer"
                        onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="w-3 h-3 shrink-0" />
                            <span className="font-mono text-[11px]">
                              {formatTime(log.createdAt)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              ACTION_COLORS[log.action] || "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {ACTION_ICONS[log.action]}
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Database className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <div>
                              <span className="font-semibold text-foreground">{log.entity}</span>
                              {log.entityId && (
                                <span className="text-[10px] text-muted-foreground ml-1.5 font-mono">
                                  #{log.entityId.slice(-8)}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3 text-muted-foreground shrink-0" />
                            <div>
                              <div className="font-medium text-foreground">
                                {log.user?.name || "System / Automated"}
                              </div>
                              {log.user?.role && (
                                <div className="text-[10px] text-muted-foreground">{log.user.role}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-foreground font-medium">
                            {log.branch?.name || "—"}
                          </div>
                          {log.branch?.city && (
                            <div className="text-[10px] text-muted-foreground">{log.branch.city}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          {details && typeof details === "object" ? (
                            <span className="text-muted-foreground text-[11px]">
                              {Object.entries(details)
                                .slice(0, 2)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(" · ")}
                              {Object.keys(details).length > 2 && (
                                <span className="text-emerald-600 ml-1">+more</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-[11px] line-clamp-1">
                              {details || "—"}
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded details row */}
                      {isExpanded && details && (
                        <tr>
                          <td colSpan={6} className="px-4 py-3 bg-muted/30 border-t border-dashed border-border/60">
                            <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                              <Activity className="w-3.5 h-3.5" /> Full Action Details
                            </div>
                            <pre className="text-[11px] text-foreground bg-muted/60 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all">
                              {typeof details === "object"
                                ? JSON.stringify(details, null, 2)
                                : details}
                            </pre>
                            {log.ipAddress && (
                              <div className="mt-2 text-[11px] text-muted-foreground">
                                IP Address: <span className="font-mono text-foreground">{log.ipAddress}</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t bg-muted/30 text-xs">
            <span className="text-muted-foreground">
              Page <strong className="text-foreground">{currentPage}</strong> of{" "}
              <strong className="text-foreground">{totalPages}</strong> ·{" "}
              <strong className="text-foreground">{filteredLogs.length}</strong> total records
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 rounded-lg text-xs font-semibold ${
                      currentPage === page
                        ? "bg-emerald-600 text-white"
                        : "border hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
