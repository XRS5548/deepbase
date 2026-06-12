import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-hd-fg text-hd-bg mt-auto">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="font-heading text-2xl mb-4">
              Place<span className="text-hd-accent">.</span>Dept
            </h3>
            <p className="font-body text-base opacity-80 leading-relaxed">
              Corporate data platform for teams — manage databases, forms, emails, and automated workflows.
            </p>
          </div>

          <div>
            <h4 className="font-heading text-xl mb-4">Quick Links</h4>
            <div className="flex flex-col gap-3">
              {[
                { href: "/", label: "Home" },
                { href: "/about", label: "About" },
                { href: "/contact", label: "Contact" },
                { href: "/dashboard", label: "Dashboard" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-body text-base no-underline opacity-80 hover:opacity-100 transition-opacity flex items-center gap-1 group"
                >
                  {link.label}
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-heading text-xl mb-4">Contact</h4>
            <p className="font-body text-base opacity-80 leading-relaxed">
              hello@placedept.com
              <br />
              +91 98765 43210
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-hd-bg/20 text-center">
          <p className="font-body text-sm opacity-60">
            &copy; {new Date().getFullYear()} PlaceDept. Made with pencil and paper.
          </p>
        </div>
      </div>
    </footer>
  )
}
