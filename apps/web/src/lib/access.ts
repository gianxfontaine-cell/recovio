import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { hasTenantRole, tenantRoles, type TenantRole } from "./access-policy"

export { tenantRoles }
export type { TenantRole } from "./access-policy"

export type TenantContext = {
  ok: true
  user: {
    id: string
    email: string
    name: string | null
    role: string
    tenantId: string
    tenant: { id: string; name: string; slug: string }
  }
}

export type AccessResult = TenantContext | {
  ok: false
  response: Response
}

export async function requireTenantUser(
  allowedRoles?: readonly TenantRole[]
): Promise<AccessResult> {
  const session = await auth()
  if (!session?.user?.email) {
    return { ok: false, response: Response.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { tenant: { select: { id: true, name: true, slug: true } } }
  })

  if (!user?.tenantId || !user.tenant) {
    return { ok: false, response: Response.json({ error: "Organization setup required" }, { status: 403 }) }
  }

  if (!hasTenantRole(user.role, allowedRoles)) {
    return { ok: false, response: Response.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      tenant: user.tenant
    }
  }
}

export async function recordAuditEvent(input: {
  tenantId: string
  actorId: string
  action: string
  resourceType: string
  resourceId?: string
  metadata?: Record<string, string | number | boolean | null>
}): Promise<void> {
  await prisma.auditEvent.create({
    data: {
      ...input,
      metadata: input.metadata ?? undefined
    }
  })
}
