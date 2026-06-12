"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Timer, Plus, CheckCircle2, Eye, X } from "lucide-react"
import TriggersPanel from "@/components/triggers-panel"

type View = "create" | "executed" | "live" | null

export default function FloatingTrigger() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [panelView, setPanelView] = useState<View>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [menuOpen])

  function open(view: View) {
    setMenuOpen(false)
    setPanelView(view)
  }

  const items = [
    { key: "create" as const, label: "Create Trigger", icon: Plus, desc: "Schedule a new date-based trigger" },
    { key: "executed" as const, label: "Triggered Items", icon: CheckCircle2, desc: "View completed triggers" },
    { key: "live" as const, label: "View Live Triggers", icon: Eye, desc: "View pending active triggers" },
  ]

  return (
    <>
      {/* FAB */}
      <div ref={menuRef} className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
          title="Triggers"
        >
          <Timer className="w-6 h-6" />
        </button>

        {/* Dropup Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-16 right-0 w-64 bg-background border border-border rounded-xl shadow-xl overflow-hidden"
            >
              {items.map((item) => (
                <button
                  key={item.key}
                  onClick={() => open(item.key)}
                  className="flex items-start gap-3 w-full px-4 py-3 text-left hover:bg-accent transition-colors border-b border-border/50 last:border-0"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0 mt-0.5">
                    <item.icon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Slide-over panel */}
      <AnimatePresence>
        {panelView && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/30"
              onClick={() => setPanelView(null)}
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-background border-l border-border shadow-2xl overflow-y-auto"
            >
              <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border flex items-center justify-between px-5 py-3">
                <h2 className="text-base font-semibold">
                  {panelView === "create" ? "New Trigger" : panelView === "executed" ? "Triggered Items" : "Live Triggers"}
                </h2>
                <button onClick={() => setPanelView(null)} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5">
                <TriggersPanel initialView={panelView} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
