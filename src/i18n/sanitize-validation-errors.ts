import type { ValidationError } from '@nestjs/common';

export type SafeValidationErrorItem = {
  property: string;
  constraints?: Record<string, string>;
  children?: SafeValidationErrorItem[];
};

export function sanitizeValidationErrors(
  errors: ValidationError[],
): SafeValidationErrorItem[] {
  return errors.map((error) => {
    const item: SafeValidationErrorItem = {
      property: error.property,
    };

    if (error.constraints && Object.keys(error.constraints).length > 0) {
      item.constraints = { ...error.constraints };
    }

    if (error.children && error.children.length > 0) {
      item.children = sanitizeValidationErrors(error.children);
    }

    return item;
  });
}
