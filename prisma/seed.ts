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

const PUBLIC_HOLIDAYS_2026 = [
  { date: '2026-01-26', name: 'Republic Day' },
  { date: '2026-03-04', name: 'Holi' },
  { date: '2026-03-21', name: 'Eid-ul-Fitr' },
  { date: '2026-04-03', name: 'Good Friday' },
  { date: '2026-04-14', name: 'Ambedkar Jayanti' },
  { date: '2026-05-27', name: 'Eid-ul-Adha (Bakrid)' },
  { date: '2026-08-15', name: 'Independence Day' },
  { date: '2026-10-02', name: 'Gandhi Jayanti' },
  { date: '2026-11-08', name: 'Diwali' },
  { date: '2026-12-25', name: 'Christmas' },
];

async function seedPublicHolidays(): Promise<void> {
  const result = await prisma.publicHoliday.createMany({
    data: PUBLIC_HOLIDAYS_2026.map(({ date, name }) => ({
      date: new Date(date),
      name,
      year: new Date(date).getFullYear(),
    })),
    skipDuplicates: true,
  });

  console.log(`Seeded ${result.count} public holiday(s) for 2026.`);
}

async function main(): Promise<void> {
  await seedHrUser();
  await seedPublicHolidays();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
