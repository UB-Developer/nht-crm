import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const hotelSchema = z.object({
  name: z.string().min(3, "Hotel name is required"),
  city: z.enum(["MAKKAH", "MADINAH"]),
  stars: z.number().min(1).max(5).default(4),
  distanceMeters: z.number().min(0, "Distance in meters is required"),
  address: z.string().min(5, "Address is required"),
  contactPhone: z.string().optional(),
  facilities: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city");

    const hotels = await prisma.hotel.findMany({
      where: {
        isDeleted: false,
        ...(city && city !== "ALL" ? { city } : {}),
      },
      include: {
        rooms: { where: { isDeleted: false } },
        _count: { select: { hotelBookings: true } },
      },
      orderBy: { distanceMeters: "asc" },
    });

    return NextResponse.json({ hotels });
  } catch (error) {
    console.error("GET hotels error:", error);
    return NextResponse.json({ error: "Failed to fetch hotels" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = hotelSchema.parse(body);

    const hotel = await prisma.hotel.create({
      data: {
        name: parsed.name,
        city: parsed.city,
        stars: parsed.stars,
        distanceMeters: parsed.distanceMeters,
        address: parsed.address,
        contactPhone: parsed.contactPhone,
        facilities: parsed.facilities,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entity: "Hotel",
        entityId: hotel.id,
        branchId: session.user.branchId || null,
        details: `Added hotel property ${hotel.name} in ${hotel.city} (${hotel.distanceMeters}m from Haram)`,
      },
    });

    return NextResponse.json({ success: true, hotel });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("POST hotel error:", error);
    return NextResponse.json({ error: "Failed to add hotel" }, { status: 500 });
  }
}
