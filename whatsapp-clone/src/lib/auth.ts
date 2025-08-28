import NextAuth, { type NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'
import { PrismaClient } from '../../generated/prisma'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

const credentialsSchema = z.object({
  phone: z.string().min(5),
  password: z.string().min(4),
})

export const authConfig: NextAuthConfig = {
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: { phone: {}, password: {} },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw)
        if (!parsed.success) return null
        const { phone, password } = parsed.data
        const user = await prisma.user.findUnique({ where: { phone } })
        if (!user) return null
        const isValid = user.statusMessage === null
          ? false
          : await bcrypt.compare(password, user.statusMessage)
        if (!isValid) return null
        return { id: user.id, name: user.displayName, image: user.avatarUrl, phone: user.phone }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = (user as any).id
        token.phone = (user as any).phone
      }
      return token
    },
    async session({ session, token }) {
      ;(session as any).userId = token.userId
      ;(session as any).phone = token.phone
      return session
    },
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

