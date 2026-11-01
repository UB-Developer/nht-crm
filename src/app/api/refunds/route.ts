import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const refundRequestSchema = z.object({
  module: z.enum(["TICKET", "HOTEL", "PACKAGE", "VISA"]),
  referenceId: z.string().min(1, "Reference ID is required"),
  customerId: z.string().min(1, "Customer is required"),
  supplierId: z.string().optional().nullable(),
  originalAmount: z.number().min(0),
  penaltyAirline: z.number().default(0),
  penaltySupplier: z.number().default(0),
  penaltyCompany: z.number().default(0),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const refunds = await prisma.refund.findMany({
      where: { isDeleted: false },
      include: {
        customer: true,
        supplier: true,
        branch: true,
        approvedBy: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ refunds });
  } catch (error) {
    console.error("GET refunds error:", error);
    return NextResponse.json({ error: "Failed to fetch refunds" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = refundRequestSchema.parse(body);

    const totalPenalties =
      parsed.penaltyAirline + parsed.penaltySupplier + parsed.penaltyCompany;
    const customerRefundAmount = Math.max(0, parsed.originalAmount - totalPenalties);
    const supplierRefundAmount = Math.max(0, parsed.originalAmount - parsed.penaltyAirline);

    const refundNumber = `RF-${Date.now().toString().slice(-6)}`;

    const refund = await prisma.refund.create({
      data: {
        refundNumber,
        module: parsed.module,
        referenceId: parsed.referenceId,
        customerId: parsed.customerId,
        supplierId: parsed.supplierId || null,
        originalAmount: parsed.originalAmount,
        penaltyAirline: parsed.penaltyAirline,
        penaltySupplier: parsed.penaltySupplier,
        penaltyCompany: parsed.penaltyCompany,
        customerRefundAmount,
        supplierRefundAmount,
        status: "REQUESTED",
        notes: parsed.notes,
        branchId: session.user.branchId || null,
      },
    });

    // Notify accountant
    const accountantUser = await prisma.user.findFirst({
      where: { role: "ACCOUNTANT" },
    });
    if (accountantUser) {
      await prisma.notification.create({
        data: {
          userId: accountantUser.id,
          title: `New Refund Request: ${refund.refundNumber}`,
          message: `Refund of PKR ${customerRefundAmount.toLocaleString()} requested for ${parsed.module}. Airline penalty: PKR ${parsed.penaltyAirline.toLocaleString()}.`,
          type: "REFUND_REQUEST",
          linkUrl: "/refunds",
        },
      });
    }

    return NextResponse.json({ success: true, refund });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("POST refund error:", error);
    return NextResponse.json({ error: "Failed to submit refund" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, status } = body;

    if (!id || !["APPROVED", "REFUNDED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status or ID" }, { status: 400 });
    }

    const existing = await prisma.refund.findUnique({
      where: { id },
      include: { customer: true, supplier: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Refund not found" }, { status: 404 });
    }

    const updated = await prisma.refund.update({
      where: { id },
      data: {
        status,
        approvedById: session.user.id,
      },
    });

    // If APPROVED, auto-post reversing journal entries
    if (status === "APPROVED" || status === "REFUNDED") {
      try {
        const accSales = await prisma.account.findFirst({
          where: { subType: "SALES" },
        });
        const accReceivable = await prisma.account.findFirst({
          where: { subType: "RECEIVABLE" },
        });
        const accCash = await prisma.account.findFirst({
          where: { subType: "CASH" },
        });

        if (accSales && (accReceivable || accCash)) {
          const targetAcc = accReceivable || accCash!;
          const jv = await prisma.journalEntry.create({
            data: {
              entryNumber: `JV-REV-${Date.now().toString().slice(-6)}`,
              date: new Date(),
              description: `Reversal for Refund ${updated.refundNumber} (${updated.module}) for ${existing.customer.firstName} ${existing.customer.lastName}`,
              referenceType: "REFUND",
              referenceId: updated.id,
              branchId: updated.branchId,
              createdById: session.user.id,
            },
          });

          // Debit Sales Revenue (Reducing Revenue), Credit Customer / Bank (Paying back or reducing receivable)
          await prisma.ledgerEntry.createMany({
            data: [
              {
                journalEntryId: jv.id,
                accountId: accSales.id,
                debit: updated.customerRefundAmount,
                credit: 0,
                balance: updated.customerRefundAmount,
                description: `Sales reversal for refund ${updated.refundNumber}`,
                customerId: updated.customerId,
              },
              {
                journalEntryId: jv.id,
                accountId: targetAcc.id,
                debit: 0,
                credit: updated.customerRefundAmount,
                balance: updated.customerRefundAmount,
                description: `Settlement credit for refund ${updated.refundNumber}`,
                customerId: updated.customerId,
              },
            ],
          });
        }
      } catch (revErr) {
        console.warn("Reversing JV creation failed:", revErr);
      }
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "APPROVE",
        entity: "Refund",
        entityId: updated.id,
        branchId: updated.branchId,
        details: `Updated refund ${updated.refundNumber} status to ${status}. Reversing ledger entries posted.`,
      },
    });

    return NextResponse.json({ success: true, refund: updated });
  } catch (error) {
    console.error("PUT refund error:", error);
    return NextResponse.json({ error: "Failed to update refund" }, { status: 500 });
  }
}
