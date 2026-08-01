import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../server.js';
import User from '../models/User.js';
import Team from '../models/Team.js';
import Track from '../models/Track.js';
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

describe('Registration API', () => {
  let leaderToken;
  let teamId;
  let trackId;

  beforeEach(async () => {
    await User.deleteMany({});
    await Team.deleteMany({});
    await Track.deleteMany({});

    const track = await Track.create({ title: 'Test Track', description: 'desc' });
    trackId = track._id;

    const leader = await User.create({
      name: 'Leader',
      email: 'leader@test.com',
      password: 'password',
      role: 'teamLeader'
    });

    const team = await Team.create({
      teamName: 'Test Team',
      leader: leader._id
    });
    
    leader.team = team._id;
    await leader.save();
    teamId = team._id;

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'leader@test.com', password: 'password' });

    // Extract cookie for auth
    leaderToken = res.headers['set-cookie'][0].split(';')[0];
  });

  test('POST /api/registration - Success', async () => {
    const res = await request(app)
      .post('/api/registration')
      .set('Cookie', leaderToken)
      .send({
        trackPreferences: [trackId],
        transactionId: 'TXN12345'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.team.isRegistered).toBe(true);
    expect(res.body.team.transactionId).toBe('TXN12345');
  });

  test('POST /api/registration - Already Registered', async () => {
    const team = await Team.findById(teamId);
    team.isRegistered = true;
    await team.save();

    const res = await request(app)
      .post('/api/registration')
      .set('Cookie', leaderToken)
      .send({
        trackPreferences: [trackId],
        transactionId: 'TXN12345'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Team is already registered');
  });

  test('POST /api/registration - Graceful handling of missing teamId', async () => {
    // Create a leader without a team
    const corruptedLeader = await User.create({
      name: 'Corrupted Leader',
      email: 'corrupt@test.com',
      password: 'password',
      role: 'teamLeader'
    });
    
    // Login to get token
    const resLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'corrupt@test.com', password: 'password' });
      
    const corruptToken = resLogin.headers['set-cookie'][0].split(';')[0];
    
    const res = await request(app)
      .post('/api/registration')
      .set('Cookie', corruptToken)
      .send({
        trackPreferences: [trackId],
        transactionId: 'TXN12345'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('User does not belong to a team');
  });
});
