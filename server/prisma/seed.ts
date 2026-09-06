import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

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

async function seedRequesters() {
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

async function seedTicketsAndAttachments() {
  const requesters = await prisma.developmentRequester.findMany({ where: { isActive: true } });
  const categories = await prisma.category.findMany();
  const systems = await prisma.relatedSystem.findMany();

  if (requesters.length === 0 || categories.length === 0 || systems.length === 0) return;

  // Create 10 tickets
  for (let i = 1; i <= 10; i++) {
    const requester = requesters[i % requesters.length];
    const category = categories[i % categories.length];
    const system = systems[i % systems.length];
    
    const ticketNumber = `TKT-2026-${String(i).padStart(4, '0')}`;
    
    await prisma.ticket.upsert({
      where: { ticketNumber },
      update: {},
      create: {
        ticketNumber,
        requesterId: requester.id,
        categoryId: category.id,
        relatedSystemId: system.id,
        summary: `Sample Ticket Summary ${i}`,
        description: `This is a sample description for ticket ${ticketNumber}. It provides details about the issue.`,
        requestedPriority: i % 3 === 0 ? 'HIGH' : i % 2 === 0 ? 'MEDIUM' : 'LOW',
        currentStatus: 'NEW',
      }
    });
  }

  // Seed attachments for the first ticket
  const firstTicket = await prisma.ticket.findUnique({ where: { ticketNumber: 'TKT-2026-0001' } });
  if (firstTicket) {
    // Normal attachment
    await prisma.attachment.upsert({
      where: { storagePath: 'test-attachment-1.png' },
      update: {},
      create: {
        ticketId: firstTicket.id,
        originalFilename: 'screenshot1.png',
        storagePath: 'test-attachment-1.png',
        mimeType: 'image/png',
        size: 250000,
      }
    });

    // Another normal attachment
    await prisma.attachment.upsert({
      where: { storagePath: 'test-attachment-2.pdf' },
      update: {},
      create: {
        ticketId: firstTicket.id,
        originalFilename: 'document.pdf',
        storagePath: 'test-attachment-2.pdf',
        mimeType: 'application/pdf',
        size: 1500000,
      }
    });

    // Soft-removed attachment
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
      }
    });
  }
}

async function main() {
  await seedCategories();
  await seedRelatedSystems();
  await seedRequesters();
  await seedTicketsAndAttachments();
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });