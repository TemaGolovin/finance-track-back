export const ERRORS_MESSAGES = {
  NOT_FOUND: (entity: string, id: string) => `${entity} with id ${id} not found`,
  ALREADY_EXISTS: ({entity,fieldName, fieldValue}: {
    entity: string,fieldName: string, fieldValue: string
  }) => `${entity} with field "${fieldName}: ${fieldValue}" already exists`,
}