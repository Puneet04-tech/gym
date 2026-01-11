const request = require('supertest');
const app = require('../backend/server');

describe('Reports API', () => {
  it('health endpoint should be ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
  });
});
