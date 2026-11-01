import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bookingSchema = z.object({
  packageId: z.string().min(1, "Package is required"),
  customerId: z.string().min(1, "Primary pilgrim is required"),
  roomType: z.string().default("QUAD"),
  travelDate: z.string().min(1, "Travel date required"),
  notes: z.string().optional(),
  totalAmount: z.number().min(0),
  paidAmount: z.number().default(0),
  paymentMethod: z.string().default("CASH"),
  paymentReference: z.string().optional(),
  pilgrims: z
    .array(
      z.object({
        customerId: z.string(),
        passportId: z.string().optional().nullable(),
        relationToHead: z.string().default("SELF"),
        roomType: z.string().default("QUAD"),
        isChild: z.boolean().default(false),
        isInfant: z.boolean().default(false),
      })
    )
    .min(1, "At least one pilgrim required"),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const bookings = await prisma.packageBooking.findMany({
      where: {
        isDeleted: false,
        ...(session.user.role === "STAFF"
          ? { createdById: session.user.id }
          : session.user.role === "BRANCH_MANAGER"
          ? { branchId: session.user.branchId || undefined }
          : {}),
        ...(status && status !== "ALL" ? { bookingStatus: status } : {}),
      },
      include: {
        package: true,
        customer: true,
        branch: true,
        createdBy: true,
        pilgrims: {
          include: { customer: true, passport: true, visas: true, nusukRecords: true },
        },
        receipts: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("GET bookings error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = bookingSchema.parse(body);

    const bookingNumber = `PKG-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const balanceAmount = Math.max(0, parsed.totalAmount - parsed.paidAmount);
    const paymentStatus =
      parsed.paidAmount >= parsed.totalAmount
        ? "PAID"
        : parsed.paidAmount > 0
        ? "PARTIAL"
        : "UNPAID";

    const branchId = session.user.branchId || (await prisma.branch.findFirst())?.id;

    // Create PackageBooking record
    const booking = await prisma.packageBooking.create({
      data: {
        bookingNumber,
        packageId: parsed.packageId,
        customerId: parsed.customerId,
        branchId,
        createdById: session.user.id,
        roomType: parsed.roomType,
        totalPilgrims: parsed.pilgrims.length,
        totalAmount: parsed.totalAmount,
        paidAmount: parsed.paidAmount,
        balanceAmount,
        bookingStatus: "CONFIRMED",
        paymentStatus,
        travelDate: new Date(parsed.travelDate),
        notes: parsed.notes,
      },
      include: { customer: true, package: true },
    });

    // Create Pilgrim records
    for (const p of parsed.pilgrims) {
      const pilgrim = await prisma.pilgrim.create({
        data: {
          packageBookingId: booking.id,
          customerId: p.customerId,
          passportId: p.passportId || null,
          relationToHead: p.relationToHead,
          roomType: p.roomType,
          isChild: p.isChild,
          isInfant: p.isInfant,
          visaStatus: "SUBMITTED",
          nusukStatus: "PENDING",
          ticketStatus: "PENDING",
        },
      });

      // Automatically create a Visa application record for the pilgrim
      await prisma.visa.create({
        data: {
          pilgrimId: pilgrim.id,
          customerId: p.customerId,
          passportId: p.passportId || null,
          visaType: "UMRAH",
          status: "SUBMITTED",
          costPrice: 42000,
          sellingPrice: 55000,
          remarks: `Auto-generated for Booking ${booking.bookingNumber}`,
        },
      });

      // Automatically create a Nusuk permit placeholder
      await prisma.nusuk.create({
        data: {
          pilgrimId: pilgrim.id,
          customerId: p.customerId,
          nusukRefId: `NSK-${Date.now().toString().slice(-6)}`,
          umrahPermitStatus: "PENDING",
          rawdahPermitStatus: "PENDING",
          packageBookingId: booking.id,
          remarks: "Pending Nusuk portal slot confirmation",
        },
      });
    }

    // Auto Double-Entry Engine Journal Entries
    try {
      const accReceivable = await prisma.account.findFirst({
        where: { subType: "RECEIVABLE" },
      });
      const accSales = await prisma.account.findFirst({
        where: { code: "4001" }, // Package Sales
      });
      const accCash = await prisma.account.findFirst({
        where: { subType: "CASH" },
      });

      if (accReceivable && accSales) {
        // 1. Booking recognition JV: Debit Accounts Receivable, Credit Package Sales
        const jvBooking = await prisma.journalEntry.create({
          data: {
            entryNumber: `JV-BK-${Date.now().toString().slice(-6)}`,
            date: new Date(),
            description: `Package Booking ${booking.bookingNumber} (${booking.package.name}) for ${booking.customer.firstName} ${booking.customer.lastName}`,
            referenceType: "BOOKING",
            referenceId: booking.id,
            branchId,
            createdById: session.user.id,
          },
        });

        await prisma.ledgerEntry.createMany({
          data: [
            {
              journalEntryId: jvBooking.id,
              accountId: accReceivable.id,
              debit: parsed.totalAmount,
              credit: 0,
              balance: parsed.totalAmount,
              description: `Receivable for ${booking.bookingNumber}`,
              customerId: booking.customerId,
            },
            {
              journalEntryId: jvBooking.id,
              accountId: accSales.id,
              debit: 0,
              credit: parsed.totalAmount,
              balance: parsed.totalAmount,
              description: `Revenue recognized for ${booking.bookingNumber}`,
              customerId: booking.customerId,
            },
          ],
        });

        // 2. If Advance Payment is made, create Receipt and JV settlement
        if (parsed.paidAmount > 0 && accCash) {
          const receipt = await prisma.receipt.create({
            data: {
              receiptNumber: `RV-${Date.now().toString().slice(-6)}`,
              date: new Date(),
              customerId: booking.customerId,
              accountId: accCash.id,
              packageBookingId: booking.id,
              amount: parsed.paidAmount,
              currency: "PKR",
              paymentMethod: parsed.paymentMethod,
              reference: parsed.paymentReference || "Advance Booking Payment",
              notes: `Advance for booking ${booking.bookingNumber}`,
              branchId,
              createdById: session.user.id,
            },
          });

          const jvReceipt = await prisma.journalEntry.create({
            data: {
              entryNumber: `JV-RV-${Date.now().toString().slice(-6)}`,
              date: new Date(),
              description: `Advance Receipt ${receipt.receiptNumber} settlement for ${booking.bookingNumber}`,
              referenceType: "RECEIPT",
              referenceId: receipt.id,
              branchId,
              createdById: session.user.id,
            },
          });

          await prisma.ledgerEntry.createMany({
            data: [
              {
                journalEntryId: jvReceipt.id,
                accountId: accCash.id,
                debit: parsed.paidAmount,
                credit: 0,
                balance: parsed.paidAmount,
                description: `Cash received for booking ${booking.bookingNumber}`,
                customerId: booking.customerId,
              },
              {
                journalEntryId: jvReceipt.id,
                accountId: accReceivable.id,
                debit: 0,
                credit: parsed.paidAmount,
                balance: balanceAmount,
                description: `Receivable settlement for booking ${booking.bookingNumber}`,
                customerId: booking.customerId,
              },
            ],
          });
        }
      }
    } catch (jvErr) {
      console.warn("Booking JV auto-posting error:", jvErr);
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entity: "PackageBooking",
        entityId: booking.id,
        branchId,
        details: `Created Booking ${booking.bookingNumber} for ${parsed.pilgrims.length} pilgrims. Total: PKR ${parsed.totalAmount.toLocaleString()}, Advance Paid: PKR ${parsed.paidAmount.toLocaleString()}`,
      },
    });

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("POST booking error:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
