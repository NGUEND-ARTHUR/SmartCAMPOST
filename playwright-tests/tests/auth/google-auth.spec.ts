import { test, expect } from '@playwright/test';
import { apiUrl } from '../../test-utils/api';

test.describe('Google auth integration checks', () => {
  test('Invalid Google token is rejected', async ({ request }) => {
    const res = await request.post(apiUrl('/auth/google'), { data: { idToken: 'invalid-token' } });
    expect([400,401,422]).toContain(res.status());
  });

  test.skip('Valid Google token creates/links account (requires env GOOGLE_TEST_IDTOKEN)', async ({ request }) => {
    const idToken = process.env.GOOGLE_TEST_IDTOKEN;
    test.skip(!idToken, 'No GOOGLE_TEST_IDTOKEN provided');
    const res = await request.post(apiUrl('/auth/google'), { data: { idToken } });
    expect([200,201]).toContain(res.status());
  });
});
