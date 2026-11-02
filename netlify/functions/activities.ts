import { getAssetActivities } from '../../src/lib/audit/logger';

export const handler = async (event: any) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    };
  }

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  const assetId = event.queryStringParameters?.assetId;
  if (!assetId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'assetId query parameter is required' }),
    };
  }

  try {
    const activities = await getAssetActivities(assetId);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ activities }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
