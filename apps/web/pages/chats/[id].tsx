import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';

export default function ChatView() {
  const router = useRouter();
  const { id } = router.query as { id?: string };
  const [messages, setMessages] = useState<any[]>([]);
  const [body, setBody] = useState('');
  const [typing, setTyping] = useState(false);
  const [whoTyping, setWhoTyping] = useState<string | null>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (!id) return;
    api(`/api/messages/${id}`).then((d)=> setMessages(d.messages));
    const socket = getSocket();
    socketRef.current = socket;
    socket.emit('join:chat', { chatId: id });
    const onNew = (evt: any) => {
      if (evt?.message?.chatId === id) setMessages((m)=> [...m, evt.message]);
    };
    const onTyping = (evt: any) => {
      if (evt?.chatId === id) {
        setWhoTyping(evt.isTyping ? evt.userId : null);
      }
    };
    const onReceipt = (evt: any) => {
      setMessages((m)=> m.map((msg)=> msg.id === evt.messageId ? { ...msg, receipts: [...(msg.receipts||[]), { userId: evt.userId, status: evt.status }] } : msg));
    };
    socket.on('message:new', onNew);
    socket.on('typing', onTyping);
    socket.on('receipt:update', onReceipt);
    return () => {
      socket.off('message:new', onNew);
      socket.off('typing', onTyping);
      socket.off('receipt:update', onReceipt);
    };
  }, [id]);

  function send() {
    if (!id || !body) return;
    socketRef.current.emit('message:send', { chatId: id, body }, (res: any) => {
      if (res?.ok) setBody('');
    });
  }

  useEffect(() => {
    if (!id) return;
    const socket = socketRef.current || getSocket();
    socket.emit('typing', { chatId: id, isTyping: typing });
  }, [typing, id]);

  return (
    <div style={{ padding: 24 }}>
      <h2>Chat</h2>
      <div style={{ minHeight: 200, border: '1px solid #ddd', padding: 12 }}>
        {messages.map((m)=> (
          <div key={m.id}>{m.body || m.kind}</div>
        ))}
        {whoTyping && <div style={{ opacity:0.6, fontStyle:'italic' }}>Typing…</div>}
      </div>
      <div style={{ display:'flex', gap: 8, marginTop: 12 }}>
        <input style={{ flex:1 }} value={body} onChange={(e)=>setBody(e.target.value)} onFocus={()=>setTyping(true)} onBlur={()=>setTyping(false)} />
        <button onClick={send}>Send</button>
      </div>
    </div>
  );
}

