import { signIn } from "@/auth"

export default function LoginPage({
  searchParams
}: {
  searchParams?: { callbackUrl?: string }
}) {
  const callbackUrl = searchParams?.callbackUrl?.startsWith("/") &&
    !searchParams.callbackUrl.startsWith("//")
    ? searchParams.callbackUrl
    : "/"
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-8 text-center">
        <h1 className="text-2xl font-bold">Welcome to Recovio</h1>
        <p className="mt-2 text-sm text-slate-400">Sign in with your organization account to access your workspace</p>
        
        {process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET ? (
          <form
            action={async () => {
              "use server"
              await signIn("google", { redirectTo: callbackUrl })
            }}
            className="mt-6"
          >
            <button className="rounded-xl bg-white px-6 py-3 font-semibold text-slate-900 transition-colors hover:bg-slate-200">
              Sign in with Google Workspace
            </button>
          </form>
        ) : null}
        {process.env.NODE_ENV !== "production" || process.env.AUTH_ALLOW_GITHUB === "true" ? (
          <form
            action={async () => {
              "use server"
              await signIn("github", { redirectTo: callbackUrl })
            }}
            className={process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET ? "mt-3" : "mt-6"}
          >
            <button className="rounded-xl border border-white/10 px-6 py-3 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5">
              Sign in with GitHub
            </button>
          </form>
        ) : null}
        {process.env.NODE_ENV === "production" && !process.env.AUTH_GOOGLE_ID ? (
          <p role="alert" className="mt-4 text-sm text-red-300">Organization sign-in is not configured. Contact your administrator.</p>
        ) : null}
      </div>
    </div>
  )
}
