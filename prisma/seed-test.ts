import { PrismaClient, PointType, AdminRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Starting test database seeding...');

  // Clean existing data (in reverse order of dependencies)
  await prisma.memberPrivilege.deleteMany();
  await prisma.point.deleteMany();
  await prisma.privilege.deleteMany();
  await prisma.member.deleteMany();
  await prisma.admin.deleteMany();

  console.log('🧹 Cleaned existing test data');

  // Create minimal test data
  const testPassword = await bcrypt.hash('test123', 12);

  // Create test admin
  const testAdmin = await prisma.admin.create({
    data: {
      email: 'test.admin@test.com',
      username: 'testadmin',
      passwordHash: testPassword,
      role: AdminRole.ADMIN,
    },
  });

  // Create test member
  const testMember = await prisma.member.create({
    data: {
      email: 'test.member@test.com',
      username: 'testmember',
      passwordHash: testPassword,
      firstName: 'Test',
      lastName: 'Member',
    },
  });

  // Create test privilege
  const testPrivilege = await prisma.privilege.create({
    data: {
      name: 'Test Privilege',
      description: 'A test privilege for automated testing',
      pointCost: 50,
      validityDays: 30,
    },
  });

  // Create test points
  await prisma.point.create({
    data: {
      memberId: testMember.id,
      amount: 100,
      type: PointType.EARNED,
      description: 'Test points',
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Test database seeding completed!');
  console.log('\n📋 Test data summary:');
  console.log(`- ${await prisma.admin.count()} test admin`);
  console.log(`- ${await prisma.member.count()} test member`);
  console.log(`- ${await prisma.privilege.count()} test privilege`);
  console.log(`- ${await prisma.point.count()} test point transaction`);
  
  console.log('\n🔑 Test credentials:');
  console.log('Admin: test.admin@test.com / test123');
  console.log('Member: test.member@test.com / test123');
}

main()
  .catch((e) => {
    console.error('❌ Error during test seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });