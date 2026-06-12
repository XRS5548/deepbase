import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const authRoutes = ["/signin", "/signup"]
const protectedPrefixes = ["/dashboard", "/form"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Redirect authenticated users away from signin/signup
  if (authRoutes.includes(pathname)) {
    const session = await getSession(request)
    if (session) return NextResponse.redirect(new URL("/dashboard", request.url))
    return NextResponse.next()
  }

  // Protect dashboard and form routes
  if (protectedPrefixes.some((p) => pathname.startsWith(p))) {
    const session = await getSession(request)
    if (!session) {
      const signinUrl = new URL("/signin", request.url)
      signinUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(signinUrl)
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

async function getSession(request: NextRequest) {
  try {
    const res = await fetch(`${request.nextUrl.origin}/api/auth/get-session`, {
      headers: { cookie: request.headers.get("cookie") ?? "" },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.session ?? null
  } catch {
    return null
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
}
