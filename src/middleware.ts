import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"
import { NextResponse } from "next/server"

// Usamos authConfig (sin Prisma/fs) para el Edge runtime
const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { nextUrl } = req
  const session = req.auth
  const isLoggedIn = !!session

  const isAdminRoute = nextUrl.pathname.startsWith("/admin")
  const isPacienteRoute = nextUrl.pathname.startsWith("/paciente")
  const isAuthRoute =
    nextUrl.pathname === "/login" || nextUrl.pathname === "/registro"

  if (isAuthRoute) {
    if (isLoggedIn) {
      const role = session?.user?.role
      return NextResponse.redirect(
        new URL(role === "ADMIN" ? "/admin" : "/paciente", nextUrl)
      )
    }
    return NextResponse.next()
  }

  if (!isLoggedIn && (isAdminRoute || isPacienteRoute)) {
    return NextResponse.redirect(new URL("/login", nextUrl))
  }

  if (isAdminRoute && session?.user?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/paciente", nextUrl))
  }

  if (isPacienteRoute && session?.user?.role === "ADMIN") {
    return NextResponse.redirect(new URL("/admin", nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sesiones).*)"],
}
