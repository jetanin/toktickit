/**
 * TokTickIT Lab 3 - Data Migration Script
 * 
 * Purpose:
 * Converts legacy DevelopmentRequester rows into the Lab 3 User table.
 * 
 * Rules:
 * - role = 'REQUESTER'
 * - isActive is preserved from DevelopmentRequester
 * - mustChangePassword = true (mandatory first-login password change)
 * - Initial temporary password for local dev: 'Password123!' (hashed with bcrypt, salt rounds = 10)
 * - Retains exact id mapping so existing Ticket.requesterId relationships are preserved.
 * - Synchronizes User table PostgreSQL sequence.
 * - Idempotent: can be safely executed multiple times.
 */

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// LOCAL DEVELOPMENT ONLY - Initial default password for migrated accounts
// Satisfies BR-06: >=8 chars, uppercase, lowercase, number, special char.
export const DEV_DEFAULT_PASSWORD = 'Password123!';
export const BCRYPT_SALT_ROUNDS = 10;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function runDataMigration() {
  console.log('--- Starting Lab 3 Requester -> User Data Migration ---');

  // Pre-compute bcrypt hash for local dev default password
  const defaultPasswordHash = await bcrypt.hash(DEV_DEFAULT_PASSWORD, BCRYPT_SALT_ROUNDS);

  // 1. Fetch all legacy DevelopmentRequester records
  const legacyRequesters = await prisma.developmentRequester.findMany({
    orderBy: { id: 'asc' },
  });

  console.log(`Found ${legacyRequesters.length} legacy DevelopmentRequester rows.`);

  let migratedCount = 0;
  let updatedCount = 0;

  for (const requester of legacyRequesters) {
    const existingUser = await prisma.user.findUnique({
      where: { email: requester.email },
    });

    if (!existingUser) {
      // Check if this ID is already occupied by an auto-incremented user
      const existingById = await prisma.user.findUnique({
        where: { id: requester.id },
      });

      let newUser;
      if (!existingById) {
        // ID is free, preserve legacy id
        newUser = await prisma.user.create({
          data: {
            id: requester.id,
            name: requester.name,
            email: requester.email,
            passwordHash: defaultPasswordHash,
            role: 'REQUESTER',
            isActive: requester.isActive,
            mustChangePassword: true,
            createdAt: requester.createdAt,
          },
        });
      } else {
        // ID is taken by another user, generate new ID and re-point any tickets
        newUser = await prisma.user.create({
          data: {
            name: requester.name,
            email: requester.email,
            passwordHash: defaultPasswordHash,
            role: 'REQUESTER',
            isActive: requester.isActive,
            mustChangePassword: true,
            createdAt: requester.createdAt,
          },
        });

        // Update any tickets pointing to old requester.id
        await prisma.ticket.updateMany({
          where: { requesterId: requester.id },
          data: { requesterId: newUser.id },
        });
      }
      migratedCount++;
    } else {
      // Update existing user attributes without overwriting password if already customized
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: requester.name,
          isActive: requester.isActive,
        },
      });
      updatedCount++;
    }
  }

  // 2. Synchronize PostgreSQL sequence for User.id to avoid duplicate key errors on future inserts
  await prisma.$executeRawUnsafe(`
    SELECT setval(pg_get_serial_sequence('"User"', 'id'), COALESCE(MAX("id"), 1)) FROM "User";
  `);

  // 3. Ensure all existing tickets have valid itPriority backfilled from requestedPriority
  const ticketsToUpdate = await prisma.ticket.findMany({
    where: { itPriority: null },
    select: { id: true, requestedPriority: true },
  });

  for (const t of ticketsToUpdate) {
    await prisma.ticket.update({
      where: { id: t.id },
      data: { itPriority: t.requestedPriority },
    });
  }

  // 4. Verify ticket ownership integrity
  const totalTickets = await prisma.ticket.count();
  const allTickets = await prisma.ticket.findMany({
    select: { id: true, requesterId: true },
  });
  const users = await prisma.user.findMany({ select: { id: true } });
  const userIds = new Set(users.map((u) => u.id));
  const validTickets = allTickets.filter((t) => userIds.has(t.requesterId)).length;

  console.log('Data Migration Complete:');
  console.log(`- Created ${migratedCount} new User rows.`);
  console.log(`- Updated ${updatedCount} existing User rows.`);
  console.log(`- Backfilled itPriority for ${ticketsToUpdate.length} tickets.`);
  console.log(`- Verified ${validTickets} of ${totalTickets} tickets have valid User requester references.`);

  return {
    migratedCount,
    updatedCount,
    totalTickets,
    verifiedTickets: validTickets,
  };
}

if (require.main === module) {
  runDataMigration()
    .then(() => prisma.$disconnect())
    .catch(async (err) => {
      console.error('Migration failed:', err);
      await prisma.$disconnect();
      process.exit(1);
    });
}
