import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/aijobtracker',
  jwtSecret: process.env.JWT_SECRET || 'your_super_secret_jwt_key_here',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
};
