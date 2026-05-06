export function hasPermission(
  permissions: string[] | undefined,
  permission: string,
): boolean {
  if (!permission) return true;
  if (!permissions || permissions.length === 0) return false;

  return permissions.includes('*') || permissions.includes(permission);
}

export function hasAnyPermission(
  permissions: string[] | undefined,
  permissionCodes: string[],
): boolean {
  return permissionCodes.some((permission) => hasPermission(permissions, permission));
}
