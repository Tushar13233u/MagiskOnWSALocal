import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from './prisma';
import { env } from './env';

export const registerSchema = z.object({
  phone: z.string().min(6),
  password: z.string().min(6),
  displayName: z.string().min(1)
});

export const loginSchema = z.object({
  phone: z.string().min(6),
  password: z.string().min(6)
});

export async function registerUser(input: z.infer<typeof registerSchema>) {
  const existing = await prisma.user.findUnique({ where: { phone: input.phone } });
  if (existing) throw new Error('Phone already registered');
  const hashed = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({ data: { phone: input.phone, displayName: input.displayName, about: '', avatarUrl: null } });
  // store password hash in separate table for demo simplicity
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS _passwords (userId TEXT PRIMARY KEY, hash TEXT NOT NULL)`);
  await prisma.$executeRawUnsafe(`INSERT INTO _passwords (userId, hash) VALUES (?, ?)`, user.id, hashed);
  return issueToken(user.id);
}

export async function loginUser(input: z.infer<typeof loginSchema>) {
  const user = await prisma.user.findUnique({ where: { phone: input.phone } });
  if (!user) throw new Error('Invalid credentials');
  const row: any = await prisma.$queryRawUnsafe(`SELECT hash FROM _passwords WHERE userId = ?`, user.id);
  const hash = Array.isArray(row) && row[0]?.hash;
  if (!hash) throw new Error('Invalid credentials');
  const ok = await bcrypt.compare(input.password, hash);
  if (!ok) throw new Error('Invalid credentials');
  return issueToken(user.id);
}

export function issueToken(userId: string) {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as any;
    return payload.sub as string;
  } catch {
    return null;
  }
}
