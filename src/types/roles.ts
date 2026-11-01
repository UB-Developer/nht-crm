export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  BRANCH_MANAGER = "BRANCH_MANAGER",
  ACCOUNTANT = "ACCOUNTANT",
  TICKET_MANAGER = "TICKET_MANAGER",
  HOTEL_MANAGER = "HOTEL_MANAGER",
  STAFF = "STAFF",
}

export interface RoleConfig {
  name: string;
  badgeColor: string;
  defaultPath: string;
  description: string;
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  [UserRole.SUPER_ADMIN]: {
    name: "Super Admin",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300",
    defaultPath: "/dashboard/admin",
    description: "Unrestricted enterprise access, system settings, database management and global logs",
  },
  [UserRole.ADMIN]: {
    name: "Admin",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
    defaultPath: "/dashboard/admin",
    description: "Full operational control, branch oversight, user management, and executive reporting",
  },
  [UserRole.BRANCH_MANAGER]: {
    name: "Branch Manager",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300",
    defaultPath: "/dashboard/branch",
    description: "Branch sales, staff coordination, branch approvals, and cash register oversight",
  },
  [UserRole.ACCOUNTANT]: {
    name: "Accountant",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
    defaultPath: "/dashboard/accountant",
    description: "General ledger, trial balance, customer/supplier ledgers, refund approvals, and financial statements",
  },
  [UserRole.TICKET_MANAGER]: {
    name: "Ticket Manager",
    badgeColor: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300",
    defaultPath: "/dashboard/tickets",
    description: "Airlines, flights, group allocations, PNR management, e-tickets, and airline refunds",
  },
  [UserRole.HOTEL_MANAGER]: {
    name: "Hotel Manager",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300",
    defaultPath: "/dashboard/hotels",
    description: "Makkah & Madinah hotels, room inventory, season rates, vouchers, and hotel refunds",
  },
  [UserRole.STAFF]: {
    name: "Sales Agent (Staff)",
    badgeColor: "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300",
    defaultPath: "/dashboard/staff",
    description: "Customer onboarding, passport scanning, booking creation, and personal commissions",
  },
};

export interface NavItem {
  title: string;
  href: string;
  iconName: string;
  badge?: string;
  roles: UserRole[];
}

export const NAVIGATION_ITEMS: NavItem[] = [
  // Dashboards
  {
    title: "Executive Dashboard",
    href: "/dashboard/admin",
    iconName: "LayoutDashboard",
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  },
  {
    title: "Branch Dashboard",
    href: "/dashboard/branch",
    iconName: "Store",
    roles: [UserRole.BRANCH_MANAGER],
  },
  {
    title: "Accounts Dashboard",
    href: "/dashboard/accountant",
    iconName: "BadgeDollarSign",
    roles: [UserRole.ACCOUNTANT],
  },
  {
    title: "Aviation & Tickets",
    href: "/dashboard/tickets",
    iconName: "PlaneTakeoff",
    roles: [UserRole.TICKET_MANAGER],
  },
  {
    title: "Hotels & Rooms",
    href: "/dashboard/hotels",
    iconName: "Building2",
    roles: [UserRole.HOTEL_MANAGER],
  },
  {
    title: "Sales Agent Desk",
    href: "/dashboard/staff",
    iconName: "Compass",
    roles: [UserRole.STAFF],
  },

  // Modules
  {
    title: "Pilgrims & Passports",
    href: "/customers",
    iconName: "Users",
    roles: [
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.BRANCH_MANAGER,
      UserRole.STAFF,
      UserRole.ACCOUNTANT,
    ],
  },
  {
    title: "Umrah / Hajj Packages",
    href: "/packages",
    iconName: "PackageCheck",
    roles: [
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.BRANCH_MANAGER,
      UserRole.STAFF,
      UserRole.TICKET_MANAGER,
      UserRole.HOTEL_MANAGER,
    ],
  },
  {
    title: "Bookings & Vouchers",
    href: "/bookings",
    iconName: "CalendarDays",
    roles: [
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.BRANCH_MANAGER,
      UserRole.STAFF,
      UserRole.ACCOUNTANT,
    ],
  },
  {
    title: "Airlines & Groups",
    href: "/airline-groups",
    iconName: "Plane",
    roles: [
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.BRANCH_MANAGER,
      UserRole.TICKET_MANAGER,
    ],
  },
  {
    title: "Single Tickets",
    href: "/tickets",
    iconName: "Ticket",
    roles: [
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.BRANCH_MANAGER,
      UserRole.TICKET_MANAGER,
      UserRole.STAFF,
    ],
  },
  {
    title: "Hotels (Makkah/Madinah)",
    href: "/hotels",
    iconName: "Hotel",
    roles: [
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.BRANCH_MANAGER,
      UserRole.HOTEL_MANAGER,
    ],
  },
  {
    title: "Visa Processing",
    href: "/visas",
    iconName: "FileCheck2",
    roles: [
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.BRANCH_MANAGER,
      UserRole.STAFF,
    ],
  },
  {
    title: "Nusuk & Rawdah",
    href: "/nusuk",
    iconName: "ShieldCheck",
    roles: [
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.BRANCH_MANAGER,
      UserRole.STAFF,
    ],
  },
  {
    title: "Double-Entry Accounts",
    href: "/accounts",
    iconName: "Receipt",
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT],
  },
  {
    title: "Ledgers & Daybook",
    href: "/ledgers",
    iconName: "BookOpen",
    roles: [
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.ACCOUNTANT,
      UserRole.BRANCH_MANAGER,
    ],
  },
  {
    title: "Financial Reports",
    href: "/reports",
    iconName: "BarChart3",
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT],
  },
  {
    title: "Refunds & Cancellations",
    href: "/refunds",
    iconName: "RotateCcw",
    roles: [
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.ACCOUNTANT,
      UserRole.TICKET_MANAGER,
      UserRole.HOTEL_MANAGER,
    ],
  },
  {
    title: "Suppliers Master",
    href: "/suppliers",
    iconName: "Truck",
    roles: [
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.ACCOUNTANT,
      UserRole.TICKET_MANAGER,
      UserRole.HOTEL_MANAGER,
    ],
  },
  {
    title: "Branches & Staff",
    href: "/branches",
    iconName: "Network",
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  },
  {
    title: "Audit & Activity Logs",
    href: "/audit-logs",
    iconName: "FileSpreadsheet",
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  },
  {
    title: "System Settings",
    href: "/settings",
    iconName: "Settings",
    roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  },
];
