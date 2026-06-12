// app/dashboard/DashboardClient.tsx
"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Search,
  Bell,
  Plus,
  ChevronDown,
  Users,
  Database,
  FileText,
  BellRing,
  User,
  Settings,
  LogOut,
  HelpCircle,
  LayoutDashboard,
  FormInput,
  Timer,
  Activity,
  Zap,
  Menu,
  X,
  Mail,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { getNotifications, type NotificationItem } from "@/lib/notification-api"
import { ThemeToggle } from "@/components/theme-toggle"
import FloatingTrigger from "@/components/floating-trigger"

const navigationItems = [
  {
    section: "Main",
    items: [
      { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
      { name: "Teams", icon: Users, path: "/dashboard/teams" },
      { name: "Databases", icon: Database, path: "/dashboard/databases" },
      { name: "Forms", icon: FormInput, path: "/dashboard/forms" },
      { name: "Triggers", icon: Timer, path: "/dashboard/triggers" },
      { name: "Emails", icon: Mail, path: "/dashboard/emails" },
    ],
  },
  {
    section: "Monitoring",
    items: [
      { name: "Notifications", icon: BellRing, path: "/dashboard/notifications" },
      { name: "Activity Logs", icon: Activity, path: "/dashboard/activity-logs" },
    ],
  },
  {
    section: "System",
    items: [
      { name: "Settings", icon: Settings, path: "/dashboard/settings" },
    ],
  },
]

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

interface DashboardClientProps {
  children: React.ReactNode
}

export default function DashboardClient({ children }: DashboardClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [notifs, setNotifs] = useState<NotificationItem[]>([])
  const pathname = usePathname()

  useEffect(() => {
    getNotifications().then(setNotifs).catch(() => setNotifs([]))
  }, [])

  const unreadCount = notifs.filter((n) => !n.read).length

  return (
    <div className="flex h-screen bg-background">
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80, x: 0 }}
        className="hidden lg:flex flex-col bg-card border-r border-border transition-all duration-300"
      >
        <SidebarContent sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} pathname={pathname} />
      </motion.aside>

      <motion.aside
        initial={false}
        animate={{ x: mobileSidebarOpen ? 0 : -280 }}
        className="fixed inset-y-0 left-0 z-50 w-[280px] lg:hidden bg-card border-r border-border"
      >
        <SidebarContent sidebarOpen={true} setSidebarOpen={() => setMobileSidebarOpen(false)} pathname={pathname} isMobile onCloseMobile={() => setMobileSidebarOpen(false)} />
      </motion.aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setMobileSidebarOpen(true)} notifs={notifs} unreadCount={unreadCount} />
        <main className="flex-1 overflow-y-auto bg-muted/30">
          {children}
        </main>
      </div>
      <FloatingTrigger />
    </div>
  )
}

function SidebarContent({ sidebarOpen, setSidebarOpen, pathname, isMobile, onCloseMobile }: {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  pathname: string
  isMobile?: boolean
  onCloseMobile?: () => void
}) {
  const { data: session } = authClient.useSession()
  const user = session?.user
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?"

  return (
    <>
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl font-bold text-foreground truncate">
              DataVault
            </motion.span>
          )}
        </div>
        {isMobile ? (
          <Button variant="ghost" size="icon" onClick={onCloseMobile} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-muted-foreground hover:text-foreground flex-shrink-0">
            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${sidebarOpen ? "" : "-rotate-90"}`} />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 px-4">
        {navigationItems.map((section) => (
          <div key={section.section} className="mb-6">
            {sidebarOpen && (
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
                {section.section}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.path || (item.path !== "/dashboard" && pathname.startsWith(item.path))
                return (
                  <Link key={item.name} href={item.path} onClick={onCloseMobile}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={`w-full justify-start ${sidebarOpen ? "px-3" : "px-0 justify-center"} ${
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      } transition-colors duration-200`}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {sidebarOpen && (
                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ml-3 truncate">
                          {item.name}
                        </motion.span>
                      )}
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </ScrollArea>

      <div className="p-4 border-t border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full flex items-center space-x-3 px-2 py-2 hover:bg-accent rounded-lg transition-colors">
              <Avatar className="w-8 h-8 flex-shrink-0">
                {user?.image ? <AvatarImage src={user.image} /> : null}
                <AvatarFallback className="bg-blue-500 text-white">{initials}</AvatarFallback>
              </Avatar>
              {sidebarOpen && (
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user?.name || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email || ""}
                  </p>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href="/dashboard/settings">
              <DropdownMenuItem className="cursor-pointer">
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
            </Link>
            <Link href="/dashboard/settings">
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
            </Link>
            <DropdownMenuItem className="cursor-pointer">
              <HelpCircle className="w-4 h-4 mr-2" />
              Help
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive cursor-pointer"
              onClick={() => authClient.signOut()}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}

function Header({ onMenuClick, notifs, unreadCount }: {
  onMenuClick: () => void
  notifs: NotificationItem[]
  unreadCount: number
}) {
  const router = useRouter()

  return (
    <header className="bg-card border-b border-border sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 lg:px-6 py-3">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="lg:hidden text-muted-foreground hover:text-foreground" onClick={onMenuClick}>
            <Menu className="w-5 h-5" />
          </Button>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/60 w-4 h-4" />
            <Input
              placeholder="Search databases, forms, teams..."
              className="pl-10 bg-muted/50 border-border focus:bg-background transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center space-x-1 lg:space-x-2">
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5 text-muted-foreground" />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center"
                  >
                    {unreadCount}
                  </motion.span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                <Badge variant="secondary" className="text-xs">{unreadCount} new</Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <ScrollArea className="h-64">
                {notifs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                    <Bell className="w-8 h-8 mb-2 opacity-40" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  notifs.slice(0, 10).map((n) => (
                    <DropdownMenuItem key={n.id} className="flex items-start space-x-3 p-3 cursor-pointer hover:bg-accent">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate">{n.title}</p>
                          {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2" />}
                        </div>
                        {n.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground/60 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </ScrollArea>
              <DropdownMenuSeparator />
              <Link href="/dashboard/notifications">
                <DropdownMenuItem className="text-center text-primary cursor-pointer">
                  View all notifications
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all" size="sm">
                <Plus className="w-4 h-4 lg:mr-2" />
                <span className="hidden lg:inline">Create</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <Link href="/dashboard/databases">
                <DropdownMenuItem className="cursor-pointer">
                  <Database className="w-4 h-4 mr-2" />
                  Database
                </DropdownMenuItem>
              </Link>
              <Link href="/dashboard/forms">
                <DropdownMenuItem className="cursor-pointer">
                  <FileText className="w-4 h-4 mr-2" />
                  Form
                </DropdownMenuItem>
              </Link>
              <Link href="/dashboard/teams">
                <DropdownMenuItem className="cursor-pointer">
                  <Users className="w-4 h-4 mr-2" />
                  Team
                </DropdownMenuItem>
              </Link>
              <Link href="/dashboard/triggers">
                <DropdownMenuItem className="cursor-pointer">
                  <Timer className="w-4 h-4 mr-2" />
                  Trigger
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-8 hidden lg:block" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 p-1 hover:bg-accent rounded-lg transition-colors">
                <UserAvatar />
                <ChevronDown className="w-4 h-4 hidden lg:block text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/dashboard/settings">
                <DropdownMenuItem className="cursor-pointer">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
              </Link>
              <Link href="/dashboard/settings">
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
              </Link>
              <Link href="/dashboard/settings">
                <DropdownMenuItem className="cursor-pointer">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Help & Support
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive cursor-pointer"
                onClick={() => { authClient.signOut(); router.push("/signin") }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

function UserAvatar() {
  const { data: session } = authClient.useSession()
  const user = session?.user
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?"

  return (
    <Avatar className="w-8 h-8 ring-2 ring-primary/20">
      {user?.image ? <AvatarImage src={user.image} /> : null}
      <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
    </Avatar>
  )
}
