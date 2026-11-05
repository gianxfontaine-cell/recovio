import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, tenantId: true }
  })
  if (!user) return Response.json({ error: "User not found" }, { status: 401 })
  if (user.tenantId) return Response.json({ error: "User already belongs to an organization" }, { status: 409 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Request body must be valid JSON" }, { status: 400 })
  }
  if (!body || typeof body !== "object" || !("name" in body) || typeof body.name !== "string") {
    return Response.json({ error: "Organization name is required" }, { status: 400 })
  }

  const name = body.name.trim()
  const slugInput = "slug" in body && typeof body.slug === "string" ? body.slug : name
  const slug = slugInput.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  if (name.length < 2 || name.length > 100 || !slug || slug.length > 80) {
    return Response.json({ error: "Provide a valid organization name and slug" }, { status: 400 })
  }

  try {
    const tenant = await prisma.$transaction(async tx => {
      const created = await tx.tenant.create({ data: { name, slug } })
      const membership = await tx.user.updateMany({
        where: { id: user.id, tenantId: null },
        data: { tenantId: created.id, role: "ADMIN" }
      })
      if (membership.count !== 1) throw new Error("User organization membership changed")
      await tx.auditEvent.create({
        data: {
          tenantId: created.id,
          actorId: user.id,
          action: "organization.created",
          resourceType: "organization",
          resourceId: created.id
        }
      })
      return created
    })
    return Response.json({ ok: true, organization: tenant }, { status: 201 })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Response.json({ error: "That organization slug is already in use" }, { status: 409 })
    }
    throw error
  }
}
