"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Users, Database, Mail, Timer, ChevronRight } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

const wobble = { borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }
const wobbleMd = { borderRadius: "225px 25px 195px 35px / 35px 195px 25px 225px" }

const features = [
  { icon: Users, title: "Team Management", desc: "Create teams, set roles, and control access to databases and forms across your organisation." },
  { icon: Database, title: "Databases & Forms", desc: "Build structured databases with custom form submissions, columns, and allotments." },
  { icon: Mail, title: "Bulk Emails", desc: "Send mass emails to teams and contacts directly from your configured email accounts." },
  { icon: Timer, title: "Smart Triggers", desc: "Schedule tasks and automate workflows with cron triggers and event-based actions." },
]

const steps = [
  { step: "01", title: "Create Teams", desc: "Set up teams, invite members, and configure role-based access to your resources." },
  { step: "02", title: "Build Resources", desc: "Create databases, design forms, set up email accounts, and configure triggers." },
  { step: "03", title: "Automate & Track", desc: "Monitor activity logs, send emails, and let triggers handle the scheduling." },
]

const stats = [
  { value: "500+", label: "Teams" },
  { value: "10K+", label: "Users" },
  { value: "50K+", label: "Emails Sent" },
  { value: "99.9%", label: "Uptime" },
]

export default function HomePage() {
  return (
    <div className="bg-hd-bg min-h-screen" style={{ backgroundImage: "radial-gradient(var(--hd-muted) 1px, transparent 1px)", backgroundSize: "24px 24px" }}>
      <Navbar />

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-block font-body text-sm px-4 py-1.5 bg-hd-card border-2 border-hd-fg mb-6" style={wobble}>
              ✦ Corporate Data Platform
            </div>
            <h1 className="font-heading text-5xl md:text-6xl text-hd-fg leading-[1.1] mb-6">
              Corporate data,<br />
              <span className="text-hd-accent">hand-drawn</span> simple.
            </h1>
            <p className="font-body text-lg md:text-xl text-hd-fg/70 mb-8 leading-relaxed">
              The playful platform for teams to manage databases, forms, emails, and automated workflows — without the corporate bloat.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="font-body text-lg md:text-xl px-8 py-3 bg-hd-card text-hd-fg border-[3px] border-hd-fg no-underline inline-flex items-center gap-2 transition-all duration-100 hover:bg-hd-accent hover:text-white active:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
                style={{ ...wobble, boxShadow: "4px 4px 0px 0px var(--hd-fg)" }}
              >
                Get Started <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/about"
                className="font-body text-lg md:text-xl px-8 py-3 bg-hd-muted text-hd-fg border-[3px] border-hd-fg no-underline inline-flex items-center gap-2 transition-all duration-100 hover:bg-hd-blue hover:text-white active:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
                style={{ ...wobble, boxShadow: "4px 4px 0px 0px var(--hd-fg)" }}
              >
                Learn More
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div
              className="bg-hd-card border-[3px] border-hd-fg p-8"
              style={{ ...wobbleMd, boxShadow: "8px 8px 0px 0px var(--hd-fg)" }}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b-2 border-dashed border-hd-fg/20">
                  <div className="w-10 h-10 rounded-full bg-hd-muted flex items-center justify-center font-heading text-sm">T</div>
                  <div className="flex-1">
                    <p className="font-heading text-base">Engineering Team</p>
                    <p className="font-body text-sm text-hd-fg/60">12 members · 3 databases</p>
                  </div>
                  <span className="font-body text-xs px-3 py-1 bg-hd-card-alt border border-hd-fg">Active</span>
                </div>
                <div className="flex items-center gap-3 pb-4 border-b-2 border-dashed border-hd-fg/20">
                  <div className="w-10 h-10 rounded-full bg-hd-muted flex items-center justify-center font-heading text-sm">D</div>
                  <div className="flex-1">
                    <p className="font-heading text-base">Design Team</p>
                    <p className="font-body text-sm text-hd-fg/60">8 members · 2 forms</p>
                  </div>
                  <span className="font-body text-xs px-3 py-1 bg-hd-muted border border-hd-fg">Invited</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-hd-muted flex items-center justify-center font-heading text-sm">M</div>
                  <div className="flex-1">
                    <p className="font-heading text-base">Marketing Team</p>
                    <p className="font-body text-sm text-hd-fg/60">6 members · 1 trigger</p>
                  </div>
                  <span className="font-body text-xs px-3 py-1 bg-hd-muted border border-hd-fg">Active</span>
                </div>
              </div>
            </div>
            <div className="hidden md:block absolute -bottom-4 -right-4 w-8 h-8 bg-hd-accent rounded-full" />
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="bg-hd-card border-[3px] border-hd-fg p-6 text-center"
              style={{ borderRadius: `${180 + i * 20}px ${20 + i * 10}px ${160 + i * 15}px ${30 + i * 10}px / ${20 + i * 10}px ${170 + i * 20}px ${25 + i * 10}px ${165 + i * 15}px`, boxShadow: "4px 4px 0px 0px var(--hd-fg)" }}
            >
              <p className="font-heading text-3xl md:text-4xl text-hd-fg">{s.value}</p>
              <p className="font-body text-sm text-hd-fg/60 mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <h2 className="font-heading text-4xl md:text-5xl text-hd-fg mb-4">How It Works</h2>
          <p className="font-body text-lg text-hd-fg/60 max-w-lg mx-auto">Three steps to get your team running.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="bg-hd-card border-[3px] border-hd-fg p-8 relative"
              style={{ ...wobbleMd, boxShadow: "4px 4px 0px 0px var(--hd-fg)", transform: i === 1 ? "rotate(-1deg)" : i === 2 ? "rotate(1deg)" : "none" }}
            >
              <span className="font-heading text-5xl text-hd-muted absolute top-4 right-6">{s.step}</span>
              <h3 className="font-heading text-2xl text-hd-fg mb-3 relative z-10">{s.title}</h3>
              <p className="font-body text-base text-hd-fg/70">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <h2 className="font-heading text-4xl md:text-5xl text-hd-fg mb-4">Everything You Need</h2>
          <p className="font-body text-lg text-hd-fg/60 max-w-lg mx-auto">Built for teams that need structure without the stiffness.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="bg-hd-card-alt border-[3px] border-hd-fg p-8 flex gap-5"
              style={{ ...wobbleMd, boxShadow: "4px 4px 0px 0px var(--hd-fg)", transform: i % 2 === 0 ? "rotate(-0.5deg)" : "rotate(0.5deg)" }}
            >
              <div className="w-12 h-12 flex-shrink-0 bg-hd-card border-2 border-hd-fg flex items-center justify-center" style={wobble}>
                <f.icon className="w-6 h-6 text-hd-fg" />
              </div>
              <div>
                <h3 className="font-heading text-xl text-hd-fg mb-2">{f.title}</h3>
                <p className="font-body text-base text-hd-fg/70">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-hd-card border-[3px] border-hd-fg p-12 md:p-16 text-center relative"
          style={{ ...wobbleMd, boxShadow: "8px 8px 0px 0px var(--hd-fg)" }}
        >
          <h2 className="font-heading text-4xl md:text-5xl text-hd-fg mb-4">
            Ready to streamline your workflows?
          </h2>
          <p className="font-body text-lg text-hd-fg/60 mb-8 max-w-md mx-auto">
            Join hundreds of teams already using PlaceDept.
          </p>
          <Link
            href="/signup"
            className="font-body text-lg md:text-xl px-10 py-4 bg-hd-card text-hd-fg border-[3px] border-hd-fg no-underline inline-flex items-center gap-2 transition-all duration-100 hover:bg-hd-accent hover:text-white active:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
            style={{ ...wobble, boxShadow: "4px 4px 0px 0px var(--hd-fg)" }}
          >
            Get Started Free <ChevronRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>

      <Footer />
    </div>
  )
}
