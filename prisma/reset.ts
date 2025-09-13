import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Resetting database...');

  // Clean all data (in reverse order of dependencies)
  await prisma.memberPrivilege.deleteMany();
  console.log('✅ Deleted member privileges');
  
  await prisma.point.deleteMany();
  console.log('✅ Deleted points');
  
  await prisma.privilege.deleteMany();
  console.log('✅ Deleted privileges');
  
  await prisma.member.deleteMany();
  console.log('✅ Deleted members');
  
  await prisma.admin.deleteMany();
  console.log('✅ Deleted admins');

  console.log('🎯 Database reset completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database reset:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });