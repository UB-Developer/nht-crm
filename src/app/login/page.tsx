"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  MoonStar,
  Lock,
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
  Building,
  Shield,
  Plane,
  Hotel,
  Receipt,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const demoAccounts = [
    {
      role: "Super Admin",
      email: "superadmin@alharamain.pk",
      pass: "Admin@123",
      icon: Shield,
      color: "border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300",
    },
    {
      role: "Admin",
      email: "admin@alharamain.pk",
      pass: "Admin@123",
      icon: Shield,
      color: "border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300",
    },
    {
      role: "BM Karachi",
      email: "karachi.manager@alharamain.pk",
      pass: "Manager@123",
      icon: Building,
      color: "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300",
    },
    {
      role: "BM Lahore",
      email: "lahore.manager@alharamain.pk",
      pass: "Manager@123",
      icon: Building,
      color: "border-teal-200 text-teal-700 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-300",
    },
    {
      role: "Chief Accountant",
      email: "accounts@alharamain.pk",
      pass: "Accounts@123",
      icon: Receipt,
      color: "border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300",
    },
    {
      role: "Ticket Manager",
      email: "tickets@alharamain.pk",
      pass: "Tickets@123",
      icon: Plane,
      color: "border-cyan-200 text-cyan-700 bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/40 dark:text-cyan-300",
    },
    {
      role: "Hotel Manager",
      email: "hotels@alharamain.pk",
      pass: "Hotels@123",
      icon: Hotel,
      color: "border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300",
    },
    {
      role: "Sales Agent (Staff)",
      email: "agent.khi@alharamain.pk",
      pass: "Agent@123",
      icon: UserCheck,
      color: "border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300",
    },
  ];

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else {
        // Fetch session or redirect to home which delegates to role dashboard
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-slate-100">
      <div className="w-full max-w-4xl grid md:grid-cols-12 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900/90 backdrop-blur-md">
        {/* Left Form Section */}
        <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-900/50">
                <MoonStar className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">
                  AL-HARAMAIN TRAVEL & ERP
                </h1>
                <p className="text-xs text-emerald-400 font-medium">
                  Hajj, Umrah & Aviation Management System
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-200">
                Sign in to your Portal
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your credentials or click any demo role below to quick-fill
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@alharamain.pk"
                    className="pl-9 bg-slate-950/80 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9 pr-10 bg-slate-950/80 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-lg transition-all shadow-md shadow-emerald-950 text-sm mt-2"
              >
                {loading ? "Authenticating..." : "Sign In to ERP"}
              </Button>
            </form>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Enterprise Security • 256-bit JWT RBAC</span>
            <span>v2.5 Production</span>
          </div>
        </div>

        {/* Right Role-Picker Section */}
        <div className="md:col-span-5 p-6 sm:p-8 bg-slate-950/60 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                1-Click Demo Logins
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-4">
              Click any of the 8 provisioned role profiles to immediately populate the form:
            </p>

            <div className="space-y-2">
              {demoAccounts.map((acc) => {
                const Icon = acc.icon;
                const isSelected = email === acc.email;
                return (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleQuickLogin(acc.email, acc.pass)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-950/40 text-emerald-300 ring-1 ring-emerald-500"
                        : "border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="p-1 rounded bg-slate-800 text-slate-400">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <div className="font-semibold text-slate-200 truncate leading-tight">
                          {acc.role}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {acc.email}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono shrink-0 ml-2">
                      Auto-fill
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 text-[10px] text-slate-500 text-center">
            Default Password: <code className="text-slate-400">Role@123 / Admin@123</code>
          </div>
        </div>
      </div>
    </div>
  );
}
