import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const booking = await prisma.packageBooking.findUnique({
      where: { id: params.id, isDeleted: false },
      include: {
        package: {
          include: { makkahHotel: true, madinahHotel: true, airline: true },
        },
        customer: { include: { passports: true } },
        branch: true,
        createdBy: true,
        pilgrims: {
          include: { customer: true, passport: true, visas: true, nusukRecords: true },
        },
        receipts: {
          include: { account: true },
          orderBy: { date: "desc" },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error("GET booking error:", error);
    return NextResponse.json({ error: "Failed to fetch booking" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bookingStatus, notes } = body;

    const allowedStatuses = [
      "DRAFT",
      "CONFIRMED",
      "VISA_PROCESSING",
      "TICKETED",
      "DEPARTED",
      "COMPLETED",
      "CANCELLED",
    ];

    if (bookingStatus && !allowedStatuses.includes(bookingStatus)) {
      return NextResponse.json({ error: "Invalid booking status" }, { status: 400 });
    }

    const existing = await prisma.packageBooking.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const updated = await prisma.packageBooking.update({
      where: { id: params.id },
      data: {
        ...(bookingStatus ? { bookingStatus } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entity: "PackageBooking",
        entityId: updated.id,
        branchId: updated.branchId,
        details: `Updated booking ${updated.bookingNumber} workflow status from ${existing.bookingStatus} to ${bookingStatus}`,
      },
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch (error) {
    console.error("PUT booking error:", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
