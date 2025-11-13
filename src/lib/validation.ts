import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Please enter a valid email address');
export const phoneSchema = z.string().regex(/^\\+?[1-9]\\d{1,14}$/, 'Please enter a valid phone number');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
export const currencySchema = z.enum(['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD']);
export const amountSchema = z.number().min(0.01, 'Amount must be greater than 0').max(999999.99, 'Amount is too large');

// User validation schemas
export const createUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
  email: emailSchema,
  phone: phoneSchema.optional(),
  password: passwordSchema
});

export const updateUserSchema = createUserSchema.partial().omit({ password: true });

// Group validation schemas
export const createGroupSchema = z.object({
  name: z.string().min(3, 'Group name must be at least 3 characters').max(50, 'Group name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  currency: currencySchema,
  isPrivate: z.boolean().default(true),
  memberEmails: z.array(emailSchema).max(50, 'Too many members').optional()
});

export const updateGroupSchema = createGroupSchema.partial();

export const inviteMemberSchema = z.object({
  email: emailSchema,
  role: z.enum(['member', 'admin']).default('member')
});

// Expense validation schemas
export const expenseSplitSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  amount: amountSchema
});

export const createExpenseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  amount: amountSchema,
  category: z.string().min(1, 'Category is required'),
  groupId: z.string().min(1, 'Group ID is required').optional(),
  splitMethod: z.enum(['equal', 'custom', 'percentage']).default('equal'),
  splits: z.array(expenseSplitSchema).min(1, 'At least one split is required'),
  receiptUrl: z.string().url().optional(),
  tags: z.array(z.string()).max(10, 'Too many tags').optional()
});

export const updateExpenseSchema = createExpenseSchema.partial().omit({ groupId: true, splits: true });

// Settlement validation schemas
export const createSettlementSchema = z.object({
  groupId: z.string().min(1, 'Group ID is required'),
  fromUserId: z.string().min(1, 'From user ID is required'),
  toUserId: z.string().min(1, 'To user ID is required'),
  amount: amountSchema,
  description: z.string().max(200, 'Description is too long').optional(),
  method: z.enum(['cash', 'bank_transfer', 'digital_wallet', 'venmo', 'paypal', 'other']).default('cash'),
  confirmationId: z.string().optional()
});

// Form validation helpers
export const validateForm = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    throw error;
  }
};

// Custom validation hooks
export const useFormValidation = <T>(
  schema: z.ZodSchema<T>
) => {
  const validate = (data: unknown) => {
    return validateForm(schema, data);
  };

  const validateField = (fieldName: string, value: unknown) => {
    try {
      const fieldSchema = (schema as any).shape[fieldName];
      if (fieldSchema) {
        fieldSchema.parse(value);
        return null;
      }
      return null;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0]?.message || 'Invalid value';
      }
      return 'Invalid value';
    }
  };

  return { validate, validateField };
};

// Validation utilities
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>\"'&]/g, '');
};

export const validateEmail = (email: string): boolean => {
  return emailSchema.safeParse(email).success;
};

export const validatePhone = (phone: string): boolean => {
  return phoneSchema.safeParse(phone).success;
};

export const validateAmount = (amount: number): boolean => {
  return amountSchema.safeParse(amount).success;
};

export const formatValidationErrors = (errors: z.ZodError): Record<string, string> => {
  const formattedErrors: Record<string, string> = {};
  errors.errors.forEach((error) => {
    const path = error.path.join('.');
    formattedErrors[path] = error.message;
  });
  return formattedErrors;
};

// Real-time validation for forms
export const createValidationRules = (schema: z.ZodSchema<any>) => {
  return {
    validate: (value: any, fieldName?: string) => {
      if (fieldName) {
        // Validate specific field
        try {
          const fieldSchema = (schema as any).shape[fieldName];
          if (fieldSchema) {
            fieldSchema.parse(value);
            return true;
          }
        } catch {
          return false;
        }
      } else {
        // Validate entire object
        return schema.safeParse(value).success;
      }
      return true;
    },
    getError: (value: any, fieldName?: string) => {
      if (fieldName) {
        try {
          const fieldSchema = (schema as any).shape[fieldName];
          if (fieldSchema) {
            fieldSchema.parse(value);
            return null;
          }
        } catch (error) {
          if (error instanceof z.ZodError) {
            return error.errors[0]?.message || 'Invalid value';
          }
        }
      } else {
        const result = schema.safeParse(value);
        if (!result.success) {
          return formatValidationErrors(result.error);
        }
      }
      return null;
    }
  };
};

// Export type definitions
export type CreateUserData = z.infer<typeof createUserSchema>;
export type UpdateUserData = z.infer<typeof updateUserSchema>;
export type CreateGroupData = z.infer<typeof createGroupSchema>;
export type UpdateGroupData = z.infer<typeof updateGroupSchema>;
export type InviteMemberData = z.infer<typeof inviteMemberSchema>;
export type CreateExpenseData = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseData = z.infer<typeof updateExpenseSchema>;
export type CreateSettlementData = z.infer<typeof createSettlementSchema>;