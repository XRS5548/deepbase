"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { UserPlus, Mail, Lock, User } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Toaster } from "@/components/ui/sonner"

const wobble = { borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }
const wobbleMd = { borderRadius: "225px 25px 195px 35px / 35px 195px 25px 225px" }

export default function SignUpPage() {
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    const { error } = await authClient.signUp.email({ email, password, name })
    if (error) {
      toast.error(error.message || "Sign up failed")
    } else {
      toast.success("Account created!")
      router.push("/dashboard")
    }
  }

  const handleSocial = (provider: "google" | "github") => {
    authClient.signIn.social({ provider })
  }

  return (
    <div className="bg-hd-bg min-h-screen" style={{ backgroundImage: "radial-gradient(var(--hd-muted) 1px, transparent 1px)", backgroundSize: "24px 24px" }}>
      <Toaster />
      <Navbar />

      <section className="max-w-lg mx-auto px-6 pt-20 pb-24">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="text-center mb-10">
            <div className="inline-block font-body text-sm px-4 py-1.5 bg-hd-card border-2 border-hd-fg mb-6" style={wobble}>
              ✦ Get Started
            </div>
            <h1 className="font-heading text-4xl md:text-5xl text-hd-fg mb-4">Sign Up</h1>
            <p className="font-body text-base text-hd-fg/60">
              Create your account and join the community.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-hd-card border-[3px] border-hd-fg p-8 space-y-6"
            style={{ ...wobbleMd, boxShadow: "6px 6px 0px 0px var(--hd-fg)" }}
          >
            <div>
              <label className="font-body text-sm text-hd-fg block mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Full Name
              </label>
              <input
                name="name"
                type="text"
                required
                placeholder="Your full name"
                className="w-full font-body text-base px-4 py-3 bg-hd-card border-2 border-hd-fg placeholder:text-hd-fg/40 focus:outline-none focus:border-hd-blue focus:ring-2 focus:ring-hd-blue/20"
                style={wobble}
              />
            </div>

            <div>
              <label className="font-body text-sm text-hd-fg block mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="you@college.edu"
                className="w-full font-body text-base px-4 py-3 bg-hd-card border-2 border-hd-fg placeholder:text-hd-fg/40 focus:outline-none focus:border-hd-blue focus:ring-2 focus:ring-hd-blue/20"
                style={wobble}
              />
            </div>

            <div>
              <label className="font-body text-sm text-hd-fg block mb-2">
                <Lock className="w-4 h-4 inline mr-1" />
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                minLength={8}
                placeholder="At least 8 characters"
                className="w-full font-body text-base px-4 py-3 bg-hd-card border-2 border-hd-fg placeholder:text-hd-fg/40 focus:outline-none focus:border-hd-blue focus:ring-2 focus:ring-hd-blue/20"
                style={wobble}
              />
            </div>

            <button
              type="submit"
              className="w-full font-body text-lg px-8 py-3 bg-hd-card text-hd-fg border-[3px] border-hd-fg inline-flex items-center justify-center gap-2 transition-all duration-100 hover:bg-hd-accent hover:text-white active:shadow-none active:translate-x-[4px] active:translate-y-[4px] cursor-pointer"
              style={{ ...wobble, boxShadow: "4px 4px 0px 0px var(--hd-fg)" }}
            >
              <UserPlus className="w-5 h-5" />
              Create Account
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t-2 border-dashed border-hd-fg/20" />
              <span className="font-body text-sm text-hd-fg/40">or continue with</span>
              <div className="flex-1 border-t-2 border-dashed border-hd-fg/20" />
            </div>

            {/* Social Buttons */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => handleSocial("github")}
                className="w-full font-body text-base px-6 py-3 bg-hd-card text-hd-fg border-[3px] border-hd-fg inline-flex items-center justify-center gap-3 transition-all duration-100 hover:bg-hd-muted active:shadow-none active:translate-x-[4px] active:translate-y-[4px] cursor-pointer"
                style={{ ...wobble, boxShadow: "4px 4px 0px 0px var(--hd-fg)" }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
                Sign up with GitHub
              </button>
              <button
                type="button"
                onClick={() => handleSocial("google")}
                className="w-full font-body text-base px-6 py-3 bg-hd-card text-hd-fg border-[3px] border-hd-fg inline-flex items-center justify-center gap-3 transition-all duration-100 hover:bg-hd-muted active:shadow-none active:translate-x-[4px] active:translate-y-[4px] cursor-pointer"
                style={{ ...wobble, boxShadow: "4px 4px 0px 0px var(--hd-fg)" }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                </svg>
                Sign up with Google
              </button>
            </div>

            <p className="font-body text-sm text-center text-hd-fg/60">
              Already have an account?{" "}
              <Link href="/signin" className="text-hd-blue underline decoration-dashed underline-offset-4 hover:text-hd-accent">
                Sign in
              </Link>
            </p>
          </form>
        </motion.div>
      </section>

      <Footer />
    </div>
  )
}
