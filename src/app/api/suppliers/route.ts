import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const supplierSchema = z.object({
  name: z.string().min(2, "Supplier name is required"),
  type: z.enum(["AIRLINE", "HOTEL", "VISA", "TRANSPORT", "GENERAL"]),
  contactPerson: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  address: z.string().optional().nullable(),
  balance: z.number().default(0),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const where: any = { isDeleted: false };
    if (type && type !== "ALL") {
      where.type = type;
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      include: {
        _count: {
          select: {
            groups: true,
            tickets: true,
            hotelBookings: true,
            visas: true,
            payments: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ suppliers });
  } catch (error) {
    console.error("GET suppliers error:", error);
    return NextResponse.json({ error: "Failed to fetch suppliers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = supplierSchema.parse(body);

    const supplier = await prisma.supplier.create({
      data: {
        name: parsed.name,
        type: parsed.type,
        contactPerson: parsed.contactPerson || null,
        phone: parsed.phone || null,
        email: parsed.email || null,
        address: parsed.address || null,
        balance: parsed.balance || 0,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entity: "Supplier",
        entityId: supplier.id,
        branchId: session.user.branchId || null,
        details: JSON.stringify({
          name: supplier.name,
          type: supplier.type,
          contactPerson: supplier.contactPerson,
        }),
      },
    });

    return NextResponse.json({ supplier }, { status: 201 });
  } catch (error: any) {
    console.error("POST supplier error:", error);
    if (error.errors) {
      return NextResponse.json({ error: error.errors[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create supplier" }, { status: 500 });
  }
}
