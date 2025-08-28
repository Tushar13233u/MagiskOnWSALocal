import { PrismaClient } from '../../../../generated/prisma'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

export async function POST() {
  await prisma.receipt.deleteMany({})
  await prisma.message.deleteMany({})
  await prisma.membership.deleteMany({})
  await prisma.chat.deleteMany({})
  await prisma.user.deleteMany({})

  const [alice, bob] = await Promise.all([
    prisma.user.create({
      data: {
        phone: '+1000000001',
        displayName: 'Alice',
        avatarUrl: null,
        statusMessage: await bcrypt.hash('pass1234', 10),
      },
    }),
    prisma.user.create({
      data: {
        phone: '+1000000002',
        displayName: 'Bob',
        avatarUrl: null,
        statusMessage: await bcrypt.hash('pass1234', 10),
      },
    }),
  ])

  const chat = await prisma.chat.create({ data: { isGroup: false } })
  await prisma.membership.createMany({
    data: [
      { chatId: chat.id, userId: alice.id },
      { chatId: chat.id, userId: bob.id },
    ],
  })
  await prisma.message.createMany({
    data: [
      { chatId: chat.id, senderId: alice.id, type: 'TEXT', text: 'Hey Bob!' },
      { chatId: chat.id, senderId: bob.id, type: 'TEXT', text: 'Hi Alice!' },
    ],
  })

  return new Response(JSON.stringify({ ok: true }), { status: 200 })
}

