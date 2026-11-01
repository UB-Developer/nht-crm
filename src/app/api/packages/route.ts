import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const packageSchema = z.object({
  name: z.string().min(3, "Package name is required"),
  packageType: z.enum(["HAJJ", "UMRAH", "RAMADAN", "CUSTOM"]).default("UMRAH"),
  durationDays: z.number().min(1),
  makkahHotelId: z.string().min(1, "Makkah hotel is required"),
  makkahNights: z.number().min(1),
  madinahHotelId: z.string().min(1, "Madinah hotel is required"),
  madinahNights: z.number().min(1),
  mealPlan: z.string().default("BED_AND_BREAKFAST"),
  transportIncluded: z.boolean().default(true),
  transportType: z.string().default("BUS_VIP"),
  visaIncluded: z.boolean().default(true),
  zyaratIncluded: z.boolean().default(true),
  airlineId: z.string().optional().nullable(),
  flightId: z.string().optional().nullable(),
  groupId: z.string().optional().nullable(),
  costDouble: z.number().min(0),
  sellDouble: z.number().min(0),
  costTriple: z.number().min(0),
  sellTriple: z.number().min(0),
  costQuad: z.number().min(0),
  sellQuad: z.number().min(0),
  costQuint: z.number().min(0).default(0),
  sellQuint: z.number().min(0).default(0),
  childPrice: z.number().min(0).default(0),
  infantPrice: z.number().min(0).default(0),
  description: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const packages = await prisma.package.findMany({
      where: { isDeleted: false },
      include: {
        makkahHotel: true,
        madinahHotel: true,
        airline: true,
        group: true,
        _count: { select: { packageBookings: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ packages });
  } catch (error) {
    console.error("GET packages error:", error);
    return NextResponse.json({ error: "Failed to fetch packages" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = packageSchema.parse(body);

    const pkg = await prisma.package.create({
      data: {
        name: parsed.name,
        packageType: parsed.packageType,
        durationDays: parsed.durationDays,
        makkahHotelId: parsed.makkahHotelId,
        makkahNights: parsed.makkahNights,
        madinahHotelId: parsed.madinahHotelId,
        madinahNights: parsed.madinahNights,
        mealPlan: parsed.mealPlan,
        transportIncluded: parsed.transportIncluded,
        transportType: parsed.transportType,
        visaIncluded: parsed.visaIncluded,
        zyaratIncluded: parsed.zyaratIncluded,
        airlineId: parsed.airlineId || null,
        flightId: parsed.flightId || null,
        groupId: parsed.groupId || null,
        costDouble: parsed.costDouble,
        sellDouble: parsed.sellDouble,
        costTriple: parsed.costTriple,
        sellTriple: parsed.sellTriple,
        costQuad: parsed.costQuad,
        sellQuad: parsed.sellQuad,
        costQuint: parsed.costQuint,
        sellQuint: parsed.sellQuint,
        childPrice: parsed.childPrice,
        infantPrice: parsed.infantPrice,
        description: parsed.description,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entity: "Package",
        entityId: pkg.id,
        branchId: session.user.branchId || null,
        details: `Created Umrah package ${pkg.name} (${pkg.durationDays} days) Quad Selling: PKR ${pkg.sellQuad.toLocaleString()}`,
      },
    });

    return NextResponse.json({ success: true, package: pkg });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("POST package error:", error);
    return NextResponse.json({ error: "Failed to create package" }, { status: 500 });
  }
}
