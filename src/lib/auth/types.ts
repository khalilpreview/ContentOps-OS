import type { User, UserRole, AuthSession, AssetStatus } from '../../types';

export type { User, UserRole, AuthSession, AssetStatus };

export class UnauthorizedError extends Error {
  statusCode = 401;
  constructor(message = 'Unauthorized: Authentication required') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  statusCode = 403;
  constructor(message = 'Forbidden: Access denied') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class BadRequestError extends Error {
  statusCode = 400;
  constructor(message = 'Bad Request') {
    super(message);
    this.name = 'BadRequestError';
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  constructor(message = 'Not Found') {
    super(message);
    this.name = 'NotFoundError';
  }
}
