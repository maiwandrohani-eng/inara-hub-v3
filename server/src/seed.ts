import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create super admin user
  const superAdminPassword = await bcrypt.hash('Come*1234', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'maiwand@inara.org' },
    update: {
      passwordHash: superAdminPassword,
      role: 'ADMIN',
    },
    create: {
      email: 'maiwand@inara.org',
      passwordHash: superAdminPassword,
      firstName: 'Maiwand',
      lastName: 'Admin',
      role: 'ADMIN',
      department: 'IT',
    },
  });
  console.log('✅ Created super admin user:', superAdmin.email);

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@inara.org' },
    update: {},
    create: {
      email: 'admin@inara.org',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      department: 'IT',
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // Create sample staff user
  const staffPassword = await bcrypt.hash('staff123', 10);
  const staff = await prisma.user.upsert({
    where: { email: 'staff@inara.org' },
    update: {},
    create: {
      email: 'staff@inara.org',
      passwordHash: staffPassword,
      firstName: 'Staff',
      lastName: 'Member',
      role: 'STAFF',
      department: 'PROGRAMS',
      country: 'Afghanistan',
    },
  });
  console.log('✅ Created staff user:', staff.email);

  // Create 8 work systems
  const workSystems = [
    { name: 'Human Resource Management', url: 'https://hr.inara.org', order: 1 },
    { name: 'Asset Management', url: 'https://assets.inara.org', order: 2 },
    { name: 'Procurement Management', url: 'https://procurement.inara.org', order: 3 },
    { name: 'Financial Management', url: 'https://finance.inara.org', order: 4 },
    { name: 'Project Management', url: 'https://projects.inara.org', order: 5 },
    { name: 'Case Management', url: 'https://cases.inara.org', order: 6 },
    { name: 'Planning and Reporting', url: 'https://planning.inara.org', order: 7 },
    { name: 'The INARA Network', url: 'https://network.inara.org', order: 8 },
  ];

  for (const system of workSystems) {
    await prisma.workSystem.upsert({
      where: { name: system.name },
      update: {},
      create: system,
    });
  }
  console.log('✅ Created 8 work systems');

  // Create sample orientation
  const existingOrientation = await prisma.orientation.findFirst({
    where: { isActive: true },
  });

  if (!existingOrientation) {
    const orientation = await prisma.orientation.create({
      data: {
        title: 'Welcome to INARA',
        content: `
          <h2>Welcome to INARA Global Staff Platform</h2>
          <p>This is your unified digital workplace. Here you can:</p>
          <ul>
            <li>Access all INARA operational systems</li>
            <li>Complete mandatory trainings</li>
            <li>Read and certify policies</li>
            <li>Access institutional knowledge</li>
            <li>Submit program ideas</li>
            <li>Download standardized templates</li>
          </ul>
          <h3>Key Principles</h3>
          <ul>
            <li>Humanitarian principles guide all our work</li>
            <li>Safeguarding is everyone's responsibility</li>
            <li>Accountability to beneficiaries is paramount</li>
          </ul>
        `,
        sections: [
          {
            type: 'section',
            title: 'Introduction',
            content: 'Welcome to INARA',
          },
          {
            type: 'question',
            question: 'What is the main purpose of this platform?',
            options: [
              'To access all INARA systems',
              'To complete trainings',
              'To manage projects',
              'All of the above',
            ],
            correctAnswer: 'All of the above',
          },
        ],
      },
    });
    console.log('✅ Created orientation');
  } else {
    console.log('✅ Orientation already exists');
  }

  // Create sample training
  const training = await prisma.training.create({
    data: {
      title: 'Safeguarding Basics',
      description: 'Introduction to safeguarding principles and practices',
      content: 'Training content here...',
      duration: 30,
      objectives: ['Understand safeguarding', 'Know reporting procedures'],
      sections: [
        { type: 'section', title: 'Introduction', content: 'Safeguarding overview' },
      ],
      quiz: {
        questions: [
          {
            question: 'What is safeguarding?',
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 'A',
          },
        ],
      },
      passingScore: 70,
      isMandatory: true,
      category: 'Safeguarding',
      subcategory: 'Child Protection',
      tags: ['safeguarding', 'mandatory'],
    },
  });
  console.log('✅ Created sample training');

  // Create sample policy
  const policy = await prisma.policy.create({
    data: {
      title: 'Code of Conduct',
      brief: 'INARA Code of Conduct outlines expected behavior for all staff',
      complete: '<h1>Code of Conduct</h1><p>Full policy content...</p>',
      assessment: {
        questions: [
          {
            question: 'Have you read and understood the Code of Conduct?',
            type: 'acknowledgment',
          },
        ],
        passingScore: 100,
      },
      effectiveDate: new Date(),
      isMandatory: true,
      category: 'Human Resources',
      subcategory: 'Code of Conduct',
      tags: ['conduct', 'mandatory'],
    },
  });
  console.log('✅ Created sample policy');

  // Seed initial configuration data
  const initialConfigs = [
    // Departments
    { type: 'department', key: 'HR', value: 'Human Resources', order: 1 },
    { type: 'department', key: 'FINANCE', value: 'Finance', order: 2 },
    { type: 'department', key: 'PROCUREMENT', value: 'Procurement', order: 3 },
    { type: 'department', key: 'PROGRAMS', value: 'Programs', order: 4 },
    { type: 'department', key: 'MEAL', value: 'MEAL', order: 5 },
    { type: 'department', key: 'IT', value: 'Information Technology', order: 6 },
    { type: 'department', key: 'OPERATIONS', value: 'Operations', order: 7 },
    { type: 'department', key: 'P_AND_D', value: 'Partnership and Development', order: 8 },
    
    // Countries
    { type: 'country', key: 'AFG', value: 'Afghanistan', order: 1 },
    { type: 'country', key: 'IRQ', value: 'Iraq', order: 2 },
    { type: 'country', key: 'SYR', value: 'Syria', order: 3 },
    { type: 'country', key: 'JOR', value: 'Jordan', order: 4 },
    { type: 'country', key: 'LBN', value: 'Lebanon', order: 5 },
    { type: 'country', key: 'TUR', value: 'Turkey', order: 6 },
    
    // Cities (with country metadata)
    { type: 'city', key: 'KBL', value: 'Kabul', order: 1, metadata: { country: 'AFG' } },
    { type: 'city', key: 'HER', value: 'Herat', order: 2, metadata: { country: 'AFG' } },
    { type: 'city', key: 'BDG', value: 'Baghdad', order: 1, metadata: { country: 'IRQ' } },
    { type: 'city', key: 'ERB', value: 'Erbil', order: 2, metadata: { country: 'IRQ' } },
    { type: 'city', key: 'DMS', value: 'Damascus', order: 1, metadata: { country: 'SYR' } },
    { type: 'city', key: 'ALP', value: 'Aleppo', order: 2, metadata: { country: 'SYR' } },
    { type: 'city', key: 'AMM', value: 'Amman', order: 1, metadata: { country: 'JOR' } },
    { type: 'city', key: 'BEY', value: 'Beirut', order: 1, metadata: { country: 'LBN' } },
    { type: 'city', key: 'IST', value: 'Istanbul', order: 1, metadata: { country: 'TUR' } },
    { type: 'city', key: 'ANK', value: 'Ankara', order: 2, metadata: { country: 'TUR' } },
  ];

  for (const config of initialConfigs) {
    try {
      await prisma.systemConfig.upsert({
        where: {
          type_key: {
            type: config.type,
            key: config.key,
          },
        },
        update: {},
        create: config,
      });
    } catch (error: any) {
      // If unique constraint fails, try to create directly
      try {
        await prisma.systemConfig.create({ data: config });
      } catch (e) {
        // Ignore if already exists
      }
    }
  }
  console.log('✅ Created initial configuration data');

  console.log('🎉 Seeding completed!');
}

// Export for use in setup route
export async function seedDatabase() {
  await main();
  await prisma.$disconnect();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .catch((e) => {
      console.error('❌ Seeding failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

