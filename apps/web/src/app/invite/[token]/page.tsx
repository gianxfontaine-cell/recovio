import { auth } from "@/auth"
import { AcceptInvitation } from "@/components/onboarding-workflow"
import Link from "next/link"

export default async function InvitationPage({ params }: { params: { token: string } }) {
  const session = await auth()
  const loginUrl = `/login?callbackUrl=${encodeURIComponent(`/invite/${params.token}`)}`
  return (
    <main className="mx-auto max-w-lg px-6 py-20">
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-sky-300">Organization invitation</p>
        <h1 className="mt-3 text-2xl font-bold">Join your team on Recovio</h1>
        {session?.user?.email ? (
          <>
            <p className="mt-3 text-sm text-slate-400">Signed in as {session.user.email}. The invitation can only be accepted by the invited email address.</p>
            <AcceptInvitation token={params.token} />
          </>
        ) : (
          <>
            <p className="mt-3 text-sm text-slate-400">Sign in with the email address that received this invitation to continue.</p>
            <Link href={loginUrl} className="mt-5 inline-block rounded-xl bg-sky-400 px-5 py-3 font-semibold text-slate-950">Sign in to continue</Link>
          </>
        )}
      </div>
    </main>
  )
}
