import { ApiResponseOptions } from '@nestjs/swagger';

export class ApiDocumentationHelper {
  /**
   * Standard success response schema
   */
  static createSuccessResponse(dataSchema: any, message: string = 'Operation successful'): ApiResponseOptions {
    return {
      status: 200,
      description: message,
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: dataSchema,
          message: { type: 'string', example: message },
          meta: {
            type: 'object',
            properties: {
              timestamp: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
              traceId: { type: 'string', example: 'trace-id-123' }
            }
          }
        }
      }
    };
  }

  /**
   * Standard error response schema
   */
  static createErrorResponse(status: number, message: string, code?: string): ApiResponseOptions {
    return {
      status,
      description: message,
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: code || 'ERROR_CODE' },
              message: { type: 'string', example: message },
              details: { type: 'object', description: 'Additional error details (optional)' }
            }
          },
          meta: {
            type: 'object',
            properties: {
              timestamp: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
              traceId: { type: 'string', example: 'trace-id-123' }
            }
          }
        }
      }
    };
  }

  /**
   * Paginated response schema
   */
  static createPaginatedResponse(itemSchema: any, message: string = 'Data retrieved successfully'): ApiResponseOptions {
    return {
      status: 200,
      description: message,
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'array',
            items: itemSchema
          },
          message: { type: 'string', example: message },
          meta: {
            type: 'object',
            properties: {
              timestamp: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
              traceId: { type: 'string', example: 'trace-id-123' },
              pagination: {
                type: 'object',
                properties: {
                  page: { type: 'number', example: 1 },
                  limit: { type: 'number', example: 10 },
                  total: { type: 'number', example: 100 },
                  totalPages: { type: 'number', example: 10 },
                  hasNext: { type: 'boolean', example: true },
                  hasPrev: { type: 'boolean', example: false }
                }
              }
            }
          }
        }
      }
    };
  }

  /**
   * Common error responses
   */
  static readonly COMMON_ERRORS = {
    UNAUTHORIZED: this.createErrorResponse(401, 'Unauthorized access', 'UNAUTHORIZED'),
    FORBIDDEN: this.createErrorResponse(403, 'Forbidden access', 'FORBIDDEN'),
    NOT_FOUND: this.createErrorResponse(404, 'Resource not found', 'NOT_FOUND'),
    VALIDATION_ERROR: this.createErrorResponse(400, 'Validation failed', 'VALIDATION_ERROR'),
    INTERNAL_ERROR: this.createErrorResponse(500, 'Internal server error', 'INTERNAL_ERROR'),
    INSUFFICIENT_POINTS: this.createErrorResponse(400, 'Insufficient points', 'INSUFFICIENT_POINTS'),
    DUPLICATE_RESOURCE: this.createErrorResponse(409, 'Resource already exists', 'DUPLICATE_RESOURCE'),
  };

  /**
   * Common data schemas
   */
  static readonly SCHEMAS = {
    MEMBER: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'clm123456789' },
        email: { type: 'string', example: 'member@example.com' },
        username: { type: 'string', example: 'member123' },
        firstName: { type: 'string', example: 'John' },
        lastName: { type: 'string', example: 'Doe' },
        isActive: { type: 'boolean', example: true },
        createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' }
      }
    },

    ADMIN: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'cla123456789' },
        email: { type: 'string', example: 'admin@example.com' },
        username: { type: 'string', example: 'admin' },
        role: { type: 'string', example: 'ADMIN', enum: ['ADMIN', 'SUPER_ADMIN'] },
        isActive: { type: 'boolean', example: true },
        createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' }
      }
    },

    POINT_TRANSACTION: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'clp123456789' },
        memberId: { type: 'string', example: 'clm123456789' },
        amount: { type: 'number', example: 100 },
        signedAmount: { type: 'number', example: 100 },
        type: { type: 'string', example: 'EARNED', enum: ['EARNED', 'DEDUCTED', 'EXPIRED', 'EXCHANGED'] },
        description: { type: 'string', example: 'Daily login bonus' },
        expiresAt: { type: 'string', example: '2024-01-01T00:00:00.000Z', nullable: true },
        isExpired: { type: 'boolean', example: false },
        createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' }
      }
    },

    PRIVILEGE: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'clpr123456789' },
        name: { type: 'string', example: 'Premium Access' },
        description: { type: 'string', example: 'Access to premium features' },
        pointCost: { type: 'number', example: 500 },
        isActive: { type: 'boolean', example: true },
        validityDays: { type: 'number', example: 30, nullable: true },
        createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' }
      }
    },

    MEMBER_PRIVILEGE: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'clmp123456789' },
        memberId: { type: 'string', example: 'clm123456789' },
        privilegeId: { type: 'string', example: 'clpr123456789' },
        grantedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
        expiresAt: { type: 'string', example: '2023-02-01T00:00:00.000Z', nullable: true },
        isActive: { type: 'boolean', example: true },
        isExpired: { type: 'boolean', example: false },
        privilege: { $ref: '#/components/schemas/Privilege' }
      }
    },

    POINT_BALANCE: {
      type: 'object',
      properties: {
        memberId: { type: 'string', example: 'clm123456789' },
        totalEarned: { type: 'number', example: 2000 },
        totalDeducted: { type: 'number', example: 500 },
        totalExpired: { type: 'number', example: 100 },
        totalExchanged: { type: 'number', example: 300 },
        availableBalance: { type: 'number', example: 1100 },
        lastUpdated: { type: 'string', example: '2023-01-01T00:00:00.000Z' }
      }
    },

    JWT_RESPONSE: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        expiresIn: { type: 'number', example: 86400 }
      }
    }
  };

  /**
   * Common query parameters
   */
  static readonly QUERY_PARAMS = {
    PAGE: { name: 'page', required: false, type: Number, description: 'Page number (default: 1)' },
    LIMIT: { name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' },
    SEARCH: { name: 'search', required: false, type: String, description: 'Search term' },
    IS_ACTIVE: { name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' },
    START_DATE: { name: 'startDate', required: false, type: String, description: 'Start date for filtering (ISO string)' },
    END_DATE: { name: 'endDate', required: false, type: String, description: 'End date for filtering (ISO string)' },
    POINT_TYPE: { 
      name: 'type', 
      required: false, 
      enum: ['EARNED', 'DEDUCTED', 'EXPIRED', 'EXCHANGED'], 
      description: 'Filter by point transaction type' 
    }
  };

  /**
   * Example request bodies
   */
  static readonly EXAMPLES = {
    MEMBER_REGISTRATION: {
      summary: 'Member registration example',
      value: {
        email: 'member@example.com',
        username: 'member123',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe'
      }
    },

    MEMBER_LOGIN: {
      summary: 'Member login example',
      value: {
        emailOrUsername: 'member@example.com',
        password: 'SecurePassword123!'
      }
    },

    ADMIN_LOGIN: {
      summary: 'Admin login example',
      value: {
        emailOrUsername: 'admin@example.com',
        password: 'AdminPassword123!'
      }
    },

    PROFILE_UPDATE: {
      summary: 'Profile update example',
      value: {
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe123'
      }
    },

    PASSWORD_CHANGE: {
      summary: 'Password change example',
      value: {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!'
      }
    },

    ADD_POINTS: {
      summary: 'Add points example',
      value: {
        memberId: 'clm123456789',
        amount: 500,
        description: 'Bonus points for activity',
        expirationDays: 365
      }
    },

    DEDUCT_POINTS: {
      summary: 'Deduct points example',
      value: {
        memberId: 'clm123456789',
        amount: 200,
        description: 'Point deduction for violation'
      }
    },

    CREATE_PRIVILEGE: {
      summary: 'Create privilege example',
      value: {
        name: 'Premium Access',
        description: 'Access to premium features and content',
        pointCost: 500,
        validityDays: 30
      }
    },

    EXCHANGE_PRIVILEGE: {
      summary: 'Exchange privilege example',
      value: {
        privilegeId: 'clpr123456789'
      }
    }
  };
}