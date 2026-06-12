"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Timer, Plus, Trash2, Pencil, Calendar, Clock, Bell, CircleCheck, Circle, List,
} from "lucide-react"
import { getTriggers, createTrigger, updateTrigger, deleteTrigger } from "@/lib/trigger-api"
import type { TriggerItem } from "@/lib/actions/triggers"
import { teamIcons, iconColorClasses } from "@/lib/team-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const bgColorOptions = [
  { value: "", label: "Default" },
  { value: "bg-red-100 dark:bg-red-900/20", label: "Red" },
  { value: "bg-amber-100 dark:bg-amber-900/20", label: "Amber" },
  { value: "bg-emerald-100 dark:bg-emerald-900/20", label: "Green" },
  { value: "bg-blue-100 dark:bg-blue-900/20", label: "Blue" },
  { value: "bg-violet-100 dark:bg-violet-900/20", label: "Violet" },
  { value: "bg-rose-100 dark:bg-rose-900/20", label: "Rose" },
]

function TriggerForm({
  editing, onDone, onCancel, dbColId: initialDbColId,
}: {
  editing: TriggerItem | null
  onDone: (data: { date: string; time?: string; message: string; icon?: string; bgColor?: string; dbColId?: string }) => Promise<void>
  onCancel: () => void
  dbColId?: string
}) {
  const [date, setDate] = useState(() => editing ? new Date(editing.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0])
  const [time, setTime] = useState(() => editing?.time || "")
  const [message, setMessage] = useState(() => editing?.message || "")
  const [icon, setIcon] = useState(() => editing?.icon || "")
  const [bg, setBg] = useState(() => editing?.bgColor || "")

  async function handleSubmit() {
    if (!message.trim() || !date) return
    await onDone({ date, time: time || undefined, message: message.trim(), icon: icon || undefined, bgColor: bg || undefined, dbColId: initialDbColId || undefined })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Icon</label>
        <div className="flex flex-wrap gap-1.5">
          {teamIcons.map(({ name: iconName, icon: Icon }, idx) => (
            <button
              key={iconName}
              type="button"
              onClick={() => setIcon(icon === iconName ? "" : iconName)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                icon === iconName
                  ? `${iconColorClasses[idx % iconColorClasses.length]} ring-2 ring-offset-1 ring-foreground scale-110 shadow-sm`
                  : "bg-accent/50 text-muted-foreground hover:bg-accent hover:text-foreground border border-input"
              }`}
              title={iconName}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Background</label>
        <div className="flex flex-wrap gap-1.5">
          {bgColorOptions.map((b) => (
            <button
              key={b.value}
              type="button"
              onClick={() => setBg(bg === b.value ? "" : b.value)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all border ${
                bg === b.value ? "ring-2 ring-offset-1 ring-foreground scale-105" : "border-input hover:bg-accent"
              } ${b.value || "bg-background text-foreground"}`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Date</label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 text-sm" />
        </div>
        <div className="flex-1 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Time</label>
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-9 text-sm" />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Bell className="w-3.5 h-3.5" /> Message</label>
        <textarea
          value={message} onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g. Send monthly report reminder"
          rows={2}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button type="button" size="sm" onClick={handleSubmit} disabled={!message.trim() || !date}>
          {editing ? "Save" : "Create"}
        </Button>
      </div>
    </div>
  )
}

function isTriggerPast(t: TriggerItem): boolean {
  if (t.fired) return true;
  
  const now = new Date();
  const triggerDate = new Date(t.date);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const triggerDay = new Date(triggerDate.getFullYear(), triggerDate.getMonth(), triggerDate.getDate());
  
  if (triggerDay > today) return false;
  if (triggerDay < today) return true;
  
  if (t.time) {
    const [h, m] = t.time.split(":").map(Number);
    const triggerMin = h * 60 + (m ?? 0);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return nowMin >= triggerMin;
  }
  
  return false;
}

export default function TriggersPanel({ initialView, dbColId }: { initialView?: "create" | "executed" | "live"; dbColId?: string }) {
  const [triggers, setTriggers] = useState<TriggerItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<TriggerItem | null>(null)
  const [showForm, setShowForm] = useState(initialView === "create")

  useEffect(() => {
    let mounted = true
    getTriggers()
      .then((list) => { if (mounted) setTriggers(list) })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const getFilteredTriggers = () => {
    let filtered = [...triggers];
    
    if (initialView === "executed") {
      filtered = filtered.filter(t => t.fired || isTriggerPast(t));
      filtered.sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        return (b.time || "").localeCompare(a.time || "");
      });
    } else if (initialView === "live") {
      filtered = filtered.filter(t => !t.fired && !isTriggerPast(t));
      filtered.sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return (a.time || "").localeCompare(b.time || "");
      });
    } else {
      filtered.sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return (a.time || "").localeCompare(b.time || "");
      });
    }
    
    return filtered;
  };

  const filtered = getFilteredTriggers();
  const live = filtered.filter((t) => !t.fired)
  const executed = filtered.filter((t) => t.fired)

  async function handleCreate(data: { date: string; time?: string; message: string; icon?: string; bgColor?: string; dbColId?: string }) {
    const res = await createTrigger(data)
    setTriggers((prev) => [res.trigger, ...prev])
    setShowForm(false)
  }

  async function handleEdit(data: { date: string; time?: string; message: string; icon?: string; bgColor?: string; dbColId?: string }) {
    if (!editing) return
    await updateTrigger(editing.id, data)
    setEditing(null)
    setShowForm(false)
    const list = await getTriggers()
    setTriggers(list)
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

  function renderRow(t: TriggerItem) {
    const iconDef = teamIcons.find((ti) => ti.name === t.icon)
    const TIcon = iconDef?.icon || Timer
    const colorIdx = teamIcons.findIndex((ti) => ti.name === t.icon)
    const iconColor = colorIdx >= 0 ? iconColorClasses[colorIdx % iconColorClasses.length] : "bg-gradient-to-br from-amber-500 to-orange-600"
    const dateStr = new Date(t.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    const timeStr = t.time
      ? new Date(`2000-01-01T${t.time}`).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
      : null

    return (
      <div
        key={t.id}
        className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors group ${
          t.fired 
            ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20" 
            : "border-border/60 hover:bg-accent/40"
        } ${t.bgColor || ""}`}
      >
        <button onClick={() => toggleFired(t)} className="shrink-0 p-0.5" title={t.fired ? "Mark pending" : "Mark fired"}>
          {t.fired ? <CircleCheck className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />}
        </button>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-xs ${t.icon ? iconColor : "bg-gradient-to-br from-amber-500 to-orange-600"}`}>
          <TIcon className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm truncate ${t.fired ? "text-muted-foreground" : "font-medium"}`}>
            {t.message}
          </p>
          <p className="text-[11px] text-muted-foreground">{dateStr}{timeStr ? ` · ${timeStr}` : ""}</p>
        </div>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button size="sm" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(t); setShowForm(true) }}><Pencil className="w-3.5 h-3.5" /></Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-500" onClick={() => handleDelete(t.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <div className="w-5 h-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <AnimatePresence mode="wait">
        {showForm ? (
          <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="flex items-center gap-2 mb-3">
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => { setShowForm(false); setEditing(null) }}>
                <List className="w-4 h-4 mr-1" /> Back
              </Button>
              <span className="text-sm font-medium">{editing ? "Edit Trigger" : "New Trigger"}</span>
            </div>
            <TriggerForm
              key={editing?.id || "new"}
              editing={editing}
              onDone={editing ? handleEdit : handleCreate}
              onCancel={() => { setShowForm(false); setEditing(null) }}
              dbColId={dbColId}
            />
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Timer className="w-4 h-4" /> Triggers
              </h3>
              <Button size="sm" className="h-8 gap-1.5" onClick={() => { setShowForm(true); setEditing(null) }}>
                <Plus className="w-3.5 h-3.5" /> New
              </Button>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Timer className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">
                  {initialView === "executed" 
                    ? "No executed triggers yet" 
                    : initialView === "live" 
                      ? "No live triggers" 
                      : "No triggers yet"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {live.length > 0 && (
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 px-0.5">
                      Live ({live.length})
                    </p>
                    <div className="space-y-1.5">{live.map(renderRow)}</div>
                  </div>
                )}
                {executed.length > 0 && (
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 px-0.5">
                      Executed ({executed.length})
                    </p>
                    <div className="space-y-1.5">{executed.map(renderRow)}</div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}