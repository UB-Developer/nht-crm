"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Building2,
  Receipt,
  Bell,
  Globe,
  Save,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  FileText,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const TABS = [
  { id: "company", label: "Company Profile", icon: Building2 },
  { id: "invoicing", label: "Invoice & Numbering", icon: Receipt },
  { id: "currency", label: "Currency & Tax", icon: DollarSign },
  { id: "notifications", label: "Alerts & Notifications", icon: Bell },
  { id: "terms", label: "Terms & Conditions", icon: FileText },
];

interface SettingsData {
  companyName: string;
  companyNameUrdu: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  address: string;
  city: string;
  country: string;
  logoUrl: string;
  registrationNumber: string;
  ntn: string;
  currency: string;
  currencySAR: string;
  currencyUSD: string;
  exchangeRateSAR: number;
  exchangeRateUSD: number;
  invoicePrefix: string;
  voucherPrefix: string;
  receiptPrefix: string;
  paymentPrefix: string;
  taxRate: number;
  taxLabel: string;
  termsAndConditions: string;
  footerNote: string;
  dateFormat: string;
  timezone: string;
  notificationsEmail: boolean;
  notificationsWhatsApp: boolean;
  passportExpiryAlertMonths: number;
  paymentDueReminderDays: number;
}

export function SettingsClient() {
  const [activeTab, setActiveTab] = useState("company");
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        setSettings(data.settings);
      } catch {
        setErrorMsg("Failed to load settings.");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSuccessMsg("✅ Settings saved successfully!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const update = (field: keyof SettingsData, value: string | number | boolean) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        <span className="ml-2 text-sm text-muted-foreground">Loading settings…</span>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-600" />
            System Settings
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Company profile, invoice configuration, currency exchange rates, and notification rules
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : "Save All Settings"}
        </Button>
      </div>

      {/* Status messages */}
      {successMsg && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Tab Layout */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="md:w-52 shrink-0">
          <nav className="space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all text-left ${
                    activeTab === tab.id
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Settings Panel */}
        <div className="flex-1 bg-card border rounded-2xl p-6 shadow-xs text-sm">
          {/* TAB: Company Profile */}
          {activeTab === "company" && (
            <div className="space-y-5">
              <h2 className="font-bold text-base text-foreground">Company Profile</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Company Name (English)</label>
                  <input
                    type="text"
                    value={settings.companyName}
                    onChange={(e) => update("companyName", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Company Name (Urdu)</label>
                  <input
                    type="text"
                    value={settings.companyNameUrdu}
                    onChange={(e) => update("companyNameUrdu", e.target.value)}
                    dir="rtl"
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none text-sm font-urdu"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Tagline / Slogan</label>
                <input
                  type="text"
                  value={settings.tagline}
                  onChange={(e) => update("tagline", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Office Phone</label>
                  <input
                    type="text"
                    value={settings.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">WhatsApp Number</label>
                  <input
                    type="text"
                    value={settings.whatsapp}
                    onChange={(e) => update("whatsapp", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Official Email</label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => update("email", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Website</label>
                  <input
                    type="text"
                    value={settings.website}
                    onChange={(e) => update("website", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">SECP Registration No.</label>
                  <input
                    type="text"
                    value={settings.registrationNumber}
                    onChange={(e) => update("registrationNumber", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">NTN (Tax Number)</label>
                  <input
                    type="text"
                    value={settings.ntn}
                    onChange={(e) => update("ntn", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">City</label>
                  <input
                    type="text"
                    value={settings.city}
                    onChange={(e) => update("city", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Full Office Address</label>
                <textarea
                  value={settings.address}
                  onChange={(e) => update("address", e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">PDF Footer Note</label>
                <input
                  type="text"
                  value={settings.footerNote}
                  onChange={(e) => update("footerNote", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none text-sm"
                />
              </div>
            </div>
          )}

          {/* TAB: Invoicing & Number Formats */}
          {activeTab === "invoicing" && (
            <div className="space-y-5">
              <h2 className="font-bold text-base text-foreground">Invoice & Document Numbering</h2>
              <p className="text-xs text-muted-foreground">
                Set prefixes for all document types. Numbers auto-increment per document. Example: <strong>INV-2026-0001</strong>
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Invoice & Receipts</h3>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Invoice Prefix</label>
                    <input
                      type="text"
                      value={settings.invoicePrefix}
                      onChange={(e) => update("invoicePrefix", e.target.value.toUpperCase())}
                      maxLength={6}
                      className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none uppercase font-mono"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">Preview: {settings.invoicePrefix}-2026-0001</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Receipt Voucher Prefix</label>
                    <input
                      type="text"
                      value={settings.receiptPrefix}
                      onChange={(e) => update("receiptPrefix", e.target.value.toUpperCase())}
                      maxLength={4}
                      className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none uppercase font-mono"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">Preview: {settings.receiptPrefix}-2026-0001</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Vouchers & Payments</h3>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Hotel/Package Voucher Prefix</label>
                    <input
                      type="text"
                      value={settings.voucherPrefix}
                      onChange={(e) => update("voucherPrefix", e.target.value.toUpperCase())}
                      maxLength={4}
                      className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none uppercase font-mono"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">Preview: {settings.voucherPrefix}-2026-0001</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Payment Voucher Prefix</label>
                    <input
                      type="text"
                      value={settings.paymentPrefix}
                      onChange={(e) => update("paymentPrefix", e.target.value.toUpperCase())}
                      maxLength={4}
                      className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none uppercase font-mono"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">Preview: {settings.paymentPrefix}-2026-0001</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Date Display Format</label>
                  <select
                    value={settings.dateFormat}
                    onChange={(e) => update("dateFormat", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2026)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2026)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (2026-12-31)</option>
                    <option value="DD-MMM-YYYY">DD-MMM-YYYY (31-Dec-2026)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Timezone</label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => update("timezone", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="Asia/Karachi">Asia/Karachi (PKT, UTC+5)</option>
                    <option value="Asia/Riyadh">Asia/Riyadh (AST, UTC+3)</option>
                    <option value="UTC">UTC (Universal Time)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Currency & Tax */}
          {activeTab === "currency" && (
            <div className="space-y-5">
              <h2 className="font-bold text-base text-foreground">Currency & Tax Configuration</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border bg-blue-50/50 dark:bg-blue-950/20">
                  <label className="block text-xs font-bold mb-1.5 text-blue-700 dark:text-blue-300">Base Currency</label>
                  <input
                    type="text"
                    value={settings.currency}
                    onChange={(e) => update("currency", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none font-mono font-bold"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1.5">Primary ledger currency</p>
                </div>

                <div className="p-4 rounded-xl border bg-amber-50/50 dark:bg-amber-950/20">
                  <label className="block text-xs font-bold mb-1.5 text-amber-700 dark:text-amber-300">
                    SAR Exchange Rate
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={settings.exchangeRateSAR}
                      onChange={(e) => update("exchangeRateSAR", parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none font-mono"
                    />
                    <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">PKR/SAR</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">1 SAR = {settings.exchangeRateSAR} PKR</p>
                </div>

                <div className="p-4 rounded-xl border bg-emerald-50/50 dark:bg-emerald-950/20">
                  <label className="block text-xs font-bold mb-1.5 text-emerald-700 dark:text-emerald-300">
                    USD Exchange Rate
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={settings.exchangeRateUSD}
                      onChange={(e) => update("exchangeRateUSD", parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none font-mono"
                    />
                    <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">PKR/USD</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">1 USD = {settings.exchangeRateUSD} PKR</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={settings.taxRate}
                    onChange={(e) => update("taxRate", parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Set to 0 for exempt / zero-rated packages</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Tax Label (on Invoices)</label>
                  <input
                    type="text"
                    value={settings.taxLabel}
                    onChange={(e) => update("taxLabel", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: Notifications */}
          {activeTab === "notifications" && (
            <div className="space-y-5">
              <h2 className="font-bold text-base text-foreground">Alerts & Notification Settings</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
                  <div>
                    <div className="font-semibold text-sm text-foreground">Email Notifications</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Send alerts to registered email addresses for payments, visa, passport expiry
                    </div>
                  </div>
                  <button
                    onClick={() => update("notificationsEmail", !settings.notificationsEmail)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.notificationsEmail ? "bg-emerald-600" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        settings.notificationsEmail ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
                  <div>
                    <div className="font-semibold text-sm text-foreground">WhatsApp Notifications</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Generate pre-formatted WhatsApp message links for booking confirmations
                    </div>
                  </div>
                  <button
                    onClick={() => update("notificationsWhatsApp", !settings.notificationsWhatsApp)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.notificationsWhatsApp ? "bg-emerald-600" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        settings.notificationsWhatsApp ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Passport Expiry Alert (months before)</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={settings.passportExpiryAlertMonths}
                    onChange={(e) => update("passportExpiryAlertMonths", parseInt(e.target.value) || 6)}
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Alert when passport expires within {settings.passportExpiryAlertMonths} months
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Payment Due Reminder (days before)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={settings.paymentDueReminderDays}
                    onChange={(e) => update("paymentDueReminderDays", parseInt(e.target.value) || 7)}
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Send reminder {settings.paymentDueReminderDays} days before installment due
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Terms & Conditions */}
          {activeTab === "terms" && (
            <div className="space-y-5">
              <h2 className="font-bold text-base text-foreground">Terms & Conditions</h2>
              <p className="text-xs text-muted-foreground">
                These terms appear on all printed invoices, vouchers, and package documents.
              </p>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Terms & Conditions Text</label>
                <textarea
                  value={settings.termsAndConditions}
                  onChange={(e) => update("termsAndConditions", e.target.value)}
                  rows={12}
                  className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none text-sm font-mono resize-y"
                />
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  One term per line. Will be printed as a numbered list on documents.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5">Document Footer Message</label>
                <input
                  type="text"
                  value={settings.footerNote}
                  onChange={(e) => update("footerNote", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background focus:ring-2 focus:ring-emerald-600 focus:outline-none text-sm"
                />
              </div>

              {/* Live Preview */}
              <div className="p-4 rounded-xl border bg-muted/40 space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  📄 Invoice Preview
                </div>
                <div className="text-xs space-y-1 text-foreground">
                  {settings.termsAndConditions.split("\n").filter(Boolean).map((line, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="shrink-0 font-semibold text-muted-foreground">{i + 1}.</span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
                {settings.footerNote && (
                  <div className="pt-2 mt-2 border-t text-xs text-center text-emerald-700 dark:text-emerald-400 font-medium italic">
                    {settings.footerNote}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
