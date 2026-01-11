/**
 * Authentication Tests
 */

const request = require('supertest');
const app = require('../backend/server');
const database = require('../config/database');
const { resetDatabase } = require('./testUtils');

describe('Authentication API', () => {
    beforeAll(async () => {
        await database.initialize();
        await resetDatabase();
    });

    afterAll(async () => {
        await database.close();
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'Password123',
                    first_name: 'Test',
                    last_name: 'User',
                    role: 'user',
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('userId');
            expect(response.body.message).toBe('User registered successfully');
        });

        it('should not register with duplicate email', async () => {
            await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser2',
                    email: 'duplicate@example.com',
                    password: 'Password123',
                    first_name: 'Test',
                    last_name: 'User',
                });

            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser3',
                    email: 'duplicate@example.com',
                    password: 'Password123',
                    first_name: 'Test',
                    last_name: 'User',
                });

            expect(response.status).toBe(409);
        });
    });

    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'logintest',
                    email: 'logintest@example.com',
                    password: 'Password123',
                    first_name: 'Login',
                    last_name: 'Test',
                });
        });

        it('should login with valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'logintest@example.com',
                    password: 'Password123',
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
        });

        it('should not login with invalid password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'logintest@example.com',
                    password: 'WrongPassword',
                });

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/auth/profile', () => {
        let token;

        beforeEach(async () => {
            const registerRes = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'profiletest',
                    email: 'profiletest@example.com',
                    password: 'Password123',
                    first_name: 'Profile',
                    last_name: 'Test',
                });

            const loginRes = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'profiletest@example.com',
                    password: 'Password123',
                });

            token = loginRes.body.token;
        });

        it('should get user profile with valid token', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.email).toBe('profiletest@example.com');
        });

        it('should not get profile without token', async () => {
            const response = await request(app)
                .get('/api/auth/profile');

            expect(response.status).toBe(401);
        });
    });
});
