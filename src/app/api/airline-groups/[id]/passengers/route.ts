import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const addPassengerSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  passportId: z.string().optional().nullable(),
  ticketNumber: z.string().optional().nullable(),
  sellingPrice: z.number().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const group = await prisma.group.findUnique({
      where: { id: params.id, isDeleted: false },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const availableSeats = group.totalSeats - (group.seatsSold + group.seatsBlocked);
    if (availableSeats <= 0) {
      return NextResponse.json(
        { error: "No available seats remaining in this group allotment" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = addPassengerSchema.parse(body);

    const passenger = await prisma.groupPassenger.create({
      data: {
        groupId: group.id,
        customerId: parsed.customerId,
        passportId: parsed.passportId || null,
        ticketNumber: parsed.ticketNumber || null,
        seatCostPrice: group.seatCostPrice,
        seatSellingPrice: parsed.sellingPrice || group.seatSellingPrice,
        status: "CONFIRMED",
      },
    });

    // Update group seat counter
    await prisma.group.update({
      where: { id: group.id },
      data: {
        seatsSold: { increment: 1 },
      },
    });

    return NextResponse.json({ success: true, passenger });
  } catch (error) {
    console.error("Add passenger error:", error);
    return NextResponse.json({ error: "Failed to add passenger" }, { status: 500 });
  }
}
