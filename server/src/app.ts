import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import crypto from 'crypto';

// Suppress known upstream deprecation warning between @prisma/adapter-pg and pg 8.23+
const originalEmitWarning = process.emitWarning;
process.emitWarning = function (warning: any, ...args: any[]) {
  if (
    (typeof warning === 'string' && warning.includes('Calling client.query()')) ||
    (warning && typeof warning.message === 'string' && warning.message.includes('Calling client.query()'))
  ) {
    return;
  }
  return (originalEmitWarning as any).call(this, warning, ...args);
};

import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });

import cookieParser from 'cookie-parser';
import authRouter from './routes/auth';
import staffRouter from './routes/staff';
import adminRouter from './routes/admin';
import { authenticateSession, gatePasswordChange } from './middleware/auth';
import { COOKIE_NAME } from './utils/auth';
import { formatTicket, parseStatus, parsePriority } from './utils/format';

const app = express();
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(authenticateSession);
app.use(gatePasswordChange);

app.use('/api/auth', authRouter);
app.use('/api/staff', staffRouter);
app.use('/api/admin', adminRouter);

// Middleware to check requester / session identity
export const requireRequester = async (req: Request, res: Response, next: NextFunction) => {
  // If user is already authenticated via session cookie or Bearer token
  if (req.user) {
    (req as any).requester = req.user;
    return next();
  }

  // If session cookie or Bearer auth was supplied but req.user is undefined, reject with 401
  const hasToken = req.cookies?.[COOKIE_NAME] || req.headers.authorization;
  if (hasToken) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // Fallback for Lab 2 test compatibility when no session is present
  const requesterIdStr = req.header('X-Requester-Id');
  if (!requesterIdStr) {
    res.status(401).json({ error: 'Unauthorized or X-Requester-Id header missing' });
    return;
  }
  
  const requesterId = parseInt(requesterIdStr, 10);
  if (isNaN(requesterId)) {
    res.status(401).json({ error: 'Invalid X-Requester-Id' });
    return;
  }

  try {
    let user = await prisma.user.findUnique({
      where: { id: requesterId, isActive: true }
    });
    
    if (!user) {
      const devReq = await prisma.developmentRequester.findUnique({
        where: { id: requesterId, isActive: true }
      });
      if (!devReq) {
        res.status(403).json({ error: 'Requester not found or inactive' });
        return;
      }

      user = await prisma.user.findUnique({
        where: { email: devReq.email, isActive: true }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            id: devReq.id,
            name: devReq.name,
            email: devReq.email,
            passwordHash: 'legacy_dev_user',
            role: 'REQUESTER',
            isActive: true,
            mustChangePassword: true,
          }
        }).catch(async () => {
          return await prisma.user.findFirst({ where: { isActive: true } });
        });
      }
    }

    if (!user || !user.isActive) {
      res.status(403).json({ error: 'Requester not found or inactive' });
      return;
    }
    
    // Attach to request
    req.user = user;
    (req as any).requester = user;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'TokTickIT API' });
});

// REFERENCE DATA
app.get('/api/dev-requesters', async (req, res) => {
  try {
    const requesters = await prisma.developmentRequester.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, email: true, isActive: true },
    });
    res.status(200).json(requesters);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
      select: { id: true, name: true },
    });
    res.status(200).json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/related-systems', async (req, res) => {
  try {
    const systems = await prisma.relatedSystem.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
    res.status(200).json(systems);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Format ticket for API response
const formatTicket = (ticket: any) => {
  const mapPriority = (p: string | null) => p ? p.charAt(0) + p.slice(1).toLowerCase() : null;
  const mapStatus = (s: string) => {
    if (s === 'NEW') return 'New';
    if (s === 'OPEN') return 'Open';
    if (s === 'IN_PROGRESS') return 'In Progress';
    if (s === 'WAITING_FOR_REQUESTER') return 'Waiting for Requester';
    if (s === 'RESOLVED') return 'Resolved';
    if (s === 'CLOSED') return 'Closed';
    if (s === 'REOPENED') return 'Reopened';
    if (s === 'CANCELLED') return 'Cancelled';
    return s;
  };
  
  return {
    ...ticket,
    requestedPriority: mapPriority(ticket.requestedPriority),
    itPriority: mapPriority(ticket.itPriority),
    currentStatus: mapStatus(ticket.currentStatus),
  };
};

// TICKETS
app.post('/api/tickets', requireRequester, async (req, res) => {
  try {
    const user = req.user!;
    if (user.role === 'ADMINISTRATOR') {
      res.status(403).json({ error: 'Access forbidden: Insufficient permissions' });
      return;
    }
    const { categoryId, relatedSystemId, summary, description, requestedPriority } = req.body;
    
    if (
      !categoryId ||
      !relatedSystemId ||
      typeof summary !== 'string' ||
      typeof description !== 'string' ||
      summary.trim() === '' ||
      description.trim() === ''
    ) {
      res.status(400).json({ error: 'Missing or invalid required fields' });
      return;
    }
    
    if (summary.length > 100 || description.length > 1000) {
      res.status(400).json({ error: 'Summary or description too long' });
      return;
    }

    const catId = Number(categoryId);
    const sysId = Number(relatedSystemId);
    if (isNaN(catId) || isNaN(sysId)) {
      res.status(400).json({ error: 'Invalid categoryId or relatedSystemId' });
      return;
    }

    // Verify category and related system exist and are active
    const [category, relatedSystem] = await Promise.all([
      prisma.category.findUnique({ where: { id: catId, isActive: true } }),
      prisma.relatedSystem.findUnique({ where: { id: sysId, isActive: true } }),
    ]);

    if (!category || !relatedSystem) {
      res.status(400).json({ error: 'Invalid category or related system' });
      return;
    }

    let priority: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (requestedPriority) {
      const normalizedPriority = String(requestedPriority).toUpperCase();
      if (!['LOW', 'MEDIUM', 'HIGH'].includes(normalizedPriority)) {
        res.status(400).json({ error: 'Invalid requested priority. Must be Low, Medium, or High.' });
        return;
      }
      priority = normalizedPriority as 'LOW' | 'MEDIUM' | 'HIGH';
    }
    
    // Generate unique ticket number TKT-YYYY-NNNNNN
    const year = new Date().getFullYear();
    let ticketNumber = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      const randomNum = Math.floor(Math.random() * 900000) + 100000;
      ticketNumber = `TKT-${year}-${randomNum}`;
      const existing = await prisma.ticket.findUnique({ where: { ticketNumber } });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        summary: summary.trim(),
        description: description.trim(),
        requestedPriority: priority,
        itPriority: priority,
        categoryId: catId,
        relatedSystemId: sysId,
        requesterId: user.id,
        ticketOwnerId: null,
        currentStatus: 'NEW',
        requesterResolutionPending: false,
      },
      include: {
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true, email: true, role: true } },
      }
    });
    
    res.status(201).json(formatTicket(ticket));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/tickets', requireRequester, async (req, res) => {
  try {
    const user = req.user!;
    const { search, category, priority, status, sort = 'updatedAt', order = 'desc', page = '1', limit = '8' } = req.query;
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    
    if (isNaN(pageNum) || pageNum <= 0) {
      res.status(400).json({ error: 'Invalid page parameter' });
      return;
    }
    if (isNaN(limitNum) || limitNum <= 0 || limitNum > 100) {
      res.status(400).json({ error: 'Invalid limit parameter' });
      return;
    }
    if (order !== 'asc' && order !== 'desc') {
      res.status(400).json({ error: 'Invalid order parameter' });
      return;
    }
    
    const allowedSortFields = ['ticketNumber', 'createdAt', 'updatedAt', 'summary'];
    if (!allowedSortFields.includes(sort as string)) {
      res.status(400).json({ error: 'Invalid sort field' });
      return;
    }

    const where: any = { requesterId: user.id };
    
    if (search) {
      where.OR = [
        { ticketNumber: { contains: search as string, mode: 'insensitive' } },
        { summary: { contains: search as string, mode: 'insensitive' } },
        { requester: { name: { contains: search as string, mode: 'insensitive' } } }
      ];
    }
    if (category) where.categoryId = parseInt(category as string, 10);
    if (priority) {
      const priorityMapped = parsePriority(priority as string);
      if (priorityMapped) where.requestedPriority = priorityMapped;
    }
    if (status) {
      const statusMapped = parseStatus(status as string);
      if (statusMapped) where.currentStatus = statusMapped;
    }
    
    const totalItems = await prisma.ticket.count({ where });
    const totalPages = Math.max(1, Math.ceil(totalItems / limitNum));
    
    if (pageNum > totalPages) {
      res.status(400).json({ error: 'Invalid page parameter' });
      return;
    }
    
    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: [
        { [sort as string]: order },
        { id: 'desc' } // secondary sort
      ],
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      include: {
        category: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true, email: true, role: true } }
      }
    });
    
    res.status(200).json({
      data: tickets.map(formatTicket),
      meta: {
        totalItems,
        totalPages,
        currentPage: pageNum,
        itemsPerPage: limitNum
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/tickets/:id', requireRequester, async (req, res) => {
  try {
    const user = req.user!;
    const ticketId = parseInt(req.params.id, 10);
    
    if (isNaN(ticketId)) {
      res.status(400).json({ error: 'Invalid ticket id' });
      return;
    }
    
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true, email: true, role: true } },
        ticketOwner: { select: { id: true, name: true, email: true, role: true } },
        attachments: {
          select: {
            id: true,
            originalFilename: true,
            size: true,
            mimeType: true,
            removalReason: true,
            removedAt: true,
            createdAt: true
          }
        }
      }
    });
    
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }
    
    if (ticket.requesterId !== user.id && user.role !== 'IT_STAFF' && user.role !== 'ADMINISTRATOR') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    
    res.status(200).json(formatTicket(ticket));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Sanitize extension and generate unique UUID storage path per BR-12
    const ext = path.extname(file.originalname).toLowerCase();
    const safeUuid = crypto.randomUUID();
    cb(null, `${safeUuid}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, WEBP, and PDF are permitted.'));
    }
  }
});

// ATTACHMENTS
app.post('/api/tickets/:id/attachments', requireRequester, (req, res, next) => {
  upload.single('attachment')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const user = req.user!;
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      res.status(400).json({ error: 'Invalid ticket id' });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'Missing attachment file' });
      return;
    }
    
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { attachments: { where: { removedAt: null } } }
    });
    
    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }
    
    if (ticket.requesterId !== user.id && user.role !== 'IT_STAFF' && user.role !== 'ADMINISTRATOR') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    
    if (ticket.attachments.length >= 5) {
      res.status(400).json({ error: 'Maximum of 5 active attachments allowed' });
      return;
    }
    
    // Sanitize original filename (strip directory traversal / special chars for metadata)
    const sanitizedOriginal = path.basename(file.originalname).replace(/[^\w.-]/g, '_');

    const attachment = await prisma.attachment.create({
      data: {
        ticketId,
        originalFilename: sanitizedOriginal || file.originalname,
        storagePath: file.filename,
        mimeType: file.mimetype,
        size: file.size
      }
    });
    
    res.status(201).json({
      id: attachment.id,
      originalFilename: attachment.originalFilename,
      size: attachment.size,
      mimeType: attachment.mimeType,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/attachments/:id', requireRequester, async (req, res) => {
  try {
    const user = req.user!;
    const attachmentId = parseInt(req.params.id, 10);
    if (isNaN(attachmentId)) {
      res.status(400).json({ error: 'Invalid attachment id' });
      return;
    }
    
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { ticket: true }
    });
    
    if (!attachment) {
      res.status(404).json({ error: 'Attachment not found' });
      return;
    }
    
    if (attachment.ticket.requesterId !== user.id && user.role !== 'IT_STAFF' && user.role !== 'ADMINISTRATOR') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    
    res.status(200).json({
      id: attachment.id,
      originalFilename: attachment.originalFilename,
      size: attachment.size,
      mimeType: attachment.mimeType,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/attachments/:id/download', requireRequester, async (req, res) => {
  try {
    const user = req.user!;
    const attachmentId = parseInt(req.params.id, 10);
    if (isNaN(attachmentId)) {
      res.status(400).json({ error: 'Invalid attachment id' });
      return;
    }
    
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { ticket: true }
    });
    
    if (!attachment) {
      res.status(404).json({ error: 'Attachment not found' });
      return;
    }
    
    if (attachment.ticket.requesterId !== user.id && user.role !== 'IT_STAFF' && user.role !== 'ADMINISTRATOR') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    
    if (attachment.removedAt) {
      res.status(400).json({ error: 'Attachment has been removed' });
      return;
    }
    
    const filePath = path.join(__dirname, '../uploads', attachment.storagePath);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'File not found on disk' });
      return;
    }
    
    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${attachment.originalFilename}"`);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.patch('/api/attachments/:id/remove', requireRequester, async (req, res) => {
  try {
    const user = req.user!;
    const attachmentId = parseInt(req.params.id, 10);
    if (isNaN(attachmentId)) {
      res.status(400).json({ error: 'Invalid attachment id' });
      return;
    }

    const { reason } = req.body;
    if (!reason || typeof reason !== 'string' || reason.trim() === '') {
      res.status(400).json({ error: 'Reason is required' });
      return;
    }
    
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { ticket: true }
    });
    
    if (!attachment) {
      res.status(404).json({ error: 'Attachment not found' });
      return;
    }
    
    if (attachment.ticket.requesterId !== user.id && user.role !== 'IT_STAFF' && user.role !== 'ADMINISTRATOR') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    
    await prisma.attachment.update({
      where: { id: attachmentId },
      data: {
        removedAt: new Date(),
        removalReason: reason.trim()
      }
    });
    
    res.status(200).json({
      message: 'Attachment removed successfully',
      id: attachmentId,
      removedAt: new Date(),
      removalReason: reason.trim()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUBLIC COMMENTS
app.get('/api/tickets/:id/comments', requireRequester, async (req, res) => {
  try {
    const user = req.user!;
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      res.status(400).json({ error: 'Invalid ticket id' });
      return;
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    if (ticket.requesterId !== user.id && user.role !== 'IT_STAFF' && user.role !== 'ADMINISTRATOR') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const comments = await prisma.publicComment.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        ticketId: true,
        content: true,
        author: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        createdAt: true
      }
    });

    res.status(200).json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/tickets/:id/comments', requireRequester, async (req, res) => {
  try {
    const user = req.user!;
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      res.status(400).json({ error: 'Invalid ticket id' });
      return;
    }

    const { content } = req.body;
    if (!content || typeof content !== 'string' || content.trim().length === 0 || content.trim().length > 2000) {
      res.status(400).json({ error: 'Comment content must be between 1 and 2000 characters' });
      return;
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    if (ticket.requesterId !== user.id && user.role !== 'IT_STAFF' && user.role !== 'ADMINISTRATOR') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const comment = await prisma.publicComment.create({
      data: {
        ticketId,
        authorId: user.id,
        content: content.trim()
      },
      select: {
        id: true,
        ticketId: true,
        content: true,
        author: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        createdAt: true
      }
    });

    res.status(201).json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// INTERNAL NOTES (Restricted strictly to IT_STAFF and ADMINISTRATOR per BR-04, BR-20, AC-04)
const requireInternalNotesRole = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  if (req.user.role !== 'IT_STAFF' && req.user.role !== 'ADMINISTRATOR') {
    res.status(403).json({ error: 'Access forbidden: Insufficient permissions' });
    return;
  }
  next();
};

app.get('/api/tickets/:id/internal-notes', requireInternalNotesRole, async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      res.status(400).json({ error: 'Invalid ticket id' });
      return;
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    const notes = await prisma.internalNote.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        ticketId: true,
        content: true,
        author: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        createdAt: true,
      },
    });

    res.status(200).json(notes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/tickets/:id/internal-notes', requireInternalNotesRole, async (req, res) => {
  try {
    const user = req.user!;
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      res.status(400).json({ error: 'Invalid ticket id' });
      return;
    }

    const { content } = req.body;
    if (
      !content ||
      typeof content !== 'string' ||
      content.trim().length === 0 ||
      content.trim().length > 2000
    ) {
      res.status(400).json({
        error: 'Internal note content must be between 1 and 2000 characters',
      });
      return;
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    const note = await prisma.internalNote.create({
      data: {
        ticketId,
        authorId: user.id,
        content: content.trim(),
      },
      select: {
        id: true,
        ticketId: true,
        content: true,
        author: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        createdAt: true,
      },
    });

    res.status(201).json(note);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// RESOLVE INDICATION
app.patch('/api/tickets/:id/resolve-indication', requireRequester, async (req, res) => {
  try {
    const user = req.user!;
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      res.status(400).json({ error: 'Invalid ticket id' });
      return;
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    // Only ticket owner may indicate problem appears resolved
    if (ticket.requesterId !== user.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Update requesterResolutionPending = true and append system public comment per Spec § 11.5
    // Never modify currentStatus to RESOLVED or CLOSED per BR-05
    await prisma.$transaction([
      prisma.ticket.update({
        where: { id: ticketId },
        data: { requesterResolutionPending: true }
      }),
      prisma.publicComment.create({
        data: {
          ticketId,
          authorId: user.id,
          content: `${user.name} indicated that the problem appears resolved.`
        }
      })
    ]);

    res.status(200).json({
      id: ticketId,
      requesterResolutionPending: true,
      message: 'Problem indicated as resolved'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default app;