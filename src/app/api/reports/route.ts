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
    const reportType = searchParams.get("type") || "ALL";

    const [accounts, bookings, tickets, hotelBookings, branches, expenses] =
      await Promise.all([
        prisma.account.findMany({
          where: { isDeleted: false },
          include: { branch: true },
          orderBy: { code: "asc" },
        }),
        prisma.packageBooking.findMany({
          where: { isDeleted: false },
          include: { package: true, branch: true, createdBy: true },
        }),
        prisma.ticket.findMany({
          where: { isDeleted: false },
          include: { branch: true },
        }),
        prisma.hotelBooking.findMany({
          where: { isDeleted: false },
          include: { branch: true },
        }),
        prisma.branch.findMany({
          where: { isDeleted: false },
        }),
        prisma.expense.findMany({
          where: { isDeleted: false },
        }),
      ]);

    // 1. Trial Balance Computation
    const trialBalance = accounts.map((acc) => {
      const isDebitNature = acc.type === "ASSET" || acc.type === "EXPENSE";
      const debit = isDebitNature ? Math.max(0, acc.balance) : 0;
      const credit = !isDebitNature ? Math.max(0, acc.balance) : 0;

      return {
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        subType: acc.subType,
        debit,
        credit,
        branch: acc.branch?.name || "Corporate Head Office",
      };
    });

    const totalDebit = trialBalance.reduce((s, a) => s + a.debit, 0);
    const totalCredit = trialBalance.reduce((s, a) => s + a.credit, 0);

    // 2. Profit & Loss Computation
    const revenueAccounts = accounts.filter((a) => a.type === "REVENUE");
    const costAccounts = accounts.filter((a) => a.subType === "COST_OF_SALES");
    const operatingExpenses = accounts.filter(
      (a) => a.subType === "OPERATING_EXPENSE"
    );

    const totalRevenue = revenueAccounts.reduce((s, a) => s + a.balance, 0);
    const totalCostOfSales = costAccounts.reduce((s, a) => s + a.balance, 0);
    const grossProfit = totalRevenue - totalCostOfSales;
    const totalOperatingExpenses = operatingExpenses.reduce(
      (s, a) => s + a.balance,
      0
    );
    const netProfit = grossProfit - totalOperatingExpenses;

    // 3. Balance Sheet Computation
    const assets = accounts.filter((a) => a.type === "ASSET");
    const liabilities = accounts.filter((a) => a.type === "LIABILITY");
    const equity = accounts.filter((a) => a.type === "EQUITY");

    const totalAssets = assets.reduce((s, a) => s + a.balance, 0);
    const totalLiabilities = liabilities.reduce((s, a) => s + a.balance, 0);
    const totalEquity = equity.reduce((s, a) => s + a.balance, 0) + netProfit;

    // 4. Branch-wise sales
    const branchSales = branches.map((b) => {
      const branchBkgs = bookings.filter((bk) => bk.branchId === b.id);
      const branchTkts = tickets.filter((tk) => tk.branchId === b.id);
      const bkgTotal = branchBkgs.reduce((s, bk) => s + bk.totalAmount, 0);
      const tktTotal = branchTkts.reduce((s, tk) => s + tk.sellingPrice, 0);

      return {
        branchId: b.id,
        branchName: b.name,
        city: b.city,
        totalSales: bkgTotal + tktTotal,
        bookingsCount: branchBkgs.length,
        ticketsCount: branchTkts.length,
      };
    });

    return NextResponse.json({
      trialBalance: {
        accounts: trialBalance,
        totalDebit,
        totalCredit,
        isBalanced: Math.abs(totalDebit - totalCredit) < 1,
      },
      profitAndLoss: {
        revenueAccounts,
        totalRevenue,
        costAccounts,
        totalCostOfSales,
        grossProfit,
        operatingExpenses,
        totalOperatingExpenses,
        netProfit,
        netMarginPercentage:
          totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0",
      },
      balanceSheet: {
        assets,
        totalAssets,
        liabilities,
        totalLiabilities,
        equity,
        totalEquity,
        isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1,
      },
      branchSales,
    });
  } catch (error) {
    console.error("GET reports error:", error);
    return NextResponse.json({ error: "Failed to generate financial reports" }, { status: 500 });
  }
}
