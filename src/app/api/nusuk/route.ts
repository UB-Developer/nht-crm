import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const records = await prisma.nusuk.findMany({
      where: { isDeleted: false },
      include: {
        customer: { include: { passports: true } },
        packageBooking: { include: { package: true } },
        pilgrim: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ records });
  } catch (error) {
    console.error("GET nusuk error:", error);
    return NextResponse.json({ error: "Failed to fetch nusuk records" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { nusukIds, umrahPermitStatus, rawdahPermitStatus, rawdahSlotDate } = body;

    if (!Array.isArray(nusukIds) || nusukIds.length === 0) {
      return NextResponse.json({ error: "Invalid nusuk IDs" }, { status: 400 });
    }

    await prisma.nusuk.updateMany({
      where: { id: { in: nusukIds } },
      data: {
        ...(umrahPermitStatus ? { umrahPermitStatus } : {}),
        ...(rawdahPermitStatus ? { rawdahPermitStatus } : {}),
        ...(rawdahSlotDate ? { rawdahSlotDate: new Date(rawdahSlotDate) } : {}),
      },
    });

    // Update pilgrim nusukStatus
    const updatedNusuk = await prisma.nusuk.findMany({
      where: { id: { in: nusukIds } },
      select: { pilgrimId: true },
    });

    const pilgrimIds = updatedNusuk
      .map((n) => n.pilgrimId)
      .filter((id): id is string => Boolean(id));

    if (pilgrimIds.length > 0) {
      await prisma.pilgrim.updateMany({
        where: { id: { in: pilgrimIds } },
        data: {
          nusukStatus: rawdahPermitStatus === "APPROVED" ? "APPROVED" : "ISSUED",
        },
      });
    }

    return NextResponse.json({ success: true, count: nusukIds.length });
  } catch (error) {
    console.error("PUT nusuk error:", error);
    return NextResponse.json({ error: "Failed to update nusuk permits" }, { status: 500 });
  }
}
