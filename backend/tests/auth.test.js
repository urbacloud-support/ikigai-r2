import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../server.js';
import User from '../models/User.js';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

beforeAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Auth API', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  test('POST /api/auth/login - Success', async () => {
    await User.create({
      name: 'Test Admin',
      email: 'test@admin.com',
      password: 'password123',
      role: 'admin'
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@admin.com', password: 'password123' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe('test@admin.com');
    // Check if cookie is set
    expect(res.headers['set-cookie']).toBeDefined();
  });

  test('POST /api/auth/login - Invalid Password', async () => {
    await User.create({
      name: 'Test Admin',
      email: 'test@admin.com',
      password: 'password123',
      role: 'admin'
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@admin.com', password: 'wrongpassword' });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
