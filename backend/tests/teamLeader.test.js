import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import TeamLeader from '../models/TeamLeader.js';

let mongoServer;

describe('TeamLeader Model (Assessments Schema)', () => {
    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    afterEach(async () => {
        await TeamLeader.deleteMany({});
    });

    it('should create a valid TeamLeader without assessments', async () => {
        const team = new TeamLeader({
            name: 'John Doe',
            email: 'john@example.com',
            password: 'hashed-password',
            teamName: 'Innovators'
        });
        
        const savedTeam = await team.save();
        expect(savedTeam._id).toBeDefined();
        expect(savedTeam.assessments.evaluator).toHaveLength(0);
        expect(savedTeam.assessments.judge).toHaveLength(0);
    });

    it('should allow adding multiple evaluator assessments', async () => {
        const team = new TeamLeader({
            name: 'Jane Doe',
            email: 'jane@example.com',
            password: 'pass',
            teamName: 'Builders'
        });
        
        const mockEvaluatorId1 = new mongoose.Types.ObjectId();
        const mockEvaluatorId2 = new mongoose.Types.ObjectId();

        team.assessments.evaluator.push({
            evaluatorId: mockEvaluatorId1,
            status: 'Completed',
            totalScore: 85,
            feedback: 'Good job'
        });

        team.assessments.evaluator.push({
            evaluatorId: mockEvaluatorId2,
            status: 'Pending'
        });

        const savedTeam = await team.save();
        
        expect(savedTeam.assessments.evaluator).toHaveLength(2);
        expect(savedTeam.assessments.evaluator[0].totalScore).toBe(85);
        expect(savedTeam.assessments.evaluator[1].status).toBe('Pending');
        expect(savedTeam.assessments.evaluator[1].totalScore).toBe(0); // tests default
    });
});
