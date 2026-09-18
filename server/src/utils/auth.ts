import jwt from 'jsonwebtoken';
import { Response } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'toktickit-secret-session-key-lab-03-2026';
export const COOKIE_NAME = 'toktickit_session';

export interface SessionPayload {
  id: number;
  email: string;
  role: string;
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validatePasswordComplexity(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one numeric digit');
  }
  if (!/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function signSessionToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionPayload;
    return {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
  } catch {
    return null;
  }
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 86400 * 1000, // 24 hours in milliseconds
    secure: process.env.NODE_ENV === 'production',
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

