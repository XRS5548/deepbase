import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-hd-bg flex items-center justify-center p-6" style={{ backgroundImage: "radial-gradient(var(--hd-muted) 1px, transparent 1px)", backgroundSize: "24px 24px" }}>
      <div className="text-center max-w-md">
        <h1 className="font-heading text-7xl text-hd-fg mb-4">404</h1>
        <p className="font-body text-xl text-hd-fg mb-8">Page not found</p>
        <Link
          href="/"
          className="inline-block font-body text-lg px-8 py-3 bg-hd-card text-hd-fg border-[3px] border-hd-fg transition-all duration-100 hover:bg-hd-accent hover:text-white active:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
          style={{ borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px", boxShadow: "4px 4px 0px 0px var(--hd-fg)" }}
        >
          Back Home
        </Link>
      </div>
    </div>
  )
}
