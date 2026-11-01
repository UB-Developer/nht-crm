import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const jvSchema = z.object({
  description: z.string().min(3, "Description is required"),
  date: z.string().optional(),
  referenceType: z.string().default("MANUAL"),
  referenceId: z.string().optional().nullable(),
  entries: z
    .array(
      z.object({
        accountId: z.string().min(1, "Account required"),
        debit: z.number().min(0).default(0),
        credit: z.number().min(0).default(0),
        description: z.string().optional(),
        customerId: z.string().optional().nullable(),
        supplierId: z.string().optional().nullable(),
      })
    )
    .min(2, "At least two lines required for double entry"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = jvSchema.parse(body);

    const totalDebit = parsed.entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = parsed.entries.reduce((sum, e) => sum + e.credit, 0);

    // Double-entry validation: Total Debits must equal Total Credits
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json(
        {
          error: `Unbalanced entry! Total Debits (${totalDebit.toLocaleString()}) must equal Total Credits (${totalCredit.toLocaleString()}).`,
        },
        { status: 400 }
      );
    }

    const entryNumber = `JV-MN-${Date.now().toString().slice(-6)}`;
    const branchId = session.user.branchId || null;

    const jv = await prisma.journalEntry.create({
      data: {
        entryNumber,
        date: parsed.date ? new Date(parsed.date) : new Date(),
        description: parsed.description,
        referenceType: parsed.referenceType,
        referenceId: parsed.referenceId || null,
        branchId,
        createdById: session.user.id,
      },
    });

    for (const line of parsed.entries) {
      await prisma.ledgerEntry.create({
        data: {
          journalEntryId: jv.id,
          accountId: line.accountId,
          debit: line.debit,
          credit: line.credit,
          balance: line.debit > 0 ? line.debit : line.credit,
          description: line.description || parsed.description,
          customerId: line.customerId || null,
          supplierId: line.supplierId || null,
        },
      });

      // Update account running balance
      const delta = line.debit - line.credit;
      await prisma.account.update({
        where: { id: line.accountId },
        data: {
          balance: { increment: delta },
        },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        entity: "JournalEntry",
        entityId: jv.id,
        branchId,
        details: `Posted manual Journal Voucher ${jv.entryNumber} of PKR ${totalDebit.toLocaleString()}`,
      },
    });

    return NextResponse.json({ success: true, journalEntry: jv });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("POST journal entry error:", error);
    return NextResponse.json({ error: "Failed to post journal voucher" }, { status: 500 });
  }
}
