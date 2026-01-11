const request = require('supertest');
const app = require('../backend/server');
const database = require('../config/database');
const { generateId } = require('../backend/utils/helpers');
const { resetDatabase } = require('./testUtils');

// Utility to create unique values per test run
const unique = () => Date.now() + Math.floor(Math.random() * 1000);

describe('Extended modules validation and flows', () => {
    let adminToken;
    let adminUserId;
    let memberId;
    let feePackageId;

        beforeAll(async () => {
                await database.initialize();
                await resetDatabase();

        const uniqueVal = unique();
        const registerRes = await request(app)
            .post('/api/auth/register')
            .send({
                username: `admin${uniqueVal}`,
                email: `admin${uniqueVal}@example.com`,
                password: 'Admin123',
                first_name: 'Admin',
                last_name: 'User',
                role: 'admin',
            });

        adminUserId = registerRes.body.userId;
        await database.run('UPDATE users SET role = ? WHERE id = ?', ['admin', adminUserId]);

        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: `admin${uniqueVal}@example.com`, password: 'Admin123' });

        adminToken = loginRes.body.token;

        const memberRes = await request(app)
            .post('/api/members')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                username: `member${uniqueVal}`,
                email: `member${uniqueVal}@example.com`,
                password: 'Member123',
                first_name: 'Mem',
                last_name: 'Ber',
            });
        memberId = memberRes.body.memberId;
    });

    afterAll(async () => {
        await database.close();
    });

    describe('Fee packages validation', () => {
        it('rejects missing name', async () => {
            const res = await request(app)
                .post('/api/fee-packages')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ monthly_fee: 10 });

            expect(res.status).toBe(400);
        });

        it('creates a fee package', async () => {
            const res = await request(app)
                .post('/api/fee-packages')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Basic', monthly_fee: 25, duration_days: 30 });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id');
            feePackageId = res.body.id;
        });
    });

    describe('Subscriptions validation', () => {
        it('rejects missing member_id', async () => {
            const res = await request(app)
                .post('/api/subscriptions')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ fee_package_id: 'x' });

            expect(res.status).toBe(400);
        });

        it('assigns subscription', async () => {
            const res = await request(app)
                .post('/api/subscriptions')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    member_id: memberId,
                    fee_package_id: feePackageId,
                    start_date: new Date().toISOString(),
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('id');
        });
    });

    describe('Store validation and edit flow', () => {
        let supplementId;

        it('rejects invalid supplement', async () => {
            const res = await request(app)
                .post('/api/store')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ price: -5 });

            expect(res.status).toBe(400);
        });

        it('creates supplement', async () => {
            const res = await request(app)
                .post('/api/store')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Whey', price: 19.99, stock: 5 });

            expect(res.status).toBe(201);
            supplementId = res.body.id;
        });

        it('gets supplement by id and updates it', async () => {
            const getRes = await request(app)
                .get(`/api/store/${supplementId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(getRes.status).toBe(200);
            expect(getRes.body.data.name).toBe('Whey');

            const updateRes = await request(app)
                .put(`/api/store/${supplementId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Whey Isolate', price: 24.99, stock: 3 });

            expect(updateRes.status).toBe(200);
        });
    });

    describe('Diet validation and edit flow', () => {
        let dietId;

        it('rejects missing member_id', async () => {
            const res = await request(app)
                .post('/api/diets')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ title: 'Plan' });

            expect(res.status).toBe(400);
        });

        it('creates diet for member', async () => {
            const res = await request(app)
                .post('/api/diets')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ member_id: memberId, title: 'Cut', plan: 'Low carb' });

            expect(res.status).toBe(201);
            dietId = res.body.id;
        });

        it('lists diets (admin all) and updates', async () => {
            const listRes = await request(app)
                .get('/api/diets')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(listRes.status).toBe(200);
            expect(Array.isArray(listRes.body.data)).toBe(true);

            const updateRes = await request(app)
                .put(`/api/diets/${dietId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ plan: 'Moderate carb' });

            expect(updateRes.status).toBe(200);
        });

        it('rejects empty update payload', async () => {
            const res = await request(app)
                .put(`/api/diets/${dietId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({});

            expect(res.status).toBe(400);
        });
    });

    describe('Notifications validation and unread count', () => {
        it('rejects missing fields', async () => {
            const res = await request(app)
                .post('/api/notifications')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ user_id: adminUserId, title: '' });

            expect(res.status).toBe(400);
        });

        it('creates notification and updates unread count', async () => {
            const createRes = await request(app)
                .post('/api/notifications')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ user_id: adminUserId, title: 'Hello', message: 'World' });

            expect(createRes.status).toBe(201);

            const countRes = await request(app)
                .get(`/api/notifications/user/${adminUserId}/unread-count`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(countRes.status).toBe(200);
            expect(countRes.body).toHaveProperty('count');
            const unreadBefore = countRes.body.count;

            const listRes = await request(app)
                .get(`/api/notifications/user/${adminUserId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            const firstId = listRes.body.data[0].id;

            await request(app)
                .patch(`/api/notifications/${firstId}/read`)
                .set('Authorization', `Bearer ${adminToken}`);

            const countAfter = await request(app)
                .get(`/api/notifications/user/${adminUserId}/unread-count`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(countAfter.body.count).toBeLessThanOrEqual(unreadBefore);
        });
    });
});
