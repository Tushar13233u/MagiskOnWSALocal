import dotenv from 'dotenv';
dotenv.config();

export const env = {
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret',
  PORT: Number(process.env.PORT || 4000)
};
