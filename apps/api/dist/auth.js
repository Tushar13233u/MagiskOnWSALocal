"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerSchema = void 0;
exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.issueToken = issueToken;
exports.verifyToken = verifyToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const zod_1 = require("zod");
const prisma_1 = require("./prisma");
const env_1 = require("./env");
exports.registerSchema = zod_1.z.object({
    phone: zod_1.z.string().min(6),
    password: zod_1.z.string().min(6),
    displayName: zod_1.z.string().min(1)
});
exports.loginSchema = zod_1.z.object({
    phone: zod_1.z.string().min(6),
    password: zod_1.z.string().min(6)
});
async function registerUser(input) {
    const existing = await prisma_1.prisma.user.findUnique({ where: { phone: input.phone } });
    if (existing)
        throw new Error('Phone already registered');
    const hashed = await bcrypt_1.default.hash(input.password, 10);
    const user = await prisma_1.prisma.user.create({ data: { phone: input.phone, displayName: input.displayName, about: '', avatarUrl: null } });
    // store password hash in separate table for demo simplicity
    await prisma_1.prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS _passwords (userId TEXT PRIMARY KEY, hash TEXT NOT NULL)`);
    await prisma_1.prisma.$executeRawUnsafe(`INSERT INTO _passwords (userId, hash) VALUES (?, ?)`, user.id, hashed);
    return issueToken(user.id);
}
async function loginUser(input) {
    const user = await prisma_1.prisma.user.findUnique({ where: { phone: input.phone } });
    if (!user)
        throw new Error('Invalid credentials');
    const row = await prisma_1.prisma.$queryRawUnsafe(`SELECT hash FROM _passwords WHERE userId = ?`, user.id);
    const hash = Array.isArray(row) && row[0]?.hash;
    if (!hash)
        throw new Error('Invalid credentials');
    const ok = await bcrypt_1.default.compare(input.password, hash);
    if (!ok)
        throw new Error('Invalid credentials');
    return issueToken(user.id);
}
function issueToken(userId) {
    return jsonwebtoken_1.default.sign({ sub: userId }, env_1.env.JWT_SECRET, { expiresIn: '7d' });
}
function verifyToken(token) {
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        return payload.sub;
    }
    catch {
        return null;
    }
}
