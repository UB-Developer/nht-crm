import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NotificationsClient } from "./NotificationsClient";

export const metadata = {
  title: "Notifications | Al-Haramain ERP",
  description: "All system alerts — passport expiry, payment due, visa status, group deadlines",
};

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return <NotificationsClient initialNotifications={notifications} initialUnread={unreadCount} />;
}
