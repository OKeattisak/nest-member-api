import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../../infrastructure/prisma/prisma.module';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

export async function createTestingModule(providers: any[] = []): Promise<TestingModule> {
  const module: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env.test',
      }),
      PrismaModule,
    ],
    providers,
  }).compile();

  return module;
}

export async function cleanupDatabase(prisma: PrismaService): Promise<void> {
  // Clean up in reverse order of dependencies
  await prisma.memberPrivilege.deleteMany();
  await prisma.point.deleteMany();
  await prisma.privilege.deleteMany();
  await prisma.member.deleteMany();
  await prisma.admin.deleteMany();
}

export function createTestMember(overrides: Partial<any> = {}) {
  return {
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: 'hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    ...overrides,
  };
}

export function createTestPrivilege(overrides: Partial<any> = {}) {
  return {
    name: 'Test Privilege',
    description: 'A test privilege',
    pointCost: 100,
    validityDays: 30,
    ...overrides,
  };
}