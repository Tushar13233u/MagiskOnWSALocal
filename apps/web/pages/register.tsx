import { useState } from 'react';
import { api, setToken } from '../lib/api';
import { useRouter } from 'next/router';

export default function Register() {
  const [phone, setPhone] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { token } = await api('/auth/register', { method: 'POST', body: JSON.stringify({ phone, password, displayName }) });
      setToken(token);
      router.push('/chats');
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ padding: 24, display: 'grid', gap: 12 }}>
      <h2>Register</h2>
      <input placeholder="Phone" value={phone} onChange={(e)=>setPhone(e.target.value)} />
      <input placeholder="Display Name" value={displayName} onChange={(e)=>setDisplayName(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
      {error && <div style={{ color:'red' }}>{error}</div>}
      <button type="submit">Create account</button>
    </form>
  );
}

