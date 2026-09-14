-- CreateTable
CREATE TABLE `companies` (
    `id` CHAR(36) NOT NULL,
    `legalName` VARCHAR(200) NOT NULL,
    `tradeName` VARCHAR(200) NULL,
    `countryCode` CHAR(2) NOT NULL,
    `documentType` VARCHAR(20) NULL,
    `taxId` VARCHAR(32) NULL,
    `currencyCode` CHAR(3) NOT NULL,
    `timeZone` VARCHAR(64) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `companies_countryCode_documentType_taxId_key`(`countryCode`, `documentType`, `taxId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `branches` (
    `id` CHAR(36) NOT NULL,
    `companyId` CHAR(36) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `countryCode` CHAR(2) NOT NULL,
    `timeZone` VARCHAR(64) NOT NULL,
    `address` VARCHAR(250) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `branches_companyId_active_name_id_idx`(`companyId`, `active`, `name`, `id`),
    UNIQUE INDEX `branches_companyId_id_key`(`companyId`, `id`),
    UNIQUE INDEX `branches_companyId_code_key`(`companyId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL,
    `email` VARCHAR(254) NOT NULL,
    `displayName` VARCHAR(160) NOT NULL,
    `passwordHash` VARCHAR(255) NULL,
    `active` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `memberships` (
    `id` CHAR(36) NOT NULL,
    `companyId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `memberships_userId_active_idx`(`userId`, `active`),
    UNIQUE INDEX `memberships_companyId_id_key`(`companyId`, `id`),
    UNIQUE INDEX `memberships_companyId_userId_key`(`companyId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` CHAR(36) NOT NULL,
    `companyId` CHAR(36) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `roles_companyId_id_key`(`companyId`, `id`),
    UNIQUE INDEX `roles_companyId_code_key`(`companyId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `code` VARCHAR(80) NOT NULL,
    `description` VARCHAR(200) NOT NULL,

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permissions` (
    `companyId` CHAR(36) NOT NULL,
    `roleId` CHAR(36) NOT NULL,
    `permissionCode` VARCHAR(80) NOT NULL,

    INDEX `role_permissions_companyId_roleId_idx`(`companyId`, `roleId`),
    INDEX `role_permissions_permissionCode_idx`(`permissionCode`),
    PRIMARY KEY (`roleId`, `permissionCode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_roles` (
    `companyId` CHAR(36) NOT NULL,
    `membershipId` CHAR(36) NOT NULL,
    `roleId` CHAR(36) NOT NULL,

    INDEX `user_roles_companyId_membershipId_idx`(`companyId`, `membershipId`),
    INDEX `user_roles_companyId_roleId_idx`(`companyId`, `roleId`),
    PRIMARY KEY (`membershipId`, `roleId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `branch_access` (
    `companyId` CHAR(36) NOT NULL,
    `membershipId` CHAR(36) NOT NULL,
    `branchId` CHAR(36) NOT NULL,

    INDEX `branch_access_companyId_membershipId_idx`(`companyId`, `membershipId`),
    INDEX `branch_access_companyId_branchId_idx`(`companyId`, `branchId`),
    PRIMARY KEY (`membershipId`, `branchId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` CHAR(36) NOT NULL,
    `companyId` CHAR(36) NOT NULL,
    `membershipId` CHAR(36) NOT NULL,
    `tokenHash` CHAR(64) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `revokedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `sessions_tokenHash_key`(`tokenHash`),
    INDEX `sessions_companyId_membershipId_revokedAt_idx`(`companyId`, `membershipId`, `revokedAt`),
    INDEX `sessions_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_events` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `companyId` CHAR(36) NOT NULL,
    `actorMembershipId` CHAR(36) NULL,
    `action` VARCHAR(80) NOT NULL,
    `entityType` VARCHAR(64) NOT NULL,
    `entityId` VARCHAR(64) NULL,
    `requestId` VARCHAR(64) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_events_companyId_createdAt_id_idx`(`companyId`, `createdAt`, `id`),
    INDEX `audit_events_companyId_actorMembershipId_idx`(`companyId`, `actorMembershipId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `branches` ADD CONSTRAINT `branches_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `memberships` ADD CONSTRAINT `memberships_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `memberships` ADD CONSTRAINT `memberships_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `roles` ADD CONSTRAINT `roles_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_companyId_roleId_fkey` FOREIGN KEY (`companyId`, `roleId`) REFERENCES `roles`(`companyId`, `id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permissionCode_fkey` FOREIGN KEY (`permissionCode`) REFERENCES `permissions`(`code`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_companyId_membershipId_fkey` FOREIGN KEY (`companyId`, `membershipId`) REFERENCES `memberships`(`companyId`, `id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_companyId_roleId_fkey` FOREIGN KEY (`companyId`, `roleId`) REFERENCES `roles`(`companyId`, `id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `branch_access` ADD CONSTRAINT `branch_access_companyId_membershipId_fkey` FOREIGN KEY (`companyId`, `membershipId`) REFERENCES `memberships`(`companyId`, `id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `branch_access` ADD CONSTRAINT `branch_access_companyId_branchId_fkey` FOREIGN KEY (`companyId`, `branchId`) REFERENCES `branches`(`companyId`, `id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_companyId_membershipId_fkey` FOREIGN KEY (`companyId`, `membershipId`) REFERENCES `memberships`(`companyId`, `id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `audit_events` ADD CONSTRAINT `audit_events_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `audit_events` ADD CONSTRAINT `audit_events_companyId_actorMembershipId_fkey` FOREIGN KEY (`companyId`, `actorMembershipId`) REFERENCES `memberships`(`companyId`, `id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
