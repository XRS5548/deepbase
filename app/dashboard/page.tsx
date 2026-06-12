"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { motion } from "framer-motion"
import {
  Database,
  FileText,
  Users,
  Timer,
  Bell,
  Activity,
  ChevronRight,
  TrendingUp,
  Plus,
  MoreHorizontal,
  Calendar,
  Zap,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { authClient } from "@/lib/auth-client"
import { getStats, type Stats } from "@/lib/stats-api"
import { getNotifications, type NotificationItem } from "@/lib/notification-api"
import { getActivity, type ActivityItem } from "@/lib/activity-api"
import { getTriggers } from "@/lib/trigger-api"
import type { TriggerItem } from "@/lib/actions/triggers"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const statConfig = [
  { label: "Triggers", icon: Timer, key: "triggers" as const, href: "/dashboard/triggers", color: "amber" },
  { label: "Databases", icon: Database, key: "databases" as const, href: "/dashboard/databases", color: "blue" },
  { label: "Forms", icon: FileText, key: "forms" as const, href: "/dashboard/forms", color: "emerald" },
  { label: "Teams", icon: Users, key: "teams" as const, href: "/dashboard/teams", color: "violet" },
]

const colorStyles: Record<string, { card: string; icon: string; text: string; ring: string }> = {
  amber:  { card: "border-amber-200 dark:border-amber-800", icon: "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400", text: "text-amber-700 dark:text-amber-300", ring: "ring-amber-500/20" },
  blue:   { card: "border-blue-200 dark:border-blue-800", icon: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400", text: "text-blue-700 dark:text-blue-300", ring: "ring-blue-500/20" },
  emerald:{ card: "border-emerald-200 dark:border-emerald-800", icon: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400", text: "text-emerald-700 dark:text-emerald-300", ring: "ring-emerald-500/20" },
  violet: { card: "border-violet-200 dark:border-violet-800", icon: "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400", text: "text-violet-700 dark:text-violet-300", ring: "ring-violet-500/20" },
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return date.toLocaleDateString()
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
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

function isTriggerPast(t: TriggerItem): boolean {
  if (t.fired) return true
  const now = new Date()
  const triggerDate = new Date(t.date)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const triggerDay = new Date(triggerDate.getFullYear(), triggerDate.getMonth(), triggerDate.getDate())
  if (triggerDay > today) return false
  if (triggerDay < today) return true
  if (t.time) {
    const [h, m] = t.time.split(":").map(Number)
    const triggerMin = h * 60 + (m ?? 0)
    const nowMin = now.getHours() * 60 + now.getMinutes()
    return nowMin >= triggerMin
  }
  return true
}

function formatTriggerDate(t: TriggerItem): string {
  const d = new Date(t.date)
  const today = new Date()
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
  const dateStr = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
  if (d.toDateString() === today.toDateString()) return `Today${t.time ? " at " + t.time : ""}`
  if (d.toDateString() === tomorrow.toDateString()) return `Tomorrow${t.time ? " at " + t.time : ""}`
  return `${dateStr}${t.time ? " at " + t.time : ""}`
}

function LoadingSkeleton() {
  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-3">
        <div className="h-8 w-72 bg-gray-200 dark:bg-gray-800 rounded-lg" />
        <div className="h-4 w-56 bg-gray-200 dark:bg-gray-800 rounded-lg" />
      </div>

      {/* Triggers card skeleton */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-800" />
            <div className="space-y-2">
              <div className="h-5 w-40 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-800" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-3 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
              </div>
              <div className="h-6 w-16 bg-gray-200 dark:bg-gray-800 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-3">
            <div className="flex justify-between">
              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-800" />
            </div>
            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
        ))}
      </div>

      {/* Bottom section skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-5 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
          <div className="h-56 bg-gray-200 dark:bg-gray-800 rounded-lg" />
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-5 w-28 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
            <div className="h-5 w-14 bg-gray-200 dark:bg-gray-800 rounded-full" />
          </div>
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-800 mt-1.5" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-36 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-3 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data: session } = authClient.useSession()
  const [stats, setStats] = useState<Stats | null>(null)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [triggers, setTriggers] = useState<TriggerItem[]>([])
  const [loading, setLoading] = useState(true)
  const prevTriggersRef = useRef<TriggerItem[]>([])

  const initialLoad = async () => {
    const [s, n, a, t] = await Promise.all([
      getStats().catch(() => null),
      getNotifications().catch(() => [] as NotificationItem[]),
      getActivity().catch(() => [] as ActivityItem[]),
      getTriggers().catch(() => [] as TriggerItem[]),
    ])
    setStats(s)
    setNotifications(n)
    setActivity(a)
    setTriggers(t)
    prevTriggersRef.current = t
    setLoading(false)
  }

  useEffect(() => {
    initialLoad()
  }, [])

  // Auto-poll triggers every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const newTriggers = await getTriggers()
        setTriggers(prev => {
          const newlyFired = newTriggers.filter(
            nt => nt.fired && !prev.find(pt => pt.id === nt.id)?.fired
          )
          newlyFired.forEach(t => {
            toast.success(`Trigger fired: ${t.message}`, {
              icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
              description: formatTriggerDate(t),
            })
          })
          return newTriggers
        })
      } catch {}
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const triggeredTriggers = useMemo(() => {
    return triggers
      .filter(t => t.fired)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
  }, [triggers])

  const upcomingTriggers = useMemo(() => {
    return triggers
      .filter(t => !isTriggerPast(t))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5)
  }, [triggers])

  const weeklyActivity = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const dayCounts: Record<string, number> = Object.fromEntries(days.map(d => [d, 0]))
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    activity.forEach(a => {
      const d = new Date(a.createdAt)
      if (d.getTime() >= sevenDaysAgo) {
        const day = days[d.getDay()]
        dayCounts[day]++
      }
    })
    return days.map(day => ({ day, count: dayCounts[day] }))
  }, [activity])

  const unreadCount = notifications.filter(n => !n.read).length
  const name = session?.user?.name ?? "User"

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
            {getGreeting()}, {name}
          </h1>
          <p className="text-muted-foreground mt-1">Here&apos;s what&apos;s happening with your workspace today.</p>
        </div>
        <Link href="/dashboard/settings">
          <Button variant="outline" size="sm" className="gap-2">
            <MoreHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
        </Link>
      </motion.div>

      {/* Triggered Triggers */}
      {triggeredTriggers.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="border-emerald-200 dark:border-emerald-800 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 px-6 py-4 border-b border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-emerald-900 dark:text-emerald-100">Triggered Triggers</h2>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">
                      {triggeredTriggers.length} trigger{triggeredTriggers.length !== 1 ? "s" : ""} fired
                    </p>
                  </div>
                </div>
                <Link href="/dashboard/triggers">
                  <Button variant="outline" size="sm" className="border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 gap-1">
                    View All <ChevronRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </div>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {triggeredTriggers.map((t) => (
                  <Link key={t.id} href="/dashboard/triggers" className="flex items-center gap-4 px-6 py-4 hover:bg-accent/50 transition-colors">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg bg-emerald-100 dark:bg-emerald-900/30"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{t.message}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" /> {formatTriggerDate(t)}
                        </span>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Fired</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Fired
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Upcoming Triggers */}
      <motion.div variants={itemVariants}>
        <Card className="border-amber-200 dark:border-amber-800 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 px-6 py-4 border-b border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-amber-900 dark:text-amber-100">Upcoming Triggers</h2>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    {upcomingTriggers.length} trigger{upcomingTriggers.length !== 1 ? "s" : ""} pending
                  </p>
                </div>
              </div>
              <Link href="/dashboard/triggers">
                <Button variant="outline" size="sm" className="border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 gap-1">
                  Manage <ChevronRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </div>
          <CardContent className="p-0">
            {upcomingTriggers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Timer className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm font-medium text-foreground mb-1">No upcoming triggers</p>
                <p className="text-xs">Create a trigger to get reminded about important dates</p>
                <Link href="/dashboard/triggers">
                  <Button variant="outline" size="sm" className="mt-4 gap-2">
                    <Plus className="w-3.5 h-3.5" /> Create Trigger
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {upcomingTriggers.map((t) => (
                  <Link key={t.id} href="/dashboard/triggers" className="flex items-center gap-4 px-6 py-4 hover:bg-accent/50 transition-colors">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                      style={{ backgroundColor: t.bgColor || "hsl(var(--accent))" }}
                    >
                      {t.icon || <Zap className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{t.message}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" /> {formatTriggerDate(t)}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {t.fired ? "Fired" : "Pending"}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statConfig.map((stat) => {
          const cs = colorStyles[stat.color]
          const value = stats?.[stat.key] ?? 0
          const Icon = stat.icon
          return (
            <Link key={stat.key} href={stat.href}>
              <Card className={`${cs.card} transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer`}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${cs.icon}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${cs.text}`}>{value}</div>
                  <p className="text-xs text-muted-foreground mt-1">Total {stat.label.toLowerCase()}</p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </motion.div>

      {/* Chart + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Activity Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <CardTitle>Weekly Activity</CardTitle>
                </div>
                <Badge variant="secondary" className="text-xs">
                  This week
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyActivity} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "13px",
                      }}
                      cursor={{ fill: "hsl(var(--accent))" }}
                    />
                    <Bar
                      dataKey="count"
                      fill="hsl(var(--chart-1, 221.2 83.2% 53.3%))"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={48}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Notifications */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  <CardTitle>Notifications</CardTitle>
                </div>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount} new
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Bell className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.read ? "bg-transparent" : "bg-blue-500"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{n.title}</p>
                        {n.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.description}</p>
                        )}
                        <p className="text-[11px] text-muted-foreground/60 mt-1">{timeAgo(new Date(n.createdAt))}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Link href="/dashboard/notifications">
                <Button variant="ghost" size="sm" className="w-full mt-3 text-muted-foreground gap-1">
                  View all <ChevronRight className="w-3 h-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-muted-foreground" />
                <CardTitle>Recent Activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {activity.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <Activity className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-sm">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {activity.slice(0, 10).map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-4 py-3 border-b border-border/50 last:border-0"
                    >
                      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                        <Activity className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium capitalize">{actionLabels[a.action] || a.action}</span>{" "}
                          <span className="text-muted-foreground">{entityLabels[a.entity] || a.entity}</span>
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">{timeAgo(new Date(a.createdAt))}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
              <Link href="/dashboard/activity-logs">
                <Button variant="ghost" size="sm" className="w-full mt-2 text-muted-foreground gap-1">
                  View all activity <ChevronRight className="w-3 h-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-muted-foreground" />
                <CardTitle>Quick Actions</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/triggers">
                <Button variant="outline" className="w-full justify-start gap-3 h-11 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/20">
                  <Timer className="w-4 h-4" />
                  New Trigger
                </Button>
              </Link>
              <Link href="/dashboard/databases">
                <Button variant="outline" className="w-full justify-start gap-3 h-11">
                  <Database className="w-4 h-4" />
                  New Database
                </Button>
              </Link>
              <Link href="/dashboard/forms">
                <Button variant="outline" className="w-full justify-start gap-3 h-11">
                  <FileText className="w-4 h-4" />
                  New Form
                </Button>
              </Link>
              <Link href="/dashboard/teams">
                <Button variant="outline" className="w-full justify-start gap-3 h-11">
                  <Users className="w-4 h-4" />
                  New Team
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}