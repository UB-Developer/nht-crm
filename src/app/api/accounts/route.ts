import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");

    const accounts = await prisma.account.findMany({
      where: {
        isDeleted: false,
        ...(branchId && branchId !== "ALL" ? { branchId } : {}),
      },
      include: {
        branch: true,
        _count: { select: { ledgerEntries: true } },
      },
      orderBy: { code: "asc" },
    });

    // Group by category (ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE)
    const grouped = {
      ASSET: accounts.filter((a) => a.type === "ASSET"),
      LIABILITY: accounts.filter((a) => a.type === "LIABILITY"),
      EQUITY: accounts.filter((a) => a.type === "EQUITY"),
      REVENUE: accounts.filter((a) => a.type === "REVENUE"),
      EXPENSE: accounts.filter((a) => a.type === "EXPENSE"),
    };

    return NextResponse.json({ accounts, grouped });
  } catch (error) {
    console.error("GET accounts error:", error);
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}
