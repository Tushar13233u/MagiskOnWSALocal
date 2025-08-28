import type { NextApiRequest, NextApiResponse } from 'next'
import { getIO } from '@/lib/socket-server'

export const config = {
  api: { bodyParser: false },
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // @ts-ignore - Next exposes the underlying HTTP server here
  const server = res.socket.server
  if (!(server as any).io) {
    (server as any).io = getIO(server as any)
  }
  res.end()
}

