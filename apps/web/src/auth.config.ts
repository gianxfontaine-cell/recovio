import type { NextAuthConfig } from "next-auth"

const authConfig = {
  providers: [],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig

export default authConfig
