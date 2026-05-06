export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface ErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  userInfo: {
    userId?: string;
    email?: string | null;
  }
}

export function handleError(error: unknown, operationType: OperationType, path: string | null, userId?: string, email?: string | null) {
  const errInfo: ErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    userInfo: {
      userId,
      email,
    },
  };
  console.error('Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
