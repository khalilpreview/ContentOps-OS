import { assertRole } from '../../src/lib/auth/guard';
import { getAllUsers, inviteUser, promoteUserToRole, removeUser } from '../../src/lib/auth/sync-user';

export const handler = async (event: any) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-dev-user-id, x-thrill-user-id',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
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

    // Assert Super Admin or Content Manager role
    const currentUser = await assertRole(fakeReq, ['SUPER_ADMIN', 'CONTENT_MANAGER']);

    if (event.httpMethod === 'GET') {
      const users = await getAllUsers();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ users }),
      };
    }

    if (event.httpMethod === 'POST') {
      const { email, name, role, team, redirectTo } = fakeReq.body;
      const result = await inviteUser({
        email,
        name,
        role,
        team,
        invitedBy: currentUser.name || currentUser.email,
        redirectTo,
      });
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result),
      };
    }

    if (event.httpMethod === 'PATCH') {
      const { id, role } = fakeReq.body;
      const updated = await promoteUserToRole(id, role);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ user: updated }),
      };
    }

    if (event.httpMethod === 'DELETE') {
      const id = event.queryStringParameters?.id || fakeReq.body?.id;
      const success = await removeUser(id);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success }),
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
