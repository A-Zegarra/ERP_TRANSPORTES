CREATE TABLE `company_branding` (
  `companyId` CHAR(36) NOT NULL,
  `version` INTEGER NOT NULL DEFAULT 1,
  `displayName` VARCHAR(200) NOT NULL,
  `slogan` VARCHAR(160) NOT NULL DEFAULT '',
  `primaryColor` CHAR(7) NOT NULL DEFAULT '#006e63',
  `accentColor` CHAR(7) NOT NULL DEFAULT '#956416',
  `density` VARCHAR(20) NOT NULL DEFAULT 'comfortable',
  `logoHash` CHAR(64) NULL,
  PRIMARY KEY (`companyId`),
  CONSTRAINT `company_branding_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `company_branding` (`companyId`, `displayName`)
SELECT `id`, COALESCE(NULLIF(`tradeName`, ''), `legalName`) FROM `companies`;

ALTER TABLE `audit_events`
  ADD COLUMN `actorName` VARCHAR(160) NULL,
  ADD COLUMN `beforeJson` JSON NULL,
  ADD COLUMN `afterJson` JSON NULL;
CREATE INDEX `audit_events_companyId_action_createdAt_id_idx` ON `audit_events` (`companyId`, `action`, `createdAt`, `id`);

INSERT INTO `permissions` (`code`, `description`) VALUES
  ('branding.write', 'Personalizar identidad visual'),
  ('audit.read', 'Consultar auditoría de la empresa');
INSERT INTO `role_permissions` (`companyId`, `roleId`, `permissionCode`)
SELECT r.`companyId`, r.`id`, p.`code` FROM `roles` r CROSS JOIN `permissions` p
WHERE r.`code` = 'administrador' AND p.`code` IN ('branding.write', 'audit.read');
