import { auth } from '@/lib/auth'
import Link from 'next/link'
import Chat from './Chat'
import { PrismaClient } from '../../../generated/prisma'

export default async function AppPage() {
  const session = await auth()
  if (!session) {
    return (
      <main className="p-6">
        <p>Not authenticated. <Link className="underline" href="/login">Sign in</Link></p>
      </main>
    )
  }
  const prisma = new PrismaClient()
  const user = await prisma.user.findUnique({ where: { phone: (session as any).phone } })
  const chats = await prisma.chat.findMany({
    where: { memberships: { some: { userId: user!.id } } },
    include: {
      messages: { orderBy: { createdAt: 'asc' }, include: { sender: true } },
    },
  })
  const firstChat = chats[0]
  const me = (session as any).phone as string
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Chats</h1>
      {firstChat ? (
        <Chat chatId={firstChat.id} me={me} />
      ) : (
        <p>No chats found.</p>
      )}
    </main>
  )
}

