import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BranchesClient } from "./BranchesClient";

export const metadata = {
  title: "Branches & Staff Management | Al-Haramain ERP",
  description: "Multi-branch network management, staff onboarding, commission setup, and performance tracking",
};

export default async function BranchesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const [branches, usersRaw] = await Promise.all([
    prisma.branch.findMany({
      where: { isDeleted: false },
      include: {
        users: {
          where: { isDeleted: false },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            phone: true,
            commissionRate: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            customers: true,
            packageBookings: true,
            tickets: true,
            hotelBookings: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        branchId: true,
        commissionRate: true,
        isActive: true,
        createdAt: true,
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
            city: true,
          },
        },
        packageBookings: {
          where: { isDeleted: false },
          select: {
            id: true,
            totalAmount: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Enrich users with sales stats
  const users = usersRaw.map((u) => {
    const totalSalesVolume = u.packageBookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const earnedCommission = (totalSalesVolume * (u.commissionRate || 0)) / 100;
    return {
      ...u,
      totalBookingsCount: u.packageBookings.length,
      totalSalesVolume,
      earnedCommission,
      packageBookings: undefined, // strip from client payload
    };
  });

  return <BranchesClient initialBranches={branches} initialUsers={users as any} />;
}
