import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { config } from '../config/env.js';

const MONGO_URI = config.mongoUri;

const seedDemoUser = async () => {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const existing = await User.findOne({ email: 'test@example.com' });
    if (!existing) {
      const demo = new User({ name: 'Demo User', email: 'test@example.com', password: 'Test1234!' });
      await demo.save();
      console.log('✅ Demo user created');
    } else {
      console.log('🔁 Demo user already exists');
    }
    await mongoose.disconnect();
  } catch (err) {
    console.error('❌ Seed error', err);
  }
};

seedDemoUser();
