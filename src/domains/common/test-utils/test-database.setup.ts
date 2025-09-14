import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@/infrastructure/prisma/prisma.module';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';

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
  await cleanupWithRetry(prisma, 3);
}

async function cleanupWithRetry(prisma: PrismaService, maxRetries: number): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Use transaction to ensure atomicity and proper constraint handling
      await prisma.$transaction(async (tx) => {
        // Clean up in strict dependency order to avoid foreign key violations
        // 1. First delete junction/relationship tables
        await tx.memberPrivilege.deleteMany();
        
        // 2. Then delete dependent entities
        await tx.point.deleteMany();
        
        // 3. Then delete parent entities
        await tx.privilege.deleteMany();
        await tx.member.deleteMany();
        
        // 4. Finally delete independent entities
        await tx.admin.deleteMany();
      }, {
        timeout: 10000, // 10 second timeout
      });
      
      // If we reach here, cleanup was successful
      return;
    } catch (error) {
      if (attempt === maxRetries) {
        // If this was the last attempt, throw the error
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Database cleanup failed after ${maxRetries} attempts: ${errorMessage}`);
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, attempt - 1) * 100; // 100ms, 200ms, 400ms...
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
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
    isActive: true, // Explicitly set default value
    ...overrides,
  };
}