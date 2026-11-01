import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const customerSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  cnic: z.string().optional().nullable(),
  phone: z.string().min(10, "Valid phone number is required"),
  whatsapp: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  familyHeadId: z.string().optional().nullable(),
  branchId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),

  // Optional passport sub-object
  passport: z
    .object({
      passportNumber: z.string().min(5),
      surname: z.string().min(1),
      givenNames: z.string().min(1),
      nationality: z.string().default("PAK"),
      issueDate: z.string(),
      expiryDate: z.string(),
      dateOfBirth: z.string(),
      gender: z.string().default("MALE"),
      placeOfBirth: z.string().optional().nullable(),
      countryOfIssue: z.string().default("PAKISTAN"),
      passportScanUrl: z.string().optional().nullable(),
      photoUrl: z.string().optional().nullable(),
      cnicScanUrl: z.string().optional().nullable(),
      vaccineScanUrl: z.string().optional().nullable(),
    })
    .optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const branchId = searchParams.get("branchId") || session.user.branchId;

    const customers = await prisma.customer.findMany({
      where: {
        isDeleted: false,
        ...(session.user.role === "BRANCH_MANAGER" || session.user.role === "STAFF"
          ? { branchId: session.user.branchId || undefined }
          : branchId
          ? { branchId }
          : {}),
        ...(search
          ? {
              OR: [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { cnic: { contains: search } },
                { phone: { contains: search } },
                { passportNumber: { contains: search } },
              ],
            }
          : {}),
      },
      include: {
        passports: { where: { isDeleted: false } },
        branch: true,
        _count: {
          select: {
            packageBookings: true,
            tickets: true,
            visas: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ customers });
  } catch (error) {
    console.error("GET customers error:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = customerSchema.parse(body);

    const branchId =
      parsed.branchId || session.user.branchId || (await prisma.branch.findFirst())?.id;

    const customer = await prisma.customer.create({
      data: {
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        cnic: parsed.cnic,
        phone: parsed.phone,
        whatsapp: parsed.whatsapp || parsed.phone,
        email: parsed.email || null,
        address: parsed.address,
        city: parsed.city,
        familyHeadId: parsed.familyHeadId,
        branchId,
        notes: parsed.notes,
        passportNumber: parsed.passport?.passportNumber || null,
      },
    });

    // If passport details are included, create the passport record
    let passportRecord = null;
    if (parsed.passport) {
      passportRecord = await prisma.passport.create({
        data: {
          customerId: customer.id,
          passportNumber: parsed.passport.passportNumber.toUpperCase().trim(),
          surname: parsed.passport.surname.toUpperCase().trim(),
          givenNames: parsed.passport.givenNames.toUpperCase().trim(),
          nationality: parsed.passport.nationality || "PAK",
          issueDate: new Date(parsed.passport.issueDate),
          expiryDate: new Date(parsed.passport.expiryDate),
          dateOfBirth: new Date(parsed.passport.dateOfBirth),
          gender: parsed.passport.gender,
          placeOfBirth: parsed.passport.placeOfBirth,
          countryOfIssue: parsed.passport.countryOfIssue || "PAKISTAN",
          passportScanUrl: parsed.passport.passportScanUrl,
          photoUrl: parsed.passport.photoUrl,
          cnicScanUrl: parsed.passport.cnicScanUrl,
          vaccineScanUrl: parsed.passport.vaccineScanUrl,
        },
      });

      // Check 6-month validity warning
      const diffMonths =
        (new Date(parsed.passport.expiryDate).getTime() - new Date().getTime()) /
        (1000 * 3600 * 24 * 30);
      if (diffMonths < 6) {
        await prisma.notification.create({
          data: {
            userId: session.user.id,
            title: "Passport Expiry Alert (< 6 Months)",
            message: `Pilgrim ${customer.firstName} ${customer.lastName}'s passport ${parsed.passport.passportNumber} has less than 6 months validity. Renewal required before Umrah issuance.`,
            type: "PASSPORT_EXPIRY",
            linkUrl: `/customers/${customer.id}`,
          },
        });
      }
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entity: "Customer",
        entityId: customer.id,
        branchId,
        details: `Registered pilgrim ${customer.firstName} ${customer.lastName} with passport ${parsed.passport?.passportNumber || "N/A"}`,
      },
    });

    return NextResponse.json({
      success: true,
      customer,
      passport: passportRecord,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("POST customer error:", error);
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}
