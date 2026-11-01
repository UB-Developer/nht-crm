"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPKR } from "@/lib/utils";

interface AccountOption {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface JVLine {
  accountId: string;
  description: string;
  debit: number;
  credit: number;
}

export default function NewJournalEntryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [lines, setLines] = useState<JVLine[]>([
    { accountId: "", description: "", debit: 100000, credit: 0 },
    { accountId: "", description: "", debit: 0, credit: 100000 },
  ]);

  useEffect(() => {
    async function loadAccounts() {
      try {
        const res = await fetch("/api/accounts");
        const data = await res.json();
        if (data.accounts?.length > 0) {
          setAccounts(data.accounts);
          setLines([
            { accountId: data.accounts[0].id, description: "", debit: 100000, credit: 0 },
            { accountId: data.accounts[1]?.id || data.accounts[0].id, description: "", debit: 0, credit: 100000 },
          ]);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadAccounts();
  }, []);

  const totalDebit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference < 0.01 && totalDebit > 0;

  const addLine = () => {
    setLines([
      ...lines,
      {
        accountId: accounts[0]?.id || "",
        description: "",
        debit: 0,
        credit: 0,
      },
    ]);
  };

  const removeLine = (idx: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== idx));
  };

  const updateLine = (idx: number, field: keyof JVLine, val: any) => {
    const updated = [...lines];
    (updated[idx] as any)[field] = val;
    setLines(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      setError("Cannot post unbalanced voucher. Total debits must equal total credits.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        description,
        date,
        referenceType: "MANUAL",
        entries: lines.map((l) => ({
          accountId: l.accountId,
          description: l.description || description,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
        })),
      };

      const res = await fetch("/api/accounts/journal-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post JV");

      router.push("/ledgers");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error posting JV");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 border-b pb-4">
        <Link href="/accounts">
          <Button size="sm" variant="outline" className="gap-1 text-xs">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Accounts
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Post Manual Journal Voucher (JV)</h1>
          <p className="text-xs text-muted-foreground">
            Strict double-entry accounting engine with debit/credit balance validation.
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
            <CardTitle className="text-sm font-semibold">1. Voucher Narration & Date</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-medium mb-1">Narration / Description *</label>
                <Input
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Bank charges or manual adjustment entry"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Voucher Date *</label>
                <Input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Double Entry Lines */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold">2. Double-Entry Accounting Lines</CardTitle>
              <CardDescription className="text-xs">
                Select accounts to debit and credit. Entries must strictly balance.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLine}
              className="text-xs gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Line
            </Button>
          </CardHeader>

          <CardContent className="space-y-3">
            {lines.map((line, idx) => (
              <div key={idx} className="p-3 rounded-xl border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-muted-foreground font-semibold uppercase mb-1">
                      Account #{idx + 1}
                    </label>
                    <select
                      value={line.accountId}
                      onChange={(e) => updateLine(idx, "accountId", e.target.value)}
                      className="w-full h-8 border rounded-md px-2 bg-background text-xs"
                      required
                    >
                      <option value="">Select Account</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.code} - {a.name} ({a.type})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-muted-foreground font-semibold uppercase mb-1">
                      Debit (Dr) PKR
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={line.debit}
                      onChange={(e) => updateLine(idx, "debit", Number(e.target.value))}
                      className="h-8 font-mono text-emerald-600 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-muted-foreground font-semibold uppercase mb-1">
                      Credit (Cr) PKR
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={line.credit}
                      onChange={(e) => updateLine(idx, "credit", Number(e.target.value))}
                      className="h-8 font-mono text-blue-600 font-semibold"
                    />
                  </div>
                </div>

                {lines.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeLine(idx)}
                    className="p-1.5 text-red-500 hover:text-red-700 self-end sm:self-center"
                    title="Remove line"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            {/* Total & Balancing Checker Strip */}
            <div className="p-4 rounded-xl border bg-muted/40 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs">
              <div>
                <span className="text-muted-foreground block text-[11px]">Total Debits</span>
                <span className="font-bold text-base text-emerald-600 font-mono">
                  {formatPKR(totalDebit)}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[11px]">Total Credits</span>
                <span className="font-bold text-base text-blue-600 font-mono">
                  {formatPKR(totalCredit)}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[11px]">Balance Status</span>
                {isBalanced ? (
                  <span className="font-bold text-xs text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-1 mt-1">
                    <CheckCircle2 className="w-4 h-4" /> Perfectly Balanced
                  </span>
                ) : (
                  <span className="font-bold text-xs text-red-600 flex items-center justify-center gap-1 mt-1">
                    <AlertTriangle className="w-4 h-4" /> Difference: {formatPKR(difference)}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link href="/accounts">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={loading || !isBalanced}
            className="bg-emerald-700 hover:bg-emerald-800 text-white min-w-36"
          >
            {loading ? "Posting..." : "Post Journal Voucher"}
          </Button>
        </div>
      </form>
    </div>
  );
}
