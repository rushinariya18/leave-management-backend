# Architecture

This project follows a **module-based (feature-based)** architecture. Each domain (users, products, ...) is a self-contained module under `src/modules/`, with a strict layering contract: **Routes → Controller → Service → Prisma**.

## Recommended folder structure

```
project-root/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app.ts
│   ├── config/
│   │   ├── prisma.ts
│   ├── modules/
│   │   ├── users/
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── user.validation.ts
│   │   │   └── user.docs.ts
│   │   └── products/
│   │       ├── product.controller.ts
│   │       ├── product.service.ts
│   │       ├── product.routes.ts
│   │       ├── product.validation.ts
│   │       └── product.docs.ts
│   ├── middlewares/
│   │   ├── error.middleware.ts
│   │   ├── not-found.middleware.ts
│   │   └── rate-limit.middleware.ts
│   ├── utils/
│   │   ├── ApiError.ts
│   │   ├── asyncHandler.ts
│   │   ├── response.ts
│   │   └── pagination.ts
│   ├── constants/
│   │   ├── errors.ts
│   │   └── statusCodes.ts
│   └── types/
│       ├── user.ts
│       ├── product.ts
│       └── common.ts
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Layer responsibilities

The architecture only works if each layer sticks to its responsibility.

### 1. Routes

Responsible for:

- URL
- HTTP method
- middleware
- controller mapping

```ts
router.post('/', validate(createUserSchema), userController.createUser);
```

No business logic.

### 2. Controller

Responsible for:

- Reading `req`
- Calling service
- Returning `res`

```ts
const createUser = async (req, res) => {
  const user = await userService.createUser(req.body);

  return res.status(201).json({
    success: true,
    data: user,
  });
};
```

Controller should remain **thin**.

### 3. Service

This is where your **business logic** lives.

```ts
const createUser = async (data) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new ApiError(409, 'User already exists');
  }

  return prisma.user.create({ data });
};
```

The service can directly interact with the Prisma client.

That's the key difference from a stricter layered architecture:

```
Controller
    ↓
Service
    ↓
Prisma Client
```

### 4. Prisma (schema & client)

Responsible for:

- PostgreSQL schema (`prisma/schema.prisma`)
- Table relations, indexes, and constraints
- Migrations (`prisma migrate dev`)
- A single shared `PrismaClient` instance (`src/config/prisma.ts`)

```prisma
model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}
```

```ts
// src/config/prisma.ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
```

Import the shared `prisma` instance in services — don't instantiate `PrismaClient` per module.
