import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Hajj & Umrah CRM + ERP database...");

  // 1. Clean existing records in correct relation order
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.account.deleteMany();
  await prisma.nusuk.deleteMany();
  await prisma.visa.deleteMany();
  await prisma.pilgrim.deleteMany();
  await prisma.packageBooking.deleteMany();
  await prisma.package.deleteMany();
  await prisma.hotelBooking.deleteMany();
  await prisma.room.deleteMany();
  await prisma.hotel.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.groupPassenger.deleteMany();
  await prisma.group.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.flight.deleteMany();
  await prisma.route.deleteMany();
  await prisma.airline.deleteMany();
  await prisma.passport.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();

  // 2. Branches in Pakistan
  const branchKhi = await prisma.branch.create({
    data: {
      name: "Karachi Head Office",
      code: "KHI-HQ",
      city: "Karachi",
      address: "Suite 401, Al-Khaleej Towers, Main Shahrah-e-Faisal, Karachi",
      phone: "+92 21 34567890",
      email: "khi@alharamain.pk",
      managerName: "Tariq Mahmood",
      isHeadOffice: true,
    },
  });

  const branchLhe = await prisma.branch.create({
    data: {
      name: "Lahore Branch",
      code: "LHE-01",
      city: "Lahore",
      address: "Office 12, Ground Floor, Siddiq Trade Centre, Gulberg III, Lahore",
      phone: "+92 42 35789012",
      email: "lhe@alharamain.pk",
      managerName: "Farhan Saeed",
      isHeadOffice: false,
    },
  });

  const branchIsb = await prisma.branch.create({
    data: {
      name: "Islamabad Branch",
      code: "ISB-01",
      city: "Islamabad",
      address: "Plot 14, Beverly Centre, Jinnah Avenue, Blue Area, Islamabad",
      phone: "+92 51 28901234",
      email: "isb@alharamain.pk",
      managerName: "Zubair Hashmi",
      isHeadOffice: false,
    },
  });

  console.log("✅ Branches seeded");

  // 3. Password Hashing
  const adminPass = await bcrypt.hash("Admin@123", 10);
  const managerPass = await bcrypt.hash("Manager@123", 10);
  const accountsPass = await bcrypt.hash("Accounts@123", 10);
  const ticketsPass = await bcrypt.hash("Tickets@123", 10);
  const hotelsPass = await bcrypt.hash("Hotels@123", 10);
  const agentPass = await bcrypt.hash("Agent@123", 10);

  // 4. Users for every role
  const superAdmin = await prisma.user.create({
    data: {
      name: "Sheikh Abdul Rehman (CEO)",
      email: "superadmin@alharamain.pk",
      passwordHash: adminPass,
      phone: "+92 300 1234567",
      role: "SUPER_ADMIN",
      branchId: branchKhi.id,
      commissionRate: 0,
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      name: "Hamza Tariq (Operations Admin)",
      email: "admin@alharamain.pk",
      passwordHash: adminPass,
      phone: "+92 301 2345678",
      role: "ADMIN",
      branchId: branchKhi.id,
      commissionRate: 0,
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      name: "Tariq Mahmood (BM Karachi)",
      email: "karachi.manager@alharamain.pk",
      passwordHash: managerPass,
      phone: "+92 302 3456789",
      role: "BRANCH_MANAGER",
      branchId: branchKhi.id,
      commissionRate: 2.0,
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      name: "Farhan Saeed (BM Lahore)",
      email: "lahore.manager@alharamain.pk",
      passwordHash: managerPass,
      phone: "+92 303 4567890",
      role: "BRANCH_MANAGER",
      branchId: branchLhe.id,
      commissionRate: 2.0,
      isActive: true,
    },
  });

  const accountant = await prisma.user.create({
    data: {
      name: "Muhammad Bilal (Chief Accountant)",
      email: "accounts@alharamain.pk",
      passwordHash: accountsPass,
      phone: "+92 304 5678901",
      role: "ACCOUNTANT",
      branchId: branchKhi.id,
      commissionRate: 0,
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      name: "Adnan Siddiqui (Ticketing Head)",
      email: "tickets@alharamain.pk",
      passwordHash: ticketsPass,
      phone: "+92 305 6789012",
      role: "TICKET_MANAGER",
      branchId: branchKhi.id,
      commissionRate: 1.5,
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      name: "Khurram Qureshi (Hotels & Logistics)",
      email: "hotels@alharamain.pk",
      passwordHash: hotelsPass,
      phone: "+92 306 7890123",
      role: "HOTEL_MANAGER",
      branchId: branchKhi.id,
      commissionRate: 1.5,
      isActive: true,
    },
  });

  const staffKhi = await prisma.user.create({
    data: {
      name: "Usman Raza (Sales Consultant)",
      email: "agent.khi@alharamain.pk",
      passwordHash: agentPass,
      phone: "+92 321 8901234",
      role: "STAFF",
      branchId: branchKhi.id,
      commissionRate: 3.5,
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      name: "Ali Hassan (Sales Consultant)",
      email: "agent.lhe@alharamain.pk",
      passwordHash: agentPass,
      phone: "+92 333 9012345",
      role: "STAFF",
      branchId: branchLhe.id,
      commissionRate: 3.5,
      isActive: true,
    },
  });

  console.log("✅ Users seeded with all roles and encrypted passwords");

  // 5. Suppliers
  const supSaudia = await prisma.supplier.create({
    data: {
      name: "Saudi Arabian Airlines (Saudia)",
      type: "AIRLINE",
      contactPerson: "Ahmed Al-Ghamdi",
      phone: "+966 12 686 0000",
      email: "groups@saudia.com",
      address: "Jeddah Airport Road, Saudi Arabia",
      balance: -4500000.0,
    },
  });

  const supPia = await prisma.supplier.create({
    data: {
      name: "Pakistan International Airlines (PIA)",
      type: "AIRLINE",
      contactPerson: "Kamran Akram",
      phone: "+92 21 111 786 786",
      email: "umrahdesk@piac.aero",
      address: "PIA Head Office, Karachi Airport",
      balance: -2800000.0,
    },
  });

  const supSwissotel = await prisma.supplier.create({
    data: {
      name: "Swissotel Al Maqam Makkah Supplier Co.",
      type: "HOTEL",
      contactPerson: "Mohammad Yahya",
      phone: "+966 12 571 7333",
      email: "reservations@swissotel-makkah.com",
      address: "Abraj Al Bait Complex, King Abdul Aziz Endowment, Makkah",
      balance: -3200000.0,
    },
  });

  const supDarAlTaqwa = await prisma.supplier.create({
    data: {
      name: "Dar Al Taqwa Madinah Hospitality Group",
      type: "HOTEL",
      contactPerson: "Sultan Al-Madani",
      phone: "+966 14 829 1111",
      email: "booking@daraltaqwa.com",
      address: "Opposite Prophet's Mosque, Northern Courtyard, Madinah",
      balance: -2100000.0,
    },
  });

  const supVisa = await prisma.supplier.create({
    data: {
      name: "Al-Waqar Umrah Visa Facilitation Services",
      type: "VISA",
      contactPerson: "Sheikh Waqar",
      phone: "+92 51 2223344",
      email: "visas@alwaqar.pk",
      address: "G-8 Markaz, Islamabad",
      balance: -750000.0,
    },
  });

  const supTransport = await prisma.supplier.create({
    data: {
      name: "Al-Safwah VIP Transport & Limousine KSA",
      type: "TRANSPORT",
      contactPerson: "Abu Bakr",
      phone: "+966 50 123 4567",
      email: "operations@alsafwahtransport.com",
      address: "Makkah Al-Mukarramah",
      balance: -400000.0,
    },
  });

  console.log("✅ Suppliers seeded");

  // 6. Airlines & Flights
  const airlineSV = await prisma.airline.create({
    data: {
      name: "Saudi Arabian Airlines",
      code: "SV",
      logoUrl: "/airlines/saudia.png",
      contactPhone: "+92 21 111 728 342",
      contactEmail: "khi@saudia.com",
    },
  });

  const airlinePK = await prisma.airline.create({
    data: {
      name: "Pakistan International Airlines",
      code: "PK",
      logoUrl: "/airlines/pia.png",
      contactPhone: "+92 21 111 786 786",
      contactEmail: "info@piac.aero",
    },
  });

  const airlineXY = await prisma.airline.create({
    data: {
      name: "Flynas",
      code: "XY",
      logoUrl: "/airlines/flynas.png",
      contactPhone: "+92 51 111 359 627",
      contactEmail: "sales.pk@flynas.com",
    },
  });

  const routeKhiJed = await prisma.route.create({
    data: {
      origin: "KHI",
      destination: "JED",
      flightNumber: "SV-701",
      airlineId: airlineSV.id,
    },
  });

  const routeLheMed = await prisma.route.create({
    data: {
      origin: "LHE",
      destination: "MED",
      flightNumber: "PK-739",
      airlineId: airlinePK.id,
    },
  });

  const flightSV701 = await prisma.flight.create({
    data: {
      airlineId: airlineSV.id,
      routeId: routeKhiJed.id,
      flightNumber: "SV-701",
      departureAirport: "Jinnah International Airport, Karachi (KHI)",
      arrivalAirport: "King Abdulaziz International Airport, Jeddah (JED)",
      departureTime: new Date("2026-11-20T06:30:00Z"),
      arrivalTime: new Date("2026-11-20T09:45:00Z"),
      baggageKg: 46, // 2 pieces of 23kg
      flightClass: "ECONOMY",
    },
  });

  const flightPK739 = await prisma.flight.create({
    data: {
      airlineId: airlinePK.id,
      routeId: routeLheMed.id,
      flightNumber: "PK-739",
      departureAirport: "Allama Iqbal International Airport, Lahore (LHE)",
      arrivalAirport: "Prince Mohammad bin Abdulaziz Airport, Madinah (MED)",
      departureTime: new Date("2026-11-22T08:00:00Z"),
      arrivalTime: new Date("2026-11-22T11:45:00Z"),
      baggageKg: 40,
      flightClass: "ECONOMY",
    },
  });

  console.log("✅ Airlines, Routes & Flights seeded");

  // 7. Airline Groups (Group inventory tracking)
  const groupSV = await prisma.group.create({
    data: {
      groupName: "SV Nov-Dec Super Economy Group (100 Seats)",
      airlineId: airlineSV.id,
      routeId: routeKhiJed.id,
      flightId: flightSV701.id,
      pnr: "SVNOV26G",
      departureDate: new Date("2026-11-20T06:30:00Z"),
      returnDate: new Date("2026-12-05T14:30:00Z"),
      totalSeats: 100,
      seatsSold: 78,
      seatsBlocked: 12,
      seatCostPrice: 195000.0,
      seatSellingPrice: 225000.0,
      nameListDeadline: new Date("2026-11-12T18:00:00Z"),
      supplierId: supSaudia.id,
      branchId: branchKhi.id,
      status: "OPEN",
    },
  });

  const groupPK = await prisma.group.create({
    data: {
      groupName: "PIA Lahore-Madinah Umrah Special",
      airlineId: airlinePK.id,
      routeId: routeLheMed.id,
      flightId: flightPK739.id,
      pnr: "PKLHE26G",
      departureDate: new Date("2026-11-22T08:00:00Z"),
      returnDate: new Date("2026-12-07T16:00:00Z"),
      totalSeats: 80,
      seatsSold: 64,
      seatsBlocked: 6,
      seatCostPrice: 180000.0,
      seatSellingPrice: 205000.0,
      nameListDeadline: new Date("2026-11-15T18:00:00Z"),
      supplierId: supPia.id,
      branchId: branchLhe.id,
      status: "OPEN",
    },
  });

  console.log("✅ Groups seeded");

  // 8. Hotels (Makkah & Madinah)
  const hotelSwissotel = await prisma.hotel.create({
    data: {
      name: "Swissotel Al Maqam Makkah",
      city: "MAKKAH",
      stars: 5,
      distanceMeters: 40,
      address: "Clock Towers, King Abdul Aziz Endowment, Ibrahim Al Khalil Rd, Makkah",
      contactPhone: "+966 12 571 7333",
      images: "/hotels/swissotel.jpg",
      facilities: "Haram View, Buffet Breakfast, Free High-Speed WiFi, Concierge, Direct Clock Tower Elevator to Haram",
    },
  });

  const hotelPullman = await prisma.hotel.create({
    data: {
      name: "Pullman ZamZam Makkah",
      city: "MAKKAH",
      stars: 5,
      distanceMeters: 60,
      address: "Abraj Al Bait Complex, Makkah",
      contactPhone: "+966 12 571 5555",
      images: "/hotels/pullman.jpg",
      facilities: "Direct Haram Access, 3 Restaurants, Multi-lingual Staff, Room Service 24/7",
    },
  });

  const hotelKiswah = await prisma.hotel.create({
    data: {
      name: "Al Kiswah Towers Hotel Makkah",
      city: "MAKKAH",
      stars: 3,
      distanceMeters: 950,
      address: "At Taysir District, Makkah",
      contactPhone: "+966 12 531 2222",
      images: "/hotels/kiswah.jpg",
      facilities: "24/7 Free Haram Shuttle Bus, Food Court, Air Conditioning, Free WiFi in Lobby",
    },
  });

  const hotelDarAlTaqwa = await prisma.hotel.create({
    data: {
      name: "Dar Al Taqwa Hotel Madinah",
      city: "MADINAH",
      stars: 5,
      distanceMeters: 15,
      address: "Directly facing Prophet's Mosque Main Gates, Northern Courtyard, Madinah",
      contactPhone: "+966 14 829 1111",
      images: "/hotels/dar-al-taqwa.jpg",
      facilities: "Ladies Entrance Proximity, Gourmet Tea Garden, Luxury Suites, 24/7 Concierge",
    },
  });

  const hotelMovenpick = await prisma.hotel.create({
    data: {
      name: "Anwar Al Madinah Mövenpick",
      city: "MADINAH",
      stars: 5,
      distanceMeters: 50,
      address: "Central Area, Badaah, Madinah",
      contactPhone: "+966 14 818 1000",
      images: "/hotels/movenpick-madinah.jpg",
      facilities: "Shopping Mall Link, Executive Lounge, 4 International Restaurants, Underground Parking",
    },
  });

  // Rooms for Swissotel
  await prisma.room.createMany({
    data: [
      {
        hotelId: hotelSwissotel.id,
        roomType: "DOUBLE",
        totalRooms: 30,
        seasonName: "Winter Regular 2026",
        costPrice: 65000.0,
        sellingPrice: 78000.0,
        isAvailable: true,
      },
      {
        hotelId: hotelSwissotel.id,
        roomType: "TRIPLE",
        totalRooms: 25,
        seasonName: "Winter Regular 2026",
        costPrice: 75000.0,
        sellingPrice: 92000.0,
        isAvailable: true,
      },
      {
        hotelId: hotelSwissotel.id,
        roomType: "QUAD",
        totalRooms: 40,
        seasonName: "Winter Regular 2026",
        costPrice: 85000.0,
        sellingPrice: 105000.0,
        isAvailable: true,
      },
    ],
  });

  // Rooms for Dar Al Taqwa
  await prisma.room.createMany({
    data: [
      {
        hotelId: hotelDarAlTaqwa.id,
        roomType: "DOUBLE",
        totalRooms: 20,
        seasonName: "Winter Regular 2026",
        costPrice: 60000.0,
        sellingPrice: 74000.0,
        isAvailable: true,
      },
      {
        hotelId: hotelDarAlTaqwa.id,
        roomType: "TRIPLE",
        totalRooms: 20,
        seasonName: "Winter Regular 2026",
        costPrice: 70000.0,
        sellingPrice: 86000.0,
        isAvailable: true,
      },
      {
        hotelId: hotelDarAlTaqwa.id,
        roomType: "QUAD",
        totalRooms: 30,
        seasonName: "Winter Regular 2026",
        costPrice: 80000.0,
        sellingPrice: 98000.0,
        isAvailable: true,
      },
    ],
  });

  // Rooms for Kiswah (Economy)
  await prisma.room.createMany({
    data: [
      {
        hotelId: hotelKiswah.id,
        roomType: "DOUBLE",
        totalRooms: 50,
        seasonName: "Winter Regular 2026",
        costPrice: 16000.0,
        sellingPrice: 22000.0,
        isAvailable: true,
      },
      {
        hotelId: hotelKiswah.id,
        roomType: "QUAD",
        totalRooms: 100,
        seasonName: "Winter Regular 2026",
        costPrice: 24000.0,
        sellingPrice: 32000.0,
        isAvailable: true,
      },
      {
        hotelId: hotelKiswah.id,
        roomType: "QUINT",
        totalRooms: 80,
        seasonName: "Winter Regular 2026",
        costPrice: 28000.0,
        sellingPrice: 38000.0,
        isAvailable: true,
      },
    ],
  });

  console.log("✅ Hotels & Rooms seeded");

  // 9. Packages (Umrah & Hajj)
  const pkgPremium15 = await prisma.package.create({
    data: {
      name: "15-Day Royal VIP Umrah Package (5-Star Haram Front)",
      packageType: "UMRAH",
      durationDays: 15,
      makkahHotelId: hotelSwissotel.id,
      makkahNights: 7,
      madinahHotelId: hotelDarAlTaqwa.id,
      madinahNights: 7,
      mealPlan: "BED_AND_BREAKFAST",
      transportIncluded: true,
      transportType: "PRIVATE_GMC",
      visaIncluded: true,
      zyaratIncluded: true,
      airlineId: airlineSV.id,
      flightId: flightSV701.id,
      groupId: groupSV.id,
      costDouble: 520000.0,
      sellDouble: 595000.0,
      costTriple: 440000.0,
      sellTriple: 495000.0,
      costQuad: 390000.0,
      sellQuad: 445000.0,
      costQuint: 360000.0,
      sellQuint: 410000.0,
      childPrice: 280000.0,
      infantPrice: 95000.0,
      description: "Direct Haram front 5-star experience with Saudi Arabian Airlines, Private VIP GMC transport, fast-track electronic Umrah Visa, and complete Ziyarat in Makkah & Madinah.",
    },
  });

  const pkgEconomy21 = await prisma.package.create({
    data: {
      name: "21-Day Economy Umrah Shuttle Package",
      packageType: "UMRAH",
      durationDays: 21,
      makkahHotelId: hotelKiswah.id,
      makkahNights: 10,
      madinahHotelId: hotelMovenpick.id,
      madinahNights: 10,
      mealPlan: "ROOM_ONLY",
      transportIncluded: true,
      transportType: "BUS_VIP",
      visaIncluded: true,
      zyaratIncluded: true,
      airlineId: airlinePK.id,
      flightId: flightPK739.id,
      groupId: groupPK.id,
      costDouble: 310000.0,
      sellDouble: 350000.0,
      costTriple: 260000.0,
      sellTriple: 295000.0,
      costQuad: 220000.0,
      sellQuad: 255000.0,
      costQuint: 195000.0,
      sellQuint: 230000.0,
      childPrice: 175000.0,
      infantPrice: 70000.0,
      description: "Budget-friendly 21-day package with 24/7 dedicated Haram shuttle bus, direct PIA Lahore-Madinah flights, and comprehensive guide support.",
    },
  });

  console.log("✅ Packages seeded");

  // 10. Customers & Passports
  const cust1 = await prisma.customer.create({
    data: {
      firstName: "Haji Muhammad",
      lastName: "Iqbal",
      cnic: "42101-2345678-1",
      phone: "+92 300 9876543",
      whatsapp: "+92 300 9876543",
      email: "m.iqbal@gmail.com",
      address: "House 142, Block 5, Gulshan-e-Iqbal, Karachi",
      city: "Karachi",
      branchId: branchKhi.id,
      notes: "VIP family client. Traveled with us in 2024 for Umrah.",
    },
  });

  const cust1Spouse = await prisma.customer.create({
    data: {
      firstName: "Rashida",
      lastName: "Begum",
      cnic: "42101-8765432-2",
      phone: "+92 300 9876543",
      whatsapp: "+92 300 9876543",
      email: "rashida.begum@gmail.com",
      address: "House 142, Block 5, Gulshan-e-Iqbal, Karachi",
      city: "Karachi",
      familyHeadId: cust1.id,
      branchId: branchKhi.id,
    },
  });

  const cust2 = await prisma.customer.create({
    data: {
      firstName: "Chaudhry",
      lastName: "Nawaz Sharif",
      cnic: "35202-4567890-3",
      phone: "+92 321 4455667",
      whatsapp: "+92 321 4455667",
      email: "c.nawaz@hotmail.com",
      address: "House 89, Sector Y, Phase 3, DHA, Lahore",
      city: "Lahore",
      branchId: branchLhe.id,
      notes: "Requested Ground floor room for senior citizens.",
    },
  });

  const cust3Warning = await prisma.customer.create({
    data: {
      firstName: "Sohail",
      lastName: "Akhtar",
      cnic: "61101-7890123-5",
      phone: "+92 333 5566778",
      whatsapp: "+92 333 5566778",
      email: "sohail.akhtar@yahoo.com",
      address: "Street 8, F-10/2, Islamabad",
      city: "Islamabad",
      branchId: branchIsb.id,
      notes: "Passport expiring in 3 months! Needs renewal notification.",
    },
  });

  // Passports
  const pass1 = await prisma.passport.create({
    data: {
      customerId: cust1.id,
      passportNumber: "AL1234567",
      surname: "IQBAL",
      givenNames: "MUHAMMAD",
      nationality: "PAK",
      issueDate: new Date("2022-04-10"),
      expiryDate: new Date("2032-04-09"), // Valid 10 years
      dateOfBirth: new Date("1968-08-15"),
      gender: "MALE",
      placeOfBirth: "KARACHI",
      countryOfIssue: "PAKISTAN",
      passportScanUrl: "/uploads/passports/AL1234567_scan.pdf",
      photoUrl: "/uploads/photos/m_iqbal.jpg",
      cnicScanUrl: "/uploads/cnic/42101_front.jpg",
      vaccineScanUrl: "/uploads/vaccine/m_iqbal_polio.pdf",
    },
  });

  const pass1Spouse = await prisma.passport.create({
    data: {
      customerId: cust1Spouse.id,
      passportNumber: "AL7654321",
      surname: "BEGUM",
      givenNames: "RASHIDA",
      nationality: "PAK",
      issueDate: new Date("2021-06-20"),
      expiryDate: new Date("2031-06-19"),
      dateOfBirth: new Date("1972-11-25"),
      gender: "FEMALE",
      placeOfBirth: "LAHORE",
      countryOfIssue: "PAKISTAN",
      passportScanUrl: "/uploads/passports/AL7654321_scan.pdf",
      photoUrl: "/uploads/photos/rashida.jpg",
    },
  });

  const pass2 = await prisma.passport.create({
    data: {
      customerId: cust2.id,
      passportNumber: "BL9876543",
      surname: "SHARIF",
      givenNames: "NAWAZ",
      nationality: "PAK",
      issueDate: new Date("2020-01-15"),
      expiryDate: new Date("2030-01-14"),
      dateOfBirth: new Date("1960-03-01"),
      gender: "MALE",
      placeOfBirth: "LAHORE",
      countryOfIssue: "PAKISTAN",
    },
  });

  // Passport with LESS THAN 6 MONTHS validity (for passport expiry alert widget)
  const passExpiringSoon = await prisma.passport.create({
    data: {
      customerId: cust3Warning.id,
      passportNumber: "CL5544332",
      surname: "AKHTAR",
      givenNames: "SOHAIL",
      nationality: "PAK",
      issueDate: new Date("2017-01-10"),
      expiryDate: new Date("2026-12-15"), // Expiring in under 2 months!
      dateOfBirth: new Date("1985-05-12"),
      gender: "MALE",
      placeOfBirth: "RAWALPINDI",
      countryOfIssue: "PAKISTAN",
    },
  });

  console.log("✅ Customers and Passports seeded");

  // 11. Package Booking & Pilgrims
  const booking1 = await prisma.packageBooking.create({
    data: {
      bookingNumber: "PKG-2026-0001",
      packageId: pkgPremium15.id,
      customerId: cust1.id,
      branchId: branchKhi.id,
      createdById: staffKhi.id,
      roomType: "DOUBLE",
      totalPilgrims: 2,
      totalAmount: 1190000.0, // 595,000 * 2
      paidAmount: 800000.0,
      balanceAmount: 390000.0,
      bookingStatus: "VISA_PROCESSING",
      paymentStatus: "PARTIAL",
      travelDate: new Date("2026-11-20"),
      notes: "Double bed room facing Haram. Wheelchair requested for Rawdah slot.",
    },
  });

  const pilgrim1 = await prisma.pilgrim.create({
    data: {
      packageBookingId: booking1.id,
      customerId: cust1.id,
      passportId: pass1.id,
      relationToHead: "SELF",
      roomType: "DOUBLE",
      visaStatus: "PROCESSING",
      nusukStatus: "APPROVED",
      ticketStatus: "ISSUED",
    },
  });

  const pilgrim2 = await prisma.pilgrim.create({
    data: {
      packageBookingId: booking1.id,
      customerId: cust1Spouse.id,
      passportId: pass1Spouse.id,
      relationToHead: "SPOUSE",
      roomType: "DOUBLE",
      visaStatus: "PROCESSING",
      nusukStatus: "APPROVED",
      ticketStatus: "ISSUED",
    },
  });

  // Visas
  await prisma.visa.create({
    data: {
      pilgrimId: pilgrim1.id,
      customerId: cust1.id,
      passportId: pass1.id,
      supplierId: supVisa.id,
      visaType: "UMRAH",
      applicationDate: new Date("2026-10-25"),
      status: "PROCESSING",
      costPrice: 42000.0,
      sellingPrice: 55000.0,
      remarks: "Applied through Al-Waqar portal. MOFA pending confirmation.",
    },
  });

  await prisma.visa.create({
    data: {
      pilgrimId: pilgrim2.id,
      customerId: cust1Spouse.id,
      passportId: pass1Spouse.id,
      supplierId: supVisa.id,
      visaType: "UMRAH",
      applicationDate: new Date("2026-10-25"),
      status: "PROCESSING",
      costPrice: 42000.0,
      sellingPrice: 55000.0,
    },
  });

  // Nusuk & Rawdah permits
  await prisma.nusuk.create({
    data: {
      pilgrimId: pilgrim1.id,
      customerId: cust1.id,
      nusukRefId: "NSK-2026-88912",
      umrahPermitStatus: "APPROVED",
      rawdahPermitStatus: "APPROVED",
      rawdahSlotDate: new Date("2026-11-23T20:30:00Z"),
      packageBookingId: booking1.id,
      remarks: "Men Rawdah slot booked for 23 Nov 20:30 (Gate 38).",
    },
  });

  await prisma.nusuk.create({
    data: {
      pilgrimId: pilgrim2.id,
      customerId: cust1Spouse.id,
      nusukRefId: "NSK-2026-88913",
      umrahPermitStatus: "APPROVED",
      rawdahPermitStatus: "APPROVED",
      rawdahSlotDate: new Date("2026-11-24T09:00:00Z"),
      packageBookingId: booking1.id,
      remarks: "Women Rawdah morning slot booked for 24 Nov 09:00 (Gate 24).",
    },
  });

  console.log("✅ Booking, Pilgrims, Visas and Nusuk records seeded");

  // 12. Single Ticket Booking
  const ticket1 = await prisma.ticket.create({
    data: {
      type: "SINGLE",
      customerId: cust2.id,
      passportId: pass2.id,
      supplierId: supPia.id,
      pnr: "PK8819A",
      ticketNumber: "214-4902183921",
      routeDetails: "LHE - JED - LHE",
      departureDate: new Date("2026-11-25T10:00:00Z"),
      returnDate: new Date("2026-12-10T18:00:00Z"),
      fare: 185000.0,
      tax: 24000.0,
      supplierCost: 190000.0,
      sellingPrice: 215000.0,
      profit: 25000.0,
      branchId: branchLhe.id,
      status: "ISSUED",
    },
  });

  console.log("✅ Single Ticket seeded");

  // 13. Chart of Accounts (Double Entry System)
  const accCashKhi = await prisma.account.create({
    data: {
      code: "1001",
      name: "Cash in Hand - Karachi Branch",
      type: "ASSET",
      subType: "CASH",
      currency: "PKR",
      balance: 1450000.0,
      branchId: branchKhi.id,
    },
  });

  const accBankAlfalah = await prisma.account.create({
    data: {
      code: "1002",
      name: "Bank Alfalah Current A/C (PkR)",
      type: "ASSET",
      subType: "BANK",
      currency: "PKR",
      balance: 18500000.0,
      branchId: branchKhi.id,
    },
  });

  const accBankMeezan = await prisma.account.create({
    data: {
      code: "1003",
      name: "Meezan Bank Islamic Corporate (SAR/PKR)",
      type: "ASSET",
      subType: "BANK",
      currency: "PKR",
      balance: 12400000.0,
      branchId: branchKhi.id,
    },
  });

  const accReceivableCustomers = await prisma.account.create({
    data: {
      code: "1004",
      name: "Accounts Receivable - Pilgrims & Customers",
      type: "ASSET",
      subType: "RECEIVABLE",
      currency: "PKR",
      balance: 390000.0,
      branchId: branchKhi.id,
    },
  });

  const accPayableSuppliers = await prisma.account.create({
    data: {
      code: "2001",
      name: "Accounts Payable - Airlines & Hotels",
      type: "LIABILITY",
      subType: "PAYABLE",
      currency: "PKR",
      balance: 12250000.0,
      branchId: branchKhi.id,
    },
  });

  const accCustomerAdvances = await prisma.account.create({
    data: {
      code: "2002",
      name: "Advance Payments from Pilgrims",
      type: "LIABILITY",
      subType: "PAYABLE",
      currency: "PKR",
      balance: 800000.0,
      branchId: branchKhi.id,
    },
  });

  const accSalesRevenue = await prisma.account.create({
    data: {
      code: "4001",
      name: "Umrah & Hajj Package Sales",
      type: "REVENUE",
      subType: "SALES",
      currency: "PKR",
      balance: 1190000.0,
      branchId: branchKhi.id,
    },
  });

  const accTicketRevenue = await prisma.account.create({
    data: {
      code: "4002",
      name: "Air Ticket Sales Revenue",
      type: "REVENUE",
      subType: "SALES",
      currency: "PKR",
      balance: 215000.0,
      branchId: branchLhe.id,
    },
  });

  const accAirlineCost = await prisma.account.create({
    data: {
      code: "5001",
      name: "Cost of Airline Seats",
      type: "EXPENSE",
      subType: "COST_OF_SALES",
      currency: "PKR",
      balance: 580000.0,
      branchId: branchKhi.id,
    },
  });

  const accHotelCost = await prisma.account.create({
    data: {
      code: "5002",
      name: "Cost of Hotel Rooms (Makkah/Madinah)",
      type: "EXPENSE",
      subType: "COST_OF_SALES",
      currency: "PKR",
      balance: 340000.0,
      branchId: branchKhi.id,
    },
  });

  const accOfficeRent = await prisma.account.create({
    data: {
      code: "6001",
      name: "Office Rent & Utilities",
      type: "EXPENSE",
      subType: "OPERATING_EXPENSE",
      currency: "PKR",
      balance: 185000.0,
      branchId: branchKhi.id,
    },
  });

  console.log("✅ Chart of Accounts seeded");

  // 14. Journal Entries & Auto-Posting Ledger Entries
  const jv1 = await prisma.journalEntry.create({
    data: {
      entryNumber: "JV-2026-0001",
      date: new Date("2026-10-25"),
      description: "Booking revenue recognition for PKG-2026-0001 (Haji Muhammad Iqbal)",
      referenceType: "BOOKING",
      referenceId: booking1.id,
      branchId: branchKhi.id,
      createdById: accountant.id,
    },
  });

  // Debit Receivable, Credit Sales
  await prisma.ledgerEntry.createMany({
    data: [
      {
        journalEntryId: jv1.id,
        accountId: accReceivableCustomers.id,
        debit: 1190000.0,
        credit: 0.0,
        balance: 1190000.0,
        currency: "PKR",
        description: "Receivable for Booking PKG-2026-0001",
        customerId: cust1.id,
      },
      {
        journalEntryId: jv1.id,
        accountId: accSalesRevenue.id,
        debit: 0.0,
        credit: 1190000.0,
        balance: 1190000.0,
        currency: "PKR",
        description: "Package Sales for Booking PKG-2026-0001",
        customerId: cust1.id,
      },
    ],
  });

  // 15. Receipts (Customer Payment)
  const rcpt1 = await prisma.receipt.create({
    data: {
      receiptNumber: "RV-2026-0001",
      date: new Date("2026-10-25"),
      customerId: cust1.id,
      accountId: accBankAlfalah.id,
      packageBookingId: booking1.id,
      amount: 800000.0,
      currency: "PKR",
      paymentMethod: "BANK_TRANSFER",
      reference: "BAFL-IBFT-9081231",
      notes: "Advance payment 800,000 received via online transfer.",
      branchId: branchKhi.id,
      createdById: accountant.id,
    },
  });

  const jvReceipt = await prisma.journalEntry.create({
    data: {
      entryNumber: "JV-2026-0002",
      date: new Date("2026-10-25"),
      description: "Receipt RV-2026-0001 settlement from Haji Muhammad Iqbal",
      referenceType: "RECEIPT",
      referenceId: rcpt1.id,
      branchId: branchKhi.id,
      createdById: accountant.id,
    },
  });

  await prisma.ledgerEntry.createMany({
    data: [
      {
        journalEntryId: jvReceipt.id,
        accountId: accBankAlfalah.id,
        debit: 800000.0,
        credit: 0.0,
        balance: 800000.0,
        currency: "PKR",
        description: "Bank Alfalah debit for Receipt RV-2026-0001",
        customerId: cust1.id,
      },
      {
        journalEntryId: jvReceipt.id,
        accountId: accReceivableCustomers.id,
        debit: 0.0,
        credit: 800000.0,
        balance: 390000.0,
        currency: "PKR",
        description: "Accounts receivable credit for Receipt RV-2026-0001",
        customerId: cust1.id,
      },
    ],
  });

  // 16. Supplier Payment
  const pmt1 = await prisma.payment.create({
    data: {
      paymentNumber: "PV-2026-0001",
      date: new Date("2026-10-26"),
      supplierId: supSaudia.id,
      accountId: accBankMeezan.id,
      amount: 500000.0,
      currency: "PKR",
      paymentMethod: "BANK_TRANSFER",
      reference: "MEEZAN-FT-776211",
      notes: "Group seat deposit paid to Saudi Arabian Airlines.",
      branchId: branchKhi.id,
      createdById: accountant.id,
    },
  });

  // 17. Expenses (Petty cash & bills)
  await prisma.expense.create({
    data: {
      expenseNumber: "EX-2026-0001",
      date: new Date("2026-10-28"),
      accountId: accOfficeRent.id,
      title: "Karachi Office Electricity & High-Speed Internet Bill",
      category: "UTILITIES",
      amount: 45000.0,
      currency: "PKR",
      paymentMethod: "CASH",
      branchId: branchKhi.id,
      paidTo: "K-Electric & PTCL",
      createdById: accountant.id,
    },
  });

  // 18. Refund Record Flow (Airline Penalty + Customer Refund)
  await prisma.refund.create({
    data: {
      refundNumber: "RF-2026-0001",
      date: new Date("2026-10-29"),
      module: "TICKET",
      referenceId: ticket1.id,
      customerId: cust2.id,
      supplierId: supPia.id,
      originalAmount: 215000.0,
      penaltyAirline: 25000.0,
      penaltySupplier: 5000.0,
      penaltyCompany: 10000.0,
      customerRefundAmount: 175000.0,
      supplierRefundAmount: 160000.0,
      status: "APPROVED",
      notes: "Passenger medical emergency cancellation. Approved by Chief Accountant.",
      branchId: branchLhe.id,
      approvedById: accountant.id,
    },
  });

  // 19. Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: superAdmin.id,
        title: "Passport Expiry Alert (Under 6 Months)",
        message: "Customer Sohail Akhtar's passport CL5544332 expires on 15 Dec 2026. Renewal required prior to Umrah travel.",
        type: "PASSPORT_EXPIRY",
        isRead: false,
        linkUrl: "/customers",
      },
      {
        userId: superAdmin.id,
        title: "Group Name-list Deadline Alert",
        message: "Group SV Nov-Dec Super Economy (PNR: SVNOV26G) name-list deadline is 12 Nov 2026. 22 unallocated seats remaining.",
        type: "GROUP_DEADLINE",
        isRead: false,
        linkUrl: "/airline-groups",
      },
      {
        userId: accountant.id,
        title: "Balance Payment Due Reminder",
        message: "Booking PKG-2026-0001 (Haji Muhammad Iqbal) has an outstanding balance of PKR 390,000 due before departure.",
        type: "PAYMENT_DUE",
        isRead: false,
        linkUrl: "/bookings",
      },
      {
        userId: staffKhi.id,
        title: "Visa Processing Update",
        message: "Pilgrim Rashida Begum & Haji Muhammad Iqbal Umrah visas submitted to Embassy/MOFA.",
        type: "VISA_STATUS",
        isRead: true,
        linkUrl: "/visas",
      },
    ],
  });

  // 20. Audit Log
  await prisma.auditLog.createMany({
    data: [
      {
        userId: superAdmin.id,
        action: "CREATE",
        entity: "Package",
        entityId: pkgPremium15.id,
        branchId: branchKhi.id,
        details: "Created 15-Day Royal VIP Umrah Package with Swissotel & Dar Al Taqwa.",
      },
      {
        userId: staffKhi.id,
        action: "CREATE",
        entity: "PackageBooking",
        entityId: booking1.id,
        branchId: branchKhi.id,
        details: "Created Booking PKG-2026-0001 for 2 pilgrims with double sharing.",
      },
      {
        userId: accountant.id,
        action: "APPROVE",
        entity: "Refund",
        entityId: "RF-2026-0001",
        branchId: branchLhe.id,
        details: "Approved Ticket Refund RF-2026-0001 with PKR 25,000 airline penalty.",
      },
    ],
  });

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
