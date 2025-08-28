import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Realtime Chat</h1>
      <p>
        <Link href="/login">Login</Link> · <Link href="/register">Register</Link>
      </p>
    </div>
  );
}

