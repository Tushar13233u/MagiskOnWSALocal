import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { env } from './env';
import { z } from 'zod';
import { loginSchema, registerSchema, loginUser, registerUser, verifyToken } from './auth';
import { registerSocketHandlers } from './socket';
import { router as authedRoutes } from './routes';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

io.use((socket, next) => {
  const token = (socket.handshake.auth as any)?.token || (socket.handshake.headers['authorization'] as string | undefined)?.replace('Bearer ', '');
  const userId = token ? verifyToken(token) : null;
  if (!userId) return next(new Error('unauthorized'));
  (socket as any).userId = userId;
  next();
});

registerSocketHandlers(io);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/auth/register', async (req, res) => {
  try {
    const input = registerSchema.parse(req.body);
    const token = await registerUser(input);
    res.json({ token });
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'bad_request' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const input = loginSchema.parse(req.body);
    const token = await loginUser(input);
    res.json({ token });
  } catch (e: any) {
    res.status(401).json({ error: e.message || 'unauthorized' });
  }
});

app.use('/api', authedRoutes);

server.listen(env.PORT, () => {
  console.log(`api listening on ${env.PORT}`);
});
