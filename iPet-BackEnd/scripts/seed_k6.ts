import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

const email = process.env.PERF_EMAIL || 'perf@example.com';
const password = process.env.PERF_PASSWORD || 'perf-password';
const petId = process.env.PERF_PET_ID || '00000000-0000-4000-8000-000000000001';

async function main() {
  const passwordHash = await hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      isGuest: false,
      displayName: 'perf-user',
    },
    update: {
      passwordHash,
      isGuest: false,
    },
  });

  await prisma.pet.upsert({
    where: { id: petId },
    create: {
      id: petId,
      userId: user.id,
      name: 'perf-pet',
      type: 'dog',
      deleted: false,
    },
    update: {
      userId: user.id,
      deleted: false,
    },
  });

  await prisma.healthRecord.upsert({
    where: { id: `${petId}-weight-1` },
    create: {
      id: `${petId}-weight-1`,
      petId,
      type: 'weight',
      value: 10.5,
      unit: 'kg',
      date: new Date().toISOString(),
      deleted: false,
      version: 1,
    },
    update: {},
  });

  console.log(JSON.stringify({ ok: true, email, petId }));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

