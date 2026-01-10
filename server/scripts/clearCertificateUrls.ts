import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing old certificate URLs from database...');
  
  const result = await prisma.certificate.updateMany({
    where: {
      certificateUrl: {
        not: '',
      },
    },
    data: {
      certificateUrl: '',
    },
  });

  console.log(`✅ Updated ${result.count} certificates`);
  console.log('Old PDF certificate URLs have been cleared.');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
