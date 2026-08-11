const ADMIN_ROLES = new Set(['ROOT', 'MIDDLE', 'DEFAULT'])

export function isAdminRole(role) {
  return ADMIN_ROLES.has(String(role ?? '').toUpperCase())
}
