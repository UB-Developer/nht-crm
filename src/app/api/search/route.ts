import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";

    if (!q || q.length < 2) {
      return NextResponse.json({ results: { customers: [], tickets: [], bookings: [], groups: [] } });
    }

    const searchLower = q.toLowerCase();

    const [customers, tickets, bookings, groups] = await Promise.all([
      // Search customers by name, CNIC, phone, passport number
      prisma.customer.findMany({
        where: {
          isDeleted: false,
          OR: [
            { firstName: { contains: q } },
            { lastName: { contains: q } },
            { cnic: { contains: q } },
            { phone: { contains: q } },
            { whatsapp: { contains: q } },
            { passportNumber: { contains: q } },
          ],
        },
        include: {
          passports: {
            where: { isDeleted: false },
            select: { passportNumber: true, expiryDate: true },
            take: 1,
          },
          branch: { select: { name: true, city: true } },
        },
        take: 10,
      }),

      // Search tickets by PNR, ticket number, route
      prisma.ticket.findMany({
        where: {
          isDeleted: false,
          OR: [
            { pnr: { contains: q.toUpperCase() } },
            { ticketNumber: { contains: q } },
            { routeDetails: { contains: q } },
          ],
        },
        include: {
          customer: { select: { firstName: true, lastName: true, phone: true } },
          supplier: { select: { name: true } },
          branch: { select: { name: true } },
        },
        take: 8,
      }),

      // Search bookings by booking number
      prisma.packageBooking.findMany({
        where: {
          isDeleted: false,
          OR: [
            { bookingNumber: { contains: q.toUpperCase() } },
          ],
        },
        include: {
          customer: { select: { firstName: true, lastName: true, phone: true } },
          package: { select: { name: true } },
          branch: { select: { name: true } },
        },
        take: 8,
      }),

      // Search airline groups by group name or PNR
      prisma.group.findMany({
        where: {
          OR: [
            { groupName: { contains: q } },
            { pnr: { contains: q.toUpperCase() } },
          ],
        },
        include: {
          airline: { select: { name: true, code: true } },
          route: { select: { origin: true, destination: true } },
        },
        take: 6,
      }),
    ]);

    return NextResponse.json({
      results: {
        customers,
        tickets,
        bookings,
        groups,
      },
      query: q,
      total: customers.length + tickets.length + bookings.length + groups.length,
    });
  } catch (error) {
    console.error("GET search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
