// Test setup and utilities
jest.setTimeout(10000);

process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'password';
process.env.DB_NAME = 'etunda_test_db';
process.env.JWT_SECRET = 'test-secret-key';
