import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod = null;

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/aijobtracker';
    console.log(`Connecting to MongoDB at: ${mongoUri}...`);
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 3000
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.warn('⚠️ Local MongoDB connection failed:', error.message);
    console.log('🚀 Starting in-memory MongoDB server as fallback...');
    
    try {
      mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      console.log(`🔗 In-memory MongoDB URI: ${uri}`);
      
      await mongoose.connect(uri);
      console.log('✅ In-memory MongoDB connected successfully');
    } catch (innerError) {
      console.error('❌ Failed to start and connect to in-memory MongoDB:', innerError.message);
      process.exit(1);
    }
  }
};
