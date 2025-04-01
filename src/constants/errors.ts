export const ERRORS_MESSAGES = {
  NOT_FOUND: (entity: string, id: string, fieldName = 'id') =>
    `${entity} with ${fieldName} ${id} not found`,
  ALREADY_EXISTS: ({
    entity,
    fieldName,
    fieldValue,
  }: {
    entity: string;
    fieldName: string;
    fieldValue: string;
  }) => `${entity} with field "${fieldName}: ${fieldValue}" already exists`,

  WRONG_LOGIN_OR_PASSWORD: () => 'Wrong login or password',

  FORBIDDEN: () => "You don't have access to this resource",
  UNAUTHORIZED: () => 'Unauthorized',

  INVALID_DATE: () => 'Invalid date',
};
