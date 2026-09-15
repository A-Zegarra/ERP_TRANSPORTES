-- Aditiva y compatible con 1A.2. No crea identidades ni cambia contraseñas.
ALTER TABLE companies ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE branches ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE memberships ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN mustChangePassword BOOLEAN NOT NULL DEFAULT false;

INSERT INTO permissions (code, description) VALUES
 ('company.write', 'Editar datos de empresa'),
 ('branches.read', 'Consultar sucursales asignadas'),
 ('branches.write', 'Administrar sucursales'),
 ('users.read', 'Consultar usuarios de la empresa'),
 ('users.write', 'Administrar accesos de usuarios');

INSERT INTO role_permissions (companyId, roleId, permissionCode)
 SELECT r.companyId, r.id, p.code FROM roles r CROSS JOIN permissions p
 WHERE r.code = 'administrador' AND p.code IN
 ('company.write','branches.read','branches.write','users.read','users.write');

INSERT INTO roles (id, companyId, code, name, updatedAt)
 SELECT UUID(), c.id, 'consulta', 'Consulta', UTC_TIMESTAMP(3) FROM companies c
 WHERE NOT EXISTS (SELECT 1 FROM roles r WHERE r.companyId = c.id AND r.code = 'consulta');
INSERT INTO role_permissions (companyId, roleId, permissionCode)
 SELECT r.companyId, r.id, p.code FROM roles r CROSS JOIN permissions p
 WHERE r.code = 'consulta' AND p.code IN ('company.read','branches.read')
 AND NOT EXISTS (SELECT 1 FROM role_permissions rp WHERE rp.roleId=r.id AND rp.permissionCode=p.code);
