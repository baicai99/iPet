import { Prisma, PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

type Bucket = 'day' | 'week' | 'month';

const prisma = new PrismaClient();

function asBucket(value: string): Bucket | null {
  return value === 'day' || value === 'week' || value === 'month' ? (value as Bucket) : null;
}

function getBucketKey(dateIso: string, bucket: Bucket): string {
  const date = new Date(dateIso);
  if (!Number.isFinite(date.getTime())) return dateIso.slice(0, 10);

  switch (bucket) {
    case 'day':
      return date.toISOString().split('T')[0];
    case 'week': {
      const weekStart = new Date(date);
      const day = weekStart.getDay();
      const diff = (day === 0 ? -6 : 1) - day; // Monday
      weekStart.setDate(weekStart.getDate() + diff);
      weekStart.setHours(0, 0, 0, 0);
      return weekStart.toISOString().split('T')[0];
    }
    case 'month':
      return date.toISOString().slice(0, 7);
  }
}

function getMaterializeStartDateForBucket(bucket: Bucket): Date {
  const now = new Date();
  if (bucket === 'month') {
    const start = new Date(now);
    start.setMonth(start.getMonth() - 24);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  const start = new Date(now);
  start.setDate(start.getDate() - 400);
  start.setHours(0, 0, 0, 0);
  return start;
}

async function ensureTable(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "HealthMetricBucket" (
      "id" TEXT NOT NULL,
      "petId" TEXT NOT NULL,
      "metricKey" TEXT NOT NULL,
      "bucket" TEXT NOT NULL,
      "bucketKey" TEXT NOT NULL,
      "value" DOUBLE PRECISION NOT NULL,
      "date" TEXT NOT NULL,
      "timestamp" BIGINT NOT NULL,
      "version" INTEGER NOT NULL DEFAULT 1,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "HealthMetricBucket_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "HealthMetricBucket_petId_fkey"
        FOREIGN KEY ("petId") REFERENCES "Pet"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "uniq_health_metric_bucket"
    ON "HealthMetricBucket"("petId","metricKey","bucket","bucketKey","version");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "idx_health_metric_bucket_lookup"
    ON "HealthMetricBucket"("petId","metricKey","bucket","version","bucketKey");
  `);
}

async function rebuildOne(params: { petId: string; metricKey: string; bucket: Bucket; version: number }) {
  const startDate = getMaterializeStartDateForBucket(params.bucket);
  const records = await prisma.healthRecord.findMany({
    where: {
      petId: params.petId,
      type: params.metricKey,
      deleted: false,
      date: { gte: startDate.toISOString() },
    },
    select: { value: true, date: true },
    orderBy: { date: 'asc' },
  });

  const buckets = new Map<string, { value: number; date: string; timestamp: number }>();
  for (const record of records) {
    const key = getBucketKey(record.date, params.bucket);
    const ts = new Date(record.date).getTime();
    const existing = buckets.get(key);
    if (!existing || ts > existing.timestamp) {
      buckets.set(key, { value: record.value, date: record.date, timestamp: ts });
    }
  }

  const rows = Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([bucketKey, value]) => ({
      id: uuidv4(),
      petId: params.petId,
      metricKey: params.metricKey,
      bucket: params.bucket,
      bucketKey,
      value: value.value,
      date: value.date,
      timestamp: value.timestamp,
      version: params.version,
    }));

  await prisma.$transaction(async (tx) => {
    const minKeepVersion = Math.max(1, params.version - 1);
    await tx.$executeRaw`
      DELETE FROM "HealthMetricBucket"
      WHERE "petId" = ${params.petId}
        AND "metricKey" = ${params.metricKey}
        AND "bucket" = ${params.bucket}
        AND "version" < ${minKeepVersion};
    `;

    await tx.$executeRaw`
      DELETE FROM "HealthMetricBucket"
      WHERE "petId" = ${params.petId}
        AND "metricKey" = ${params.metricKey}
        AND "bucket" = ${params.bucket}
        AND "version" = ${params.version};
    `;

    if (rows.length === 0) return;

    const valuesSql = Prisma.join(
      rows.map((r) => Prisma.sql`(
        ${r.id},
        ${r.petId},
        ${r.metricKey},
        ${r.bucket},
        ${r.bucketKey},
        ${r.value},
        ${r.date},
        ${r.timestamp},
        ${r.version}
      )`),
    );

    await tx.$executeRaw(Prisma.sql`
      INSERT INTO "HealthMetricBucket"
        ("id","petId","metricKey","bucket","bucketKey","value","date","timestamp","version")
      VALUES ${valuesSql};
    `);
  });

  return rows.length;
}

async function main() {
  const version = Number(process.env.HEALTH_BUCKET_VERSION || '1') || 1;
  const bucketEnv = (process.env.HEALTH_BUCKETS || 'day,week,month')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const buckets = bucketEnv.map(asBucket).filter((b): b is Bucket => Boolean(b));

  if (buckets.length === 0) {
    throw new Error('No valid HEALTH_BUCKETS provided, expected day/week/month');
  }

  await ensureTable();

  const pets = await prisma.healthRecord.findMany({
    where: { deleted: false },
    select: { petId: true },
    distinct: ['petId'],
  });

  let total = 0;
  for (const { petId } of pets) {
    const metricKeys = await prisma.healthRecord.findMany({
      where: { petId, deleted: false },
      select: { type: true },
      distinct: ['type'],
    });

    for (const { type } of metricKeys) {
      for (const bucket of buckets) {
        const count = await rebuildOne({ petId, metricKey: type, bucket, version });
        total += count;
        console.log(`[backfill] petId=${petId} metricKey=${type} bucket=${bucket} version=${version} rows=${count}`);
      }
    }
  }

  console.log(JSON.stringify({ ok: true, version, buckets, totalRows: total }));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
