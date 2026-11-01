import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SuppliersClient } from "./SuppliersClient";

export const metadata = {
  title: "Suppliers & Vendors Master | Al-Haramain ERP",
  description: "Manage airline consolidators, hotels, visa agencies, and transport providers",
};

export default async function SuppliersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const suppliers = await prisma.supplier.findMany({
    where: { isDeleted: false },
    include: {
      _count: {
        select: {
          groups: true,
          tickets: true,
          hotelBookings: true,
          visas: true,
          payments: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return <SuppliersClient initialSuppliers={suppliers} />;
}
