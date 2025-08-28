import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import Link from 'next/link';

export default function Chats() {
  const [chats, setChats] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/chats').then((d)=> setChats(d.chats)).catch((e)=> setError(e.message));
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2>Chats</h2>
      {error && <div style={{ color:'red' }}>{error}</div>}
      <ul>
        {chats.map((c)=> (
          <li key={c.id}><Link href={`/chats/${c.id}`}>{c.title || (c.isGroup ? 'Group' : 'Direct Chat')}</Link></li>
        ))}
      </ul>
    </div>
  );
}

