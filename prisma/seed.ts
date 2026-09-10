import 'dotenv/config';
import bcrypt from 'bcrypt';

import { prisma } from '../src/config/prisma.js';
import { Role } from '../src/generated/prisma/client.js';

async function seedHrUser(): Promise<void> {
  const email = 'hr@yopmail.com';
  
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`User with email ${email} already exists, skipping.`);
    return;
  }

  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
  const password = await bcrypt.hash('hr@12345', saltRounds);

  const user = await prisma.user.create({
    data: {
      name: 'simform hr',
      email,
      password,
      role: Role.HR,
    },
  });

  console.log(`Created HR user: ${user.email}`);
}

async function main(): Promise<void> {
  await seedHrUser();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
