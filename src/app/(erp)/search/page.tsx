import React, { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SearchClient } from "./SearchClient";

export const metadata = {
  title: "Global Search | Al-Haramain ERP",
  description: "Search across all pilgrims, passports, PNRs, tickets, and bookings",
};

export default async function SearchPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <Suspense fallback={<div className="py-10 text-center text-muted-foreground text-sm">Loading search…</div>}>
      <SearchClient />
    </Suspense>
  );
}
