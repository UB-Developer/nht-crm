import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const branchSchema = z.object({
  name: z.string().min(2, "Branch name is required"),
  code: z.string().min(2, "Branch code is required").toUpperCase(),
  city: z.string().min(2, "City is required"),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  managerName: z.string().optional().nullable(),
  isHeadOffice: z.boolean().default(false),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const branches = await prisma.branch.findMany({
      where: { isDeleted: false },
      include: {
        users: {
          where: { isDeleted: false },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            phone: true,
            commissionRate: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            customers: true,
            packageBookings: true,
            tickets: true,
            hotelBookings: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ branches });
  } catch (error) {
    console.error("GET branches error:", error);
    return NextResponse.json({ error: "Failed to fetch branches" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check: Only SUPER_ADMIN and ADMIN can create branches
    if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = branchSchema.parse(body);

    const existing = await prisma.branch.findUnique({
      where: { code: parsed.code },
    });
    if (existing) {
      return NextResponse.json({ error: `Branch code '${parsed.code}' already exists` }, { status: 400 });
    }

    const branch = await prisma.branch.create({
      data: {
        name: parsed.name,
        code: parsed.code,
        city: parsed.city,
        address: parsed.address || null,
        phone: parsed.phone || null,
        email: parsed.email || null,
        managerName: parsed.managerName || null,
        isHeadOffice: parsed.isHeadOffice || false,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entity: "Branch",
        entityId: branch.id,
        branchId: branch.id,
        details: JSON.stringify({ name: branch.name, code: branch.code, city: branch.city }),
      },
    });

    return NextResponse.json({ branch }, { status: 201 });
  } catch (error: any) {
    console.error("POST branch error:", error);
    if (error.errors) {
      return NextResponse.json({ error: error.errors[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create branch" }, { status: 500 });
  }
}
