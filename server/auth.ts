import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'reviewer' | 'speaker';
  speakerId?: number;
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

export function generateTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 30); // 30 days
  return expiry;
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function sanitizeUser(user: any): AuthUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    userType: user.userType,
    speakerId: user.speakerId
  };
}