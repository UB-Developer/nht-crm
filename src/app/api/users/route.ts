import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional().nullable(),
  role: z.enum([
    "SUPER_ADMIN",
    "ADMIN",
    "BRANCH_MANAGER",
    "ACCOUNTANT",
    "TICKET_MANAGER",
    "HOTEL_MANAGER",
    "STAFF",
  ]),
  branchId: z.string().optional().nullable(),
  commissionRate: z.number().min(0).max(100).default(0),
});

const updateUserSchema = z.object({
  id: z.string().min(1),
  commissionRate: z.number().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
  branchId: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const role = searchParams.get("role");

    const where: any = { isDeleted: false };
    if (branchId) where.branchId = branchId;
    if (role) where.role = role;

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        branchId: true,
        commissionRate: true,
        isActive: true,
        createdAt: true,
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
            city: true,
          },
        },
        packageBookings: {
          where: { isDeleted: false },
          select: {
            id: true,
            totalAmount: true,
            paidAmount: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const enrichedUsers = users.map((u) => {
      const totalSales = u.packageBookings.reduce((sum, b) => sum + b.totalAmount, 0);
      const earnedCommission = (totalSales * (u.commissionRate || 0)) / 100;
      return {
        ...u,
        totalBookingsCount: u.packageBookings.length,
        totalSalesVolume: totalSales,
        earnedCommission,
      };
    });

    return NextResponse.json({ users: enrichedUsers });
  } catch (error) {
    console.error("GET users error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createUserSchema.parse(body);

    const existing = await prisma.user.findUnique({
      where: { email: parsed.email.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(parsed.password, 10);

    const user = await prisma.user.create({
      data: {
        name: parsed.name,
        email: parsed.email.toLowerCase(),
        passwordHash,
        phone: parsed.phone || null,
        role: parsed.role,
        branchId: parsed.branchId || null,
        commissionRate: parsed.commissionRate || 0,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        branchId: true,
        commissionRate: true,
        phone: true,
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entity: "User",
        entityId: user.id,
        branchId: user.branchId || null,
        details: JSON.stringify({ name: user.name, role: user.role, email: user.email }),
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error: any) {
    console.error("POST user error:", error);
    if (error.errors) {
      return NextResponse.json({ error: error.errors[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden. Managerial access required." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateUserSchema.parse(body);

    const updatedUser = await prisma.user.update({
      where: { id: parsed.id },
      data: {
        ...(parsed.commissionRate !== undefined && { commissionRate: parsed.commissionRate }),
        ...(parsed.isActive !== undefined && { isActive: parsed.isActive }),
        ...(parsed.branchId !== undefined && { branchId: parsed.branchId }),
        ...(parsed.phone !== undefined && { phone: parsed.phone }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        branchId: true,
        commissionRate: true,
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entity: "User",
        entityId: updatedUser.id,
        branchId: updatedUser.branchId || null,
        details: JSON.stringify(body),
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    console.error("PATCH user error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
