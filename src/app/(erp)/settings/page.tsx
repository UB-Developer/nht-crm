import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SettingsClient } from "./SettingsClient";

export const metadata = {
  title: "System Settings | Al-Haramain ERP",
  description: "Configure company profile, invoice formats, currency rates, notifications, and terms",
};

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    redirect("/dashboard/admin");
  }

  return <SettingsClient />;
}
