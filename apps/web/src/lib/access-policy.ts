export const tenantRoles = ["ADMIN", "FINANCE", "OPERATIONS", "VIEWER"] as const
export type TenantRole = (typeof tenantRoles)[number]

export function hasTenantRole(role: string, allowedRoles?: readonly TenantRole[]): boolean {
  return !allowedRoles || allowedRoles.includes(role as TenantRole)
}

export function tenantScope<T extends object>(
  tenantId: string,
  criteria: T
): Omit<T, "tenantId"> & { tenantId: string } {
  return { ...criteria, tenantId }
}

export function canReviewDispute(
  status: string,
  requesterId: string | null,
  reviewerId: string
): boolean {
  return status === "PENDING_REVIEW" && requesterId !== reviewerId
}
