import { Server, Socket } from 'socket.io';
import { prisma } from './prisma';

type Ack = (response: { ok: boolean; [key: string]: any }) => void;

export function registerSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket & { userId?: string }) => {
    const userId = (socket as any).userId as string;
    socket.join(`user:${userId}`);

    socket.on('join:chat', async ({ chatId }: { chatId: string }, cb?: Ack) => {
      try {
        if (!chatId) throw new Error('invalid_payload');
        const member = await prisma.chatMember.findFirst({ where: { chatId, userId } });
        if (!member) throw new Error('forbidden');
        socket.join(`chat:${chatId}`);
        cb && cb({ ok: true });
      } catch (e: any) {
        cb && cb({ ok: false, error: e.message || 'error' });
      }
    });

    socket.on(
      'message:send',
      async (
        payload: { chatId: string; body?: string; kind?: string; mediaUrl?: string | null; mediaType?: string | null },
        cb?: Ack
      ) => {
        try {
          const { chatId, body, kind = 'TEXT', mediaUrl = null, mediaType = null } = payload || ({} as any);
          if (!chatId || (!body && !mediaUrl)) throw new Error('invalid_payload');
          const member = await prisma.chatMember.findFirst({ where: { chatId, userId } });
          if (!member) throw new Error('forbidden');
          const message = await prisma.message.create({
            data: { chatId, authorId: userId, body: body ?? null, kind: kind as any, mediaUrl, mediaType }
          });
          // bump chat updatedAt
          await prisma.chat.update({ where: { id: chatId }, data: { updatedAt: new Date() } });
          const members = await prisma.chatMember.findMany({ where: { chatId }, select: { userId: true } });
          const createReceipts = members
            .filter((m) => m.userId !== userId)
            .map((m) =>
              prisma.messageReceipt.create({ data: { messageId: message.id, userId: m.userId, status: 'SENT' as any } })
            );
          await Promise.all(createReceipts);
          io.to(members.map((m) => `user:${m.userId}`)).emit('message:new', { message });
          cb && cb({ ok: true, message });
        } catch (e: any) {
          cb && cb({ ok: false, error: e.message || 'error' });
        }
      }
    );

    socket.on('receipt:ack', async ({ messageId, status }: { messageId: string; status: 'DELIVERED' | 'READ' }, cb?: Ack) => {
      try {
        if (!messageId || !['DELIVERED', 'READ'].includes(status)) throw new Error('invalid_payload');
        const receipt = await prisma.messageReceipt.upsert({
          where: { messageId_userId_status: { messageId, userId, status } },
          update: {},
          create: { messageId, userId, status }
        });
        const msg = await prisma.message.findUnique({ where: { id: messageId }, select: { authorId: true } });
        if (msg?.authorId) {
          // notify author about receipt update
          io.to(`user:${msg.authorId}`).emit('receipt:update', { messageId, userId, status });
        }
        cb && cb({ ok: true });
      } catch (e: any) {
        cb && cb({ ok: false, error: e.message || 'error' });
      }
    });

    socket.on('typing', ({ chatId, isTyping }: { chatId: string; isTyping: boolean }) => {
      if (!chatId) return;
      io.to(`chat:${chatId}`).emit('typing', { chatId, userId, isTyping: !!isTyping });
    });
  });
}

