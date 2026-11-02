import { transitionAssetStage, TransitionPayload } from '../../src/lib/actions/transition-stage';
import { getAssetActivities } from '../../src/lib/audit/logger';

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

    if (event.httpMethod === 'POST') {
      const payload: TransitionPayload = fakeReq.body;
      const result = await transitionAssetStage(fakeReq, payload);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result),
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
      body: JSON.stringify({
        error: err.name || 'Error',
        message: err.message || 'Internal Server Error',
      }),
    };
  }
};
