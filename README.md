# 🕌 Al-Haramain Travel & Umrah ERP

**A complete, production-ready CRM + ERP web application for Hajj/Umrah & Travel Agencies in Pakistan.**

Built with Next.js 14+ App Router, TypeScript, Tailwind CSS, shadcn/ui, Prisma ORM (SQLite locally / PostgreSQL in production), NextAuth JWT authentication, double-entry accounting engine, and role-based dashboards for 7 distinct user roles.

---

## 📋 Table of Contents

1. [Tech Stack](#tech-stack)
2. [Features Overview](#features-overview)
3. [Quick Start (Local Setup)](#quick-start-local-setup)
4. [Environment Variables](#environment-variables)
5. [Demo Login Credentials](#demo-login-credentials)
6. [Module Guide](#module-guide)
7. [RBAC — Role-Based Access Control](#rbac--role-based-access-control)
8. [Database Architecture](#database-architecture)
9. [API Endpoints Reference](#api-endpoints-reference)
10. [Migrating to PostgreSQL (Production)](#migrating-to-postgresql-production)
11. [Project Structure](#project-structure)
12. [PDF Generation](#pdf-generation)
13. [File Uploads](#file-uploads)
14. [Accounting Engine](#accounting-engine)

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14+ (App Router) + TypeScript |
| **UI Components** | Tailwind CSS + shadcn/ui |
| **ORM** | Prisma 5.22 |
| **Database (Local)** | SQLite (`prisma/dev.db`) |
| **Database (Production)** | PostgreSQL (schema in `prisma/schema.postgresql.prisma`) |
| **Authentication** | NextAuth.js v4 (Credentials + JWT sessions) |
| **Validation** | Zod |
| **Forms** | React Hook Form |
| **Charts** | Recharts |
| **Tables** | TanStack Table / native HTML tables |
| **PDF / Print** | CSS print media + `window.print()` |
| **Excel Export** | XLSX / CSV export |
| **Passwords** | bcrypt |

---

## ✨ Features Overview

### Core Modules
- **👥 Customers & Passports** — Pilgrim profiles, passport scans, 6-month expiry alerts, CNIC/vaccine uploads
- **✈️ Airline & Ticketing** — Airline groups (PNR, seat tracking), single tickets, e-ticket PDF, supplier ledger
- **🏨 Hotels** — Makkah & Madinah hotel master, room types, season rates, hotel bookings, voucher PDF
- **📦 Packages** — Umrah/Hajj packages with cost sheet auto-calculator, booking lifecycle (6 stages), tax invoice PDF
- **🛂 Visa & Nusuk** — Visa application tracking, bulk status updates, Nusuk/Rawdah permit management, Excel export
- **💰 Accounting** — Full double-entry engine, chart of accounts, journal entries, customer/supplier ledgers, Cash & Bank books
- **📊 Reports** — P&L, Trial Balance, Balance Sheet, branch sales, package-wise profit — export to Excel/PDF
- **🔄 Refunds** — Full refund flow for tickets, hotels, packages with penalty calculation and auto-reversing ledger entries
- **🚚 Suppliers** — Airline, hotel, visa, transport supplier master with payable balance tracking
- **🏢 Branches & Staff** — Multi-branch network, staff directory, commission rates, performance targets
- **📋 Audit Logs** — Immutable trail of every action with filters and CSV export
- **🔔 Notifications** — Passport expiry, payment due, visa status, group deadline alerts
- **🔍 Global Search** — Search by passenger name, passport number, CNIC, PNR, booking ID
- **⚙️ System Settings** — Company profile, invoice numbering, currency exchange rates, tax, terms

---

## 🛠 Quick Start (Local Setup)

### Prerequisites
- **Node.js** v18+ (tested on v24.16.0)
- **npm** v9+ (tested on v12)
- No PostgreSQL or Docker required for local development (uses SQLite)

### Step 1 — Clone & Install
```bash
git clone https://github.com/UB-Developer/nht-crm
cd next-crm
npm install
```

### Step 2 — Create `.env` file
```bash
cp .env.example .env
```
Or create `.env` manually (see [Environment Variables](#environment-variables) below).

### Step 3 — Push Prisma schema to SQLite
```bash
npx prisma db push
```

### Step 4 — Seed the database
```bash
npm run seed
```
This creates 3 branches, 8 users across all 7 roles, airlines, hotels, packages, customers, bookings, chart of accounts, and demo financial entries.

### Step 5 — Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### Step 6 — Login
Go to [http://localhost:3000/login](http://localhost:3000/login) and use any demo credential below, or click a **Quick Fill** button on the login page.

---

## 🔐 Environment Variables

Create a `.env` file in the project root:

```env
# Database (SQLite for local dev)
DATABASE_URL="file:./prisma/dev.db"

# NextAuth
NEXTAUTH_SECRET="your-super-secret-32-char-minimum-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Optional: File upload size limit (default 10MB)
MAX_UPLOAD_SIZE_MB=10
```

### For production (PostgreSQL), use:
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/alharamain_crm?schema=public"
NEXTAUTH_SECRET="your-production-secret-32-chars-min"
NEXTAUTH_URL="https://yourdomain.com"
```

---

## 🔑 Demo Login Credentials

All passwords use the format shown. The login page has **Quick Fill** buttons for each role.

| Role | Name | Email | Password |
|------|------|-------|----------|
| **Super Admin** | Sheikh Abdul Rehman (CEO) | `superadmin@alharamain.pk` | `Admin@123` |
| **Admin** | Hamza Tariq (Operations Admin) | `admin@alharamain.pk` | `Admin@123` |
| **Branch Manager** | Tariq Mahmood (KHI) | `karachi.manager@alharamain.pk` | `Manager@123` |
| **Branch Manager** | Farhan Saeed (LHE) | `lahore.manager@alharamain.pk` | `Manager@123` |
| **Accountant** | Muhammad Bilal | `accounts@alharamain.pk` | `Accounts@123` |
| **Ticket Manager** | Adnan Siddiqui | `tickets@alharamain.pk` | `Tickets@123` |
| **Hotel Manager** | Khurram Qureshi | `hotels@alharamain.pk` | `Hotels@123` |
| **Staff (KHI)** | Usman Raza | `agent.khi@alharamain.pk` | `Agent@123` |
| **Staff (LHE)** | Ali Hassan | `agent.lhe@alharamain.pk` | `Agent@123` |

---

## 📁 Module Guide

### 1. Customers & Passports
- **List**: `/customers` — Filter by branch, search by name/CNIC/phone, passport expiry alerts
- **New**: `/customers/new` — Full onboarding form with document upload (passport scan, photo, CNIC, vaccine)
- **View**: `/customers/[id]` — Profile with all linked bookings, visas, Nusuk records

### 2. Airline Groups & Tickets
- **Groups**: `/airline-groups` — Active group allotments, seat progress, deadlines
- **New Group**: `/airline-groups/new` — Create group with live margin calculator
- **Group Detail**: `/airline-groups/[id]` — Passenger manifest, add passenger modal
- **Single Tickets**: `/tickets` — Directory with margins, e-ticket print
- **Issue Ticket**: `/tickets/new` — Issue from supplier with cost/selling price
- **E-Ticket PDF**: `/tickets/[id]/eticket` — Printable official e-ticket / itinerary

### 3. Hotels
- **Hotels**: `/hotels` — Makkah/Madinah properties directory
- **Add Hotel**: `/hotels/new` — Property details form
- **Bookings**: `/hotels/bookings` — All hotel reservations
- **New Booking**: `/hotels/bookings/new` — Book rooms with auto-calculated nights
- **Voucher PDF**: `/hotels/bookings/[id]/voucher` — Printable hotel voucher

### 4. Packages & Bookings
- **Packages**: `/packages` — Catalogue with sharing rates
- **New Package**: `/packages/new` — Create with cost sheet auto-calculator
- **Bookings**: `/bookings` — All bookings with lifecycle status
- **New Booking**: `/bookings/new` — Package booking with family manifest
- **Booking Detail**: `/bookings/[id]` — Full detail with workflow stepper
- **Tax Invoice PDF**: `/bookings/[id]/invoice` — Official invoice/voucher

### 5. Visa & Nusuk
- **Visa**: `/visas` — Processing board with bulk status update
- **Nusuk**: `/nusuk` — Rawdah Tasreeh manager with Excel export

### 6. Accounting & Finance
- **Accounts (CoA)**: `/accounts` — Chart of accounts with live balances
- **New JV**: `/accounts/journal-entry/new` — Manual double-entry posting
- **Ledgers**: `/ledgers` — General Daybook, Customer, Supplier, Cash & Bank books (Excel export)
- **Reports**: `/reports` — P&L, Trial Balance, Balance Sheet, Branch Performance
- **Refunds**: `/refunds` — Refund approval desk with auto ledger reversal

### 7. Management & Admin
- **Suppliers**: `/suppliers` — Vendor master with payable balances
- **Branches & Staff**: `/branches` — Branch network + staff directory + commission matrix
- **Audit Logs**: `/audit-logs` — Searchable, filterable audit trail with CSV export
- **Notifications**: `/notifications` — All alerts with mark-read functionality
- **Search**: `/search` — Global cross-module search
- **Settings**: `/settings` — Company profile, invoicing, currency, notifications, terms

---

## 👤 RBAC — Role-Based Access Control

Each role has:
1. **Its own dashboard** with relevant KPIs and widgets
2. **Its own sidebar navigation** (role-filtered)
3. **Route-level protection** (server-side session check + redirect)
4. **API-level protection** (role checks in API routes)
5. **Data isolation** (Branch Managers only see own branch data)

| Module | Super Admin | Admin | Branch Mgr | Accountant | Ticket Mgr | Hotel Mgr | Staff |
|--------|:-----------:|:-----:|:----------:|:----------:|:----------:|:---------:|:-----:|
| Executive Dashboard | ✅ | ✅ | | | | | |
| Branch Dashboard | | | ✅ | | | | |
| Accounts Dashboard | | | | ✅ | | | |
| Ticketing Desk | | | | | ✅ | | |
| Hotels Desk | | | | | | ✅ | |
| Sales Agent Desk | | | | | | | ✅ |
| Customers | ✅ | ✅ | ✅ | ✅ | | | ✅ |
| Packages | ✅ | ✅ | ✅ | | ✅ | ✅ | ✅ |
| Bookings | ✅ | ✅ | ✅ | ✅ | | | ✅ |
| Airline Groups | ✅ | ✅ | ✅ | | ✅ | | |
| Single Tickets | ✅ | ✅ | ✅ | | ✅ | | ✅ |
| Hotels | ✅ | ✅ | ✅ | | | ✅ | |
| Visa | ✅ | ✅ | ✅ | | | | ✅ |
| Nusuk | ✅ | ✅ | ✅ | | | | ✅ |
| Accounts / CoA | ✅ | ✅ | | ✅ | | | |
| Ledgers | ✅ | ✅ | ✅ | ✅ | | | |
| Reports | ✅ | ✅ | | ✅ | | | |
| Refunds | ✅ | ✅ | | ✅ | ✅ | ✅ | |
| Suppliers | ✅ | ✅ | | ✅ | ✅ | ✅ | |
| Branches & Staff | ✅ | ✅ | | | | | |
| Audit Logs | ✅ | ✅ | | | | | |
| Settings | ✅ | ✅ | | | | | |

---

## 🗄 Database Architecture

### Prisma Schema — Key Models

```
Branch          → Users, Customers, Groups, Tickets, HotelBookings,
                  PackageBookings, JournalEntries, Payments, Receipts,
                  Refunds, Expenses, AuditLogs

User            → PackageBookings (createdBy), JournalEntries,
                  Payments, Receipts, Refunds (approver),
                  Expenses, Notifications, AuditLogs

Customer        → Passports, GroupPassengers, Tickets,
                  HotelBookings, PackageBookings, Pilgrims,
                  Visas, NusukRecords, Receipts, Refunds, LedgerEntries

Airline         → Routes, Flights, Groups, Packages
Supplier        → Groups, Tickets, HotelBookings, Visas,
                  Payments, Refunds, LedgerEntries

Group           → GroupPassengers, Packages
Hotel           → Rooms, HotelBookings, Packages (Makkah + Madinah)
Package         → PackageBookings
PackageBooking  → Pilgrims, Visas, Nusuk, Receipts

Account (CoA)   → JournalEntries, LedgerEntries, Payments, Receipts, Expenses
JournalEntry    → LedgerEntries (Dr/Cr pairs)

Notification    → User
AuditLog        → User, Branch
```

### Soft Deletes
All major models have `isDeleted Boolean @default(false)` and `updatedAt`. Queries filter `{ isDeleted: false }`.

### Indexes
Indexed fields: `email`, `role`, `cnic`, `passportNumber`, `pnr`, `ticketNumber`, `bookingNumber`, `type`, `status`, `branchId`, `createdAt`.

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/[...nextauth]` | NextAuth login/logout |
| GET/POST | `/api/customers` | Customer CRUD |
| POST | `/api/upload` | File upload (passports, photos) |
| GET/POST | `/api/airline-groups` | Airline group management |
| POST | `/api/airline-groups/[id]/passengers` | Add passenger to group |
| GET/POST | `/api/tickets` | Single ticket CRUD |
| GET/POST | `/api/hotels` | Hotel property CRUD |
| GET/POST | `/api/hotel-bookings` | Hotel reservation CRUD |
| GET/POST | `/api/packages` | Package CRUD |
| GET/POST | `/api/package-bookings` | Package booking CRUD |
| PATCH | `/api/package-bookings/[id]` | Booking lifecycle transition |
| GET/POST | `/api/visas` | Visa application CRUD |
| GET/POST | `/api/nusuk` | Nusuk permit CRUD |
| GET/POST | `/api/accounts` | Chart of accounts |
| POST | `/api/accounts/journal-entries` | Post double-entry JV |
| GET/POST | `/api/refunds` | Refund management |
| GET | `/api/reports` | Financial reports (TB, P&L, BS) |
| GET/POST | `/api/suppliers` | Supplier CRUD |
| GET/POST | `/api/branches` | Branch management |
| GET/POST/PATCH | `/api/users` | Staff/user management |
| GET/POST | `/api/audit-logs` | Audit log access |
| GET/POST | `/api/settings` | System settings |
| GET | `/api/search` | Global cross-module search |
| GET/PATCH | `/api/notifications` | Notification management |

---

## 🐘 Migrating to PostgreSQL (Production)

1. **Replace** `prisma/schema.prisma` with `prisma/schema.postgresql.prisma`:
   ```bash
   copy prisma\schema.postgresql.prisma prisma\schema.prisma
   ```

2. **Update `.env`**:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/alharamain_crm?schema=public"
   ```

3. **Run migrations**:
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Re-seed**:
   ```bash
   npm run seed
   ```

5. **Build & Deploy**:
   ```bash
   npm run build
   npm start
   ```

### Recommended PostgreSQL Hosts
- **Supabase** (free tier, 500MB) — best for this project
- **Railway** (5GB free)
- **Neon** (serverless PostgreSQL, free tier)
- **Self-hosted** on VPS (DigitalOcean, Vultr)

---

## 📁 Project Structure

```
next-crm/
├── prisma/
│   ├── schema.prisma              # Active schema (SQLite)
│   ├── schema.postgresql.prisma   # Production schema (PostgreSQL)
│   ├── seed.ts                    # Demo data seed script
│   └── dev.db                     # SQLite database file
│
├── src/
│   ├── app/
│   │   ├── (erp)/                 # Protected ERP routes (layout with sidebar)
│   │   │   ├── layout.tsx         # ERP shell with auth guard
│   │   │   ├── dashboard/
│   │   │   │   ├── admin/         # Executive dashboard (SUPER_ADMIN, ADMIN)
│   │   │   │   ├── branch/        # Branch dashboard (BRANCH_MANAGER)
│   │   │   │   ├── accountant/    # Accounts dashboard (ACCOUNTANT)
│   │   │   │   ├── tickets/       # Ticketing desk (TICKET_MANAGER)
│   │   │   │   ├── hotels/        # Hotels desk (HOTEL_MANAGER)
│   │   │   │   └── staff/         # Sales agent desk (STAFF)
│   │   │   ├── customers/         # Pilgrim management + passport uploads
│   │   │   ├── airline-groups/    # Group allotments + passenger manifest
│   │   │   ├── tickets/           # Single tickets + e-ticket PDF
│   │   │   ├── hotels/            # Hotel master + bookings + voucher PDF
│   │   │   ├── packages/          # Package catalogue + cost sheet
│   │   │   ├── bookings/          # Package bookings + lifecycle + invoice PDF
│   │   │   ├── visas/             # Visa processing board
│   │   │   ├── nusuk/             # Nusuk & Rawdah permit manager
│   │   │   ├── accounts/          # Chart of accounts + JV entry
│   │   │   ├── ledgers/           # Sub-ledger center (General, Customer, Supplier, Cash)
│   │   │   ├── reports/           # P&L, Trial Balance, Balance Sheet
│   │   │   ├── refunds/           # Refund approval desk
│   │   │   ├── suppliers/         # Supplier/vendor master
│   │   │   ├── branches/          # Branch network + staff directory
│   │   │   ├── audit-logs/        # Audit trail with CSV export
│   │   │   ├── notifications/     # Alert center
│   │   │   ├── search/            # Global search results
│   │   │   └── settings/          # System configuration
│   │   │
│   │   ├── api/                   # Next.js API routes
│   │   │   ├── auth/[...nextauth] # NextAuth handlers
│   │   │   ├── customers/         # Customer API
│   │   │   ├── upload/            # File upload API
│   │   │   ├── airline-groups/    # Group + passenger APIs
│   │   │   ├── tickets/           # Ticket API
│   │   │   ├── hotels/            # Hotel API
│   │   │   ├── hotel-bookings/    # Hotel booking API
│   │   │   ├── packages/          # Package API
│   │   │   ├── package-bookings/  # Booking lifecycle API
│   │   │   ├── visas/             # Visa API
│   │   │   ├── nusuk/             # Nusuk API
│   │   │   ├── accounts/          # CoA + JV APIs
│   │   │   ├── reports/           # Financial reports API
│   │   │   ├── refunds/           # Refund API
│   │   │   ├── suppliers/         # Supplier API
│   │   │   ├── branches/          # Branch API
│   │   │   ├── users/             # Staff/user API
│   │   │   ├── audit-logs/        # Audit log API
│   │   │   ├── notifications/     # Notification API
│   │   │   ├── search/            # Global search API
│   │   │   └── settings/          # Settings API
│   │   │
│   │   ├── login/                 # Login page with quick-fill buttons
│   │   └── page.tsx               # Root redirector (role-based)
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx       # Main layout shell (sidebar + topbar)
│   │   │   ├── Sidebar.tsx        # Role-filtered navigation sidebar
│   │   │   └── Topbar.tsx         # Search bar, notifications, theme toggle
│   │   ├── providers/
│   │   │   ├── ThemeProvider.tsx  # Dark/light mode context
│   │   │   └── SessionProvider.tsx # NextAuth session wrapper
│   │   └── ui/                    # shadcn/ui components (button, badge, etc.)
│   │
│   ├── lib/
│   │   ├── auth.ts                # NextAuth configuration (credentials + JWT)
│   │   ├── prisma.ts              # Prisma client singleton
│   │   └── utils.ts               # cn() and shared utilities
│   │
│   └── types/
│       ├── roles.ts               # UserRole enum, ROLE_CONFIGS, NAVIGATION_ITEMS
│       └── next-auth.d.ts         # NextAuth session type extensions
│
├── public/
│   └── uploads/                   # Uploaded files (passports, photos, CNICs)
│
├── data/
│   └── settings.json              # System settings persistence
│
├── .env                           # Environment variables (not committed)
├── .env.example                   # Template for environment variables
├── next.config.ts                 # Next.js configuration
├── tailwind.config.ts             # Tailwind CSS configuration
├── tsconfig.json                  # TypeScript configuration
└── README.md                      # This file
```

---

## 📄 PDF Generation

PDFs are generated using the browser's native **print dialog** (`window.print()`). Each printable page has dedicated **`@media print`** CSS that:
- Hides sidebar, topbar, and action buttons
- Optimizes layout for A4 paper
- Includes company header, barcode placeholder, and terms footer

### Printable Pages
| Document | URL Pattern |
|----------|-------------|
| E-Ticket / Itinerary | `/tickets/[id]/eticket` |
| Hotel Accommodation Voucher | `/hotels/bookings/[id]/voucher` |
| Umrah Package Tax Invoice | `/bookings/[id]/invoice` |

---

## 📎 File Uploads

Files are stored in `public/uploads/` organized by type:
```
public/uploads/
├── passports/     # Passport scans
├── photos/        # Pilgrim photos
├── cnics/         # CNIC scans
└── vaccines/      # Vaccination certificates
```

The upload endpoint `POST /api/upload` accepts `multipart/form-data` with field name `file` and a `type` query parameter.

**For production**, replace with an S3-compatible adapter (AWS S3, Cloudflare R2, MinIO) by updating `src/app/api/upload/route.ts`.

---

## 💰 Accounting Engine

The double-entry engine auto-posts journal entries for every transaction:

### Auto-Posted Transactions

| Event | Debit | Credit |
|-------|-------|--------|
| Package Booking Created | Accounts Receivable (1004) | Package Sales Revenue (4001) + Cost of Sales (5001) |
| Receipt Posted | Cash (1001) or Bank (1002) | Accounts Receivable (1004) |
| Ticket Issued | Receivable (1004) | Ticket Sales (4002) |
| Hotel Booking | Receivable (1004) | Hotel Revenue |
| Supplier Payment | Accounts Payable (2001) | Cash/Bank |
| Refund Approved | Reverse all original entries | Penalty retained as income |

### Chart of Accounts (Seed Data)
| Code | Account | Type |
|------|---------|------|
| 1001 | Cash in Hand (PKR) | Asset |
| 1002 | Bank — HBL Current | Asset |
| 1003 | Bank — MCB Business | Asset |
| 1004 | Accounts Receivable | Asset |
| 2001 | Accounts Payable — Suppliers | Liability |
| 3001 | Share Capital | Equity |
| 4001 | Package Sales Revenue | Revenue |
| 4002 | Ticket Sales Revenue | Revenue |
| 4003 | Hotel Revenue | Revenue |
| 4004 | Visa Revenue | Revenue |
| 5001 | Cost of Airline Seats | Expense |
| 5002 | Cost of Hotel Rooms | Expense |
| 6001 | Operating Expenses | Expense |

---

## 🔧 Common Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Reset & re-seed database
npx prisma db push --force-reset
npm run seed

# Open Prisma Studio (database GUI)
npx prisma studio

# Generate Prisma client after schema changes
npx prisma generate

# Lint check
npm run lint
```

---

## 📞 Support & Customization

This ERP is fully customizable. Key extension points:
- **Add a new module**: Create a new folder under `src/app/(erp)/`, add an API route, and add the nav item to `src/types/roles.ts`
- **Add a new role**: Extend `UserRole` enum, add `ROLE_CONFIGS` entry, and update `NAVIGATION_ITEMS`
- **Integrate WhatsApp API**: Replace the WA link generator in topbar with Twilio/WhatsApp Business API calls
- **Add email notifications**: Integrate Nodemailer or Resend in the notification triggers
- **Multi-currency live rates**: Replace static exchange rates with Fixer.io or Open Exchange Rates API calls

---

*Built for Pakistani Hajj & Umrah travel agencies — may your pilgrims' journeys be blessed.* 🕌
