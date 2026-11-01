import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ticketSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  passportId: z.string().optional().nullable(),
  supplierId: z.string().min(1, "Supplier is required"),
  pnr: z.string().min(4, "PNR is required").toUpperCase(),
  ticketNumber: z.string().min(6, "Ticket number is required"),
  routeDetails: z.string().min(3, "Route details required (e.g. KHI-JED-KHI)"),
  departureDate: z.string().min(1, "Departure date required"),
  returnDate: z.string().optional().nullable(),
  fare: z.number().min(0),
  tax: z.number().default(0),
  supplierCost: z.number().min(0, "Supplier cost required"),
  sellingPrice: z.number().min(0, "Selling price required"),
  branchId: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tickets = await prisma.ticket.findMany({
      where: { isDeleted: false },
      include: {
        customer: true,
        passport: true,
        supplier: true,
        branch: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("GET tickets error:", error);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = ticketSchema.parse(body);

    const profit = parsed.sellingPrice - parsed.supplierCost;
    const branchId = parsed.branchId || session.user.branchId || null;

    const ticket = await prisma.ticket.create({
      data: {
        customerId: parsed.customerId,
        passportId: parsed.passportId || null,
        supplierId: parsed.supplierId,
        pnr: parsed.pnr,
        ticketNumber: parsed.ticketNumber,
        routeDetails: parsed.routeDetails,
        departureDate: new Date(parsed.departureDate),
        returnDate: parsed.returnDate ? new Date(parsed.returnDate) : null,
        fare: parsed.fare,
        tax: parsed.tax,
        supplierCost: parsed.supplierCost,
        sellingPrice: parsed.sellingPrice,
        profit,
        branchId,
        status: "ISSUED",
      },
      include: { customer: true, supplier: true },
    });

    // Auto double-entry journal voucher posting for ticket issuance
    try {
      const accReceivable = await prisma.account.findFirst({
        where: { subType: "RECEIVABLE" },
      });
      const accTicketRevenue = await prisma.account.findFirst({
        where: { code: "4002" },
      });
      const accAirlineCost = await prisma.account.findFirst({
        where: { code: "5001" },
      });
      const accPayable = await prisma.account.findFirst({
        where: { subType: "PAYABLE" },
      });

      if (accReceivable && accTicketRevenue && accAirlineCost && accPayable) {
        const jv = await prisma.journalEntry.create({
          data: {
            entryNumber: `JV-TK-${Date.now().toString().slice(-6)}`,
            date: new Date(),
            description: `Air Ticket ${ticket.ticketNumber} (${ticket.pnr}) for ${ticket.customer.firstName} ${ticket.customer.lastName}`,
            referenceType: "TICKET",
            referenceId: ticket.id,
            branchId,
            createdById: session.user.id,
          },
        });

        // Debit Receivable (Customer), Credit Ticket Sales
        // Debit Cost of Airline Seats, Credit Payable (Supplier)
        await prisma.ledgerEntry.createMany({
          data: [
            {
              journalEntryId: jv.id,
              accountId: accReceivable.id,
              debit: parsed.sellingPrice,
              credit: 0,
              balance: parsed.sellingPrice,
              description: `Receivable for ticket ${ticket.ticketNumber}`,
              customerId: ticket.customerId,
            },
            {
              journalEntryId: jv.id,
              accountId: accTicketRevenue.id,
              debit: 0,
              credit: parsed.sellingPrice,
              balance: parsed.sellingPrice,
              description: `Air ticket revenue for ${ticket.ticketNumber}`,
              customerId: ticket.customerId,
            },
            {
              journalEntryId: jv.id,
              accountId: accAirlineCost.id,
              debit: parsed.supplierCost,
              credit: 0,
              balance: parsed.supplierCost,
              description: `Cost of ticket ${ticket.ticketNumber}`,
              supplierId: ticket.supplierId,
            },
            {
              journalEntryId: jv.id,
              accountId: accPayable.id,
              debit: 0,
              credit: parsed.supplierCost,
              balance: parsed.supplierCost,
              description: `Payable to ${ticket.supplier.name} for ticket ${ticket.ticketNumber}`,
              supplierId: ticket.supplierId,
            },
          ],
        });
      }
    } catch (jvErr) {
      console.warn("Auto JV posting failed:", jvErr);
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entity: "Ticket",
        entityId: ticket.id,
        branchId,
        details: `Issued single ticket ${ticket.ticketNumber} (PNR: ${ticket.pnr}) Route: ${ticket.routeDetails} Profit: PKR ${profit}`,
      },
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("POST ticket error:", error);
    return NextResponse.json({ error: "Failed to issue ticket" }, { status: 500 });
  }
}
