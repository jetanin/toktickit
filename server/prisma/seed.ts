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
    await prisma.requesterUser.upsert({
      where: { email: r.email },
      update: {},
      create: { ...r, isActive: true },
    });
  }

  await prisma.requesterUser.upsert({
    where: { email: 'inactive.user@kmutt.ac.th' },
    update: {},
    create: { name: 'Inactive Test User', email: 'inactive.user@kmutt.ac.th', isActive: false },
  });
}

async function main() {
  await seedCategories();
  await seedRelatedSystems();
  await seedRequesters();
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });