-- CreateEnum
CREATE TYPE "public"."AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'SOFT_DELETE', 'ACTIVATE', 'DEACTIVATE', 'LOGIN', 'LOGOUT', 'POINT_ADD', 'POINT_DEDUCT', 'POINT_EXPIRE', 'PRIVILEGE_EXCHANGE', 'PRIVILEGE_GRANT', 'PRIVILEGE_REVOKE');

-- CreateEnum
CREATE TYPE "public"."ActorType" AS ENUM ('ADMIN', 'MEMBER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('POINT_EARNED', 'POINT_DEDUCTED', 'POINT_EXPIRED', 'POINT_EXCHANGED', 'PRIVILEGE_GRANTED', 'PRIVILEGE_EXPIRED', 'PRIVILEGE_REVOKED');

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" "public"."AuditAction" NOT NULL,
    "actorType" "public"."ActorType" NOT NULL,
    "actorId" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "traceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."login_attempts" (
    "id" TEXT NOT NULL,
    "emailOrUsername" TEXT NOT NULL,
    "actorType" "public"."ActorType" NOT NULL,
    "success" BOOLEAN NOT NULL,
    "failureReason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "traceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."transaction_history" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "transactionType" "public"."TransactionType" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "amount" DECIMAL(10,2),
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "balanceBefore" DECIMAL(10,2),
    "balanceAfter" DECIMAL(10,2),
    "traceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "public"."audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_actorType_actorId_idx" ON "public"."audit_logs"("actorType", "actorId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "public"."audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "public"."audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "login_attempts_emailOrUsername_idx" ON "public"."login_attempts"("emailOrUsername");

-- CreateIndex
CREATE INDEX "login_attempts_actorType_idx" ON "public"."login_attempts"("actorType");

-- CreateIndex
CREATE INDEX "login_attempts_success_idx" ON "public"."login_attempts"("success");

-- CreateIndex
CREATE INDEX "login_attempts_createdAt_idx" ON "public"."login_attempts"("createdAt");

-- CreateIndex
CREATE INDEX "transaction_history_memberId_idx" ON "public"."transaction_history"("memberId");

-- CreateIndex
CREATE INDEX "transaction_history_transactionType_idx" ON "public"."transaction_history"("transactionType");

-- CreateIndex
CREATE INDEX "transaction_history_entityType_entityId_idx" ON "public"."transaction_history"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "transaction_history_createdAt_idx" ON "public"."transaction_history"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."transaction_history" ADD CONSTRAINT "transaction_history_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
