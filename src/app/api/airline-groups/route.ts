import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const groupSchema = z.object({
  groupName: z.string().min(3, "Group name is required"),
  airlineId: z.string().min(1, "Airline is required"),
  routeId: z.string().min(1, "Route is required"),
  flightId: z.string().optional().nullable(),
  pnr: z.string().min(4, "PNR is required").toUpperCase(),
  departureDate: z.string().min(1, "Departure date is required"),
  returnDate: z.string().min(1, "Return date is required"),
  totalSeats: z.number().min(1, "Total seats must be greater than 0"),
  seatCostPrice: z.number().min(0, "Seat cost price required"),
  seatSellingPrice: z.number().min(0, "Seat selling price required"),
  nameListDeadline: z.string().min(1, "Name list deadline is required"),
  supplierId: z.string().min(1, "Supplier is required"),
  branchId: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const groups = await prisma.group.findMany({
      where: { isDeleted: false },
      include: {
        airline: true,
        route: true,
        supplier: true,
        branch: true,
        passengers: {
          where: { isDeleted: false },
          include: { customer: true, passport: true },
        },
      },
      orderBy: { departureDate: "asc" },
    });

    return NextResponse.json({ groups });
  } catch (error) {
    console.error("GET groups error:", error);
    return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = groupSchema.parse(body);

    const group = await prisma.group.create({
      data: {
        groupName: parsed.groupName,
        airlineId: parsed.airlineId,
        routeId: parsed.routeId,
        flightId: parsed.flightId || null,
        pnr: parsed.pnr,
        departureDate: new Date(parsed.departureDate),
        returnDate: new Date(parsed.returnDate),
        totalSeats: parsed.totalSeats,
        seatCostPrice: parsed.seatCostPrice,
        seatSellingPrice: parsed.seatSellingPrice,
        nameListDeadline: new Date(parsed.nameListDeadline),
        supplierId: parsed.supplierId,
        branchId: parsed.branchId || session.user.branchId || null,
        status: "OPEN",
      },
    });

    // Auto-create Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entity: "Group",
        entityId: group.id,
        branchId: group.branchId,
        details: `Created airline group ${group.groupName} (${group.totalSeats} seats) with PNR ${group.pnr}`,
      },
    });

    return NextResponse.json({ success: true, group });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("POST group error:", error);
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
  }
}
