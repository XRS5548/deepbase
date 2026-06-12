"use client"

import { motion } from "framer-motion"
import { Mail, MapPin, Phone, Send } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

const wobble = { borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px" }
const wobbleMd = { borderRadius: "225px 25px 195px 35px / 35px 195px 25px 225px" }

export default function ContactPage() {
  return (
    <div className="bg-hd-bg min-h-screen" style={{ backgroundImage: "radial-gradient(var(--hd-muted) 1px, transparent 1px)", backgroundSize: "24px 24px" }}>
      <Navbar />

      <section className="max-w-5xl mx-auto px-6 pt-20 pb-24">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-16">
          <div className="inline-block font-body text-sm px-4 py-1.5 bg-hd-card border-2 border-hd-fg mb-6" style={wobble}>
            ✦ Say Hello
          </div>
          <h1 className="font-heading text-5xl md:text-6xl text-hd-fg leading-[1.1] mb-6">
            We&apos;d love to hear
            <span className="text-hd-accent"> from you</span>
          </h1>
          <p className="font-body text-lg md:text-xl text-hd-fg/70 max-w-lg mx-auto leading-relaxed">
            Questions, ideas, or just want to say hi? Drop us a message.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <form
              onSubmit={(e) => e.preventDefault()}
              className="bg-hd-card border-[3px] border-hd-fg p-8 space-y-6"
              style={{ ...wobbleMd, boxShadow: "6px 6px 0px 0px var(--hd-fg)" }}
            >
              <div>
                <label className="font-body text-sm text-hd-fg block mb-2">Name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  className="w-full font-body text-base px-4 py-3 bg-hd-card border-2 border-hd-fg placeholder:text-hd-fg/40 focus:outline-none focus:border-hd-blue focus:ring-2 focus:ring-hd-blue/20"
                  style={wobble}
                />
              </div>
              <div>
                <label className="font-body text-sm text-hd-fg block mb-2">Email</label>
                <input
                  type="email"
                  placeholder="you@college.edu"
                  className="w-full font-body text-base px-4 py-3 bg-hd-card border-2 border-hd-fg placeholder:text-hd-fg/40 focus:outline-none focus:border-hd-blue focus:ring-2 focus:ring-hd-blue/20"
                  style={wobble}
                />
              </div>
              <div>
                <label className="font-body text-sm text-hd-fg block mb-2">Message</label>
                <textarea
                  rows={5}
                  placeholder="Write your message here..."
                  className="w-full font-body text-base px-4 py-3 bg-hd-card border-2 border-hd-fg placeholder:text-hd-fg/40 focus:outline-none focus:border-hd-blue focus:ring-2 focus:ring-hd-blue/20 resize-none"
                  style={wobble}
                />
              </div>
              <button
                type="submit"
                className="font-body text-lg px-8 py-3 bg-hd-card text-hd-fg border-[3px] border-hd-fg inline-flex items-center gap-2 transition-all duration-100 hover:bg-hd-accent hover:text-white active:shadow-none active:translate-x-[4px] active:translate-y-[4px] cursor-pointer"
                style={{ ...wobble, boxShadow: "4px 4px 0px 0px var(--hd-fg)" }}
              >
                Send Message <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <div className="bg-hd-card-alt border-[3px] border-hd-fg p-8" style={{ ...wobbleMd, boxShadow: "4px 4px 0px 0px var(--hd-fg)", transform: "rotate(1deg)" }}>
              <div className="flex items-start gap-4">
                <MapPin className="w-6 h-6 text-hd-fg flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-heading text-xl text-hd-fg mb-2">Visit Us</h3>
                  <p className="font-body text-base text-hd-fg/70">
                    42 Innovation Lane,<br />
                    Bangalore, Karnataka 560001
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-hd-card border-[3px] border-hd-fg p-8" style={{ ...wobbleMd, boxShadow: "4px 4px 0px 0px var(--hd-fg)", transform: "rotate(-0.5deg)" }}>
              <div className="flex items-start gap-4">
                <Mail className="w-6 h-6 text-hd-fg flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-heading text-xl text-hd-fg mb-2">Email Us</h3>
                  <p className="font-body text-base text-hd-fg/70">
                    hello@placementdept.com<br />
                    support@placementdept.com
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-hd-card border-[3px] border-hd-fg p-8" style={{ ...wobbleMd, boxShadow: "4px 4px 0px 0px var(--hd-fg)", transform: "rotate(0.5deg)" }}>
              <div className="flex items-start gap-4">
                <Phone className="w-6 h-6 text-hd-fg flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-heading text-xl text-hd-fg mb-2">Call Us</h3>
                  <p className="font-body text-base text-hd-fg/70">
                    +91 98765 43210<br />
                    Mon–Fri, 9 AM – 6 PM
                  </p>
                </div>
              </div>
            </div>

            <div
              className="bg-hd-muted border-[3px] border-hd-fg p-8 text-center"
              style={{ ...wobbleMd, boxShadow: "4px 4px 0px 0px var(--hd-fg)" }}
            >
              <p className="font-body text-base text-hd-fg/70">
                Average response time:{" "}
                <span className="font-heading text-hd-fg">~2 hours</span>
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
