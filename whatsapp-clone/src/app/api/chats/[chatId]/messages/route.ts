import { PrismaClient } from '../../../../../../generated/prisma'

const prisma = new PrismaClient()

export async function GET(_: Request, { params }: { params: { chatId: string } }) {
  const messages = await prisma.message.findMany({
    where: { chatId: params.chatId },
    orderBy: { createdAt: 'asc' },
    include: { sender: true },
  })
  return new Response(JSON.stringify({ messages }), { status: 200 })
}

