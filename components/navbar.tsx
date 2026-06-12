"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X, LayoutDashboard, Box } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { authClient } from "@/lib/auth-client"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { data: session } = authClient.useSession()
  const isLoggedIn = !!session

  const desktopAction = isLoggedIn ? (
    <Link
      href="/dashboard"
      className="font-body text-lg px-6 py-2 bg-hd-card text-hd-fg border-[3px] border-hd-fg no-underline inline-flex items-center gap-2 transition-all duration-100 hover:bg-hd-blue hover:text-white active:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
      style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px", boxShadow: "4px 4px 0px 0px var(--hd-fg)" }}
    >
      <LayoutDashboard className="w-4 h-4" />
      Dashboard
    </Link>
  ) : (
    <Link
      href="/signin"
      className="font-body text-lg px-6 py-2 bg-hd-card text-hd-fg border-[3px] border-hd-fg no-underline transition-all duration-100 hover:bg-hd-blue hover:text-white active:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
      style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px", boxShadow: "4px 4px 0px 0px var(--hd-fg)" }}
    >
      Sign In
    </Link>
  )

  const mobileAction = isLoggedIn ? (
    <Link
      href="/dashboard"
      onClick={() => setOpen(false)}
      className="font-body text-lg px-6 py-2 bg-hd-card text-hd-fg border-[3px] border-hd-fg no-underline text-center inline-flex items-center justify-center gap-2"
      style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px", boxShadow: "4px 4px 0px 0px var(--hd-fg)" }}
    >
      <LayoutDashboard className="w-4 h-4" />
      Dashboard
    </Link>
  ) : (
    <Link
      href="/signin"
      onClick={() => setOpen(false)}
      className="font-body text-lg px-6 py-2 bg-hd-card text-hd-fg border-[3px] border-hd-fg no-underline text-center"
      style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px", boxShadow: "4px 4px 0px 0px var(--hd-fg)" }}
    >
      Sign In
    </Link>
  )

  return (
    <nav className="relative z-50 bg-hd-bg border-b-[3px] border-hd-fg">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between" style={{ backgroundImage: "radial-gradient(var(--hd-muted) 1px, transparent 1px)", backgroundSize: "24px 24px" }}>
        <Link href="/" className="font-heading text-2xl text-hd-fg no-underline inline-flex items-center gap-2">
          <Box className="w-7 h-7 text-hd-accent" strokeWidth={2.5} />
          Deep<span className="text-hd-accent">.</span>Base
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-body text-lg text-hd-fg no-underline transition-colors duration-100 hover:text-hd-accent"
            >
              {link.label}
            </Link>
          ))}
          <ThemeToggle />
          {desktopAction}
        </div>

        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setOpen(!open)}
            className="p-2 text-hd-fg"
            aria-label="Toggle menu"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t-[3px] border-hd-fg bg-hd-bg px-6 py-4 flex flex-col gap-4" style={{ backgroundImage: "radial-gradient(var(--hd-muted) 1px, transparent 1px)", backgroundSize: "24px 24px" }}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="font-body text-lg text-hd-fg no-underline"
            >
              {link.label}
            </Link>
          ))}
          {mobileAction}
        </div>
      )}
    </nav>
  )
}
