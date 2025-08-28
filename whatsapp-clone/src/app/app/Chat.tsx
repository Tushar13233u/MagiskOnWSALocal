"use client"
import { useEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
import { getSocket } from '@/lib/socket-client'

type Message = {
  id: string
  text: string | null
  createdAt: string
  sender: { id: string; displayName: string }
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function Chat({ chatId, me }: { chatId: string; me: string }) {
  const { data, mutate } = useSWR<{ messages: Message[] }>(`/api/chats/${chatId}/messages`, fetcher)
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const socket = getSocket()
    socket.emit('join', chatId)
    const onNew = (msg: Message) => {
      mutate((prev) => ({ messages: [...(prev?.messages ?? []), msg] }), { revalidate: false })
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    socket.on('new-message', onNew)
    return () => {
      socket.off('new-message', onNew)
    }
  }, [chatId, mutate])

  async function send() {
    const trimmed = text.trim()
    if (!trimmed) return
    getSocket().emit('send-message', { chatId, senderPhone: me, text: trimmed })
    setText('')
  }

  const messages = useMemo(() => data?.messages ?? [], [data])

  return (
    <div className="flex h-[70vh] flex-col border rounded-lg">
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((m) => (
          <div key={m.id} className="max-w-[70%] rounded px-3 py-2 bg-emerald-100">
            <div className="text-xs text-neutral-500">{m.sender.displayName}</div>
            <div>{m.text}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 border-t flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Type a message"
          className="flex-1 rounded border px-3 py-2"
        />
        <button onClick={send} className="rounded bg-emerald-600 text-white px-4">
          Send
        </button>
      </div>
    </div>
  )
}

