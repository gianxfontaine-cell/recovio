import { requireTenantUser } from "@/lib/access"
import { tenantScope } from "@/lib/access-policy"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const access = await requireTenantUser(["ADMIN", "FINANCE", "OPERATIONS"])
  if (!access.ok) return access.response

  const backCharge = await prisma.backCharge.findFirst({
    where: tenantScope(access.user.tenantId, { id: params.id }),
    select: { memoNumber: true, memoHtml: true }
  })
  if (!backCharge) {
    return Response.json({ error: "Back-charge memo not found" }, { status: 404 })
  }

  return new Response(backCharge.memoHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${backCharge.memoNumber}.html"`,
      "Cache-Control": "private, no-store"
    }
  })
}
