import { syncUser } from '../../src/lib/auth/sync-user';
import { getCurrentUser } from '../../src/lib/auth/get-current-user';

export const handler = async (event: any) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-dev-user-id, x-thrill-user-id',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      },
    };
  }

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const fakeReq: any = {
      headers: event.headers || {},
      body: event.body ? JSON.parse(event.body) : {},
    };

    if (event.httpMethod === 'GET') {
      const user = await getCurrentUser(fakeReq);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ user }),
      };
    }

    if (event.httpMethod === 'POST') {
      const { id, email, name, avatarUrl } = fakeReq.body;
      const user = await syncUser({
        id,
        email,
        user_metadata: {
          name,
          avatar_url: avatarUrl,
        },
      });
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ user }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  } catch (err: any) {
    const statusCode = err.statusCode || 500;
    return {
      statusCode,
      headers,
      body: JSON.stringify({ error: err.name || 'Error', message: err.message }),
    };
  }
};
