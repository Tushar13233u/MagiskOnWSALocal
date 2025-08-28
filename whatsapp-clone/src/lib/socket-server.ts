import type { Server as HTTPServer } from 'http'
import type { Socket } from 'net'
import { Server as IOServer } from 'socket.io'
import { PrismaClient } from '../../generated/prisma'

const prisma = new PrismaClient()

type NextSocketServer = HTTPServer & { io?: IOServer }
type NextNetSocket = Socket & { server?: NextSocketServer }

declare global {
  // eslint-disable-next-line no-var
  var io: IOServer | undefined
}

export function getIO(server?: NextSocketServer) {
  if (global.io) return global.io
  if (!server) throw new Error('HTTP server not available to attach Socket.IO')
  const io = new IOServer(server, { path: '/api/socket', cors: { origin: '*' } })

  io.on('connection', (socket) => {
    socket.on('join', (roomId: string) => {
      socket.join(roomId)
    })

    socket.on('send-message', async (payload: { chatId: string; senderPhone: string; text: string }) => {
      const user = await prisma.user.findUnique({ where: { phone: payload.senderPhone } })
      if (!user) return
      const message = await prisma.message.create({
        data: { chatId: payload.chatId, senderId: user.id, type: 'TEXT', text: payload.text },
        include: { sender: true },
      })
      io.to(payload.chatId).emit('new-message', {
        id: message.id,
        text: message.text,
        createdAt: message.createdAt,
        sender: { id: message.senderId, displayName: message.sender.displayName },
      })
    })
  })

  global.io = io
  return io
}

