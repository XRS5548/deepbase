"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Target, Heart, Lightbulb, Shield } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

const wobble = { borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }
const wobbleMd = { borderRadius: "225px 25px 195px 35px / 35px 195px 25px 225px" }

const values = [
  { icon: Target, title: "Purpose-Driven", desc: "We build tools that help teams manage data and workflows without unnecessary complexity." },
  { icon: Heart, title: "Human-Centered", desc: "Our platform puts people first — not corporate bureaucracy or bloated interfaces." },
  { icon: Lightbulb, title: "Playful Innovation", desc: "We believe work tools don't have to be boring. A little personality goes a long way." },
  { icon: Shield, title: "Trust & Privacy", desc: "Your team's data is sacred. We handle it with the care it deserves." },
]

const team = [
  { name: "Aarav Sharma", role: "Product & Design", initial: "A" },
  { name: "Priya Patel", role: "Engineering Lead", initial: "P" },
  { name: "Rohan Mehta", role: "Operations", initial: "R" },
  { name: "Sneha Kapoor", role: "Full-Stack Developer", initial: "S" },
]

export default function AboutPage() {
  return (
    <div className="bg-hd-bg min-h-screen" style={{ backgroundImage: "radial-gradient(var(--hd-muted) 1px, transparent 1px)", backgroundSize: "24px 24px" }}>
      <Navbar />

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-24 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-block font-body text-sm px-4 py-1.5 bg-hd-card border-2 border-hd-fg mb-6" style={wobble}>
            ✦ Our Story
          </div>
          <h1 className="font-heading text-5xl md:text-6xl text-hd-fg leading-[1.1] mb-6">
            Making team workflows
            <span className="text-hd-accent"> less chaotic</span>
            , one sketch at a time.
          </h1>
          <p className="font-body text-lg md:text-xl text-hd-fg/70 max-w-2xl mx-auto leading-relaxed">
            We started PlaceDept because we saw teams drowning in spreadsheets, scattered emails, and manual scheduling.
            We thought — there&apos;s got to be a better way. So we built one.
          </p>
        </motion.div>
      </section>

      {/* Story */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-12 items-center"
        >
          <div>
            <h2 className="font-heading text-4xl text-hd-fg mb-6">From sticky notes to software</h2>
            <div className="font-body text-base text-hd-fg/70 space-y-4 leading-relaxed">
              <p>
                It started on a whiteboard in a cramped office. Databases were messy, access was scattered, emails were lost,
                and everyone was running on caffeine and chaos.
              </p>
              <p>
                We built PlaceDept to bring clarity to the chaos — without losing the human touch that makes teams
                special. Every feature was sketched, tested, and refined with real teams.
              </p>
              <p>
                Today, we help 500+ teams manage their data, forms, emails, and automated workflows —
                making collaboration feel less like a process and more like a partnership.
              </p>
            </div>
          </div>
          <div
            className="bg-hd-card-alt border-[3px] border-hd-fg p-8 relative"
            style={{ ...wobbleMd, boxShadow: "8px 8px 0px 0px var(--hd-fg)", transform: "rotate(1deg)" }}
          >
            <div className="absolute -top-3 left-6 px-3 py-1 bg-hd-accent text-white font-body text-sm border-2 border-hd-fg" style={wobble}>
              Our Manifesto
            </div>
            <p className="font-heading text-xl text-hd-fg italic mt-4 leading-relaxed">
              &ldquo;Work shouldn&apos;t feel like paperwork. It should feel like progress.&rdquo;
            </p>
            <p className="font-body text-sm text-hd-fg/60 mt-4">— The PlaceDept Team</p>
          </div>
        </motion.div>
      </section>

      {/* Values */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <h2 className="font-heading text-4xl md:text-5xl text-hd-fg mb-4">What We Believe</h2>
          <p className="font-body text-lg text-hd-fg/60 max-w-lg mx-auto">The principles that guide every line of code.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {values.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="bg-hd-card border-[3px] border-hd-fg p-8 flex gap-5"
              style={{ ...wobbleMd, boxShadow: "4px 4px 0px 0px var(--hd-fg)", transform: i % 2 === 0 ? "rotate(-1deg)" : "rotate(1deg)" }}
            >
              <div className="w-12 h-12 flex-shrink-0 bg-hd-card border-2 border-hd-fg flex items-center justify-center" style={wobble}>
                <v.icon className="w-6 h-6 text-hd-fg" />
              </div>
              <div>
                <h3 className="font-heading text-xl text-hd-fg mb-2">{v.title}</h3>
                <p className="font-body text-base text-hd-fg/70">{v.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <h2 className="font-heading text-4xl md:text-5xl text-hd-fg mb-4">The Team</h2>
          <p className="font-body text-lg text-hd-fg/60 max-w-lg mx-auto">The humans behind the sketches.</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {team.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="bg-hd-card border-[3px] border-hd-fg p-6 text-center"
              style={{ ...wobbleMd, boxShadow: "4px 4px 0px 0px var(--hd-fg)", transform: i % 2 === 0 ? "rotate(-1deg)" : "rotate(1deg)" }}
            >
              <div className="w-20 h-20 mx-auto mb-4 bg-hd-muted border-2 border-hd-fg flex items-center justify-center" style={wobble}>
                <span className="font-heading text-2xl text-hd-fg">{m.initial}</span>
              </div>
              <h3 className="font-heading text-lg text-hd-fg">{m.name}</h3>
              <p className="font-body text-sm text-hd-fg/60">{m.role}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-hd-muted border-[3px] border-hd-fg p-12 text-center"
          style={{ ...wobbleMd, boxShadow: "8px 8px 0px 0px var(--hd-fg)" }}
        >
          <h2 className="font-heading text-3xl md:text-4xl text-hd-fg mb-4">Want to be part of the story?</h2>
          <p className="font-body text-lg text-hd-fg/70 mb-8">We&apos;re always looking for collaborators.</p>
          <Link
            href="/contact"
            className="font-body text-lg md:text-xl px-8 py-3 bg-hd-card text-hd-fg border-[3px] border-hd-fg no-underline inline-flex items-center gap-2 transition-all duration-100 hover:bg-hd-blue hover:text-white active:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
            style={{ ...wobble, boxShadow: "4px 4px 0px 0px var(--hd-fg)" }}
          >
            Get in Touch <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>

      <Footer />
    </div>
  )
}
