import { describe, it, expect, beforeAll } from 'vitest';
import bcrypt from 'bcryptjs';
import { prisma } from '../../src/app';
import { runDataMigration } from '../../prisma/data-migration';

describe('Lab 3: User Schema Evolution & Data Migration Suite', () => {
  beforeAll(async () => {
    // Run data migration to ensure all legacy requesters are synced to User
    await runDataMigration();
  });
  describe('1. Legacy Requester Migration & Password Change Governance', () => {
    it('should have migrated all DevelopmentRequester rows into User table with role REQUESTER', async () => {
      const devRequesters = await prisma.developmentRequester.findMany();
      expect(devRequesters.length).toBeGreaterThan(0);

      for (const devReq of devRequesters) {
        const user = await prisma.user.findUnique({ where: { email: devReq.email } });
        expect(user, `User with email ${devReq.email} must exist`).not.toBeNull();
        expect(user!.name).toBe(devReq.name);
        expect(user!.role).toBe('REQUESTER');
        expect(user!.isActive).toBe(devReq.isActive);
      }
    });

    it('should enforce mustChangePassword = true for every migrated legacy Requester', async () => {
      const legacyRequesters = await prisma.developmentRequester.findMany();
      for (const legacy of legacyRequesters) {
        const user = await prisma.user.findUnique({ where: { email: legacy.email } });
        expect(user).not.toBeNull();
        expect(
          user!.mustChangePassword,
          `Migrated user ${user!.email} must have mustChangePassword = true`
        ).toBe(true);
      }
    });

    it('should have hashed the initial temporary password with bcrypt for migrated requesters', async () => {
      const sampleUser = await prisma.user.findFirst({
        where: { email: { endsWith: '@kmutt.ac.th' } },
      });
      expect(sampleUser).not.toBeNull();
      expect(sampleUser!.passwordHash).toMatch(/^\$2[aby]\$\d+\$/);
      const isMatch = await bcrypt.compare('Password123!', sampleUser!.passwordHash);
      expect(isMatch, 'Password hash must verify against local dev password Password123!').toBe(true);
    });

    it('should verify that the canonical bcrypt hash string in migration.sql matches Password123!', async () => {
      // Exact hash string embedded in server/prisma/migrations/20260912100459_lab3_user_migration/migration.sql
      const CANONICAL_MIGRATION_SQL_HASH = '$2b$10$/JUXYn89A7GPKkDiCe1auO9RrwKByKrUb1olCw1bnMRS5HiFECVG6';
      const isMatch = await bcrypt.compare('Password123!', CANONICAL_MIGRATION_SQL_HASH);
      expect(isMatch, 'The exact bcrypt hash in migration.sql must decrypt to Password123!').toBe(true);
    });
  });

  describe('2. Ticket Data & Ownership Preservation', () => {
    it('should preserve existing tickets without losing or misattributing ownership', async () => {
      const totalTickets = await prisma.ticket.count();
      expect(totalTickets).toBeGreaterThanOrEqual(10);

      // Verify each ticket has a valid User foreign key relationship
      const tickets = await prisma.ticket.findMany({
        include: { requester: true },
      });

      for (const ticket of tickets) {
        expect(ticket.requester, `Ticket ${ticket.ticketNumber} must have a valid requester`).not.toBeNull();
        expect(ticket.requesterId).toBe(ticket.requester.id);
        expect(ticket.requester.role).toBe('REQUESTER');
      }
    });

    it('should preserve original ticket fields and backfill itPriority from requestedPriority', async () => {
      const ticket1 = await prisma.ticket.findUnique({
        where: { ticketNumber: 'TKT-2026-0001' },
      });
      expect(ticket1).not.toBeNull();
      expect(ticket1!.summary).toBeTruthy();
      expect(ticket1!.description).toBeTruthy();
      expect(ticket1!.requestedPriority).toBeTruthy();
      expect(ticket1!.itPriority).not.toBeNull();
      expect(ticket1!.currentStatus).toBe('NEW');
    });

    it('should preserve all attachments and soft-removal metadata on existing tickets', async () => {
      const ticket1 = await prisma.ticket.findUnique({
        where: { ticketNumber: 'TKT-2026-0001' },
        include: { attachments: true },
      });
      expect(ticket1).not.toBeNull();
      expect(ticket1!.attachments.length).toBeGreaterThanOrEqual(3);

      const removedAttachment = ticket1!.attachments.find((a) => a.removedAt !== null);
      expect(removedAttachment, 'Must have soft-removed attachment').toBeDefined();
      expect(removedAttachment!.removalReason).toBeTruthy();
      expect(removedAttachment!.storagePath).toBe('test-attachment-removed.png');

      const activeAttachments = ticket1!.attachments.filter((a) => a.removedAt === null);
      expect(activeAttachments.length).toBeGreaterThanOrEqual(2);
      expect(activeAttachments.some((a) => a.storagePath === 'test-attachment-1.png')).toBe(true);
      expect(activeAttachments.some((a) => a.storagePath === 'test-attachment-2.pdf')).toBe(true);
    });

    it('should confirm Attachment composite index Attachment_ticketId_removedAt_idx exists in PostgreSQL', async () => {
      const indexes = await prisma.$queryRawUnsafe<Array<{ indexname: string }>>(
        `SELECT indexname FROM pg_indexes WHERE tablename = 'Attachment' AND indexname = 'Attachment_ticketId_removedAt_idx';`
      );
      expect(indexes.length, 'Attachment_ticketId_removedAt_idx must exist in database').toBe(1);
    });
  });

  describe('3. Lab 3 Schema Extensions & Relations', () => {
    it('should allow CRITICAL priority on tickets', async () => {
      const criticalTicket = await prisma.ticket.findFirst({
        where: { itPriority: 'CRITICAL' },
      });
      expect(criticalTicket, 'Database must support CRITICAL itPriority').toBeDefined();
    });

    it('should support expanded ticket status enum values', async () => {
      const statuses = await prisma.ticket.findMany({
        select: { currentStatus: true },
        distinct: ['currentStatus'],
      });
      const foundStatuses = statuses.map((s) => s.currentStatus);

      // Verify multiple Lab 3 statuses exist in seeded/operational data
      expect(foundStatuses).toContain('NEW');
      expect(foundStatuses).toContain('OPEN');
      expect(foundStatuses).toContain('IN_PROGRESS');
    });

    it('should properly support ticketOwnerId referencing IT Staff / Admin users', async () => {
      const assignedTicket = await prisma.ticket.findFirst({
        where: { ticketOwnerId: { not: null } },
        include: { ticketOwner: true },
      });
      expect(assignedTicket).toBeDefined();
      expect(assignedTicket!.ticketOwner).not.toBeNull();
      expect(['IT_STAFF', 'ADMINISTRATOR']).toContain(assignedTicket!.ticketOwner!.role);
    });

    it('should support Public Comments with author relationship', async () => {
      const comment = await prisma.publicComment.findFirst({
        include: { author: true, ticket: true },
      });
      expect(comment).toBeDefined();
      expect(comment!.content).toBeTruthy();
      expect(comment!.author).not.toBeNull();
      expect(comment!.ticket).not.toBeNull();
    });

    it('should support Internal Notes with author relationship', async () => {
      const note = await prisma.internalNote.findFirst({
        include: { author: true, ticket: true },
      });
      expect(note).toBeDefined();
      expect(note!.content).toBeTruthy();
      expect(note!.author).not.toBeNull();
      expect(['IT_STAFF', 'ADMINISTRATOR']).toContain(note!.author.role);
    });
  });

  describe('4. Seed User Distribution & Role Matrix', () => {
    it('should have at least 1 active Administrator (and secondary admin for guard tests)', async () => {
      const admins = await prisma.user.findMany({
        where: { role: 'ADMINISTRATOR', isActive: true },
      });
      expect(admins.length).toBeGreaterThanOrEqual(1);
      const primaryAdmin = admins.find((a) => a.email === 'admin@toktick.it');
      expect(primaryAdmin).toBeDefined();
      expect(primaryAdmin!.mustChangePassword).toBe(false);

      const adminPasswordValid = await bcrypt.compare('Admin1234!', primaryAdmin!.passwordHash);
      expect(adminPasswordValid).toBe(true);
    });

    it('should have at least 3 active and 1 inactive IT Staff users', async () => {
      const activeStaff = await prisma.user.findMany({
        where: { role: 'IT_STAFF', isActive: true },
      });
      const inactiveStaff = await prisma.user.findMany({
        where: { role: 'IT_STAFF', isActive: false },
      });
      expect(activeStaff.length).toBeGreaterThanOrEqual(3);
      expect(inactiveStaff.length).toBeGreaterThanOrEqual(1);
      expect(inactiveStaff.some((s) => s.email === 'kevin.it@toktick.it')).toBe(true);
    });

    it('should have at least 4 active and 1 inactive Requesters with correct mustChangePassword flags', async () => {
      const activeRequesters = await prisma.user.findMany({
        where: { role: 'REQUESTER', isActive: true, email: { endsWith: '@toktick.it' } },
      });
      const inactiveRequesters = await prisma.user.findMany({
        where: { role: 'REQUESTER', isActive: false, email: { endsWith: '@toktick.it' } },
      });

      expect(activeRequesters.length).toBeGreaterThanOrEqual(4);
      expect(inactiveRequesters.length).toBeGreaterThanOrEqual(1);

      const alex = await prisma.user.findUnique({ where: { email: 'alex.thompson@toktick.it' } });
      expect(alex).toBeDefined();
      expect(alex!.mustChangePassword).toBe(true);

      const jennifer = await prisma.user.findUnique({ where: { email: 'jennifer.anderson@toktick.it' } });
      expect(jennifer).toBeDefined();
      expect(jennifer!.mustChangePassword).toBe(false);
    });
  });
});
