"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  FileText,
  Info,
  AlertTriangle,
  AlertCircle,
  ExternalLink,
  Calendar,
} from "lucide-react"
import Link from "next/link"
import { api } from "@/lib/proxy"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"

type LogEntry = {
  id: string
  executionId: string
  workflowId: string
  workflowName: string
  stepId: string
  label: string
  message: string
  level: string
  timestamp: string
  executedAt: string
}

const levelConfig: Record<string, { icon: any; color: string; bg: string }> = {
  info: { icon: Info, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
  warn: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
  error: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30" },
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(dateStr)
}

export default function WorkflowLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<{ logs: LogEntry[] }>("/api/workflows/logs")
      .then((data) => setLogs(data.logs || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-sm">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
                Workflow Logs
              </h1>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Log messages emitted by Log nodes across all workflows
              </p>
            </div>
          </div>
        </div>
      </div>

      <Card className="border-border/60">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted/50 border border-border/60 flex items-center justify-center mb-4">
                <FileText className="w-7 h-7 text-muted-foreground/40" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">No logs yet</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Log nodes in your workflows will appear here after execution.
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[calc(100vh-280px)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Time</TableHead>
                    <TableHead className="w-[140px]">Workflow</TableHead>
                    <TableHead className="w-[120px]">Node</TableHead>
                    <TableHead className="w-[80px]">Level</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const cfg = levelConfig[log.level] || levelConfig.info
                    const LevelIcon = cfg.icon
                    return (
                      <TableRow key={log.id} className="group">
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />
                            {timeAgo(log.timestamp)}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm font-medium truncate max-w-[140px]">
                          {log.workflowName}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground truncate max-w-[120px]">
                          {log.label}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-2 py-0 gap-1 font-normal ${cfg.color}`}
                          >
                            <LevelIcon className="w-3 h-3" />
                            {log.level}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-mono text-foreground/80 max-w-md truncate">
                          {log.message || <span className="italic text-muted-foreground/50">(empty)</span>}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/dashboard/workflows/${log.workflowId}`}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                          </Link>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
