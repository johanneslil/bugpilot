import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config({ path: '../../.env' });

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

async function main() {
  console.log('Seeding database...');

  await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector`;

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'alice@example.com' },
      update: {},
      create: {
        email: 'alice@example.com',
        name: 'Alice',
      },
    }),
    prisma.user.upsert({
      where: { email: 'bob@example.com' },
      update: {},
      create: {
        email: 'bob@example.com',
        name: 'Bob',
      },
    }),
    prisma.user.upsert({
      where: { email: 'charlie@example.com' },
      update: {},
      create: {
        email: 'charlie@example.com',
        name: 'Charlie',
      },
    }),
    prisma.user.upsert({
      where: { email: 'diana@example.com' },
      update: {},
      create: {
        email: 'diana@example.com',
        name: 'Diana',
      },
    }),
    prisma.user.upsert({
      where: { email: 'eve@example.com' },
      update: {},
      create: {
        email: 'eve@example.com',
        name: 'Eve',
      },
    }),
  ]);

  console.log('Created users:', users.map(u => u.name).join(', '));

  const sampleBugs = [
    {
      title: 'Login button not responding on mobile',
      description: 'When users try to login on mobile devices, the login button does not respond to clicks. This affects iOS and Android devices.',
      severity: 'S1',
      area: 'FRONTEND',
    },
    {
      title: 'Login session expires too quickly',
      description: 'Users are being logged out after just 15 minutes of inactivity. The session timeout should be at least 1 hour for better user experience.',
      severity: 'S2',
      area: 'BACKEND',
    },
    {
      title: 'Password reset link returns 404 error',
      description: 'When users click the password reset link from their email, they get a 404 error page. This prevents users from recovering their accounts.',
      severity: 'S0',
      area: 'BACKEND',
    },
    {
      title: 'Login form does not show validation errors',
      description: 'When users enter incorrect credentials, no error message is displayed. Users are left wondering why they cannot login.',
      severity: 'S2',
      area: 'FRONTEND',
    },
    {
      title: 'Database connection pool exhausted',
      description: 'Production database is running out of connections during peak hours. Need to investigate connection leaks and increase pool size.',
      severity: 'S0',
      area: 'BACKEND',
    },
    {
      title: 'Payment API returns 500 error intermittently',
      description: 'The payment processing API occasionally returns 500 errors. Retrying usually works but this causes a poor user experience.',
      severity: 'S1',
      area: 'BACKEND',
    },
    {
      title: 'Dark mode colors are inconsistent',
      description: 'Some UI elements in dark mode have poor contrast. The text is hard to read in certain sections of the dashboard.',
      severity: 'S3',
      area: 'FRONTEND',
    },
    {
      title: 'Export to CSV feature missing date column',
      description: 'When exporting data to CSV, the created_at date column is not included in the export.',
      severity: 'S2',
      area: 'DATA',
    },
    {
      title: 'Memory leak in background job worker',
      description: 'The background job worker process gradually consumes more memory over time and needs to be restarted every few days.',
      severity: 'S1',
      area: 'INFRA',
    },
    {
      title: 'Search autocomplete shows duplicates',
      description: 'The search autocomplete dropdown displays duplicate suggestions when typing. This only happens for certain search terms.',
      severity: 'S2',
      area: 'FRONTEND',
    },
    {
      title: 'Email notifications not being sent',
      description: 'Users are not receiving email notifications for important events. The email queue seems to be stuck.',
      severity: 'S0',
      area: 'BACKEND',
    },
    {
      title: 'Chart tooltips overflow on small screens',
      description: 'Dashboard chart tooltips extend beyond the viewport on mobile devices making them unreadable.',
      severity: 'S3',
      area: 'FRONTEND',
    },
    {
      title: 'API rate limiting too aggressive',
      description: 'Legitimate users are being rate limited when performing normal actions. The rate limit threshold needs adjustment.',
      severity: 'S2',
      area: 'BACKEND',
    },
    {
      title: 'User profile images not loading',
      description: 'Profile images are showing broken image icons. The CDN integration might be broken.',
      severity: 'S2',
      area: 'INFRA',
    },
    {
      title: 'Incorrect timezone handling in reports',
      description: 'Generated reports show timestamps in UTC instead of user local timezone. This causes confusion.',
      severity: 'S2',
      area: 'DATA',
    },
    {
      title: 'Mobile app crashes on startup',
      description: 'iOS app crashes immediately after launching on iOS 17. Works fine on earlier versions.',
      severity: 'S0',
      area: 'FRONTEND',
    },
    {
      title: 'Slow query performance on analytics dashboard',
      description: 'The analytics dashboard takes 30+ seconds to load. Database queries need optimization.',
      severity: 'S1',
      area: 'DATA',
    },
    {
      title: 'Typo in success message after signup',
      description: 'The success message after user signup has a typo: "Accout created" instead of "Account created".',
      severity: 'S3',
      area: 'FRONTEND',
    },
  ];

  console.log('Creating bugs with embeddings...');

  for (let i = 0; i < sampleBugs.length; i++) {
    const bug = sampleBugs[i];
    const user = users[i % users.length];
    
    console.log(`Creating bug ${i + 1}/${sampleBugs.length}: ${bug.title}`);

    const bugText = `${bug.title}\n\n${bug.description}`;
    const embedding = await generateEmbedding(bugText);
    const embeddingString = `[${embedding.join(',')}]`;

    await prisma.$executeRaw`
      INSERT INTO "Bug" (id, title, description, severity, area, status, embedding, created_by_id, created_at, updated_at)
      VALUES (
        gen_random_uuid()::text,
        ${bug.title},
        ${bug.description},
        ${bug.severity}::"Severity",
        ${bug.area}::"Area",
        'OPEN'::"BugStatus",
        ${embeddingString}::vector(1536),
        ${user.id},
        NOW(),
        NOW()
      )
    `;
  }

  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

