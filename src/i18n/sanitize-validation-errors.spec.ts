import { sanitizeValidationErrors } from './sanitize-validation-errors';

describe('sanitizeValidationErrors', () => {
  it('drops value, target and contexts from validation errors', () => {
    const result = sanitizeValidationErrors([
      {
        property: 'password',
        value: 'short',
        target: {
          email: 'user@example.com',
          password: 'short',
          name: 'User',
        },
        contexts: { some: 'context' },
        constraints: {
          minLength: 'Password must be at least 6 characters',
        },
        children: [],
      },
    ]);

    expect(result).toEqual([
      {
        property: 'password',
        constraints: {
          minLength: 'Password must be at least 6 characters',
        },
      },
    ]);
    expect(JSON.stringify(result)).not.toContain('short');
    expect(JSON.stringify(result)).not.toContain('user@example.com');
  });

  it('sanitizes nested children', () => {
    const result = sanitizeValidationErrors([
      {
        property: 'relatedCategories',
        value: [{ categoryId: 'bad' }],
        target: {},
        children: [
          {
            property: '0',
            value: { categoryId: 'bad' },
            target: [],
            constraints: { isUuid: 'must be a UUID' },
            children: [],
          },
        ],
      },
    ]);

    expect(result).toEqual([
      {
        property: 'relatedCategories',
        children: [
          {
            property: '0',
            constraints: { isUuid: 'must be a UUID' },
          },
        ],
      },
    ]);
  });
});
