import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const visaSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  passportId: z.string().optional().nullable(),
  pilgrimId: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  visaType: z.string().default("UMRAH"),
  applicationDate: z.string().optional(),
  visaNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  status: z.enum(["SUBMITTED", "PROCESSING", "APPROVED", "REJECTED", "STAMPED"]).default("SUBMITTED"),
  costPrice: z.number().default(42000),
  sellingPrice: z.number().default(55000),
  remarks: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const visas = await prisma.visa.findMany({
      where: {
        isDeleted: false,
        ...(status && status !== "ALL" ? { status } : {}),
      },
      include: {
        customer: true,
        passport: true,
        supplier: true,
        pilgrim: {
          include: { packageBooking: true },
        },
      },
      orderBy: { applicationDate: "desc" },
    });

    return NextResponse.json({ visas });
  } catch (error) {
    console.error("GET visas error:", error);
    return NextResponse.json({ error: "Failed to fetch visas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = visaSchema.parse(body);

    const visa = await prisma.visa.create({
      data: {
        customerId: parsed.customerId,
        passportId: parsed.passportId || null,
        pilgrimId: parsed.pilgrimId || null,
        supplierId: parsed.supplierId || null,
        visaType: parsed.visaType,
        applicationDate: parsed.applicationDate ? new Date(parsed.applicationDate) : new Date(),
        visaNumber: parsed.visaNumber || null,
        expiryDate: parsed.expiryDate ? new Date(parsed.expiryDate) : null,
        status: parsed.status,
        costPrice: parsed.costPrice,
        sellingPrice: parsed.sellingPrice,
        remarks: parsed.remarks,
      },
    });

    return NextResponse.json({ success: true, visa });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("POST visa error:", error);
    return NextResponse.json({ error: "Failed to apply visa" }, { status: 500 });
  }
}

// Bulk update status endpoint
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { visaIds, status, visaNumber } = body;

    if (!Array.isArray(visaIds) || visaIds.length === 0 || !status) {
      return NextResponse.json({ error: "Invalid visa IDs or status" }, { status: 400 });
    }

    await prisma.visa.updateMany({
      where: { id: { in: visaIds } },
      data: {
        status,
        ...(visaNumber ? { visaNumber } : {}),
        approvalDate: status === "APPROVED" || status === "STAMPED" ? new Date() : undefined,
      },
    });

    // Update corresponding pilgrims visaStatus
    const updatedVisas = await prisma.visa.findMany({
      where: { id: { in: visaIds } },
      select: { pilgrimId: true },
    });

    const pilgrimIds = updatedVisas
      .map((v) => v.pilgrimId)
      .filter((id): id is string => Boolean(id));

    if (pilgrimIds.length > 0) {
      await prisma.pilgrim.updateMany({
        where: { id: { in: pilgrimIds } },
        data: { visaStatus: status },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entity: "Visa",
        branchId: session.user.branchId || null,
        details: `Bulk updated ${visaIds.length} visa application(s) to status ${status}`,
      },
    });

    return NextResponse.json({ success: true, count: visaIds.length });
  } catch (error) {
    console.error("PUT visa bulk error:", error);
    return NextResponse.json({ error: "Failed to bulk update visas" }, { status: 500 });
  }
}
