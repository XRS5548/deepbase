"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Timer, Plus, Trash2, Pencil, CircleCheck, Circle, Calendar, Clock,
} from "lucide-react"
import { getTriggers, createTrigger, updateTrigger, deleteTrigger } from "@/lib/trigger-api"
import type { TriggerItem } from "@/lib/actions/triggers"
import { teamIcons, iconColorClasses } from "@/lib/team-icons"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AnimatePresence } from "framer-motion"

const bgColorOptions = [
  { value: "", label: "Default" },
  { value: "bg-red-100 dark:bg-red-900/20", label: "Red" },
  { value: "bg-amber-100 dark:bg-amber-900/20", label: "Amber" },
  { value: "bg-emerald-100 dark:bg-emerald-900/20", label: "Green" },
  { value: "bg-blue-100 dark:bg-blue-900/20", label: "Blue" },
  { value: "bg-violet-100 dark:bg-violet-900/20", label: "Violet" },
  { value: "bg-rose-100 dark:bg-rose-900/20", label: "Rose" },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export default function TriggersPage() {
  const [triggers, setTriggers] = useState<TriggerItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<TriggerItem | null>(null)

  // Form state
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [message, setMessage] = useState("")
  const [icon, setIcon] = useState("")
  const [bg, setBg] = useState("")

  useEffect(() => {
    getTriggers()
      .then(setTriggers)
      .catch(() => setTriggers([]))
      .finally(() => setLoading(false))
  }, [])

  function resetForm() {
    setDate(new Date().toISOString().split("T")[0])
    setTime("")
    setMessage("")
    setIcon("")
    setBg("")
  }

  function openCreate() {
    resetForm()
    setEditing(null)
    setShowForm(true)
  }

  function openEdit(t: TriggerItem) {
    setDate(new Date(t.date).toISOString().split("T")[0])
    setTime(t.time || "")
    setMessage(t.message)
    setIcon(t.icon || "")
    setBg(t.bgColor || "")
    setEditing(t)
    setShowForm(true)
  }

  async function handleSave() {
    if (!message.trim() || !date) return
    setShowForm(false)
    if (editing) {
      await updateTrigger(editing.id, { date, time: time || undefined, message: message.trim(), icon: icon || undefined, bgColor: bg || undefined })
      const list = await getTriggers()
      setTriggers(list)
    } else {
      const res = await createTrigger({ date, time: time || undefined, message: message.trim(), icon: icon || undefined, bgColor: bg || undefined })
      setTriggers((prev) => [res.trigger, ...prev])
    }
    resetForm()
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this trigger?")) return
    setTriggers((prev) => prev.filter((t) => t.id !== id))
    await deleteTrigger(id)
  }

  async function toggleFired(t: TriggerItem) {
    setTriggers((prev) => prev.map((x) => (x.id === t.id ? { ...x, fired: !x.fired } : x)))
    await updateTrigger(t.id, { fired: !t.fired })
  }

  const live = triggers.filter((t) => !t.fired)
  const executed = triggers.filter((t) => t.fired)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          <p className="text-sm">Loading triggers...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Triggers</h1>
          <p className="text-muted-foreground mt-1">Schedule date-based reminders and notifications.</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /><span className="hidden sm:inline">Create Trigger</span>
        </Button>
      </motion.div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => { setShowForm(false); resetForm() }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg"
            >
              <Card>
                <div className="p-6 space-y-5">
                  <h2 className="text-lg font-semibold">{editing ? "Edit Trigger" : "Create Trigger"}</h2>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Icon</label>
                    <div className="flex flex-wrap gap-2">
                      {teamIcons.map(({ name: iconName, icon: Icon }, idx) => (
                        <button key={iconName} type="button" onClick={() => setIcon(icon === iconName ? "" : iconName)}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                            icon === iconName
                              ? `${iconColorClasses[idx % iconColorClasses.length]} ring-2 ring-offset-2 ring-foreground scale-110 shadow-sm`
                              : "bg-accent/50 text-muted-foreground hover:bg-accent hover:text-foreground border border-input"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Background Color</label>
                    <div className="flex flex-wrap gap-2">
                      {bgColorOptions.map((b) => (
                        <button key={b.value} type="button" onClick={() => setBg(bg === b.value ? "" : b.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                            bg === b.value ? "ring-2 ring-offset-2 ring-foreground scale-105" : "border-input hover:bg-accent"
                          } ${b.value || "bg-background text-foreground"}`}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1 space-y-2">
                      <label className="text-sm font-medium flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Date</label>
                      <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="text-sm font-medium flex items-center gap-1.5"><Clock className="w-4 h-4" /> Time</label>
                      <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Message</label>
                    <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
                      placeholder="e.g. Send monthly report reminder" required />
                  </div>
                </div>
                <div className="flex justify-end gap-3 px-6 pb-6">
                  <Button variant="outline" onClick={() => { setShowForm(false); resetForm() }}>Cancel</Button>
                  <Button onClick={handleSave} disabled={!message.trim() || !date}>{editing ? "Save Changes" : "Create Trigger"}</Button>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      {triggers.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Timer className="w-12 h-12 mb-4 opacity-30" />
              <h3 className="text-lg font-semibold text-foreground mb-1">No triggers yet</h3>
              <p className="text-sm mb-6">Schedule your first date-based reminder.</p>
              <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" />Create Trigger</Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="space-y-6">
          {/* Live Section */}
          {live.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Live ({live.length})</h3>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-accent/50 border-b border-border">
                      <th className="text-left p-3 w-10"></th>
                      <th className="text-left p-3 font-medium text-muted-foreground w-10"></th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Time</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Message</th>
                      <th className="text-right p-3 font-medium text-muted-foreground w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {live.map((t) => renderRow(t))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Executed Section */}
          {executed.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Executed ({executed.length})</h3>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-accent/50 border-b border-border">
                      <th className="text-left p-3 w-10"></th>
                      <th className="text-left p-3 font-medium text-muted-foreground w-10"></th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Time</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Message</th>
                      <th className="text-right p-3 font-medium text-muted-foreground w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {executed.map((t) => renderRow(t))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </motion.div>
      )}
    </motion.div>
  )

  function renderRow(t: TriggerItem) {
    const iconDef = teamIcons.find((ti) => ti.name === t.icon)
    const TIcon = iconDef?.icon || Timer
    const colorIdx = teamIcons.findIndex((ti) => ti.name === t.icon)
    const iconColor = colorIdx >= 0 ? iconColorClasses[colorIdx % iconColorClasses.length] : "bg-gradient-to-br from-amber-500 to-orange-600"
    const dateStr = new Date(t.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    const timeStr = t.time
      ? new Date(`2000-01-01T${t.time}`).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
      : null

    return (
      <tr key={t.id} className={`hover:bg-accent/30 transition-colors group ${t.fired ? "opacity-60" : ""} ${t.bgColor || ""}`}>
        <td className="p-3">
          <button onClick={() => toggleFired(t)} className="p-0.5" title={t.fired ? "Mark pending" : "Mark fired"}>
            {t.fired ? <CircleCheck className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />}
          </button>
        </td>
        <td className="p-3">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shadow-xs ${t.icon ? iconColor : "bg-gradient-to-br from-amber-500 to-orange-600"}`}>
            <TIcon className="w-3.5 h-3.5 text-white" />
          </div>
        </td>
        <td className={`p-3 whitespace-nowrap ${t.fired ? "line-through text-muted-foreground" : ""}`}>{dateStr}</td>
        <td className="p-3 whitespace-nowrap text-muted-foreground">{timeStr || "—"}</td>
        <td className={`p-3 truncate max-w-xs ${t.fired ? "line-through text-muted-foreground" : "font-medium"}`}>{t.message}</td>
        <td className="p-3 text-right">
          <div className="flex gap-0.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            <Button size="sm" variant="ghost" className="h-7 w-7" onClick={() => openEdit(t)}><Pencil className="w-3.5 h-3.5" /></Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-500" onClick={() => handleDelete(t.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
          </div>
        </td>
      </tr>
    )
  }
}
