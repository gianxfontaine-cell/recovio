import NextAuth from "next-auth"
import authConfig from "@/auth.config"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnLoginPage = req.nextUrl.pathname === "/login"
  const isAuthRoute = req.nextUrl.pathname.startsWith("/api/auth")
  const isApiRoute = req.nextUrl.pathname.startsWith("/api/")
  const isInvitationRoute = req.nextUrl.pathname.startsWith("/invite/")

  if (isAuthRoute || isApiRoute || isInvitationRoute) return

  if (!isLoggedIn && !isOnLoginPage) {
    return Response.redirect(new URL("/login", req.nextUrl))
  }

  if (isLoggedIn && isOnLoginPage) {
    return Response.redirect(new URL("/", req.nextUrl))
  }
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
