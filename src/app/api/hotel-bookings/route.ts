import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { differenceInDays, parseISO } from "date-fns";

const hotelBookingSchema = z.object({
  hotelId: z.string().min(1, "Hotel is required"),
  customerId: z.string().min(1, "Customer is required"),
  supplierId: z.string().min(1, "Supplier is required"),
  roomType: z.string().default("DOUBLE"),
  numberOfRooms: z.number().min(1).default(1),
  checkInDate: z.string().min(1, "Check-in date required"),
  checkOutDate: z.string().min(1, "Check-out date required"),
  costPrice: z.number().min(0),
  sellingPrice: z.number().min(0),
  confirmationNumber: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookings = await prisma.hotelBooking.findMany({
      where: { isDeleted: false },
      include: {
        hotel: true,
        customer: true,
        supplier: true,
        branch: true,
      },
      orderBy: { checkInDate: "desc" },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("GET hotel bookings error:", error);
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
    const parsed = hotelBookingSchema.parse(body);

    const checkIn = new Date(parsed.checkInDate);
    const checkOut = new Date(parsed.checkOutDate);
    const totalNights = Math.max(1, differenceInDays(checkOut, checkIn));

    const confirmationNumber =
      parsed.confirmationNumber || `HTL-${Date.now().toString().slice(-6)}`;
    const profit = parsed.sellingPrice - parsed.costPrice;
    const branchId = session.user.branchId || null;

    const booking = await prisma.hotelBooking.create({
      data: {
        hotelId: parsed.hotelId,
        customerId: parsed.customerId,
        supplierId: parsed.supplierId,
        roomType: parsed.roomType,
        numberOfRooms: parsed.numberOfRooms,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        totalNights,
        confirmationNumber,
        costPrice: parsed.costPrice,
        sellingPrice: parsed.sellingPrice,
        profit,
        branchId,
        status: "CONFIRMED",
      },
      include: { hotel: true, customer: true, supplier: true },
    });

    // Auto double-entry journal entry for Hotel booking
    try {
      const accReceivable = await prisma.account.findFirst({
        where: { subType: "RECEIVABLE" },
      });
      const accHotelCost = await prisma.account.findFirst({
        where: { code: "5002" },
      });
      const accSales = await prisma.account.findFirst({
        where: { subType: "SALES" },
      });
      const accPayable = await prisma.account.findFirst({
        where: { subType: "PAYABLE" },
      });

      if (accReceivable && accHotelCost && accSales && accPayable) {
        const jv = await prisma.journalEntry.create({
          data: {
            entryNumber: `JV-HTL-${Date.now().toString().slice(-6)}`,
            date: new Date(),
            description: `Hotel reservation at ${booking.hotel.name} (${booking.totalNights} nights) for ${booking.customer.firstName} ${booking.customer.lastName}`,
            referenceType: "HOTEL",
            referenceId: booking.id,
            branchId,
            createdById: session.user.id,
          },
        });

        await prisma.ledgerEntry.createMany({
          data: [
            {
              journalEntryId: jv.id,
              accountId: accReceivable.id,
              debit: parsed.sellingPrice,
              credit: 0,
              balance: parsed.sellingPrice,
              description: `Receivable for hotel voucher ${booking.confirmationNumber}`,
              customerId: booking.customerId,
            },
            {
              journalEntryId: jv.id,
              accountId: accSales.id,
              debit: 0,
              credit: parsed.sellingPrice,
              balance: parsed.sellingPrice,
              description: `Revenue for hotel voucher ${booking.confirmationNumber}`,
              customerId: booking.customerId,
            },
            {
              journalEntryId: jv.id,
              accountId: accHotelCost.id,
              debit: parsed.costPrice,
              credit: 0,
              balance: parsed.costPrice,
              description: `Hotel cost for voucher ${booking.confirmationNumber}`,
              supplierId: booking.supplierId,
            },
            {
              journalEntryId: jv.id,
              accountId: accPayable.id,
              debit: 0,
              credit: parsed.costPrice,
              balance: parsed.costPrice,
              description: `Payable to ${booking.supplier.name} for hotel booking`,
              supplierId: booking.supplierId,
            },
          ],
        });
      }
    } catch (jvErr) {
      console.warn("Hotel JV posting failed:", jvErr);
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entity: "HotelBooking",
        entityId: booking.id,
        branchId,
        details: `Reserved ${booking.numberOfRooms} ${booking.roomType} room(s) at ${booking.hotel.name} for ${booking.totalNights} nights. Voucher: ${booking.confirmationNumber}`,
      },
    });

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("POST hotel booking error:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
