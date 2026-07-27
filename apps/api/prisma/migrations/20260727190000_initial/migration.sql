CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'VIEWER');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'IN_PROGRESS', 'PAUSED', 'COMPLETED');
CREATE TYPE "ProjectPermission" AS ENUM ('VIEW', 'EDIT');
CREATE TYPE "ScopeStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'PIX', 'DEBIT_CARD', 'CREDIT_CARD', 'BANK_TRANSFER', 'BOLETO', 'OTHER');

CREATE TABLE "User" (
    "id" TEXT NOT NULL, "name" VARCHAR(120) NOT NULL, "email" VARCHAR(180) NOT NULL,
    "passwordHash" TEXT NOT NULL, "role" "UserRole" NOT NULL DEFAULT 'MANAGER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE', "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Project" (
    "id" TEXT NOT NULL, "ownerId" TEXT NOT NULL, "name" VARCHAR(140) NOT NULL,
    "description" VARCHAR(600), "address" VARCHAR(240), "totalBudget" DECIMAL(14,2) NOT NULL,
    "startDate" TIMESTAMP(3), "expectedEndDate" TIMESTAMP(3),
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNING', "notes" VARCHAR(2000),
    "archivedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProjectAccess" (
    "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "userId" TEXT NOT NULL,
    "permission" "ProjectPermission" NOT NULL, "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProjectAccess_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Scope" (
    "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(600), "plannedBudget" DECIMAL(14,2) NOT NULL,
    "status" "ScopeStatus" NOT NULL DEFAULT 'ACTIVE', "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Scope_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "scopeId" TEXT,
    "description" VARCHAR(180) NOT NULL, "amount" DECIMAL(14,2) NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL, "categoryId" TEXT, "supplierId" TEXT,
    "paymentMethod" "PaymentMethod", "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "documentNumber" VARCHAR(80), "notes" VARCHAR(1200), "createdById" TEXT NOT NULL,
    "updatedById" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Category" (
    "id" TEXT NOT NULL, "name" VARCHAR(100) NOT NULL, "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL, "ownerId" TEXT NOT NULL, "name" VARCHAR(140) NOT NULL,
    "document" VARCHAR(24), "phone" VARCHAR(24), "email" VARCHAR(180), "notes" VARCHAR(1000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL, "actorId" TEXT NOT NULL, "action" VARCHAR(80) NOT NULL,
    "entityType" VARCHAR(80) NOT NULL, "entityId" TEXT NOT NULL, "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "Project_ownerId_idx" ON "Project"("ownerId");
CREATE INDEX "Project_status_idx" ON "Project"("status");
CREATE INDEX "ProjectAccess_projectId_idx" ON "ProjectAccess"("projectId");
CREATE INDEX "ProjectAccess_userId_idx" ON "ProjectAccess"("userId");
CREATE UNIQUE INDEX "ProjectAccess_projectId_userId_key" ON "ProjectAccess"("projectId", "userId");
CREATE INDEX "Scope_projectId_idx" ON "Scope"("projectId");
CREATE INDEX "Expense_projectId_idx" ON "Expense"("projectId");
CREATE INDEX "Expense_scopeId_idx" ON "Expense"("scopeId");
CREATE INDEX "Expense_expenseDate_idx" ON "Expense"("expenseDate");
CREATE INDEX "Expense_paymentStatus_idx" ON "Expense"("paymentStatus");
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
CREATE INDEX "Supplier_ownerId_idx" ON "Supplier"("ownerId");
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

ALTER TABLE "Project" ADD CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProjectAccess" ADD CONSTRAINT "ProjectAccess_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProjectAccess" ADD CONSTRAINT "ProjectAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProjectAccess" ADD CONSTRAINT "ProjectAccess_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Scope" ADD CONSTRAINT "Scope_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_scopeId_fkey" FOREIGN KEY ("scopeId") REFERENCES "Scope"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
