/**
 * Database Tests
 */

const database = require('../config/database');
const { generateId } = require('../backend/utils/helpers');
const { resetDatabase } = require('./testUtils');

describe('Database Operations', () => {
    beforeAll(async () => {
        await database.initialize();
        await resetDatabase();
    });

    afterAll(async () => {
        await database.close();
    });

    describe('User Operations', () => {
        it('should insert a user', async () => {
            const userId = generateId();
            const result = await database.run(
                `INSERT INTO users (id, username, email, password, first_name, last_name, role)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [userId, 'dbtest', 'dbtest@example.com', 'hashedpass', 'DB', 'Test', 'user']
            );

            expect(result).toHaveProperty('changes');
            expect(result.changes).toBe(1);
        });

        it('should retrieve a user', async () => {
            const user = await database.get(
                'SELECT * FROM users WHERE username = ?',
                ['dbtest']
            );

            expect(user).toBeDefined();
            expect(user.email).toBe('dbtest@example.com');
        });

        it('should update a user', async () => {
            await database.run(
                'UPDATE users SET first_name = ? WHERE username = ?',
                ['Updated', 'dbtest']
            );

            const user = await database.get(
                'SELECT * FROM users WHERE username = ?',
                ['dbtest']
            );

            expect(user.first_name).toBe('Updated');
        });

        it('should delete a user', async () => {
            await database.run(
                'DELETE FROM users WHERE username = ?',
                ['dbtest']
            );

            const user = await database.get(
                'SELECT * FROM users WHERE username = ?',
                ['dbtest']
            );

            expect(user).toBeUndefined();
        });
    });

    describe('Transaction Operations', () => {
        it('should handle transactions', async () => {
            await database.beginTransaction();

            try {
                const userId = generateId();
                await database.run(
                    `INSERT INTO users (id, username, email, password, first_name, last_name, role)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [userId, 'transtest', 'transtest@example.com', 'pass', 'Trans', 'Test', 'user']
                );

                await database.commit();

                const user = await database.get(
                    'SELECT * FROM users WHERE username = ?',
                    ['transtest']
                );

                expect(user).toBeDefined();
            } catch (error) {
                await database.rollback();
                throw error;
            }
        });
    });
});
