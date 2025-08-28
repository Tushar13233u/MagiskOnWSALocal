import "./globals.css"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "WhatsApp Clone",
  description: "Realtime chat app clone",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-neutral-50 text-neutral-900">{children}</body>
    </html>
  )
}
