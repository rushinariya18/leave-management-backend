import { OpenApiGeneratorV3, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { registerAuthDocs } from '../modules/auth/auth.docs.js';
import { registerLeaveBalanceDocs } from '../modules/leave-balance/leave-balance.docs.js';
import { registerLeaveRequestDocs } from '../modules/leave-request/leave-request.docs.js';
import { registerLeaveTypeDocs } from '../modules/leave-type/leave-type.docs.js';
import { registerPublicHolidayDocs } from '../modules/public-holiday/public-holiday.docs.js';
import { registerUserDocs } from '../modules/user/user.docs.js';

const registry = new OpenAPIRegistry();

registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'JWT obtained from POST /api/v1/auth/signin, sent as `Authorization: Bearer <token>`.',
});

registerAuthDocs(registry);
registerUserDocs(registry);
registerLeaveTypeDocs(registry);
registerLeaveBalanceDocs(registry);
registerLeaveRequestDocs(registry);
registerPublicHolidayDocs(registry);

const generator = new OpenApiGeneratorV3(registry.definitions);

export const openApiDocument = generator.generateDocument({
  openapi: '3.0.0',
  info: {
    title: 'Leave Management API',
    version: '1.0.0',
    description:
      'API documentation for the leave management backend (authentication, users, leave types, leave balances, ' +
      'leave requests, and public holidays). Protected endpoints require a bearer JWT obtained from ' +
      'POST /api/v1/auth/signin — use the Authorize button above.',
  },
  servers: [{ url: '/api/v1', description: 'API v1' }],
  tags: [
    { name: 'Auth', description: 'Sign in, sign out, and password reset' },
    { name: 'Users', description: 'User profile and account management' },
    { name: 'Leave Types', description: 'Leave type configuration' },
    { name: 'Leave Balances', description: 'Employee leave balance tracking' },
    { name: 'Leave Requests', description: 'Leave request lifecycle and approvals' },
    { name: 'Public Holidays', description: 'Organization-wide public holiday management' },
  ],
});
