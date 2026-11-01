import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AuditLogsClient } from "./AuditLogsClient";

export const metadata = {
  title: "Audit & Activity Logs | Al-Haramain ERP",
  description: "Complete record of all system actions — who did what, when, from which branch",
};

export default async function AuditLogsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard/admin");
  }

  const [logs, users, branches] = await Promise.all([
    prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
            city: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200, // Initial page load
    }),
    prisma.user.findMany({
      where: { isDeleted: false },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    }),
    prisma.branch.findMany({
      where: { isDeleted: false },
      select: { id: true, name: true, code: true, city: true },
    }),
  ]);

  return (
    <AuditLogsClient initialLogs={logs} users={users} branches={branches} />
  );
}
