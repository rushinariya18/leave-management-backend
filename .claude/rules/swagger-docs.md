# Swagger / OpenAPI documentation rule

Every module's routes **must** be documented following the same pattern already established for the existing modules (auth, user, leave-type, leave-balance, leave-request, public-holiday). A new route or module without docs is an incomplete feature — do not skip this step for new work or future routes.

## Pattern

1. Create `<module>.docs.ts` next to the module's other files (`*.routes.ts`, `*.controller.ts`, `*.service.ts`, `*.validation.ts`), exporting `registerXxxDocs(registry: OpenAPIRegistry)`.
2. Import request schemas from `<module>.validation.ts` — never redefine request shapes by hand, always reuse the existing Zod schemas.
3. Define a lightweight response data schema per resource shape actually returned by the controller (mirroring the Prisma model fields exposed, excluding sensitive fields like `password`/`tokenVersion`).
4. Wrap every response using the shared helpers from `src/config/openapi-helpers.ts`:
   - `buildSuccessResponse(dataSchema, description)` for 2xx responses
   - `errorResponse(description)` for 4xx responses
5. For every `registry.registerPath(...)` call:
   - `path` is written relative to the `/api/v1` server prefix (e.g. `/leave-types/{id}`, not `/api/v1/leave-types/{id}`)
   - Add `security: [{ bearerAuth: [] }]` on any route behind the `authenticate` middleware
   - If the route uses `authorize(...)`, note the required role(s) in the `description` field (OpenAPI has no native way to express custom role-based checks)
   - Cover the realistic response codes for that route (401/403/404/409 etc.), not just the happy path
6. Register the new `registerXxxDocs` function in `src/config/swagger.ts`, and add the module's tag to the `tags` array there.

## Example

```ts
// src/modules/products/product.docs.ts
import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { buildSuccessResponse, errorResponse } from '../../config/openapi-helpers.js';
import { createProductSchema, productIdParamsSchema } from './product.validation.js';

const productResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export function registerProductDocs(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: 'post',
    path: '/products',
    tags: ['Products'],
    summary: 'Create a product',
    security: [{ bearerAuth: [] }],
    request: {
      body: { content: { 'application/json': { schema: createProductSchema } } },
    },
    responses: {
      201: buildSuccessResponse(productResponseSchema, 'Product created successfully'),
      400: errorResponse('Validation error'),
      401: errorResponse('Authentication required'),
    },
  });
}
```

```ts
// src/config/swagger.ts
import { registerProductDocs } from '../modules/products/product.docs.js';
// ...
registerProductDocs(registry);
// ...
tags: [
  // ...existing tags
  { name: 'Products', description: 'Product catalog management' },
],
```

## Notes

- Swagger UI is served at `/api-docs`, gated behind `NODE_ENV !== 'production'` in `src/app.ts` — never remove that gate or expose docs in production.
- `extendZodWithOpenApi(z)` is called once as a side effect in `src/config/openapi-helpers.ts`. Every `*.docs.ts` file must import from `openapi-helpers.js` before calling `.openapi()` on any schema, or the extension won't be applied yet.
