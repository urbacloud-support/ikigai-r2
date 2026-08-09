import { jest } from '@jest/globals';
import { requireAuth } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

describe('Auth Middleware: requireAuth', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        req = { headers: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    it('should return 401 if no Authorization header is provided', () => {
        const middleware = requireAuth();
        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized: No token provided' });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid or expired', () => {
        req.headers.authorization = 'Bearer invalid-token';
        const middleware = requireAuth();
        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized: Invalid or expired token' });
    });

    it('should call next() if a valid token is provided with no specific role required', () => {
        const token = jwt.sign({ id: '123', email: 'test@test.com', role: 'admin' }, process.env.JWT_SECRET);
        req.headers.authorization = `Bearer ${token}`;
        
        const middleware = requireAuth();
        middleware(req, res, next);

        expect(req.user.email).toBe('test@test.com');
        expect(next).toHaveBeenCalled();
    });

    it('should return 403 if valid token provided but user lacks required role', () => {
        const token = jwt.sign({ id: '123', role: 'evaluator' }, process.env.JWT_SECRET);
        req.headers.authorization = `Bearer ${token}`;
        
        const middleware = requireAuth('admin');
        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            error: expect.stringContaining('Forbidden')
        }));
    });

    it('should call next() if user has the required role', () => {
        const token = jwt.sign({ id: '123', role: 'evaluator' }, process.env.JWT_SECRET);
        req.headers.authorization = `Bearer ${token}`;
        
        const middleware = requireAuth('evaluator', 'admin');
        middleware(req, res, next);

        expect(next).toHaveBeenCalled();
    });
});
