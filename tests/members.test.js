/**
 * Members API Tests
 */

const request = require('supertest');
const app = require('../backend/server');
const database = require('../config/database');
const { resetDatabase } = require('./testUtils');

describe('Members API', () => {
    let adminToken;
    let adminUser;

    beforeAll(async () => {
        await database.initialize();
        await resetDatabase();

        // Create admin user
        const registerRes = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'admin',
                email: 'admin@example.com',
                password: 'Admin123',
                first_name: 'Admin',
                last_name: 'User',
                role: 'admin',
            });

        adminUser = registerRes.body.userId;

        // Update user role to admin (in a real app, this would be done differently)
        await database.run(
            'UPDATE users SET role = ? WHERE id = ?',
            ['admin', adminUser]
        );

        // Login as admin
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@example.com',
                password: 'Admin123',
            });

        adminToken = loginRes.body.token;
    });

    afterAll(async () => {
        await database.close();
    });

    describe('POST /api/members', () => {
        it('should add a new member as admin', async () => {
            const response = await request(app)
                .post('/api/members')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    username: 'newmember',
                    email: 'newmember@example.com',
                    password: 'Member123',
                    first_name: 'New',
                    last_name: 'Member',
                    phone: '1234567890',
                    emergency_contact: 'John Doe',
                    emergency_phone: '0987654321',
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('memberId');
        });

        it('should not add member without admin token', async () => {
            const response = await request(app)
                .post('/api/members')
                .send({
                    username: 'unauthorized',
                    email: 'unauthorized@example.com',
                    password: 'Pass123',
                    first_name: 'Unauth',
                    last_name: 'User',
                });

            expect(response.status).toBe(401);
        });
    });

    describe('GET /api/members', () => {
        it('should get all members as admin', async () => {
            const response = await request(app)
                .get('/api/members')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('pagination');
        });
    });

    describe('GET /api/members/:id', () => {
        let memberId;

        beforeAll(async () => {
            const addRes = await request(app)
                .post('/api/members')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    username: 'getmember',
                    email: 'getmember@example.com',
                    password: 'Member123',
                    first_name: 'Get',
                    last_name: 'Member',
                });

            memberId = addRes.body.memberId;
        });

        it('should get member by ID', async () => {
            const response = await request(app)
                .get(`/api/members/${memberId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.data.id).toBe(memberId);
        });

        it('should return 404 for non-existent member', async () => {
            const response = await request(app)
                .get('/api/members/nonexistent')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
        });
    });
});
