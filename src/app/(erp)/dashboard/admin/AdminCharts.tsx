"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatPKR } from "@/lib/utils";

interface AdminChartsProps {
  totalSales: number;
  totalReceived: number;
  totalReceivable: number;
}

export function AdminCharts({ totalSales, totalReceived, totalReceivable }: AdminChartsProps) {
  // Monthly trajectory mock data with realistic Pakistani Travel numbers
  const monthlyData = [
    { month: "Jun", sales: 8500000, collections: 7800000 },
    { month: "Jul", sales: 9200000, collections: 8900000 },
    { month: "Aug", sales: 11400000, collections: 10200000 },
    { month: "Sep", sales: 14500000, collections: 13100000 },
    { month: "Oct", sales: 18200000, collections: 16400000 },
    { month: "Nov (Est)", sales: 22000000, collections: 19500000 },
  ];

  const packageDistribution = [
    { name: "15-Day Royal VIP", value: 45, color: "#059669" },
    { name: "21-Day Economy Shuttle", value: 30, color: "#0284c7" },
    { name: "Ramadan Last 10 Days", value: 15, color: "#d97706" },
    { name: "Direct Single Tickets", value: 10, color: "#7c3aed" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Monthly Bar Chart */}
      <div className="lg:col-span-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Monthly Sales vs Collections (PKR)</CardTitle>
            <CardDescription className="text-xs">
              Revenue recognized vs actual cash/bank collections across all branches
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    formatter={(val) => [formatPKR(Number(val)), ""]}
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      borderRadius: "8px",
                      border: "none",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="sales" name="Package & Ticket Sales" fill="#059669" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="collections" name="Cash Received" fill="#0284c7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Package Breakdown Donut Chart */}
      <div className="lg:col-span-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Package Portfolio Share</CardTitle>
            <CardDescription className="text-xs">
              Pilgrim distribution by package category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={packageDistribution}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {packageDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [`${val}%`, "Share"]}
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      borderRadius: "8px",
                      border: "none",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
