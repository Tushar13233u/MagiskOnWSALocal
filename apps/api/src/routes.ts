import { Router } from 'express';
import { prisma } from './prisma';
import { requireAuth, getUserId } from './httpAuth';
import { upload } from './upload';

export const router = Router();

router.use(requireAuth);

router.get('/me', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: getUserId(req) } });
  res.json({ user });
});

router.post('/chat/one-to-one', async (req, res) => {
  const userId = getUserId(req);
  const { peerUserId } = req.body || {};
  if (!peerUserId) return res.status(400).json({ error: 'peerUserId_required' });
  // find existing chat with exactly these two members
  const chats = await prisma.chat.findMany({
    where: {
      isGroup: false,
      members: { some: { userId } }
    },
    include: { members: true }
  });
  const existing = chats.find((c) => c.members.length === 2 && c.members.some((m) => m.userId === peerUserId));
  if (existing) return res.json({ chat: existing });

  const chat = await prisma.chat.create({ data: { isGroup: false } });
  await prisma.chatMember.createMany({ data: [
    { chatId: chat.id, userId, role: 'MEMBER' },
    { chatId: chat.id, userId: peerUserId, role: 'MEMBER' }
  ]});
  res.json({ chat });
});

router.post('/chat/group', async (req, res) => {
  const userId = getUserId(req);
  const { title, memberUserIds } = req.body || {};
  if (!title || !Array.isArray(memberUserIds) || memberUserIds.length === 0) return res.status(400).json({ error: 'invalid_payload' });
  const chat = await prisma.chat.create({ data: { isGroup: true, title } });
  const data = [userId, ...memberUserIds].map((id: string) => ({ chatId: chat.id, userId: id, role: id === userId ? 'ADMIN' : 'MEMBER' }));
  await prisma.chatMember.createMany({ data });
  res.json({ chat });
});

router.get('/chats', async (req, res) => {
  const userId = getUserId(req);
  const chats = await prisma.chat.findMany({
    where: { members: { some: { userId } } },
    include: { members: true },
    orderBy: { updatedAt: 'desc' }
  });
  res.json({ chats });
});

router.get('/messages/:chatId', async (req, res) => {
  const userId = getUserId(req);
  const { chatId } = req.params;
  const member = await prisma.chatMember.findFirst({ where: { chatId, userId } });
  if (!member) return res.status(403).json({ error: 'forbidden' });
  const messages = await prisma.message.findMany({ where: { chatId }, orderBy: { createdAt: 'asc' }, include: { receipts: true } });
  res.json({ messages });
});

router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file_required' });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

