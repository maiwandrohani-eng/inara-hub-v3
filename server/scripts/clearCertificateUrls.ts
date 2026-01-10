import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing ALL certificate URLs from database...');
  
  // Get all certificates with URLs
  const certificatesWithUrls = await prisma.certificate.findMany({
    where: {
      certificateUrl: {
        not: '',
      },
    },
    select: {
      id: true,
      certificateNumber: true,
      certificateUrl: true,
    },
  });

  console.log(`Found ${certificatesWithUrls.length} certificates with URLs:`);
  certificatesWithUrls.forEach(cert => {
    console.log(`  - ${cert.certificateNumber}: ${cert.certificateUrl}`);
  });

  // Clear all certificate URLs
  const result = await prisma.certificate.updateMany({
    data: {
      certificateUrl: '',
    },
  });

  console.log(`✅ Updated ${result.count} total certificates`);
  console.log('All certificate URLs have been cleared.');

  // Verify
  const remaining = await prisma.certificate.findMany({
    where: {
      certificateUrl: {
        not: '',
      },
    },
  });

  if (remaining.length === 0) {
    console.log('✓ Verification: No certificates with URLs remaining');
  } else {
    console.log(`⚠️ Verification: ${remaining.length} certificates still have URLs`);
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
