import Link from 'next/link'
import { auth } from '@/lib/auth'

export default async function HomePage() {
  const session = await auth()
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">WhatsApp Clone</h1>
      {session ? (
        <div className="space-y-2">
          <p className="text-neutral-700">Signed in as {(session as any).phone}</p>
          <Link href="/app" className="text-emerald-700 underline">Open App</Link>
        </div>
      ) : (
        <Link href="/login" className="text-emerald-700 underline">Sign in</Link>
      )}
    </main>
  )
}
