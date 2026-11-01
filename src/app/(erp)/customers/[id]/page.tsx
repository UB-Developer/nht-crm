import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPKR, isPassportExpiringSoon } from "@/lib/utils";
import {
  ArrowLeft,
  User,
  Phone,
  MessageCircle,
  FileCheck2,
  Calendar,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  Download,
  Building,
  Plane,
  Ticket,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const customer = await prisma.customer.findUnique({
    where: { id: params.id, isDeleted: false },
    include: {
      passports: { where: { isDeleted: false } },
      packageBookings: {
        where: { isDeleted: false },
        include: { package: true, branch: true },
      },
      visas: { where: { isDeleted: false }, include: { supplier: true } },
      nusukRecords: { where: { isDeleted: false } },
      tickets: { where: { isDeleted: false } },
      branch: true,
    },
  });

  if (!customer) {
    notFound();
  }

  const primaryPassport = customer.passports[0];
  const hasExpiryAlert = primaryPassport
    ? isPassportExpiringSoon(primaryPassport.expiryDate)
    : false;

  const cleanPhone = customer.phone.replace(/[^0-9]/g, "");
  const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `Assalam o Alaikum ${customer.firstName}, greetings from Al-Haramain Travel & Umrah regarding your pilgrimage file.`
  )}`;

  return (
    <div className="space-y-6">
      {/* Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div className="flex items-center gap-3">
          <Link href="/customers">
            <Button size="sm" variant="outline" className="gap-1 text-xs">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {customer.firstName} {customer.lastName}
              </h1>
              <Badge variant="outline" className="text-xs">
                {customer.branch?.name || "General"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Customer File ID: <span className="font-mono">{customer.id}</span> • Registered on {formatDate(customer.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp Chat
          </a>
          <Link href={`/bookings/new?customerId=${customer.id}`}>
            <Button size="sm" variant="gold" className="text-xs gap-1">
              <CreditCard className="w-3.5 h-3.5" /> Book Umrah Package
            </Button>
          </Link>
        </div>
      </div>

      {/* Expiry Alert Warning Banner if < 6 Months */}
      {hasExpiryAlert && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400">
              URGENT: Passport Validity Less Than 6 Months
            </h4>
            <p className="text-xs text-amber-600 dark:text-amber-300/90 mt-0.5">
              Passport {primaryPassport?.passportNumber} expires on {formatDate(primaryPassport?.expiryDate)}. Saudi Ministry of Hajj & Umrah requires minimum 6 months validity at date of departure. Please notify the pilgrim for urgent renewal.
            </p>
          </div>
        </div>
      )}

      {/* Grid: Profile Info & Passport Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Personal Details Card */}
        <div className="md:col-span-6">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                Personal Profile & Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 border-b pb-2">
                <span className="text-muted-foreground">CNIC (National ID):</span>
                <span className="font-mono font-bold text-foreground">{customer.cnic || "Not Provided"}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-b pb-2">
                <span className="text-muted-foreground">Mobile Phone:</span>
                <span className="font-semibold text-foreground">{customer.phone}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-b pb-2">
                <span className="text-muted-foreground">WhatsApp:</span>
                <span className="font-semibold text-emerald-600">{customer.whatsapp || customer.phone}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-b pb-2">
                <span className="text-muted-foreground">Email Address:</span>
                <span className="text-foreground">{customer.email || "N/A"}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-b pb-2">
                <span className="text-muted-foreground">City:</span>
                <span className="text-foreground">{customer.city || "Pakistan"}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Address:</span>
                <span className="text-foreground">{customer.address || "N/A"}</span>
              </div>
              {customer.notes && (
                <div className="mt-2 p-2.5 rounded-lg bg-muted/40 border text-[11px]">
                  <span className="font-bold">Staff Notes:</span> {customer.notes}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Passport Card */}
        <div className="md:col-span-6">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                Linked Passport Document
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {primaryPassport ? (
                <>
                  <div className="grid grid-cols-2 gap-2 border-b pb-2">
                    <span className="text-muted-foreground">Passport Number:</span>
                    <span className="font-mono font-bold text-base text-foreground">
                      {primaryPassport.passportNumber}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-b pb-2">
                    <span className="text-muted-foreground">Surname:</span>
                    <span className="font-bold text-foreground">{primaryPassport.surname}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-b pb-2">
                    <span className="text-muted-foreground">Given Names:</span>
                    <span className="font-bold text-foreground">{primaryPassport.givenNames}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-b pb-2">
                    <span className="text-muted-foreground">Date of Birth:</span>
                    <span>{formatDate(primaryPassport.dateOfBirth)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-b pb-2">
                    <span className="text-muted-foreground">Gender & Nationality:</span>
                    <span>{primaryPassport.gender} • {primaryPassport.nationality}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-b pb-2">
                    <span className="text-muted-foreground">Date of Issue:</span>
                    <span>{formatDate(primaryPassport.issueDate)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pb-1">
                    <span className="text-muted-foreground">Date of Expiry:</span>
                    <span className={hasExpiryAlert ? "font-bold text-amber-600" : "font-semibold"}>
                      {formatDate(primaryPassport.expiryDate)}
                    </span>
                  </div>

                  {primaryPassport.passportScanUrl && (
                    <div className="pt-2 border-t flex items-center justify-between">
                      <span className="text-muted-foreground text-[11px]">Passport Scan:</span>
                      <a
                        href={primaryPassport.passportScanUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-600 hover:underline font-semibold"
                      >
                        <Download className="w-3.5 h-3.5" /> Download Scan
                      </a>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No passport record attached yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bookings & Visas History */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Bookings */}
        <div className="md:col-span-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Umrah & Hajj Package Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              {customer.packageBookings.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-6">
                  No package bookings created yet.
                </div>
              ) : (
                <div className="divide-y text-xs">
                  {customer.packageBookings.map((b) => (
                    <div key={b.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          <Link href={`/bookings/${b.id}`} className="hover:text-emerald-600">
                            {b.bookingNumber}
                          </Link>
                          <Badge variant="outline" className="text-[10px]">
                            {b.bookingStatus}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {b.package.name} ({b.roomType})
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatPKR(b.totalAmount)}</div>
                        <div className="text-[10px] text-muted-foreground">
                          Paid: {formatPKR(b.paidAmount)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Visas & Nusuk */}
        <div className="md:col-span-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Visa & Nusuk Permits</CardTitle>
            </CardHeader>
            <CardContent>
              {customer.visas.length === 0 && customer.nusukRecords.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-6">
                  No visa or Nusuk permits filed yet.
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  {customer.visas.map((v) => (
                    <div key={v.id} className="p-2.5 rounded-lg border bg-muted/20 flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{v.visaType} Electronic Visa</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Agent: {v.supplier?.name || "MOFA"} • App Date: {formatDate(v.applicationDate)}
                        </div>
                      </div>
                      <Badge variant={v.status === "APPROVED" ? "success" : "warning"} className="text-[10px]">
                        {v.status}
                      </Badge>
                    </div>
                  ))}

                  {customer.nusukRecords.map((n) => (
                    <div key={n.id} className="p-2.5 rounded-lg border bg-muted/20 flex items-center justify-between">
                      <div>
                        <div className="font-semibold">Nusuk Ref: {n.nusukRefId}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Umrah: {n.umrahPermitStatus} • Rawdah: {n.rawdahPermitStatus}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        Slot: {n.rawdahSlotDate ? formatDate(n.rawdahSlotDate) : "TBD"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
