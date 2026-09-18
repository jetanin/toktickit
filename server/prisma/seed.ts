import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// LOCAL DEV PASSWORDS (Documented for local development testing only)
// Conforms to BR-06: >=8 chars, uppercase, lowercase, number, symbol
const DEV_DEFAULT_PASSWORD = 'Password123!';
const DEV_ADMIN_PASSWORD = 'Admin1234!';
const BCRYPT_SALT_ROUNDS = 10;

async function seedCategories() {
  const categories = ['Account and Access', 'Hardware', 'Software', 'Network'];
  for (const name of categories) {
    await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
  }
}

async function seedRelatedSystems() {
  const systems = ['Email', 'Campus Wi-Fi', 'VPN', 'LEB2 App', 'Grade Submission App', 'Printer', 'Corporate Laptop'];
  for (const name of systems) {
    await prisma.relatedSystem.upsert({ where: { name }, update: {}, create: { name, isActive: true } });
  }
}

async function seedLegacyRequesters() {
  // Retained for backwards-compatibility with Lab 2 tests
  const activeRequesters = [
    { name: 'Jennifer Anderson', email: 'jennifer.anderson@kmutt.ac.th' },
    { name: 'Michael Brown', email: 'michael.brown@kmutt.ac.th' },
    { name: 'Sarah Johnson', email: 'sarah.johnson@kmutt.ac.th' },
    { name: 'David Lee', email: 'david.lee@kmutt.ac.th' },
  ];
  for (const r of activeRequesters) {
    await prisma.developmentRequester.upsert({
      where: { email: r.email },
      update: {},
      create: { ...r, isActive: true },
    });
  }

  await prisma.developmentRequester.upsert({
    where: { email: 'inactive.user@kmutt.ac.th' },
    update: {},
    create: { name: 'Inactive Test User', email: 'inactive.user@kmutt.ac.th', isActive: false },
  });
}

async function seedUsers() {
  const userPasswordHash = await bcrypt.hash(DEV_DEFAULT_PASSWORD, BCRYPT_SALT_ROUNDS);
  const adminPasswordHash = await bcrypt.hash(DEV_ADMIN_PASSWORD, BCRYPT_SALT_ROUNDS);

  // 1. Administrators (1 primary active + 1 secondary active for sole-admin guard tests)
  const admins = [
    { name: 'Eleanor Vance', email: 'admin@toktick.it', role: 'ADMINISTRATOR' as const, isActive: true, mustChangePassword: false },
    { name: 'Marcus Reed', email: 'admin2@toktick.it', role: 'ADMINISTRATOR' as const, isActive: true, mustChangePassword: false },
  ];

  for (const a of admins) {
    await prisma.user.upsert({
      where: { email: a.email },
      update: { name: a.name, role: a.role, isActive: a.isActive, mustChangePassword: a.mustChangePassword },
      create: { ...a, passwordHash: adminPasswordHash },
    });
  }

  // 2. IT Staff (3 active + 1 inactive)
  const itStaff = [
    { name: 'Sarah Jenkins', email: 'sarah.it@toktick.it', role: 'IT_STAFF' as const, isActive: true, mustChangePassword: false },
    { name: 'Michael Chen', email: 'michael.it@toktick.it', role: 'IT_STAFF' as const, isActive: true, mustChangePassword: false },
    { name: 'David Ross', email: 'david.it@toktick.it', role: 'IT_STAFF' as const, isActive: true, mustChangePassword: false },
    { name: 'Kevin Miller', email: 'kevin.it@toktick.it', role: 'IT_STAFF' as const, isActive: false, mustChangePassword: false },
  ];

  for (const s of itStaff) {
    await prisma.user.upsert({
      where: { email: s.email },
      update: { name: s.name, role: s.role, isActive: s.isActive, mustChangePassword: s.mustChangePassword },
      create: { ...s, passwordHash: userPasswordHash },
    });
  }

  // 3. Requesters (4 active + 1 inactive, with Alex requiring first-login pass change)
  const requesters = [
    { name: 'Jennifer Anderson', email: 'jennifer.anderson@toktick.it', role: 'REQUESTER' as const, isActive: true, mustChangePassword: false },
    { name: 'Alex Thompson', email: 'alex.thompson@toktick.it', role: 'REQUESTER' as const, isActive: true, mustChangePassword: true },
    { name: 'Lisa Martinez', email: 'lisa.martinez@toktick.it', role: 'REQUESTER' as const, isActive: true, mustChangePassword: false },
    { name: 'Amanda Clark', email: 'amanda.clark@toktick.it', role: 'REQUESTER' as const, isActive: true, mustChangePassword: false },
    { name: 'Robert Wilson', email: 'robert.wilson@toktick.it', role: 'REQUESTER' as const, isActive: false, mustChangePassword: false },
  ];

  for (const r of requesters) {
    await prisma.user.upsert({
      where: { email: r.email },
      update: { name: r.name, role: r.role, isActive: r.isActive, mustChangePassword: r.mustChangePassword },
      create: { ...r, passwordHash: userPasswordHash },
    });
  }

  // 4. Ensure legacy DevelopmentRequesters exist as Users with mustChangePassword=true
  const legacyRequesters = await prisma.developmentRequester.findMany();
  for (const lr of legacyRequesters) {
    const existingById = await prisma.user.findUnique({ where: { id: lr.id } });
    await prisma.user.upsert({
      where: { email: lr.email },
      update: { name: lr.name, isActive: lr.isActive },
      create: {
        ...(existingById ? {} : { id: lr.id }),
        name: lr.name,
        email: lr.email,
        passwordHash: userPasswordHash,
        role: 'REQUESTER',
        isActive: lr.isActive,
        mustChangePassword: true,
      },
    });
  }

  // Synchronize User id sequence
  await prisma.$executeRawUnsafe(`
    SELECT setval(pg_get_serial_sequence('"User"', 'id'), COALESCE(MAX("id"), 1)) FROM "User";
  `);
}

async function seedTicketsAndAttachments() {
  const requesters = await prisma.user.findMany({ where: { role: 'REQUESTER', isActive: true } });
  const staff = await prisma.user.findMany({ where: { role: 'IT_STAFF', isActive: true } });
  const categories = await prisma.category.findMany();
  const systems = await prisma.relatedSystem.findMany();

  if (requesters.length === 0 || categories.length === 0 || systems.length === 0) return;

  const ticketsData = [
    {
      ticketNumber: 'TKT-2026-0001',
      summary: 'Cannot connect to campus Wi-Fi in Classroom 402',
      description: 'The Wi-Fi signal repeatedly drops during lecture hours. Error shows IP configuration failure.',
      requestedPriority: 'HIGH' as const,
      itPriority: 'HIGH' as const,
      currentStatus: 'NEW' as const,
      owner: null,
      resolutionSummary: null,
    },
    {
      ticketNumber: 'TKT-2026-0002',
      summary: 'VPN client disconnects after 5 minutes',
      description: 'Using Cisco AnyConnect on Windows 11. Connection drops with TLS handshake timeout.',
      requestedPriority: 'MEDIUM' as const,
      itPriority: 'MEDIUM' as const,
      currentStatus: 'OPEN' as const,
      owner: staff[0]?.id ?? null,
      resolutionSummary: null,
    },
    {
      ticketNumber: 'TKT-2026-0003',
      summary: 'LEB2 App session expires unexpectedly',
      description: 'During quiz submission, student session expired prematurely.',
      requestedPriority: 'HIGH' as const,
      itPriority: 'CRITICAL' as const,
      currentStatus: 'IN_PROGRESS' as const,
      owner: staff[1]?.id ?? null,
      resolutionSummary: null,
    },
    {
      ticketNumber: 'TKT-2026-0004',
      summary: 'Password reset request for department shared mailbox',
      description: 'Department administrator password needs reset following staff transition.',
      requestedPriority: 'LOW' as const,
      itPriority: 'LOW' as const,
      currentStatus: 'WAITING_FOR_REQUESTER' as const,
      owner: staff[2]?.id ?? null,
      resolutionSummary: null,
    },
    {
      ticketNumber: 'TKT-2026-0005',
      summary: 'Corrupted printer driver on Lab 3 network printer',
      description: 'Printing jobs send blank pages or spooler crashes immediately on print queue.',
      requestedPriority: 'MEDIUM' as const,
      itPriority: 'MEDIUM' as const,
      currentStatus: 'RESOLVED' as const,
      owner: staff[0]?.id ?? null,
      resolutionSummary: 'Reinstalled clean PCL6 driver on print server and cleared corrupt print spool.',
    },
    {
      ticketNumber: 'TKT-2026-0006',
      summary: 'Request for secondary monitor for research workstation',
      description: 'Need additional 27-inch HDMI display for CAD modeling station.',
      requestedPriority: 'LOW' as const,
      itPriority: 'LOW' as const,
      currentStatus: 'CLOSED' as const,
      owner: staff[1]?.id ?? null,
      resolutionSummary: 'Delivered and set up Dell 27-inch monitor with HDMI cable.',
    },
    {
      ticketNumber: 'TKT-2026-0007',
      summary: 'Grade Submission App displays 500 error for Section 2',
      description: 'Instructors cannot finalize midterm grades due to database connection exception.',
      requestedPriority: 'HIGH' as const,
      itPriority: 'CRITICAL' as const,
      currentStatus: 'REOPENED' as const,
      owner: staff[0]?.id ?? null,
      resolutionSummary: null,
    },
    {
      ticketNumber: 'TKT-2026-0008',
      summary: 'Duplicate request for software license key',
      description: 'Accidentally submitted two identical requests for MATLAB campus license.',
      requestedPriority: 'LOW' as const,
      itPriority: 'LOW' as const,
      currentStatus: 'CANCELLED' as const,
      owner: null,
      resolutionSummary: null,
    },
    {
      ticketNumber: 'TKT-2026-0009',
      summary: 'Outlook client not syncing incoming mail folders',
      description: 'IMAP sync stuck at 2 days ago. Webmail works normally.',
      requestedPriority: 'MEDIUM' as const,
      itPriority: 'MEDIUM' as const,
      currentStatus: 'OPEN' as const,
      owner: staff[2]?.id ?? null,
      resolutionSummary: null,
    },
    {
      ticketNumber: 'TKT-2026-0010',
      summary: 'Corporate laptop fan making loud grinding noise',
      description: 'Lenovo ThinkPad CPU thermal fan runs at 100% and makes rattling sound.',
      requestedPriority: 'HIGH' as const,
      itPriority: 'HIGH' as const,
      currentStatus: 'IN_PROGRESS' as const,
      owner: staff[1]?.id ?? null,
      resolutionSummary: null,
    },
    {
      ticketNumber: 'TKT-2026-0011',
      summary: 'Request access to Engineering Git server repository',
      description: 'New graduate assistant requires read/write access to project repo.',
      requestedPriority: 'MEDIUM' as const,
      itPriority: 'MEDIUM' as const,
      currentStatus: 'NEW' as const,
      owner: null,
      resolutionSummary: null,
    },
    {
      ticketNumber: 'TKT-2026-0012',
      summary: 'Classroom projector HDMI port loose connection',
      description: 'Display flickers off whenever laptop cable is nudged.',
      requestedPriority: 'HIGH' as const,
      itPriority: 'HIGH' as const,
      currentStatus: 'OPEN' as const,
      owner: staff[0]?.id ?? null,
      resolutionSummary: null,
    },
    {
      ticketNumber: 'TKT-2026-0013',
      summary: 'Request SPSS installation on faculty laptop',
      description: 'Need licensed statistical package for upcoming research paper analysis.',
      requestedPriority: 'LOW' as const,
      itPriority: 'LOW' as const,
      currentStatus: 'WAITING_FOR_REQUESTER' as const,
      owner: staff[2]?.id ?? null,
      resolutionSummary: null,
    },
    {
      ticketNumber: 'TKT-2026-0014',
      summary: 'Server room door badge reader intermittent failure',
      description: 'RFID sensor does not register staff badges on first tap.',
      requestedPriority: 'HIGH' as const,
      itPriority: 'CRITICAL' as const,
      currentStatus: 'RESOLVED' as const,
      owner: staff[1]?.id ?? null,
      resolutionSummary: 'Cleaned optical contacts and replaced RFID reader backup battery.',
    },
    {
      ticketNumber: 'TKT-2026-0015',
      summary: 'Guest Wi-Fi voucher generation failing on portal',
      description: 'Conference attendees cannot register for temporary credentials.',
      requestedPriority: 'MEDIUM' as const,
      itPriority: 'HIGH' as const,
      currentStatus: 'CLOSED' as const,
      owner: staff[0]?.id ?? null,
      resolutionSummary: 'Updated RADIUS voucher batch generator template and restarted service.',
    },
    {
      ticketNumber: 'TKT-2026-0016',
      summary: 'Keyboard keycap missing on library public PC #4',
      description: 'Spacebar is dislodged and unusable for students.',
      requestedPriority: 'LOW' as const,
      itPriority: 'LOW' as const,
      currentStatus: 'NEW' as const,
      owner: null,
      resolutionSummary: null,
    },
  ];

  for (let i = 0; i < ticketsData.length; i++) {
    const t = ticketsData[i];
    const requester = requesters[i % requesters.length];
    const category = categories[i % categories.length];
    const system = systems[i % systems.length];

    await prisma.ticket.upsert({
      where: { ticketNumber: t.ticketNumber },
      update: {
        summary: t.summary,
        description: t.description,
        requestedPriority: t.requestedPriority,
        itPriority: t.itPriority,
        currentStatus: t.currentStatus,
        ticketOwnerId: t.owner,
        resolutionSummary: t.resolutionSummary,
      },
      create: {
        ticketNumber: t.ticketNumber,
        requesterId: requester.id,
        categoryId: category.id,
        relatedSystemId: system.id,
        summary: t.summary,
        description: t.description,
        requestedPriority: t.requestedPriority,
        itPriority: t.itPriority,
        currentStatus: t.currentStatus,
        ticketOwnerId: t.owner,
        resolutionSummary: t.resolutionSummary,
      },
    });
  }

  // Seed attachments for TKT-2026-0001
  const firstTicket = await prisma.ticket.findUnique({ where: { ticketNumber: 'TKT-2026-0001' } });
  if (firstTicket) {
    await prisma.attachment.upsert({
      where: { storagePath: 'test-attachment-1.png' },
      update: {},
      create: {
        ticketId: firstTicket.id,
        originalFilename: 'screenshot1.png',
        storagePath: 'test-attachment-1.png',
        mimeType: 'image/png',
        size: 250000,
      },
    });

    await prisma.attachment.upsert({
      where: { storagePath: 'test-attachment-2.pdf' },
      update: {},
      create: {
        ticketId: firstTicket.id,
        originalFilename: 'document.pdf',
        storagePath: 'test-attachment-2.pdf',
        mimeType: 'application/pdf',
        size: 1500000,
      },
    });

    await prisma.attachment.upsert({
      where: { storagePath: 'test-attachment-removed.png' },
      update: {},
      create: {
        ticketId: firstTicket.id,
        originalFilename: 'mistake.png',
        storagePath: 'test-attachment-removed.png',
        mimeType: 'image/png',
        size: 50000,
        removedAt: new Date(),
        removalReason: 'Uploaded wrong file',
      },
    });
  }

  // Seed Public Comments and Internal Notes on TKT-2026-0003 & TKT-2026-0004
  const tkt3 = await prisma.ticket.findUnique({ where: { ticketNumber: 'TKT-2026-0003' } });
  const tkt4 = await prisma.ticket.findUnique({ where: { ticketNumber: 'TKT-2026-0004' } });

  if (tkt3 && staff.length > 0) {
    // Check if comments already exist
    const existingComments = await prisma.publicComment.count({ where: { ticketId: tkt3.id } });
    if (existingComments === 0) {
      await prisma.publicComment.create({
        data: {
          ticketId: tkt3.id,
          authorId: tkt3.requesterId,
          content: 'This happened right around 14:15 while saving question 8. The screen turned white and error 504 displayed.',
        },
      });
      await prisma.publicComment.create({
        data: {
          ticketId: tkt3.id,
          authorId: staff[1].id,
          content: 'Thank you for the timestamp. We are reviewing server access logs to check connection pool saturation.',
        },
      });
    }

    const existingNotes = await prisma.internalNote.count({ where: { ticketId: tkt3.id } });
    if (existingNotes === 0) {
      await prisma.internalNote.create({
        data: {
          ticketId: tkt3.id,
          authorId: staff[1].id,
          content: 'Internal Note: Database connection pool peaked at 98% utilization between 14:10 and 14:20. Need to increase connection limit in pool config.',
        },
      });
    }
  }

  if (tkt4 && staff.length > 2) {
    const existingNotes = await prisma.internalNote.count({ where: { ticketId: tkt4.id } });
    if (existingNotes === 0) {
      await prisma.internalNote.create({
        data: {
          ticketId: tkt4.id,
          authorId: staff[2].id,
          content: 'Internal Note: Awaiting identity verification from department secretary before resetting mailbox credentials.',
        },
      });
    }
  }
}

async function main() {
  console.log('--- Seeding TokTickIT Database ---');
  await seedCategories();
  await seedRelatedSystems();
  await seedLegacyRequesters();
  await seedUsers();
  await seedTicketsAndAttachments();
  console.log('--- Seeding Complete Successfully ---');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });