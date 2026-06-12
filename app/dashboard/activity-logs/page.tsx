"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Activity, Database, FileText, Users, Timer, UserPlus, Star, Edit3, Share2,
} from "lucide-react"
import { getActivity, type ActivityItem } from "@/lib/activity-api"
import { Card, CardContent } from "@/components/ui/card"

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

const entityLabels: Record<string, string> = {
  team: "Team", team_member: "Team Member", database: "Database", db_col: "Column", db_value: "Row",
  form: "Form", form_col: "Field", form_submission: "Submission", date_trigger: "Trigger", allotment: "Permission",
}

const actionLabels: Record<string, string> = {
  created: "created", updated: "updated", deleted: "deleted", shared: "shared",
  permission_changed: "changed permissions of", starred: "starred", unstarred: "unstarred",
}

function entityIcon(entity: string, className = "w-4 h-4") {
  const icons: Record<string, typeof Activity> = {
    team: Users, database: Database, form: FileText, date_trigger: Timer,
    team_member: UserPlus, db_col: Edit3, db_value: FileText, form_col: Edit3,
    form_submission: Star, allotment: Share2,
  }
  const Icon = icons[entity] || Activity
  return <Icon className={className} />
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

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string | null>(null)

  useEffect(() => {
    getActivity()
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
  }, [])

  const entities = [...new Set(logs.map((l) => l.entity))]
  const filtered = filter ? logs.filter((l) => l.entity === filter) : logs

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          <p className="text-sm">Loading activity logs...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="p-6 lg:p-8 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Activity Logs</h1>
        <p className="text-muted-foreground mt-1">
          {logs.length === 0
            ? "No activity recorded yet"
            : `${logs.length} event${logs.length > 1 ? "s" : ""} recorded`}
        </p>
      </motion.div>

      {/* Entity filter chips */}
      {entities.length > 0 && (
        <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter(null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              !filter
                ? "bg-foreground text-background"
                : "bg-accent/50 text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            All
          </button>
          {entities.map((e) => (
            <button
              key={e}
              onClick={() => setFilter(e)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === e
                  ? "bg-foreground text-background"
                  : "bg-accent/50 text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {entityIcon(e, "w-3.5 h-3.5")}
              {entityLabels[e] || e}
            </button>
          ))}
        </motion.div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Activity className="w-12 h-12 mb-4 opacity-30" />
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {filter ? `No ${entityLabels[filter]?.toLowerCase() || filter} activity` : "No activity yet"}
              </h3>
              <p className="text-sm">
                {filter
                  ? "No events found for this entity type"
                  : "Your actions across teams, databases, forms, and triggers will appear here."}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="space-y-1">
          {filtered.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-4 p-3.5 rounded-xl border border-border/60 hover:bg-accent/30 transition-colors group"
            >
              <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center shrink-0 mt-0.5">
                {entityIcon(log.entity, "w-4 h-4 text-muted-foreground")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium capitalize">{actionLabels[log.action] || log.action}</span>{" "}
                  <span className="text-muted-foreground">{entityLabels[log.entity] || log.entity}</span>
                  {log.performerName && (
                    <span className="text-muted-foreground/60"> by {log.performerName}</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">{timeAgo(log.createdAt)}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
