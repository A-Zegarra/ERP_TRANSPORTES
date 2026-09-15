-- CreateTable
CREATE TABLE `auth_throttles` (
    `key` CHAR(64) NOT NULL,
    `attempts` INTEGER UNSIGNED NOT NULL,
    `resetAt` DATETIME(3) NOT NULL,

    INDEX `auth_throttles_resetAt_idx`(`resetAt`),
    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_bootstrap` (
    `id` INTEGER NOT NULL,
    `companyId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `system_bootstrap_companyId_key`(`companyId`),
    UNIQUE INDEX `system_bootstrap_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `system_bootstrap` ADD CONSTRAINT `system_bootstrap_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `system_bootstrap` ADD CONSTRAINT `system_bootstrap_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
