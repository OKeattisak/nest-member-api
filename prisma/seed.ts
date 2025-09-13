import { PrismaClient, PointType, AdminRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data (in reverse order of dependencies)
  await prisma.memberPrivilege.deleteMany();
  await prisma.point.deleteMany();
  await prisma.privilege.deleteMany();
  await prisma.member.deleteMany();
  await prisma.admin.deleteMany();

  console.log('🧹 Cleaned existing data');

  // Create admin users
  const adminPassword = await bcrypt.hash('admin123', 12);
  const superAdminPassword = await bcrypt.hash('superadmin123', 12);

  const admin = await prisma.admin.create({
    data: {
      email: 'admin@example.com',
      username: 'admin',
      passwordHash: adminPassword,
      role: AdminRole.ADMIN,
    },
  });

  const superAdmin = await prisma.admin.create({
    data: {
      email: 'superadmin@example.com',
      username: 'superadmin',
      passwordHash: superAdminPassword,
      role: AdminRole.SUPER_ADMIN,
    },
  });

  console.log('👑 Created admin users');

  // Create sample members
  const memberPassword = await bcrypt.hash('member123', 12);
  
  const members = await Promise.all([
    prisma.member.create({
      data: {
        email: 'john.doe@example.com',
        username: 'johndoe',
        passwordHash: memberPassword,
        firstName: 'John',
        lastName: 'Doe',
      },
    }),
    prisma.member.create({
      data: {
        email: 'jane.smith@example.com',
        username: 'janesmith',
        passwordHash: memberPassword,
        firstName: 'Jane',
        lastName: 'Smith',
      },
    }),
    prisma.member.create({
      data: {
        email: 'bob.wilson@example.com',
        username: 'bobwilson',
        passwordHash: memberPassword,
        firstName: 'Bob',
        lastName: 'Wilson',
      },
    }),
  ]);

  console.log('👥 Created sample members');

  // Create sample privileges
  const privileges = await Promise.all([
    prisma.privilege.create({
      data: {
        name: 'Premium Support',
        description: 'Access to premium customer support with priority response',
        pointCost: 100,
        validityDays: 30,
      },
    }),
    prisma.privilege.create({
      data: {
        name: 'Free Shipping',
        description: 'Free shipping on all orders for one month',
        pointCost: 50,
        validityDays: 30,
      },
    }),
    prisma.privilege.create({
      data: {
        name: 'VIP Access',
        description: 'Access to VIP events and exclusive content',
        pointCost: 200,
        validityDays: 90,
      },
    }),
    prisma.privilege.create({
      data: {
        name: 'Discount Coupon',
        description: '10% discount on next purchase',
        pointCost: 25,
        validityDays: 14,
      },
    }),
  ]);

  console.log('🎁 Created sample privileges');

  // Create sample points for members
  const pointsData = [
    // John Doe - 150 points total
    {
      memberId: members[0].id,
      amount: 100,
      type: PointType.EARNED,
      description: 'Welcome bonus',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    },
    {
      memberId: members[0].id,
      amount: 50,
      type: PointType.EARNED,
      description: 'Purchase reward',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
    // Jane Smith - 75 points total
    {
      memberId: members[1].id,
      amount: 75,
      type: PointType.EARNED,
      description: 'Referral bonus',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
    // Bob Wilson - 200 points, some expired
    {
      memberId: members[2].id,
      amount: 150,
      type: PointType.EARNED,
      description: 'Loyalty bonus',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
    {
      memberId: members[2].id,
      amount: 50,
      type: PointType.EARNED,
      description: 'Survey completion',
      expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired yesterday
      isExpired: true,
    },
  ];

  await Promise.all(
    pointsData.map(data => prisma.point.create({ data }))
  );

  console.log('💰 Created sample points');

  // Grant some privileges to members
  const memberPrivileges = [
    {
      memberId: members[0].id,
      privilegeId: privileges[1].id, // Free Shipping
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
    {
      memberId: members[1].id,
      privilegeId: privileges[3].id, // Discount Coupon
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    },
  ];

  await Promise.all(
    memberPrivileges.map(data => prisma.memberPrivilege.create({ data }))
  );

  console.log('🏆 Granted sample privileges');

  // Create some point deduction records to show transaction history
  await prisma.point.create({
    data: {
      memberId: members[0].id,
      amount: -50,
      type: PointType.EXCHANGED,
      description: 'Exchanged for Free Shipping privilege',
    },
  });

  console.log('📊 Created transaction history');

  console.log('✅ Database seeding completed successfully!');
  console.log('\n📋 Seeded data summary:');
  console.log(`- ${await prisma.admin.count()} admin users`);
  console.log(`- ${await prisma.member.count()} members`);
  console.log(`- ${await prisma.privilege.count()} privileges`);
  console.log(`- ${await prisma.point.count()} point transactions`);
  console.log(`- ${await prisma.memberPrivilege.count()} member privileges`);
  
  console.log('\n🔑 Test credentials:');
  console.log('Admin: admin@example.com / admin123');
  console.log('Super Admin: superadmin@example.com / superadmin123');
  console.log('Member: john.doe@example.com / member123');
  console.log('Member: jane.smith@example.com / member123');
  console.log('Member: bob.wilson@example.com / member123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });