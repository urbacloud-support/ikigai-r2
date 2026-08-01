import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../server.js';
import User from '../models/User.js';
import Team from '../models/Team.js';
import Track from '../models/Track.js';
import Event from '../models/Event.js';
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

describe('Admin API Rigorous Tests', () => {
  let adminToken;

  beforeEach(async () => {
    await User.deleteMany({});
    await Team.deleteMany({});
    await Track.deleteMany({});
    await Event.deleteMany({});

    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@ikigai.com',
      password: 'password',
      role: 'admin'
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@ikigai.com', password: 'password' });

    adminToken = res.headers['set-cookie'][0].split(';')[0];
  });

  test('POST /api/admin/tracks - Should create track securely', async () => {
    const res = await request(app)
      .post('/api/admin/tracks')
      .set('Cookie', adminToken)
      .send({ title: 'Cybersecurity', description: 'Hack all the things' });

    expect(res.statusCode).toBe(201);
    expect(res.body.track.title).toBe('Cybersecurity');
  });

  test('POST /api/admin/teams - Should create leader and team', async () => {
    const res = await request(app)
      .post('/api/admin/teams')
      .set('Cookie', adminToken)
      .send({ 
        teamName: 'Alpha Squad', 
        leaderName: 'John Doe',
        leaderEmail: 'john@alpha.com',
        leaderPassword: 'password123'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.team.teamName).toBe('Alpha Squad');
    expect(res.body.leader.email).toBe('john@alpha.com');
  });

  test('POST /api/admin/teams - Missing fields should 400 gracefully', async () => {
    const res = await request(app)
      .post('/api/admin/teams')
      .set('Cookie', adminToken)
      .send({ 
        teamName: 'Missing Leader', 
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Missing required fields');
  });

  test('POST /api/admin/events - Should create event scaffolding', async () => {
    const res = await request(app)
      .post('/api/admin/events')
      .set('Cookie', adminToken)
      .send({ title: 'Mentoring Session', description: 'Q&A', date: '2026-09-01' });

    expect(res.statusCode).toBe(201);
    expect(res.body.event.title).toBe('Mentoring Session');
  });

  test('GET /api/admin/teams - Should fetch teams populated', async () => {
    await request(app).post('/api/admin/teams').set('Cookie', adminToken).send({ 
      teamName: 'Beta', leaderName: 'Bob', leaderEmail: 'bob@beta.com', leaderPassword: 'pass' 
    });

    const res = await request(app)
      .get('/api/admin/teams')
      .set('Cookie', adminToken);

    expect(res.statusCode).toBe(200);
    expect(res.body.teams.length).toBe(1);
    expect(res.body.teams[0].leader.name).toBe('Bob');
  });
});
