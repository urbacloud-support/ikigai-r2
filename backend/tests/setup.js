import { jest } from '@jest/globals';

// We need to tell Jest how to mock for ESM if needed, but for standard unit tests 
// we won't need complex mocks right now.

// Ensure environment variables are set for testing
process.env.JWT_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';
