"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  UserPlus,
  Upload,
  FileCheck2,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const customerFormSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  cnic: z.string().optional(),
  phone: z.string().min(10, "Phone number is required"),
  whatsapp: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  city: z.string().default("Karachi"),
  address: z.string().optional(),
  notes: z.string().optional(),

  // Passport Section
  includePassport: z.boolean().default(true),
  passportNumber: z.string().min(5, "Passport number required"),
  surname: z.string().min(1, "Surname required"),
  givenNames: z.string().min(1, "Given names required"),
  nationality: z.string().default("PAK"),
  gender: z.string().default("MALE"),
  dateOfBirth: z.string().min(1, "Date of birth required"),
  placeOfBirth: z.string().default("KARACHI"),
  issueDate: z.string().min(1, "Issue date required"),
  expiryDate: z.string().min(1, "Expiry date required"),
});

type CustomerFormData = z.infer<typeof customerFormSchema>;

export default function NewCustomerPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Uploaded file URLs
  const [passportScanUrl, setPassportScanUrl] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [cnicScanUrl, setCnicScanUrl] = useState<string | null>(null);
  const [vaccineScanUrl, setVaccineScanUrl] = useState<string | null>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "+92 ",
      city: "Karachi",
      nationality: "PAK",
      gender: "MALE",
      includePassport: true,
      placeOfBirth: "KARACHI",
    },
  });

  const expiryDate = watch("expiryDate");
  const isExpiringSoon = expiryDate
    ? (new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24 * 30) < 6
    : false;

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "passport" | "photo" | "cnic" | "vaccine"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(field);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", field);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.url) {
        if (field === "passport") setPassportScanUrl(data.url);
        if (field === "photo") setPhotoUrl(data.url);
        if (field === "cnic") setCnicScanUrl(data.url);
        if (field === "vaccine") setVaccineScanUrl(data.url);
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploadingField(null);
    }
  };

  const onSubmit = async (values: CustomerFormData) => {
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        firstName: values.firstName,
        lastName: values.lastName,
        cnic: values.cnic,
        phone: values.phone,
        whatsapp: values.whatsapp || values.phone,
        email: values.email || undefined,
        city: values.city,
        address: values.address,
        notes: values.notes,
        passport: values.includePassport
          ? {
              passportNumber: values.passportNumber,
              surname: values.surname,
              givenNames: values.givenNames,
              nationality: values.nationality,
              issueDate: values.issueDate,
              expiryDate: values.expiryDate,
              dateOfBirth: values.dateOfBirth,
              gender: values.gender,
              placeOfBirth: values.placeOfBirth,
              passportScanUrl,
              photoUrl,
              cnicScanUrl,
              vaccineScanUrl,
            }
          : undefined,
      };

      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to register pilgrim");
      }

      router.push(`/customers/${result.customer.id}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Submission failed");
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button and page title */}
      <div className="flex items-center gap-3 border-b pb-4">
        <Link href="/customers">
          <Button size="sm" variant="outline" className="gap-1 text-xs">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Directory
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Register New Pilgrim</h1>
          <p className="text-xs text-muted-foreground">
            Onboard customer, capture biometrics/documents, and scan passport details.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 text-xs flex items-center gap-2 border border-red-200 dark:border-red-800">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Customer Personal Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">1. Pilgrim Personal & Contact Information</CardTitle>
            <CardDescription className="text-xs">Basic Pakistani contact details and CNIC</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">First / Given Name *</label>
                <Input {...register("firstName")} placeholder="Muhammad" />
                {errors.firstName && (
                  <p className="text-[11px] text-red-500 mt-1">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Last / Family Name *</label>
                <Input {...register("lastName")} placeholder="Iqbal" />
                {errors.lastName && (
                  <p className="text-[11px] text-red-500 mt-1">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">Pakistani CNIC (National ID)</label>
                <Input {...register("cnic")} placeholder="42101-1234567-1" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Mobile Phone *</label>
                <Input {...register("phone")} placeholder="+92 300 1234567" />
                {errors.phone && (
                  <p className="text-[11px] text-red-500 mt-1">{errors.phone.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">WhatsApp Number</label>
                <Input {...register("whatsapp")} placeholder="+92 300 1234567" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">Email Address</label>
                <Input {...register("email")} type="email" placeholder="pilgrim@gmail.com" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">City in Pakistan</label>
                <select
                  {...register("city")}
                  className="w-full text-xs h-9 border rounded-md px-3 bg-background"
                >
                  <option value="Karachi">Karachi</option>
                  <option value="Lahore">Lahore</option>
                  <option value="Islamabad">Islamabad</option>
                  <option value="Rawalpindi">Rawalpindi</option>
                  <option value="Peshawar">Peshawar</option>
                  <option value="Multan">Multan</option>
                  <option value="Faisalabad">Faisalabad</option>
                  <option value="Quetta">Quetta</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Residential Address</label>
              <Input {...register("address")} placeholder="House #, Street, Block, Area..." />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Passport Information with 6-month validity warning */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">2. Passport Information & Scans</CardTitle>
                <CardDescription className="text-xs">
                  Official travel document required for Umrah/Hajj e-Visa and Nusuk permit
                </CardDescription>
              </div>
              {isExpiringSoon && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 text-amber-700 border border-amber-300 text-xs font-bold animate-pulse">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Warning: Less than 6 Months Validity!</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">Passport Number *</label>
                <Input
                  {...register("passportNumber")}
                  placeholder="AL1234567"
                  className="font-mono uppercase"
                />
                {errors.passportNumber && (
                  <p className="text-[11px] text-red-500 mt-1">{errors.passportNumber.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Surname (as in Passport) *</label>
                <Input {...register("surname")} placeholder="IQBAL" className="uppercase" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Given Names *</label>
                <Input {...register("givenNames")} placeholder="MUHAMMAD" className="uppercase" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">Date of Birth *</label>
                <Input {...register("dateOfBirth")} type="date" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Gender *</label>
                <select
                  {...register("gender")}
                  className="w-full text-xs h-9 border rounded-md px-3 bg-background"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Date of Issue *</label>
                <Input {...register("issueDate")} type="date" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Date of Expiry *</label>
                <Input
                  {...register("expiryDate")}
                  type="date"
                  className={isExpiringSoon ? "border-amber-500 focus-visible:ring-amber-500" : ""}
                />
              </div>
            </div>

            {/* Document Upload Dropzones */}
            <div className="pt-2">
              <label className="block text-xs font-semibold mb-2">
                Document Uploads (Passport Scan, Photo, CNIC & Vaccine)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Passport Scan */}
                <div className="border border-dashed rounded-lg p-3 text-center bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="flex justify-center mb-1 text-slate-500">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="text-[11px] font-semibold">Passport Scan</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">PDF or JPG</div>
                  {passportScanUrl ? (
                    <div className="mt-2 text-emerald-600 text-[10px] font-semibold flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Uploaded
                    </div>
                  ) : (
                    <label className="mt-2 inline-block cursor-pointer bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-semibold px-2 py-1 rounded">
                      {uploadingField === "passport" ? "Uploading..." : "Choose File"}
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(e, "passport")}
                      />
                    </label>
                  )}
                </div>

                {/* Pilgrim Photo */}
                <div className="border border-dashed rounded-lg p-3 text-center bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="flex justify-center mb-1 text-slate-500">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <div className="text-[11px] font-semibold">Passport Photo</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">White BG 4x6cm</div>
                  {photoUrl ? (
                    <div className="mt-2 text-emerald-600 text-[10px] font-semibold flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Uploaded
                    </div>
                  ) : (
                    <label className="mt-2 inline-block cursor-pointer bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-semibold px-2 py-1 rounded">
                      {uploadingField === "photo" ? "Uploading..." : "Choose File"}
                      <input
                        type="file"
                        className="hidden"
                        accept=".jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(e, "photo")}
                      />
                    </label>
                  )}
                </div>

                {/* CNIC Scan */}
                <div className="border border-dashed rounded-lg p-3 text-center bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="flex justify-center mb-1 text-slate-500">
                    <FileCheck2 className="w-6 h-6" />
                  </div>
                  <div className="text-[11px] font-semibold">CNIC Scan</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Front/Back</div>
                  {cnicScanUrl ? (
                    <div className="mt-2 text-emerald-600 text-[10px] font-semibold flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Uploaded
                    </div>
                  ) : (
                    <label className="mt-2 inline-block cursor-pointer bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-semibold px-2 py-1 rounded">
                      {uploadingField === "cnic" ? "Uploading..." : "Choose File"}
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(e, "cnic")}
                      />
                    </label>
                  )}
                </div>

                {/* Vaccine Document */}
                <div className="border border-dashed rounded-lg p-3 text-center bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="flex justify-center mb-1 text-slate-500">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-[11px] font-semibold">Polio/Meningitis</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Vaccination Card</div>
                  {vaccineScanUrl ? (
                    <div className="mt-2 text-emerald-600 text-[10px] font-semibold flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Uploaded
                    </div>
                  ) : (
                    <label className="mt-2 inline-block cursor-pointer bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-semibold px-2 py-1 rounded">
                      {uploadingField === "vaccine" ? "Uploading..." : "Choose File"}
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(e, "vaccine")}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/customers">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-emerald-700 hover:bg-emerald-800 text-white min-w-32"
          >
            {submitting ? "Saving Pilgrim..." : "Save & Register Pilgrim"}
          </Button>
        </div>
      </form>
    </div>
  );
}
