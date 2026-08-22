import { signIn } from "@/auth"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-8 text-center">
        <h1 className="text-2xl font-bold">Welcome to Recovio</h1>
        <p className="mt-2 text-sm text-slate-400">Sign in to access your workspace</p>
        
        <form
          action={async () => {
            "use server"
            await signIn("github", { redirectTo: "/" })
          }}
          className="mt-6"
        >
          <button className="rounded-xl bg-white px-6 py-3 font-semibold text-slate-900 transition-colors hover:bg-slate-200">
            Sign in with GitHub
          </button>
        </form>
      </div>
    </div>
  )
}
