"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Bell, CheckCheck, Trash2, Mail, MailOpen,
} from "lucide-react"
import { getNotifications, markRead, deleteNotification, markAllRead, type NotificationItem } from "@/lib/notification-api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "unread">("all")

  useEffect(() => {
    getNotifications()
      .then(setNotifs)
      .catch(() => setNotifs([]))
      .finally(() => setLoading(false))
  }, [])

  const unreadCount = notifs.filter((n) => !n.read).length
  const filtered = filter === "unread" ? notifs.filter((n) => !n.read) : notifs

  async function toggleRead(n: NotificationItem) {
    setNotifs((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: !x.read } : x)))
    await markRead(n.id, !n.read)
  }

  async function handleDelete(id: string) {
    setNotifs((prev) => prev.filter((x) => x.id !== id))
    await deleteNotification(id)
  }

  async function handleMarkAllRead() {
    const prev = notifs
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })))
    try {
      await markAllRead()
    } catch {
      setNotifs(prev)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          <p className="text-sm">Loading notifications...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="p-6 lg:p-8 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" className="gap-2" onClick={handleMarkAllRead}>
            <CheckCheck className="w-4 h-4" /> Mark all as read
          </Button>
        )}
      </motion.div>

      {/* Filter tabs */}
      <motion.div variants={itemVariants} className="flex gap-2">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-foreground text-background"
                : "bg-accent/50 text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            {f === "all" ? "All" : "Unread"}
            {f === "unread" && unreadCount > 0 && (
              <span className="ml-1.5 text-xs opacity-70">({unreadCount})</span>
            )}
          </button>
        ))}
      </motion.div>

      {/* List */}
      {filtered.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Bell className="w-12 h-12 mb-4 opacity-30" />
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {filter === "unread" ? "No unread notifications" : "No notifications yet"}
              </h3>
              <p className="text-sm">
                {filter === "unread"
                  ? "You've read everything. Great job!"
                  : "Notifications will appear here when something happens."}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="space-y-1.5">
          {filtered.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 p-4 rounded-xl border border-border/60 transition-colors ${
                n.read ? "bg-background" : "bg-accent/20 border-accent"
              }`}
            >
              {/* Read/unread dot */}
              <div className="mt-1.5">
                {n.read ? (
                  <MailOpen className="w-4 h-4 text-muted-foreground/40" />
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm ${n.read ? "text-muted-foreground" : "font-medium text-foreground"}`}>
                    {n.title}
                  </p>
                  <span className="text-[11px] text-muted-foreground/60 whitespace-nowrap shrink-0">
                    {timeAgo(n.createdAt)}
                  </span>
                </div>
                {n.description && (
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.description}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-0.5 shrink-0 ml-2">
                <button
                  onClick={() => toggleRead(n)}
                  className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                  title={n.read ? "Mark as unread" : "Mark as read"}
                >
                  {n.read ? <Mail className="w-3.5 h-3.5" /> : <MailOpen className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => handleDelete(n.id)}
                  className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-red-500"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
