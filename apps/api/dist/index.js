"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const env_1 = require("./env");
const auth_1 = require("./auth");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, { cors: { origin: '*' } });
io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers['authorization']?.replace('Bearer ', '');
    const userId = token ? (0, auth_1.verifyToken)(token) : null;
    if (!userId)
        return next(new Error('unauthorized'));
    socket.userId = userId;
    next();
});
io.on('connection', (socket) => {
    socket.on('ping', (d) => socket.emit('pong', d));
});
app.get('/health', (_req, res) => res.json({ ok: true }));
app.post('/auth/register', async (req, res) => {
    try {
        const input = auth_1.registerSchema.parse(req.body);
        const token = await (0, auth_1.registerUser)(input);
        res.json({ token });
    }
    catch (e) {
        res.status(400).json({ error: e.message || 'bad_request' });
    }
});
app.post('/auth/login', async (req, res) => {
    try {
        const input = auth_1.loginSchema.parse(req.body);
        const token = await (0, auth_1.loginUser)(input);
        res.json({ token });
    }
    catch (e) {
        res.status(401).json({ error: e.message || 'unauthorized' });
    }
});
server.listen(env_1.env.PORT, () => {
    console.log(`api listening on ${env_1.env.PORT}`);
});
