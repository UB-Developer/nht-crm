import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";
import { z } from "zod";

// Settings are stored in a simple JSON file for portability
// In production, consider a DB table (Settings model).
const SETTINGS_PATH = path.join(process.cwd(), "data", "settings.json");

const DEFAULT_SETTINGS = {
  companyName: "Al-Haramain Travel & Umrah Services",
  companyNameUrdu: "الحرمین ٹریول اینڈ عمرہ سروسز",
  tagline: "Serving Hujjaj Since 2008",
  phone: "+92 21 3456 7890",
  whatsapp: "+92 300 1234567",
  email: "info@alharamain.pk",
  website: "www.alharamain.pk",
  address: "Office 301, Umrah Tower, Shahrah-e-Faisal, Karachi",
  city: "Karachi",
  country: "Pakistan",
  logoUrl: "",
  registrationNumber: "SECP-2008-0012345",
  ntn: "1234567-8",
  currency: "PKR",
  currencySAR: "SAR",
  currencyUSD: "USD",
  exchangeRateSAR: 75.5,
  exchangeRateUSD: 280.0,
  invoicePrefix: "INV",
  voucherPrefix: "VCH",
  receiptPrefix: "RV",
  paymentPrefix: "PV",
  taxRate: 0,
  taxLabel: "FED / Sales Tax (%)",
  termsAndConditions:
    "1. All bookings are subject to seat/room availability.\n2. Full payment required before visa processing.\n3. Cancellation charges apply as per airline/hotel policy.\n4. Al-Haramain is not responsible for visa rejections.\n5. Packages prices are subject to change without prior notice.",
  footerNote: "May Allah accept your Hajj & Umrah — Ameen!",
  dateFormat: "DD/MM/YYYY",
  timezone: "Asia/Karachi",
  notificationsEmail: true,
  notificationsWhatsApp: true,
  passportExpiryAlertMonths: 6,
  paymentDueReminderDays: 7,
};

function readSettings() {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) {
      const dir = path.dirname(SETTINGS_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(SETTINGS_PATH, JSON.stringify(DEFAULT_SETTINGS, null, 2));
    }
    const raw = fs.readFileSync(SETTINGS_PATH, "utf-8");
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function writeSettings(settings: object) {
  const dir = path.dirname(SETTINGS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const settings = readSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("GET settings error:", error);
    return NextResponse.json({ error: "Failed to read settings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    const body = await req.json();
    const current = readSettings();
    const updated = { ...current, ...body };
    writeSettings(updated);

    return NextResponse.json({ settings: updated, message: "Settings saved successfully" });
  } catch (error) {
    console.error("POST settings error:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
